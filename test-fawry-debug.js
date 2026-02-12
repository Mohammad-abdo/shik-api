require('dotenv').config();
const { buildChargeRequest, createCharge } = require('./services/fawry');

// Override env vars to ensure they are set for this test
process.env.FAWRY_MERCHANT_CODE = "770000022076";
process.env.FAWRY_SECURE_KEY = "2e63ad3591b9414d810c62234768e443";
process.env.FAWRY_BASE_URL = "https://atfawry.fawrystaging.com";
process.env.FAWRY_CHARGE_PATH = "/ECommerceWeb/Fawry/payments/charge";
process.env.FAWRY_RETURN_URL_BASE = "http://localhost:5173/payments";

async function testFawry() {
    console.log('--- Starting Fawry Debug Test ---');

    const merchantRefNum = 'TEST-' + Date.now();
    console.log('Merchant Ref:', merchantRefNum);

    const options = {
        merchantCode: process.env.FAWRY_MERCHANT_CODE,
        merchantRefNum: merchantRefNum,
        customerProfileId: '12345', // Testing with a profile ID
        customerName: 'Test User',
        customerMobile: '01000000000',
        customerEmail: 'test@example.com',
        paymentMethod: 'CARD',
        returnUrl: process.env.FAWRY_RETURN_URL_BASE,
        secureKey: process.env.FAWRY_SECURE_KEY,
        description: 'Test Charge',
        chargeItems: [
            { itemId: 'A100', description: 'Item A', price: 50.00, quantity: 1 },
            { itemId: 'B200', description: 'Item B', price: 20.00, quantity: 2 } // Total: 50 + 40 = 90
        ]
    };

    console.log('\n1. Building Request (Look for Signature Source below)...');
    const request = buildChargeRequest(options);

    console.log('\n2. Generated Request Payload:');
    console.log(JSON.stringify(request, null, 2));

    console.log('\n3. Sending to Fawry...');
    try {
        const result = await createCharge(request);
        console.log('\n✅ SUCCESS!');
        console.log('Payment URL:', result.paymentUrl);
        console.log('Ref Number:', result.referenceNumber);
    } catch (error) {
        console.log('\n❌ FAILED!');
        console.log('Status Code:', error.statusCode);
        console.log('Error Message:', error.message);
        if (error.fawryResponse) {
            console.log('Fawry Response:', JSON.stringify(error.fawryResponse, null, 2));
        }
    }
}

testFawry();
