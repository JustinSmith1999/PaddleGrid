const orgId = 'Org_13321';
const apiKey = '13321_d0851966-b379-437c-b820-e95fdefb5807';
const authToken = Buffer.from(`${orgId}:${apiKey}`).toString('base64');

const today = new Date();
const startDate = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
const endDate = today.toISOString().split('T')[0];

console.log('Testing transaction endpoints with different formats...');
console.log('Date Range:', startDate, 'to', endDate);

const testCases = [
  // Different endpoint structures
  {
    name: 'transactions/list with org_id param',
    url: `https://api.courtreserve.com/api/v1/transactions/list?org_id=${orgId}&transactionStartDate=${startDate}&transactionEndDate=${endDate}`,
  },
  {
    name: 'transactions with org_id',
    url: `https://api.courtreserve.com/api/v1/transactions?org_id=${orgId}&transactionStartDate=${startDate}&transactionEndDate=${endDate}`,
  },
  {
    name: 'billing/transactions',
    url: `https://api.courtreserve.com/api/v1/billing/transactions?transactionStartDate=${startDate}&transactionEndDate=${endDate}`,
  },
  {
    name: 'financialreport/transactions',
    url: `https://api.courtreserve.com/api/v1/financialreport/transactions?transactionStartDate=${startDate}&transactionEndDate=${endDate}`,
  },
  {
    name: 'memberreport with transactions',
    url: `https://api.courtreserve.com/api/v1/memberreport/transactions?transactionStartDate=${startDate}&transactionEndDate=${endDate}`,
  },
  {
    name: 'reports/transactions',
    url: `https://api.courtreserve.com/api/v1/reports/transactions?transactionStartDate=${startDate}&transactionEndDate=${endDate}`,
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
      console.log('Response (first 2000 chars):', text.substring(0, 2000));

      try {
        const data = JSON.parse(text);
        console.log('Type:', typeof data, '| Is Array:', Array.isArray(data));

        if (typeof data === 'object') {
          console.log('Keys:', Object.keys(data));
        }

        return { success: true, endpoint: testCase, data: data };
      } catch (e) {
        console.log('Not JSON:', e.message);
      }
    } else if (response.status === 401) {
      console.log('⚠️  401 Unauthorized - endpoint may exist but auth is wrong');
      console.log('Response:', text.substring(0, 500));
    } else if (response.status === 404) {
      console.log('❌ 404 Not Found');
    } else {
      console.log(`❓ Status ${response.status}`);
      console.log('Response:', text.substring(0, 500));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }

  return { success: false };
}

async function runTests() {
  for (const testCase of testCases) {
    const result = await testEndpoint(testCase);
    if (result.success) {
      console.log('\n\n🎉 WORKING ENDPOINT FOUND!');
      console.log('Name:', result.endpoint.name);
      console.log('URL:', result.endpoint.url);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}

runTests();
