const crypto = require('crypto');

// 1. CONFIG
const MERCHANT_CODE = "770000022076"; // Your code
const SECURE_KEY = "2e63ad3591b9414d810c62234768e443"; // Your key
const ENDPOINT = "https://atfawry.fawrystaging.com/ECommerceWeb/Fawry/payments/charge";

const REF_NUM = 'TEST-' + Date.now();
const PROFILE_ID = '5514614763';
const RETURN_URL = 'http://localhost:5173/fawry-test';
const ITEM_ID = '133bd16af4ea47fd9fefb6d2769bf267';
const PRICE = '120.00';
const QTY = 1;

// 2. HELPERS
function hash(str) {
    return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

async function sendRequest(label, signature, payload) {
    console.log(`\n--- Testing Variant: ${label} ---`);
    console.log('Signature Source:', payload._sourceString);
    console.log('Signature Hash:', signature);

    // Clean payload for sending (remove _sourceString)
    const toSend = { ...payload, signature };
    delete toSend._sourceString;

    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(toSend)
        });
        const text = await res.text();
        console.log('Response:', text);
        if (text.includes('9929')) console.log('❌ Result: 9929 (Ticket Invalid)');
        else if (res.ok) console.log('✅ Result: SUCCESS!');
        else console.log('⚠️ Result: ' + res.status);
    } catch (e) {
        console.error('Network Error:', e.message);
    }
}

// 3. MAIN
async function run() {
    console.log('Verifying Fawry Credentials & Logic...');

    // VARIANT A: Standard Signature (No PaymentMethod in Hash)
    const itemsPart = ITEM_ID + QTY + PRICE;
    const sourceA = MERCHANT_CODE + REF_NUM + PROFILE_ID + RETURN_URL + itemsPart + SECURE_KEY;
    const sigA = hash(sourceA);
    const payloadA = {
        merchantCode: MERCHANT_CODE,
        merchantRefNum: REF_NUM,
        customerProfileId: PROFILE_ID,
        returnUrl: RETURN_URL,
        chargeItems: [{ itemId: ITEM_ID, quantity: QTY, price: PRICE, description: 'Test' }],
        paymentMethod: 'CARD',
        language: 'ar-eg',
        authCaptureModePayment: false,
        _sourceString: sourceA
    };
    await sendRequest('A: Standard (No PaymentMethod in Sig)', sigA, payloadA);

    // VARIANT B: Extended Signature (WITH PaymentMethod in Hash)
    // Note: Using NEW RefNum to avoid duplicate
    const refB = REF_NUM + '-B';
    const sourceB = MERCHANT_CODE + refB + PROFILE_ID + RETURN_URL + itemsPart + 'CARD' + SECURE_KEY;
    const sigB = hash(sourceB);
    const payloadB = {
        ...payloadA,
        merchantRefNum: refB, // Update Ref
        _sourceString: sourceB
    };
    await sendRequest('B: Extended (With PaymentMethod in Sig)', sigB, payloadB);

    console.log('\n---------------------------------------------------');
    console.log('If BOTH fail with 9929, your SECURE KEY or ACCOUNT PERMISSIONS are INVALID.');
    console.log('Please send this output to Fawry Support.');
}

run();
