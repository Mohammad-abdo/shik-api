const API_URL = 'https://atfawry.fawrystaging.com/ECommerceWeb/Fawry/payments/charge';

async function test() {
    console.log('Testing connectivity to:', API_URL);
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true })
        });
        console.log('Status:', res.status);
        console.log('Text:', await res.text());
    } catch (e) {
        console.error('Connection failed:', e.message);
        if (e.cause) console.error('Cause:', e.cause);
    }
}

test();
