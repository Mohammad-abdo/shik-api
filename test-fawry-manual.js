require('dotenv').config();
const crypto = require('crypto');
const { createCharge } = require('./services/fawry');

// Override env vars
process.env.FAWRY_MERCHANT_CODE = "770000022076";
process.env.FAWRY_SECURE_KEY = "2e63ad3591b9414d810c62234768e443";
process.env.FAWRY_BASE_URL = "https://atfawry.fawrystaging.com";
process.env.FAWRY_CHARGE_PATH = "/ECommerceWeb/Fawry/payments/charge";

async function testFawryManual() {
    console.log('--- Starting Fawry MANUAL Test ---');

    const merchantCode = process.env.FAWRY_MERCHANT_CODE;
    const secureKey = process.env.FAWRY_SECURE_KEY;
    const merchantRefNum = '' + Date.now(); // Numeric String
    const customerProfileId = '12345';
    const returnUrl = 'http://localhost:5173/payments';
    const paymentMethod = 'CARD';

    const itemId = 'A100';
    const quantity = 1;
    const priceNum = 50.00; // Number
    const priceStr = '50.00'; // String for hash

    // 1. Build Signature
    // merchantCode + merchantRefNum + customerProfileId + returnUrl + (itemId + quantity + priceStr) + secureKey
    // customerProfileId is MISSING in this test, so it should be skipped or empty string?
    // If omitted from JSON, typically omitted from Signature too. 
    // Let's assume Profile is EMPTY string in signature if not present.

    const toHash = merchantCode + merchantRefNum + "" + returnUrl + (itemId + quantity + priceStr) + secureKey;
    console.log('Signature Source:', toHash);
    const signature = crypto.createHash('sha256').update(toHash, 'utf8').digest('hex');

    // 2. Build Request Payload
    const request = {
        merchantCode: merchantCode,
        merchantRefNum: merchantRefNum,
        // customerProfileId: customerProfileId, // REMOVED
        customerName: 'TestUser',
        customerMobile: '01012345678', // Valid-ish format
        customerEmail: 'test@test.com',
        paymentMethod: 'CARD', // TRY WITH OR WITHOUT? Code had it.
        returnUrl: returnUrl,
        language: 'en-gb', // Try English
        chargeItems: [
            {
                itemId: itemId,
                description: 'ItemA',
                price: priceNum,
                quantity: quantity
            }
        ],
        signature: signature
    };

    console.log('Payload:', JSON.stringify(request, null, 2));

    // 3. Send
    try {
        const result = await createCharge(request);
        console.log('\n✅ SUCCESS!');
        console.log(result);
    } catch (error) {
        console.log('\n❌ FAILED!');
        console.log('Status Code:', error.statusCode);
        console.log('Error Message:', error.message);
        if (error.fawryResponse) {
            console.log('Fawry:', JSON.stringify(error.fawryResponse, null, 2));
        }
    }
}

testFawryManual();
