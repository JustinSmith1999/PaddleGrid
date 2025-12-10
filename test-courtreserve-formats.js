const orgId = 'Org_13321';
const apiKey = '13321_3befc61e-de2e-4d9e-9b89-439fe2ccce43';
const authToken = Buffer.from(`${orgId}:${apiKey}`).toString('base64');

const today = new Date();
const isoStartDate = today.toISOString().split('T')[0]; // 2025-12-09
const isoEndDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

// Format as MM/DD/YYYY
const usStartDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
const endDateObj = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
const usEndDate = `${endDateObj.getMonth() + 1}/${endDateObj.getDate()}/${endDateObj.getFullYear()}`;

console.log('Testing different date formats...\n');

const testConfigs = [
  {
    name: 'Test 1: start_date/end_date with ISO format',
    url: `https://api.courtreserve.com/api/v1/reservationreport/listactive?start_date=${isoStartDate}&end_date=${isoEndDate}`
  },
  {
    name: 'Test 2: startDate/endDate with ISO format',
    url: `https://api.courtreserve.com/api/v1/reservationreport/listactive?startDate=${isoStartDate}&endDate=${isoEndDate}`
  },
  {
    name: 'Test 3: start_date/end_date with US format',
    url: `https://api.courtreserve.com/api/v1/reservationreport/listactive?start_date=${encodeURIComponent(usStartDate)}&end_date=${encodeURIComponent(usEndDate)}`
  },
  {
    name: 'Test 4: startDate/endDate with US format',
    url: `https://api.courtreserve.com/api/v1/reservationreport/listactive?startDate=${encodeURIComponent(usStartDate)}&endDate=${encodeURIComponent(usEndDate)}`
  },
  {
    name: 'Test 5: No date parameters',
    url: `https://api.courtreserve.com/api/v1/reservationreport/listactive`
  }
];

async function testEndpoint(config) {
  console.log(`\n${config.name}`);
  console.log(`URL: ${config.url}`);

  try {
    const response = await fetch(config.url, {
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

    if (data.Data && Array.isArray(data.Data)) {
      console.log('✅ Data found! Count:', data.Data.length);
      if (data.Data.length > 0) {
        console.log('First item keys:', Object.keys(data.Data[0]));
      }
      return true;
    } else if (data.Data !== null) {
      console.log('Data type:', typeof data.Data);
      console.log('Data:', JSON.stringify(data.Data).substring(0, 200));
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
}

runTests();
