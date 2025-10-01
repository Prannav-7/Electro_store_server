const axios = require('axios');

class WhatsAppService {
    constructor() {
        this.provider = process.env.WHATSAPP_PROVIDER || 'simulation';
        
        // Green API Configuration
        this.greenApiInstanceId = process.env.GREEN_API_INSTANCE_ID;
        this.greenApiToken = process.env.GREEN_API_TOKEN;
        
        // Cloud API Configuration
        this.cloudApiToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
        this.cloudApiPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        
        console.log(`WhatsApp Service initialized with provider: ${this.provider}`);
    }

    /**
     * Send message via Green API
     */
    async sendViaGreenApi(phoneNumber, message) {
        try {
            if (!this.greenApiInstanceId || !this.greenApiToken) {
                throw new Error('Green API credentials not configured');
            }

            const url = `https://api.green-api.com/waInstance${this.greenApiInstanceId}/sendMessage/${this.greenApiToken}`;
            
            const payload = {
                chatId: `${phoneNumber}@c.us`,
                message: message
            };

            console.log(`Sending via Green API to ${phoneNumber}`);
            const response = await axios.post(url, payload);
            
            return {
                success: true,
                messageId: response.data.idMessage,
                provider: 'green-api',
                response: response.data
            };
        } catch (error) {
            console.error('Green API Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                provider: 'green-api'
            };
        }
    }

    /**
     * Send message via WhatsApp Cloud API
     */
    async sendViaCloudApi(phoneNumber, message) {
        try {
            if (!this.cloudApiToken || !this.cloudApiPhoneNumberId) {
                throw new Error('WhatsApp Cloud API credentials not configured');
            }

            const url = `https://graph.facebook.com/v18.0/${this.cloudApiPhoneNumberId}/messages`;
            
            const payload = {
                messaging_product: "whatsapp",
                to: phoneNumber,
                type: "text",
                text: { body: message }
            };

            console.log(`Sending via Cloud API to ${phoneNumber}`);
            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${this.cloudApiToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return {
                success: true,
                messageId: response.data.messages[0].id,
                provider: 'cloud-api',
                response: response.data
            };
        } catch (error) {
            console.error('Cloud API Error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.error?.message || error.message,
                provider: 'cloud-api'
            };
        }
    }

    /**
     * Simulate message sending for testing
     */
    async simulateMessage(phoneNumber, message) {
        console.log(`SIMULATING WhatsApp message to ${phoneNumber}:`);
        console.log('Message:', message);
        console.log('---');
        
        return {
            success: true,
            messageId: `sim_${Date.now()}`,
            provider: 'simulation',
            response: { simulated: true }
        };
    }

    /**
     * Send message using configured provider
     */
    async sendMessage(phoneNumber, message) {
        try {
            // Clean phone number (remove any + or spaces)
            const cleanPhoneNumber = phoneNumber.replace(/[\+\s\-]/g, '');
            
            switch (this.provider) {
                case 'green-api':
                    return await this.sendViaGreenApi(cleanPhoneNumber, message);
                
                case 'cloud-api':
                    return await this.sendViaCloudApi(cleanPhoneNumber, message);
                
                case 'simulation':
                    return await this.simulateMessage(cleanPhoneNumber, message);
                
                default:
                    // Fallback to simulation if no valid provider
                    console.log(`Unknown provider ${this.provider}, falling back to simulation`);
                    return await this.simulateMessage(cleanPhoneNumber, message);
            }
        } catch (error) {
            console.error('WhatsApp send error:', error);
            return {
                success: false,
                error: error.message,
                provider: this.provider
            };
        }
    }

    /**
     * Send order confirmation message
     */
    async sendOrderConfirmation(customerPhone, orderData) {
        const message = this.formatOrderConfirmationMessage(orderData);
        return await this.sendMessage(customerPhone, message);
    }

    /**
     * Send order status update
     */
    async sendOrderStatusUpdate(customerPhone, orderData, newStatus) {
        const message = this.formatOrderStatusMessage(orderData, newStatus);
        return await this.sendMessage(customerPhone, message);
    }

    /**
     * Format order confirmation message
     */
    formatOrderConfirmationMessage(orderData) {
        const itemsList = orderData.items.map(item => 
            `• ${item.name} (Qty: ${item.quantity}) - ₹${item.price}`
        ).join('\n');

        return `🎉 *Order Confirmed!*

Thank you ${orderData.customerName || orderData.customerDetails.firstName}!

*Order Details:*
Order #: ${orderData.orderNumber}
Total: ₹${orderData.total}

*Items:*
${itemsList}

*Delivery Address:*
${orderData.customerDetails.address}
${orderData.customerDetails.city}, ${orderData.customerDetails.state} - ${orderData.customerDetails.pincode}

We'll update you on the delivery status soon!

*Jaimaruthi Electrical & Hardwares*
📞 ${orderData.customerDetails.phone}`;
    }

    /**
     * Format order status update message
     */
    formatOrderStatusMessage(orderData, newStatus) {
        const statusMessages = {
            'confirmed': '✅ Your order has been confirmed',
            'processing': '🔄 Your order is being processed',
            'shipped': '🚚 Your order has been shipped',
            'delivered': '🎉 Your order has been delivered',
            'cancelled': '❌ Your order has been cancelled'
        };

        const statusMessage = statusMessages[newStatus] || `📦 Order status updated: ${newStatus}`;

        return `${statusMessage}

*Order #:* ${orderData.orderNumber}
*Total:* ₹${orderData.total}

*Jaimaruthi Electrical & Hardwares*
Thank you for your business!`;
    }

    /**
     * Test connection based on configured provider
     */
    async testConnection() {
        console.log(`Testing ${this.provider} connection...`);
        
        const testPhone = '918838686407'; // Your business number
        const testMessage = `🧪 WhatsApp Service Test\n\nProvider: ${this.provider}\nTime: ${new Date().toLocaleString()}\n\nThis is a test message from Jaimaruthi Electrical & Hardwares WhatsApp integration.`;
        
        return await this.sendMessage(testPhone, testMessage);
    }
}

module.exports = new WhatsAppService();
