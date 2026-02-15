// Quick test for Fawry integration
require('dotenv').config();
const fawryService = require('./services/fawry');

async function quickTest() {
    console.log('🧪 Testing Fawry Integration...\n');

    const chargeRequest = fawryService.buildChargeRequest({
        merchantCode: process.env.FAWRY_MERCHANT_CODE,
        merchantRefNum: 'test' + Date.now(),
        customerMobile: '01011329938',
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        customerProfileId: '',
        language: 'ar-eg',
        chargeItems: [{
            itemId: 'item1',
            description: 'Test Product',
            price: 100,
            quantity: 1
        }],
        returnUrl: 'https://developer.fawrystaging.com',
        secureKey: process.env.FAWRY_SECURE_KEY,
        paymentMethod: 'CARD',
        currencyCode: 'EGP',
        description: 'Test Payment',
    });

    try {
        const result = await fawryService.createCharge(chargeRequest);
        console.log('\n✅ SUCCESS!');
        console.log('📱 Payment URL:', result.paymentUrl);
        console.log('\n🎉 Integration is working! Send this URL to mobile app.');
    } catch (error) {
        console.log('\n❌ FAILED!');
        console.log('Error:', error.message);
        if (error.fawryResponse) {
            console.log('Fawry Response:', JSON.stringify(error.fawryResponse, null, 2));
        }
    }
}

quickTest();
