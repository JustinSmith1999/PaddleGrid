const https = require('https');

const orgId = '4320';
const apiKey = 'bb171c02-1e99-4831-ba67-87ee16d48df2';
const authToken = Buffer.from(`${orgId}:${apiKey}`).toString('base64');

const endpoints = [
  '/api/v1/schedule/list',
  '/api/v1/schedule/listactive',
  '/api/v1/facility/schedule',
  '/api/v1/court/schedule',
  '/api/v1/calendar/list',
  '/api/v1/reservation/schedule',
  '/api/v1/event/schedule',
  '/api/v1/schedule/court',
  '/api/v1/facilitycourt/list',
  '/api/v1/facilitycourt/schedule',
];

async function testEndpoint(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.courtreserve.com',
      path: path + '?date=2025-12-11',
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`SUCCESS: ${path} - Status ${res.statusCode}`);
          try {
            const json = JSON.parse(data);
            const keys = Object.keys(json).join(', ');
            console.log(`  Response keys: ${keys}`);
            if (json.Data && Array.isArray(json.Data) && json.Data.length > 0) {
              console.log(`  Data length: ${json.Data.length}`);
              console.log(`  Sample item keys: ${Object.keys(json.Data[0]).join(', ')}`);
            }
          } catch (e) {
            console.log(`  Raw response preview: ${data.substring(0, 100)}`);
          }
        } else {
          console.log(`FAILED: ${path} - Status ${res.statusCode}`);
        }
        resolve();
      });
    });

    req.on('error', () => resolve());
    req.on('timeout', () => { req.destroy(); resolve(); });
    req.end();
  });
}

(async () => {
  console.log('Testing CourtReserve schedule endpoints...\n');
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
})();
