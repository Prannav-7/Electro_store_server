const path = require('path');

// Load environment variables first
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Load the service after environment variables
const WhatsAppService = require('./services/whatsappService');

// Load environment variables first
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testWhatsAppIntegration() {
    console.log('=== WhatsApp Integration Test ===');
    console.log('Green API Instance ID:', process.env.GREEN_API_INSTANCE_ID ? 'Set' : 'Not Set');
    console.log('Green API Token:', process.env.GREEN_API_TOKEN ? 'Set' : 'Not Set');
    console.log('WhatsApp Provider:', process.env.WHATSAPP_PROVIDER || 'green-api');
    console.log('Raw Provider Value:', JSON.stringify(process.env.WHATSAPP_PROVIDER));
    
    // Force simulation mode for testing
    process.env.WHATSAPP_PROVIDER = 'simulation';
    
    // Reinitialize the WhatsApp service
    const WhatsAppService = require('./services/whatsappService');
    
    try {
        // Test message data
        const customerPhone = '918838686407'; // Your business number for testing
        const orderData = {
            orderNumber: 'ORD-TEST-001',
            customerName: 'Test Customer',
            total: 1850,
            items: [
                {
                    name: 'Stanley 19" Tool Box with Tray',
                    quantity: 1,
                    price: 1850
                }
            ],
            customerDetails: {
                firstName: 'Test',
                lastName: 'Customer',
                phone: customerPhone,
                email: 'test@example.com',
                address: 'Test Address, Test City',
                city: 'Test City',
                state: 'Test State',
                pincode: '123456'
            }
        };

        console.log('\n--- Testing Order Confirmation Message ---');
        const result = await WhatsAppService.sendOrderConfirmation(customerPhone, orderData);
        
        if (result.success) {
            console.log('✅ WhatsApp message sent successfully!');
            console.log('Message ID:', result.messageId);
            console.log('Provider used:', result.provider);
        } else {
            console.log('❌ Failed to send WhatsApp message');
            console.log('Error:', result.error);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testWhatsAppIntegration().then(() => {
    console.log('\n=== Test completed ===');
    process.exit(0);
}).catch(error => {
    console.error('Test crashed:', error);
    process.exit(1);
});