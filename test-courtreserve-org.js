const orgId = 'Org_13321';
const apiKey = '13321_3befc61e-de2e-4d9e-9b89-439fe2ccce43';
const authToken = Buffer.from(`${orgId}:${apiKey}`).toString('base64');

const today = new Date();
const startDate = today.toISOString().split('T')[0];
const endDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

console.log('Testing with organization parameters...\n');

const testUrls = [
  // Try with org_id parameter
  `https://api.courtreserve.com/api/v1/reservationreport/listactive?org_id=${orgId}&start_date=${startDate}&end_date=${endDate}`,
  // Try with organization parameter
  `https://api.courtreserve.com/api/v1/reservationreport/listactive?organization=${orgId}&start_date=${startDate}&end_date=${endDate}`,
  // Try with facility parameter
  `https://api.courtreserve.com/api/v1/reservationreport/listactive?facility=13321&start_date=${startDate}&end_date=${endDate}`,
  // Try with just org_id
  `https://api.courtreserve.com/api/v1/reservationreport/listactive?org_id=${orgId}`,
  // Try different date parameter format with hyphens
  `https://api.courtreserve.com/api/v1/reservationreport/listactive?start-date=${startDate}&end-date=${endDate}`,
  // Try with interval parameter
  `https://api.courtreserve.com/api/v1/reservationreport/listactive?interval=${startDate}|${endDate}`,
  // Try minimal - just the endpoint
  `https://api.courtreserve.com/api/v1/reservationreport/listactive?date=${startDate}`,
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

    try {
      const data = JSON.parse(text);
      if (data.IsSuccessStatusCode === true && data.Data) {
        if (Array.isArray(data.Data)) {
          console.log(`✅ SUCCESS! Found ${data.Data.length} items`);
          if (data.Data.length > 0) {
            console.log('First item:', JSON.stringify(data.Data[0], null, 2));
          }
          return true;
        } else {
          console.log('✅ SUCCESS but unexpected data structure:', typeof data.Data);
        }
      } else if (data.ErrorMessage) {
        console.log('Error:', data.ErrorMessage);
      } else {
        console.log('Response:', JSON.stringify(data).substring(0, 300));
      }
    } catch (e) {
      console.log('Not JSON or parse error');
      console.log('Response (first 300 chars):', text.substring(0, 300));
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }

  return false;
}

async function runTests() {
  for (const url of testUrls) {
    const success = await testEndpoint(url);
    if (success) {
      console.log('\n🎉 FOUND WORKING URL!');
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

runTests();
