const orgId = 'Org_13321';
const apiKey = '13321_3befc61e-de2e-4d9e-9b89-439fe2ccce43';
const authToken = Buffer.from(`${orgId}:${apiKey}`).toString('base64');

const today = new Date();
const startDate = today.toISOString().split('T')[0];
const endDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

console.log('Testing CourtReserve API...');
console.log('Start Date:', startDate);
console.log('End Date:', endDate);
console.log('Auth Token:', authToken.substring(0, 20) + '...');

// Test Reservation API
const reservationUrl = `https://api.courtreserve.com/api/v1/reservationreport/listactive?start_date=${startDate}&end_date=${endDate}`;
console.log('\n=== Testing Reservation API ===');
console.log('URL:', reservationUrl);

fetch(reservationUrl, {
  method: 'GET',
  headers: {
    'Authorization': `Basic ${authToken}`,
    'Content-Type': 'application/json',
  },
})
  .then(response => {
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    return response.text();
  })
  .then(text => {
    console.log('Raw Response (first 2000 chars):', text.substring(0, 2000));
    try {
      const data = JSON.parse(text);
      console.log('Parsed Type:', typeof data);
      console.log('Is Array:', Array.isArray(data));
      if (typeof data === 'object' && !Array.isArray(data)) {
        console.log('Object Keys:', Object.keys(data));
      }
      if (Array.isArray(data)) {
        console.log('Array Length:', data.length);
        if (data.length > 0) {
          console.log('First Item:', JSON.stringify(data[0], null, 2));
        }
      }
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
    }
  })
  .catch(err => console.error('Error:', err));

// Test Event API
setTimeout(() => {
  const eventStartDate = today.toISOString().split('T')[0];
  const eventEndDate = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

  const eventUrl = `https://api.courtreserve.com/api/v1/eventregistrationreport/listactive?start_date=${eventStartDate}&end_date=${eventEndDate}`;
  console.log('\n\n=== Testing Event API ===');
  console.log('URL:', eventUrl);

  fetch(eventUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json',
    },
  })
    .then(response => {
      console.log('Status:', response.status);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      return response.text();
    })
    .then(text => {
      console.log('Raw Response (first 2000 chars):', text.substring(0, 2000));
      try {
        const data = JSON.parse(text);
        console.log('Parsed Type:', typeof data);
        console.log('Is Array:', Array.isArray(data));
        if (typeof data === 'object' && !Array.isArray(data)) {
          console.log('Object Keys:', Object.keys(data));
        }
        if (Array.isArray(data)) {
          console.log('Array Length:', data.length);
          if (data.length > 0) {
            console.log('First Item:', JSON.stringify(data[0], null, 2));
          }
        }
      } catch (e) {
        console.error('Failed to parse JSON:', e.message);
      }
    })
    .catch(err => console.error('Error:', err));
}, 2000);
