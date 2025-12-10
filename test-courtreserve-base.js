const orgId = 'Org_13321';
const apiKey = '13321_3befc61e-de2e-4d9e-9b89-439fe2ccce43';
const authToken = Buffer.from(`${orgId}:${apiKey}`).toString('base64');

console.log('Testing CourtReserve API base endpoints...\n');

const baseEndpoints = [
  'https://api.courtreserve.com/api/v1/',
  'https://api.courtreserve.com/api/v1/help',
  'https://api.courtreserve.com/api/v1/reservationreport',
  'https://api.courtreserve.com/api/v1/eventregistrationreport',
  'https://api.courtreserve.com/api/',
];

async function testEndpoint(url) {
  console.log(`Testing: ${url}`);

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
    console.log('Response:', text.substring(0, 500));
    console.log('---\n');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function runTests() {
  for (const endpoint of baseEndpoints) {
    await testEndpoint(endpoint);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n\nAlso checking if we can access organization-specific endpoints...\n');

  const orgEndpoints = [
    `https://api.courtreserve.com/api/v1/organizations/${orgId}`,
    `https://api.courtreserve.com/api/v1/org/${orgId}/reservations`,
    'https://api.courtreserve.com/api/v1/me',
    'https://api.courtreserve.com/api/v1/account',
  ];

  for (const endpoint of orgEndpoints) {
    await testEndpoint(endpoint);
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}

runTests();
