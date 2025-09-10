const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { checkStockAvailability, reduceStock, restoreStock } = require('../utils/stockManager');

// Create new order
const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { items, customerDetails, orderSummary, paymentDetails } = req.body;

    // Check stock availability using utility function
    const stockCheck = await checkStockAvailability(items);
    if (!stockCheck.success) {
      return res.status(400).json({
        success: false,
        message: stockCheck.message,
        insufficientProducts: stockCheck.insufficientProducts
      });
    }

    // Create order
    const order = new Order({
      userId,
      items,
      customerDetails,
      orderSummary,
      paymentDetails: paymentDetails || {
        method: 'cod',
        status: 'pending'
      },
      status: 'confirmed',
      paymentStatus: paymentDetails?.method === 'cod' ? 'pending' : 'paid'
    });

    await order.save();

    // Reduce stock levels using utility function
    // For both paid orders and COD orders to prevent overselling
    if (paymentDetails?.status === 'completed' || 
        paymentDetails?.method === 'cod' || 
        paymentDetails?.method === 'upi' ||
        paymentDetails?.method === 'razorpay') {
      const stockReduction = await reduceStock(items);
      if (!stockReduction.success) {
        // If stock reduction fails, we should consider cancelling the order
        console.error('Stock reduction failed for order:', order._id);
        return res.status(500).json({
          success: false,
          message: 'Failed to update stock levels. Order may need manual review.',
          orderId: order._id
        });
      }
      console.log('Stock levels updated for order:', order._id, stockReduction.updatedProducts);
    }

    // Populate order with product details
    await order.populate('items.productId');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully and stock updated',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Get user's orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId })
      .populate('items.productId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNext: page < Math.ceil(totalOrders / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: orderId, userId })
      .populate('items.productId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order'
    });
  }
};

// Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel order that has been shipped or delivered'
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled'
      });
    }

    // Update order status
    order.status = 'cancelled';
    await order.save();

    // Restore product stock using utility function
    const stockRestoration = await restoreStock(order.items);
    if (stockRestoration.success) {
      console.log('Stock restored for cancelled order:', order._id, stockRestoration.updatedProducts);
    } else {
      console.error('Failed to restore stock for cancelled order:', order._id);
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully and stock restored',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order'
    });
  }
};

// Get daily sales report for admin
const getDailySalesReport = async (req, res) => {
  try {
    const { date } = req.query;
    
    // If date is provided, use it; otherwise use today
    const reportDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(reportDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(reportDate.setHours(23, 59, 59, 999));

    console.log(`Generating sales report for: ${startOfDay} to ${endOfDay}`);

    // Get all orders for the specified day
    const orders = await Order.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .populate('userId', 'name email role')
    .populate('items.productId', 'name category price')
    .sort({ createdAt: -1 });

    // Calculate daily statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.orderSummary?.total || 0), 0);
    const completedOrders = orders.filter(order => order.status === 'confirmed' || order.status === 'delivered').length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;

    // Payment method breakdown
    const paymentMethodBreakdown = {};
    orders.forEach(order => {
      const method = order.paymentDetails?.method || 'unknown';
      if (!paymentMethodBreakdown[method]) {
        paymentMethodBreakdown[method] = { count: 0, revenue: 0 };
      }
      paymentMethodBreakdown[method].count += 1;
      paymentMethodBreakdown[method].revenue += (order.orderSummary?.total || 0);
    });

    // Product sales breakdown
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const productName = item.productId?.name || `Product ${item.productId}`;
        const productId = item.productId?._id || item.productId;
        
        if (!productSales[productId]) {
          productSales[productId] = {
            name: productName,
            category: item.productId?.category || 'Unknown',
            totalQuantity: 0,
            totalRevenue: 0,
            orders: 0
          };
        }
        productSales[productId].totalQuantity += item.quantity;
        productSales[productId].totalRevenue += (item.price * item.quantity);
        productSales[productId].orders += 1;
      });
    });

    // Convert to array and sort by revenue
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Customer details with order info
    const customerOrders = orders.map(order => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      customer: {
        userId: order.userId?._id,
        name: order.userId?.name || `${order.customerDetails.firstName} ${order.customerDetails.lastName}`,
        email: order.customerDetails.email,
        phone: order.customerDetails.phone,
        address: {
          street: order.customerDetails.address,
          city: order.customerDetails.city,
          state: order.customerDetails.state,
          pincode: order.customerDetails.pincode,
          landmark: order.customerDetails.landmark
        }
      },
      orderDetails: {
        items: order.items.map(item => ({
          product: item.productId?.name || 'Unknown Product',
          category: item.productId?.category || 'Unknown',
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price
        })),
        orderSummary: order.orderSummary,
        paymentMethod: order.paymentDetails?.method || 'unknown',
        paymentStatus: order.paymentStatus,
        status: order.status,
        orderDate: order.createdAt,
        estimatedDelivery: order.estimatedDelivery,
        trackingId: order.trackingId
      }
    }));

    const report = {
      date: reportDate.toDateString(),
      summary: {
        totalOrders,
        totalRevenue,
        completedOrders,
        pendingOrders,
        cancelledOrders,
        averageOrderValue: totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0
      },
      paymentMethodBreakdown,
      topProducts,
      customerOrders
    };

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Daily sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate daily sales report',
      error: error.message
    });
  }
};

// Get all orders for admin with customer details
const getAllOrdersForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 50, status, paymentMethod, startDate, endDate } = req.query;

    console.log('Admin orders query params:', { page, limit, status, paymentMethod, startDate, endDate });

    // Build query
    const query = {};
    
    if (status && status !== '') {
      query.status = status;
      console.log('Filtering by status:', status);
    }
    
    if (paymentMethod && paymentMethod !== '') {
      query['paymentDetails.method'] = paymentMethod;
      console.log('Filtering by payment method:', paymentMethod);
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.createdAt = {
        $gte: start,
        $lte: end
      };
      console.log('Filtering by date range:', { start, end });
    } else if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query.createdAt = { $gte: start };
      console.log('Filtering by start date:', start);
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $lte: end };
      console.log('Filtering by end date:', end);
    }

    console.log('Final MongoDB query:', JSON.stringify(query, null, 2));

    const totalOrders = await Order.countDocuments(query);
    console.log('Total orders matching query:', totalOrders);
    
    const orders = await Order.find(query)
      .populate('userId', 'name email role createdAt')
      .populate('items.productId', 'name category price stock')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log('Orders returned:', orders.length);

    const ordersWithDetails = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      customer: {
        userId: order.userId?._id,
        registeredUser: order.userId ? {
          name: order.userId.name,
          email: order.userId.email,
          memberSince: order.userId.createdAt
        } : null,
        orderDetails: {
          name: `${order.customerDetails.firstName} ${order.customerDetails.lastName}`,
          email: order.customerDetails.email,
          phone: order.customerDetails.phone,
          address: {
            fullAddress: `${order.customerDetails.address}, ${order.customerDetails.city}, ${order.customerDetails.state} - ${order.customerDetails.pincode}`,
            details: order.customerDetails
          }
        }
      },
      items: order.items.map(item => ({
        product: {
          id: item.productId?._id,
          name: item.productId?.name || 'Product Unavailable',
          category: item.productId?.category || 'Unknown'
        },
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price
      })),
      orderSummary: order.orderSummary,
      payment: {
        method: order.paymentDetails?.method || 'unknown',
        status: order.paymentStatus,
        paymentId: order.paymentDetails?.paymentId,
        selectedOption: order.paymentDetails?.selectedOption
      },
      status: order.status,
      dates: {
        orderDate: order.createdAt,
        updatedAt: order.updatedAt,
        estimatedDelivery: order.estimatedDelivery
      },
      trackingId: order.trackingId
    }));

    res.json({
      success: true,
      data: {
        orders: ordersWithDetails,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasMore: (page * limit) < totalOrders
        }
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Get monthly sales summary
const getMonthlySalesSummary = async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;
    
    let startDate, endDate;
    
    if (month) {
      // Specific month
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      // Entire year
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    }

    const orders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$orderSummary.total' },
          avgOrderValue: { $avg: '$orderSummary.total' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        period: month ? `${year}-${month}` : `${year}`,
        dailySummary: orders
      }
    });
  } catch (error) {
    console.error('Monthly sales summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly sales summary'
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getDailySalesReport,
  getAllOrdersForAdmin,
  getMonthlySalesSummary
};
