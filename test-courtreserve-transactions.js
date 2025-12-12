const orgId = 'Org_13321';
const apiKey = '13321_d0851966-b379-437c-b820-e95fdefb5807';
const authToken = Buffer.from(`${orgId}:${apiKey}`).toString('base64');

const today = new Date();
const startDate = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
const endDate = today.toISOString().split('T')[0];

console.log('Testing CourtReserve Transaction API...');
console.log('Start Date:', startDate);
console.log('End Date:', endDate);
console.log('Auth Token:', authToken.substring(0, 20) + '...');

const endpoints = [
  `https://api.courtreserve.com/api/v1/transactions/list?transactionStartDate=${startDate}&transactionEndDate=${endDate}`,
  `https://api.courtreserve.com/api/v1/transactionreport/list?transactionStartDate=${startDate}&transactionEndDate=${endDate}`,
  `https://api.courtreserve.com/api/v1/transactionreport/listactive?start_date=${startDate}&end_date=${endDate}`,
  `https://api.courtreserve.com/api/v1/transactions?transactionStartDate=${startDate}&transactionEndDate=${endDate}`,
  `https://api.courtreserve.com/api/v1/paymentreport/list?transactionStartDate=${startDate}&transactionEndDate=${endDate}`,
];

async function testEndpoint(url) {
  console.log(`\n=== Testing: ${url} ===`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response (first 1000 chars):', text.substring(0, 1000));

    try {
      const data = JSON.parse(text);
      console.log('Parsed Type:', typeof data);
      console.log('Is Array:', Array.isArray(data));

      if (typeof data === 'object' && !Array.isArray(data)) {
        console.log('Object Keys:', Object.keys(data));

        // Check for common wrapper properties
        if (data.Data) {
          console.log('✅ Found Data property:', Array.isArray(data.Data) ? `Array with ${data.Data.length} items` : typeof data.Data);
          if (Array.isArray(data.Data) && data.Data.length > 0) {
            console.log('First item keys:', Object.keys(data.Data[0]));
            console.log('First item sample:', JSON.stringify(data.Data[0], null, 2));
            return { success: true, url, format: 'Data', sample: data.Data[0] };
          }
        }
        if (data.transactions) {
          console.log('✅ Found transactions property:', Array.isArray(data.transactions) ? `Array with ${data.transactions.length} items` : typeof data.transactions);
          if (Array.isArray(data.transactions) && data.transactions.length > 0) {
            console.log('First item:', JSON.stringify(data.transactions[0], null, 2));
            return { success: true, url, format: 'transactions', sample: data.transactions[0] };
          }
        }
        if (data.items) {
          console.log('✅ Found items property:', Array.isArray(data.items) ? `Array with ${data.items.length} items` : typeof data.items);
          if (Array.isArray(data.items) && data.items.length > 0) {
            console.log('First item:', JSON.stringify(data.items[0], null, 2));
            return { success: true, url, format: 'items', sample: data.items[0] };
          }
        }
      }

      if (Array.isArray(data)) {
        console.log('✅ Direct Array Length:', data.length);
        if (data.length > 0) {
          console.log('First item keys:', Object.keys(data[0]));
          console.log('First item sample:', JSON.stringify(data[0], null, 2));
          return { success: true, url, format: 'direct-array', sample: data[0] };
        }
      }
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }

  return { success: false, url };
}

async function runTests() {
  console.log('\n🔍 Testing multiple endpoints...\n');

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    if (result.success) {
      console.log('\n\n🎉 FOUND WORKING ENDPOINT!');
      console.log('URL:', result.url);
      console.log('Format:', result.format);
      console.log('Sample Data:', JSON.stringify(result.sample, null, 2));
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

runTests();
