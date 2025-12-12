const https = require('https');

const orgId = '4320';
const apiKey = 'bb171c02-1e99-4831-ba67-87ee16d48df2';
const authToken = Buffer.from(`${orgId}:${apiKey}`).toString('base64');

// Try to get a comprehensive view like the UI shows
const date = '2025-12-11T00:00:00Z';
const endDate = '2025-12-12T06:00:00Z';

async function testEndpoint(path, params) {
  return new Promise((resolve) => {
    const fullPath = path + '?' + params;
    const options = {
      hostname: 'api.courtreserve.com',
      path: fullPath,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000
    };

    console.log(`\nTrying: ${fullPath}`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        if (res.statusCode === 200 && data) {
          try {
            const json = JSON.parse(data);
            console.log('SUCCESS! Response structure:');
            console.log(JSON.stringify(json, null, 2).substring(0, 2000));
          } catch (e) {
            console.log('Response preview:', data.substring(0, 500));
          }
        }
        resolve();
      });
    });

    req.on('error', (e) => { console.log('Error:', e.message); resolve(); });
    req.on('timeout', () => { req.destroy(); resolve(); });
    req.end();
  });
}

(async () => {
  // The reservation report already works - let's see what it actually returns
  await testEndpoint('/api/v1/reservationreport/listactive',
    `reservationsFromDate=${date}&reservationsToDate=${endDate}`);

  // Check if there's an org-level or facility-level schedule
  await testEndpoint('/api/v1/organization/schedule', `from=${date}&to=${endDate}`);
  await testEndpoint('/api/v1/facilitycourt/reservations', `from=${date}&to=${endDate}`);

  // Maybe there's a combined endpoint
  await testEndpoint('/api/v1/reservationreport/all', `from=${date}&to=${endDate}`);
  await testEndpoint('/api/v1/reservationreport/listall', `from=${date}&to=${endDate}`);
})();
