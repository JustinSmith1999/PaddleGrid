const orgId = 'Org_13321';
const apiKey = '13321_3befc61e-de2e-4d9e-9b89-439fe2ccce43'; // Working key from test file
const authToken = Buffer.from(`${orgId}:${apiKey}`).toString('base64');

const today = new Date();
const startDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
const endDate = today.toISOString().split('T')[0];

console.log('Testing transaction/financial endpoints with working key...');
console.log('Date Range:', startDate, 'to', endDate, '\n');

const endpoints = [
  // Try the transactions/list endpoint that gave 401 before
  {
    name: 'transactions/list with transactionStartDate',
    url: `https://api.courtreserve.com/api/v1/transactions/list?transactionStartDate=${startDate}&transactionEndDate=${endDate}`,
  },
  {
    name: 'transactions/list with start_date',
    url: `https://api.courtreserve.com/api/v1/transactions/list?start_date=${startDate}&end_date=${endDate}`,
  },
  // Try variations
  {
    name: 'financial/list',
    url: `https://api.courtreserve.com/api/v1/financial/list?start_date=${startDate}&end_date=${endDate}`,
  },
  {
    name: 'financialreport/list',
    url: `https://api.courtreserve.com/api/v1/financialreport/list?start_date=${startDate}&end_date=${endDate}`,
  },
  {
    name: 'transactionreport/list',
    url: `https://api.courtreserve.com/api/v1/transactionreport/list?start_date=${startDate}&end_date=${endDate}`,
  },
  {
    name: 'payment/list',
    url: `https://api.courtreserve.com/api/v1/payment/list?start_date=${startDate}&end_date=${endDate}`,
  },
  {
    name: 'paymentreport/list',
    url: `https://api.courtreserve.com/api/v1/paymentreport/list?start_date=${startDate}&end_date=${endDate}`,
  },
  {
    name: 'billing/list',
    url: `https://api.courtreserve.com/api/v1/billing/list?start_date=${startDate}&end_date=${endDate}`,
  },
  // Check if reservation data includes payment info
  {
    name: 'reservationreport/listactive',
    url: `https://api.courtreserve.com/api/v1/reservationreport/listactive?start_date=${startDate}&end_date=${endDate}`,
  },
];

async function testEndpoint(endpoint) {
  console.log(`=== ${endpoint.name} ===`);

  try {
    const response = await fetch(endpoint.url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', response.status);

    const text = await response.text();

    if (response.status === 200) {
      try {
        const data = JSON.parse(text);

        console.log('Response keys:', Object.keys(data));
        console.log('IsSuccessStatusCode:', data.IsSuccessStatusCode);

        if (data.ErrorMessage) {
          console.log('❌ Error:', data.ErrorMessage);
        }

        if (data.Data) {
          if (Array.isArray(data.Data)) {
            console.log(`✅ SUCCESS! Data array with ${data.Data.length} items`);
            if (data.Data.length > 0) {
              console.log('First item keys:', Object.keys(data.Data[0]));

              // Look for financial fields
              const financialFields = Object.keys(data.Data[0]).filter(k =>
                k.toLowerCase().includes('amount') ||
                k.toLowerCase().includes('payment') ||
                k.toLowerCase().includes('price') ||
                k.toLowerCase().includes('cost') ||
                k.toLowerCase().includes('fee') ||
                k.toLowerCase().includes('total') ||
                k.toLowerCase().includes('transaction')
              );

              if (financialFields.length > 0) {
                console.log('💰 Financial fields:', financialFields);
              }

              console.log('Sample item:', JSON.stringify(data.Data[0], null, 2));
              return { success: true, url: endpoint.url, data: data.Data[0] };
            }
          } else if (data.Data === null) {
            console.log('⚠️  Data is null');
          } else {
            console.log('⚠️  Data is not an array:', typeof data.Data);
          }
        }
      } catch (e) {
        console.log('Not valid JSON:', text.substring(0, 300));
      }
    } else {
      console.log('Failed with status', response.status);
      console.log('Response:', text.substring(0, 200));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }

  console.log('');
  return { success: false };
}

async function runTests() {
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    if (result.success) {
      console.log('\n🎉 WORKING TRANSACTION ENDPOINT FOUND!');
      console.log('URL:', result.url);
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 600));
  }
}

runTests();
