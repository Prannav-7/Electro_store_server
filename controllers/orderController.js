const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Cart = require('../models/Cart');
const { checkStockAvailability, reduceStock, restoreStock } = require('../utils/stockManager');

// Create new order
const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { items, customerDetails, orderSummary, paymentDetails } = req.body;

    console.log('=== CREATE ORDER START ===');
    console.log('User ID:', userId);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Items:', JSON.stringify(items, null, 2));
    console.log('Customer Details:', JSON.stringify(customerDetails, null, 2));
    console.log('Order Summary:', JSON.stringify(orderSummary, null, 2));
    console.log('Payment Details:', JSON.stringify(paymentDetails, null, 2));

    // Check stock availability using utility function
    console.log('Checking stock availability...');
    const stockCheck = await checkStockAvailability(items);
    console.log('Stock check result:', JSON.stringify(stockCheck, null, 2));

    if (!stockCheck.success) {
      console.log('Stock check failed, returning 400');
      return res.status(400).json({
        success: false,
        message: stockCheck.message,
        insufficientProducts: stockCheck.insufficientProducts
      });
    }

    console.log('Stock check passed, creating order...');

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

    console.log('Order object created:', JSON.stringify(order, null, 2));

    const savedOrder = await order.save();
    console.log('Order saved successfully with ID:', savedOrder._id);

    // Reduce stock levels using utility function
    // For both paid orders and COD orders to prevent overselling
    console.log('Checking if stock reduction is needed...');
    if (paymentDetails?.status === 'completed' ||
        paymentDetails?.method === 'cod' ||
        paymentDetails?.method === 'upi' ||
        paymentDetails?.method === 'razorpay') {
      console.log('Reducing stock levels...');
      const stockReduction = await reduceStock(items);
      console.log('Stock reduction result:', JSON.stringify(stockReduction, null, 2));

      if (!stockReduction.success) {
        // If stock reduction fails, we should consider cancelling the order
        console.error('Stock reduction failed for order:', savedOrder._id);
        return res.status(500).json({
          success: false,
          message: 'Failed to update stock levels. Order may need manual review.',
          orderId: savedOrder._id
        });
      }
      console.log('Stock levels updated for order:', savedOrder._id, stockReduction.updatedProducts);
    } else {
      console.log('Stock reduction skipped - payment not completed');
    }

    // Populate order with product details
    console.log('Populating order with product details...');
    await savedOrder.populate('items.productId');
    console.log('Order populated successfully');

    // Clear user's cart after successful order
    console.log('Clearing user cart...');
    try {
      await Cart.findOneAndUpdate(
        { userId },
        { items: [] }
      );
      console.log('Cart cleared for user after order creation:', userId);
    } catch (cartError) {
      console.error('Error clearing cart after order creation:', cartError);
      // Don't fail the order if cart clearing fails
    }

    console.log('=== CREATE ORDER SUCCESS ===');
    res.status(201).json({
      success: true,
      message: 'Order placed successfully and stock updated',
      data: savedOrder
    });
  } catch (error) {
    console.error('=== CREATE ORDER ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
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

// Get daily summary for PDF report
const getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    // Set to start and end of the day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get today's orders
    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate('userId', 'name email').sort({ createdAt: -1 });

    // Calculate statistics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Payment method breakdown
    const paymentMethods = {};
    orders.forEach(order => {
      const method = order.paymentMethod || 'Unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    // Format orders for response
    const formattedOrders = orders.map(order => ({
      orderId: order.orderId,
      customerName: order.userId?.name || 'Guest',
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: order.createdAt
    }));

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        totalOrders,
        totalRevenue,
        averageOrderValue,
        paymentMethods,
        orders: formattedOrders
      }
    });
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching daily summary',
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

// Check if user has purchased a specific product
const checkUserPurchase = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    console.log('=== CHECK USER PURCHASE ===');
    console.log('User ID:', userId);
    console.log('Product ID:', productId);

    // Find orders where user has purchased this product
    const orders = await Order.find({
      user: userId,
      'items.product': productId,
      status: { $in: ['confirmed', 'delivered', 'completed', 'paid'] } // Consider confirmed and paid orders as well
    });

    const hasPurchased = orders.length > 0;
    
    console.log('Orders found:', orders.length);
    console.log('Has purchased:', hasPurchased);

    res.json({
      success: true,
      hasPurchased,
      orderCount: orders.length
    });
  } catch (error) {
    console.error('Check purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check purchase history'
    });
  }
};

// Get sales analytics data
const getSalesAnalytics = async (req, res) => {
  try {
    const { period = 'month', month } = req.query;
    
    // Parse the month parameter (format: YYYY-MM)
    const targetDate = month ? new Date(month + '-01') : new Date();
    const startOfPeriod = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfPeriod = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    console.log('=== SALES ANALYTICS ===');
    console.log('Period:', period);
    console.log('Target Month:', month);
    console.log('Date Range:', startOfPeriod, 'to', endOfPeriod);

    // Get daily sales for the month
    const dailySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfPeriod, $lte: endOfPeriod },
          status: { $in: ['confirmed', 'delivered', 'completed', 'paid'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          revenue: { $sum: "$orderSummary.total" },
          orders: { $sum: 1 },
          customers: { $addToSet: "$userId" }
        }
      },
      {
        $project: {
          date: "$_id",
          revenue: 1,
          orders: 1,
          customers: { $size: "$customers" }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Get recent orders
    const recentOrders = await Order.find({
      createdAt: { $gte: startOfPeriod, $lte: endOfPeriod },
      status: { $in: ['confirmed', 'delivered', 'completed', 'paid'] }
    })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(10)
    .select('orderId userId orderSummary items createdAt');

    const formattedRecentOrders = recentOrders.map(order => ({
      orderId: order.orderId || order._id.toString().slice(-8).toUpperCase(),
      customer: order.userId?.name || 'Unknown Customer',
      amount: order.orderSummary?.total || 0,
      items: order.items?.length || 0,
      date: order.createdAt.toISOString().split('T')[0]
    }));

    res.json({
      success: true,
      data: {
        dailySales,
        recentOrders: formattedRecentOrders
      }
    });

  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales analytics'
    });
  }
};

// Get monthly comparison data
const getMonthlyComparison = async (req, res) => {
  try {
    const { current, previous } = req.query;
    
    console.log('=== MONTHLY COMPARISON ===');
    console.log('Current month:', current);
    console.log('Previous month:', previous);

    const months = [previous, current].map(monthStr => {
      const date = new Date(monthStr + '-01');
      return {
        monthStr,
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
        label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };
    });

    const comparisonData = await Promise.all(
      months.map(async (month) => {
        const result = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: month.start, $lte: month.end },
              status: { $in: ['confirmed', 'delivered', 'completed', 'paid'] }
            }
          },
          {
            $group: {
              _id: null,
              revenue: { $sum: "$orderSummary.total" },
              orders: { $sum: 1 }
            }
          }
        ]);

        return {
          month: month.label,
          revenue: result[0]?.revenue || 0,
          orders: result[0]?.orders || 0,
          growth: 0 // Will calculate after getting both months
        };
      })
    );

    // Calculate growth
    if (comparisonData.length === 2) {
      const prevRevenue = comparisonData[0].revenue;
      const currentRevenue = comparisonData[1].revenue;
      
      if (prevRevenue > 0) {
        comparisonData[1].growth = ((currentRevenue - prevRevenue) / prevRevenue * 100);
        comparisonData[0].growth = 0; // Previous month baseline
      }
    }

    res.json({
      success: true,
      data: comparisonData
    });

  } catch (error) {
    console.error('Monthly comparison error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly comparison'
    });
  }
};

// Get top products data
const getTopProducts = async (req, res) => {
  try {
    const { month } = req.query;
    
    const targetDate = month ? new Date(month + '-01') : new Date();
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    console.log('=== TOP PRODUCTS ===');
    console.log('Month:', month);
    console.log('Date Range:', startOfMonth, 'to', endOfMonth);

    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          status: { $in: ['confirmed', 'delivered', 'completed', 'paid'] }
        }
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          sales: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
        }
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      {
        $project: {
          name: "$productInfo.name",
          sales: 1,
          revenue: 1,
          category: "$productInfo.category"
        }
      },
      { $sort: { sales: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: topProducts
    });

  } catch (error) {
    console.error('Top products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top products'
    });
  }
};

// Get category breakdown data
const getCategoryBreakdown = async (req, res) => {
  try {
    const { month } = req.query;
    
    const targetDate = month ? new Date(month + '-01') : new Date();
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    console.log('=== CATEGORY BREAKDOWN ===');
    console.log('Month:', month);
    console.log('Date Range:', startOfMonth, 'to', endOfMonth);

    const categoryData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
          status: { $in: ['confirmed', 'delivered', 'completed', 'paid'] }
        }
      },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      {
        $group: {
          _id: "$productInfo.category",
          sales: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
        }
      },
      {
        $project: {
          category: "$_id",
          sales: 1
        }
      },
      { $sort: { sales: -1 } }
    ]);

    // Calculate percentages
    const totalSales = categoryData.reduce((sum, cat) => sum + cat.sales, 0);
    const categoryBreakdown = categoryData.map(cat => ({
      category: cat.category,
      sales: cat.sales,
      percentage: totalSales > 0 ? Math.round((cat.sales / totalSales) * 100) : 0
    }));

    res.json({
      success: true,
      data: categoryBreakdown
    });

  } catch (error) {
    console.error('Category breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category breakdown'
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
  getMonthlySalesSummary,
  checkUserPurchase,
  getSalesAnalytics,
};

// Comprehensive Sales Report with Charts Data
const getSalesReport = async (req, res) => {
  try {
    console.log('📊 Fetching comprehensive sales report...');
    
    const {
      startDate,
      endDate,
      paymentMethod,
      status,
      category
    } = req.query;

    console.log('Query parameters:', { startDate, endDate, paymentMethod, status, category });

    // Build match query for filters
    const matchQuery = {};

    // Date range filter
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      };
    }

    // Payment method filter
    if (paymentMethod && paymentMethod !== 'all') {
      matchQuery['paymentDetails.method'] = paymentMethod;
    }

    // Status filter
    if (status && status !== 'all') {
      matchQuery.status = status;
    }

    console.log('Match query:', JSON.stringify(matchQuery, null, 2));

    // Aggregate sales data
    const salesAggregation = [
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$orderSummary.total' },
          totalProducts: { $sum: '$orderSummary.itemCount' },
          averageOrderValue: { $avg: '$orderSummary.total' }
        }
      }
    ];

    // Daily revenue aggregation for line chart
    const dailyRevenueAggregation = [
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$orderSummary.total' },
          orders: { $sum: 1 }
        }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          revenue: 1,
          orders: 1
        }
      },
      { $sort: { date: 1 } }
    ];

    // Payment method breakdown
    const paymentMethodAggregation = [
      { $match: matchQuery },
      {
        $group: {
          _id: '$paymentDetails.method',
          count: { $sum: 1 },
          revenue: { $sum: '$orderSummary.total' }
        }
      }
    ];

    // Status breakdown
    const statusAggregation = [
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          revenue: { $sum: '$orderSummary.total' }
        }
      }
    ];

    // Top products aggregation
    const topProductsAggregation = [
      { $match: matchQuery },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$productInfo.name' },
          category: { $first: '$productInfo.category' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          orders: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 20 }
    ];

    // Execute all aggregations
    console.log('Executing aggregations...');
    
    const [
      salesSummary,
      dailyRevenue,
      paymentMethodBreakdown,
      statusBreakdown,
      topProducts
    ] = await Promise.all([
      Order.aggregate(salesAggregation),
      Order.aggregate(dailyRevenueAggregation),
      Order.aggregate(paymentMethodAggregation),
      Order.aggregate(statusAggregation),
      Order.aggregate(topProductsAggregation)
    ]);

    console.log('Aggregations completed');
    console.log('Sales summary:', salesSummary);
    console.log('Daily revenue count:', dailyRevenue.length);
    console.log('Payment methods:', paymentMethodBreakdown);
    console.log('Status breakdown:', statusBreakdown);
    console.log('Top products count:', topProducts.length);

    // Format data for response
    const summary = salesSummary[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: 0,
      averageOrderValue: 0
    };

    // Format payment method breakdown
    const paymentMethodData = {};
    paymentMethodBreakdown.forEach(item => {
      paymentMethodData[item._id || 'unknown'] = {
        count: item.count,
        revenue: item.revenue
      };
    });

    // Format status breakdown
    const statusData = {};
    statusBreakdown.forEach(item => {
      statusData[item._id || 'unknown'] = {
        count: item.count,
        revenue: item.revenue
      };
    });

    // Round average order value
    summary.averageOrderValue = Math.round(summary.averageOrderValue || 0);

    const responseData = {
      summary,
      dailyRevenue,
      paymentMethodBreakdown: paymentMethodData,
      statusBreakdown: statusData,
      topProducts
    };

    console.log('✅ Sales report generated successfully');
    console.log('Response summary:', {
      totalOrders: summary.totalOrders,
      totalRevenue: summary.totalRevenue,
      dailyRevenuePoints: dailyRevenue.length,
      paymentMethods: Object.keys(paymentMethodData).length,
      topProductsCount: topProducts.length
    });

    res.json({
      success: true,
      message: 'Sales report generated successfully',
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error generating sales report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate sales report',
      error: error.message
    });
  }
};

// Update order status (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    console.log(`Admin updating order ${orderId} status to: ${status}`);

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find and update the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update the status
    const previousStatus = order.status;
    order.status = status;
    await order.save();

    console.log(`Order ${orderId} status updated from ${previousStatus} to ${status}`);

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: {
        orderId: order._id,
        previousStatus,
        newStatus: status,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getDailySalesReport,
  getDailySummary,
  getAllOrdersForAdmin,
  getMonthlySalesSummary,
  checkUserPurchase,
  getSalesAnalytics,
  getMonthlyComparison,
  getTopProducts,
  getCategoryBreakdown,
  getSalesReport
};
