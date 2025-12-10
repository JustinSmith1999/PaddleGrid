const orgId = 'Org_13321';
const apiKey = '13321_3befc61e-de2e-4d9e-9b89-439fe2ccce43';
const authToken = Buffer.from(`${orgId}:${apiKey}`).toString('base64');

const today = new Date();
const isoStartDate = today.toISOString().split('T')[0];
const isoEndDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

console.log('Testing different endpoints...\n');

const endpoints = [
  `https://api.courtreserve.com/api/v1/reservationreport?start_date=${isoStartDate}&end_date=${isoEndDate}`,
  `https://api.courtreserve.com/api/v1/reservations?start_date=${isoStartDate}&end_date=${isoEndDate}`,
  `https://api.courtreserve.com/api/v1/schedule?start_date=${isoStartDate}&end_date=${isoEndDate}`,
  `https://api.courtreserve.com/api/v1/reservationreport/list?start_date=${isoStartDate}&end_date=${isoEndDate}`,
];

async function testEndpoint(url) {
  console.log(`\nTesting: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response (first 500 chars):', text.substring(0, 500));

    try {
      const data = JSON.parse(text);
      if (data.Data && Array.isArray(data.Data) && data.Data.length > 0) {
        console.log('✅ SUCCESS! Found', data.Data.length, 'items');
        console.log('First item keys:', Object.keys(data.Data[0]));
        console.log('Sample:', JSON.stringify(data.Data[0], null, 2));
        return true;
      } else if (data.IsSuccessStatusCode === true && data.Data !== null) {
        console.log('✅ SUCCESS but Data structure:', typeof data.Data, data.Data);
        return true;
      }
    } catch (e) {
      // Not JSON
    }
  } catch (err) {
    console.error('Error:', err.message);
  }

  return false;
}

async function runTests() {
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    if (success) {
      console.log('\n🎉 FOUND WORKING ENDPOINT!');
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

runTests();
