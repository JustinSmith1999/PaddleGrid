const orgId = 'Org_13321';
const apiKey = '13321_3befc61e-de2e-4d9e-9b89-439fe2ccce43';
const authToken = Buffer.from(`${orgId}:${apiKey}`).toString('base64');

const today = new Date();
const startDate = today.toISOString().split('T')[0];
const endDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

console.log('Testing POST requests with JSON body...\n');

const testConfigs = [
  {
    name: 'Test 1: POST with DateIntervals array',
    url: 'https://api.courtreserve.com/api/v1/reservationreport/listactive',
    body: {
      DateIntervals: [
        {
          StartDate: startDate,
          EndDate: endDate
        }
      ]
    }
  },
  {
    name: 'Test 2: POST with dateIntervals (lowercase)',
    url: 'https://api.courtreserve.com/api/v1/reservationreport/listactive',
    body: {
      dateIntervals: [
        {
          startDate: startDate,
          endDate: endDate
        }
      ]
    }
  },
  {
    name: 'Test 3: POST with start_date/end_date in body',
    url: 'https://api.courtreserve.com/api/v1/reservationreport/listactive',
    body: {
      start_date: startDate,
      end_date: endDate
    }
  },
  {
    name: 'Test 4: POST with StartDate/EndDate in body',
    url: 'https://api.courtreserve.com/api/v1/reservationreport/listactive',
    body: {
      StartDate: startDate,
      EndDate: endDate
    }
  }
];

async function testEndpoint(config) {
  console.log(`\n${config.name}`);
  console.log(`URL: ${config.url}`);
  console.log(`Body: ${JSON.stringify(config.body, null, 2)}`);

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config.body)
    });

    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response (first 1000 chars):', text.substring(0, 1000));

    try {
      const data = JSON.parse(text);
      if (data.Data && Array.isArray(data.Data)) {
        console.log('✅ SUCCESS! Found', data.Data.length, 'reservations');
        if (data.Data.length > 0) {
          console.log('First item keys:', Object.keys(data.Data[0]));
          console.log('Sample:', JSON.stringify(data.Data[0], null, 2));
        }
        return true;
      } else if (data.IsSuccessStatusCode === true) {
        console.log('✅ SUCCESS!');
        console.log('Data type:', typeof data.Data);
        return true;
      } else if (data.ErrorMessage) {
        console.log('Error:', data.ErrorMessage);
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
  for (const config of testConfigs) {
    const success = await testEndpoint(config);
    if (success) {
      console.log('\n🎉 FOUND WORKING FORMAT!');
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Also test events endpoint
  console.log('\n\n=== Testing Events Endpoint ===');
  const eventConfig = {
    name: 'Event Test: POST with DateIntervals',
    url: 'https://api.courtreserve.com/api/v1/eventregistrationreport/listactive',
    body: {
      DateIntervals: [
        {
          StartDate: startDate,
          EndDate: new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
        }
      ]
    }
  };

  await testEndpoint(eventConfig);
}

runTests();
