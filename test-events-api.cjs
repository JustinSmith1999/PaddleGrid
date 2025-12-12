const https = require('https');

const orgId = '4320';
const apiKey = 'bb171c02-1e99-4831-ba67-87ee16d48df2';
const authToken = Buffer.from(`${orgId}:${apiKey}`).toString('base64');

const options = {
  hostname: 'api.courtreserve.com',
  path: '/api/v1/eventregistrationreport/listactive?eventDateFrom=2025-12-11T00:00:00Z&eventDateTo=2025-12-12T06:00:00Z',
  method: 'GET',
  headers: {
    'Authorization': `Basic ${authToken}`,
    'Content-Type': 'application/json',
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const events = json.Data || [];

    console.log(`Total events: ${events.length}`);

    if (events.length > 0) {
      console.log('\nSample event structure:');
      console.log(JSON.stringify(events[0], null, 2));

      // Check which events have Courts field
      const withCourts = events.filter(e => e.Courts);
      console.log(`\nEvents with Courts field: ${withCourts.length}`);

      if (withCourts.length > 0) {
        console.log('\nSample event with courts:');
        console.log(JSON.stringify(withCourts[0], null, 2));
      }
    }
  });
});

req.on('error', (e) => console.error(e));
req.end();
