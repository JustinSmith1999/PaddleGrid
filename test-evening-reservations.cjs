const https = require('https');

const orgId = '4320';
const apiKey = 'bb171c02-1e99-4831-ba67-87ee16d48df2';
const authToken = Buffer.from(`${orgId}:${apiKey}`).toString('base64');

const fromDate = '2025-12-10T00:00:00';  // Get yesterday to today
const toDate = '2025-12-12T23:59:59';

const url = `/api/v1/reservationreport/listactive?reservationsFromDate=${encodeURIComponent(fromDate)}&reservationsToDate=${encodeURIComponent(toDate)}`;

console.log('Fetching ALL reservations to find evening blocks...\n');

const options = {
  hostname: 'api.courtreserve.com',
  path: url,
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
    try {
      const json = JSON.parse(data);

      if (!json.IsSuccessStatusCode) {
        console.log('API Error:', json.ErrorMessage);
        return;
      }

      const reservations = json.Data || [];
      console.log(`Total reservations: ${reservations.length}\n`);

      // Filter for Dec 11, 8-10 PM on courts 2-5
      const evening = reservations.filter(r => {
        const start = new Date(r.StartTime);
        const hour = start.getHours();
        const date = start.toISOString().split('T')[0];
        const courts = r.Courts || '';

        return date === '2025-12-12' && // UTC date
               hour >= 1 && hour < 3 &&  // 8-10 PM EST = 01:00-03:00 UTC next day
               (courts.includes('Court #2') || courts.includes('Court #3') ||
                courts.includes('Court #4') || courts.includes('Court #5'));
      });

      console.log(`Evening reservations (8-10 PM, Courts 2-5): ${evening.length}\n`);

      if (evening.length > 0) {
        console.log('Details:');
        evening.forEach((r, i) => {
          console.log(`\n${i + 1}. ${r.ReservationTypeName || 'No Type'}`);
          console.log(`   Courts: ${r.Courts}`);
          console.log(`   Start: ${r.StartTime}`);
          console.log(`   End: ${r.EndTime}`);
          console.log(`   Players: ${r.Players?.length || 0}`);
          if (r.Players && r.Players.length > 0) {
            console.log(`   First player: ${r.Players[0].FirstName} ${r.Players[0].LastName}`);
          }
        });
      } else {
        console.log('❌ NO evening reservations found in this data!');
        console.log('\nShowing sample of what we DO have:');
        reservations.slice(0, 5).forEach((r, i) => {
          console.log(`\n${i + 1}. ${r.ReservationTypeName || 'No Type'}`);
          console.log(`   Courts: ${r.Courts}`);
          console.log(`   Start: ${r.StartTime}`);
        });
      }
    } catch (e) {
      console.log('Parse error:', e.message);
      console.log('Response:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => console.error('Request error:', e.message));
req.end();
