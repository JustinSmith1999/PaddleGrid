const orgId = 'Org_13321';
const apiKey = '13321_3befc61e-de2e-4d9e-9b89-439fe2ccce43';
const authToken = Buffer.from(`${orgId}:${apiKey}`).toString('base64');

const today = new Date();
const startDate = today.toISOString().split('T')[0];
const endDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

console.log('Testing array-style query parameters...\n');

const testUrls = [
  // PHP/ASP.NET array syntax with brackets
  `https://api.courtreserve.com/api/v1/reservationreport/listactive?DateIntervals[0].StartDate=${startDate}&DateIntervals[0].EndDate=${endDate}`,

  // Alternative bracket syntax
  `https://api.courtreserve.com/api/v1/reservationreport/listactive?DateIntervals[0][StartDate]=${startDate}&DateIntervals[0][EndDate]=${endDate}`,

  // No index
  `https://api.courtreserve.com/api/v1/reservationreport/listactive?DateIntervals.StartDate=${startDate}&DateIntervals.EndDate=${endDate}`,

  // Simple interval param
  `https://api.courtreserve.com/api/v1/reservationreport/listactive?DateInterval.StartDate=${startDate}&DateInterval.EndDate=${endDate}`,

  // Try dateInterval singular
  `https://api.courtreserve.com/api/v1/reservationreport/listactive?dateInterval.startDate=${startDate}&dateInterval.endDate=${endDate}`,
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
    const data = JSON.parse(text);

    console.log('Status:', response.status);
    console.log('Success:', data.IsSuccessStatusCode);
    console.log('Error:', data.ErrorMessage || 'None');

    if (data.IsSuccessStatusCode && data.Data) {
      if (Array.isArray(data.Data)) {
        console.log('✅ SUCCESS! Found', data.Data.length, 'items');
        if (data.Data.length > 0) {
          console.log('First item keys:', Object.keys(data.Data[0]));
          console.log('Sample:', JSON.stringify(data.Data[0], null, 2));
        }
        return true;
      } else {
        console.log('Data structure:', typeof data.Data, data.Data);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }

  return false;
}

async function runTests() {
  for (const url of testUrls) {
    const success = await testEndpoint(url);
    if (success) {
      console.log('\n🎉 FOUND WORKING FORMAT!');
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n\nNo working format found. The API might require:');
  console.log('1. CSV export instead of live API access');
  console.log('2. Different authentication (OAuth instead of Basic Auth)');
  console.log('3. Special API access that needs to be enabled in CourtReserve admin');
  console.log('\nPlease check your CourtReserve account for API documentation.');
}

runTests();
