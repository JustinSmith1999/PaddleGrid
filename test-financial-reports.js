const orgId = 'Org_13321';
const apiKey = '13321_d0851966-b379-437c-b820-e95fdefb5807';
const authToken = Buffer.from(`${orgId}:${apiKey}`).toString('base64');

const today = new Date();
const startDate = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
const endDate = today.toISOString().split('T')[0];

console.log('Testing financial/payment report endpoints...');
console.log('Date Range:', startDate, 'to', endDate);

const testCases = [
  {
    name: 'reservationreport/listactive (known working)',
    url: `https://api.courtreserve.com/api/v1/reservationreport/listactive?start_date=${startDate}&end_date=${endDate}`,
  },
  {
    name: 'eventregistrationreport/listactive (known working)',
    url: `https://api.courtreserve.com/api/v1/eventregistrationreport/listactive?start_date=${startDate}&end_date=${endDate}`,
  },
  {
    name: 'memberreport/listactive',
    url: `https://api.courtreserve.com/api/v1/memberreport/listactive?start_date=${startDate}&end_date=${endDate}`,
  },
  {
    name: 'paymentreport/listactive',
    url: `https://api.courtreserve.com/api/v1/paymentreport/listactive?start_date=${startDate}&end_date=${endDate}`,
  },
  {
    name: 'billingreport/listactive',
    url: `https://api.courtreserve.com/api/v1/billingreport/listactive?start_date=${startDate}&end_date=${endDate}`,
  },
  {
    name: 'financialreport/listactive',
    url: `https://api.courtreserve.com/api/v1/financialreport/listactive?start_date=${startDate}&end_date=${endDate}`,
  },
  {
    name: 'transactionreport/listactive',
    url: `https://api.courtreserve.com/api/v1/transactionreport/listactive?start_date=${startDate}&end_date=${endDate}`,
  },
];

async function testEndpoint(testCase) {
  console.log(`\n=== ${testCase.name} ===`);
  console.log('URL:', testCase.url);

  try {
    const response = await fetch(testCase.url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', response.status);

    const text = await response.text();

    if (response.status === 200) {
      console.log('✅ SUCCESS! Status 200');

      try {
        const data = JSON.parse(text);
        console.log('Type:', typeof data, '| Is Array:', Array.isArray(data));

        if (typeof data === 'object' && !Array.isArray(data)) {
          console.log('Object Keys:', Object.keys(data));

          if (data.Data && Array.isArray(data.Data)) {
            console.log(`Data array length: ${data.Data.length}`);
            if (data.Data.length > 0) {
              console.log('First item keys:', Object.keys(data.Data[0]));

              // Check for financial/payment fields
              const item = data.Data[0];
              const financialFields = Object.keys(item).filter(k =>
                k.toLowerCase().includes('amount') ||
                k.toLowerCase().includes('payment') ||
                k.toLowerCase().includes('price') ||
                k.toLowerCase().includes('cost') ||
                k.toLowerCase().includes('fee') ||
                k.toLowerCase().includes('total')
              );

              if (financialFields.length > 0) {
                console.log('💰 Financial fields found:', financialFields);
              }

              console.log('\nFirst item sample:', JSON.stringify(item, null, 2));
              return { success: true, endpoint: testCase, data: data, hasFinancials: financialFields.length > 0 };
            }
          }
        } else if (Array.isArray(data) && data.length > 0) {
          console.log(`Direct array length: ${data.length}`);
          console.log('First item keys:', Object.keys(data[0]));
          console.log('First item sample:', JSON.stringify(data[0], null, 2));
          return { success: true, endpoint: testCase, data: data };
        }
      } catch (e) {
        console.log('Not JSON:', e.message);
      }
    } else if (response.status === 401) {
      console.log('⚠️  401 Unauthorized');
    } else if (response.status === 404) {
      console.log('❌ 404 Not Found');
    } else {
      console.log(`❓ Status ${response.status}`);
      console.log('Response:', text.substring(0, 300));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }

  return { success: false };
}

async function runTests() {
  const results = [];

  for (const testCase of testCases) {
    const result = await testEndpoint(testCase);
    if (result.success) {
      results.push(result);
    }
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  if (results.length > 0) {
    console.log('\n\n🎉 WORKING ENDPOINTS FOUND!');
    results.forEach(r => {
      console.log(`\n- ${r.endpoint.name}`);
      console.log(`  URL: ${r.endpoint.url}`);
      if (r.hasFinancials) {
        console.log('  💰 Contains financial data!');
      }
    });
  }
}

runTests();
