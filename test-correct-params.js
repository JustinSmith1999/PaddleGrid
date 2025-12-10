const orgId = 'Org_13321';
const apiKey = '13321_3befc61e-de2e-4d9e-9b89-439fe2ccce43';
const authToken = Buffer.from(`${orgId}:${apiKey}`).toString('base64');

const today = new Date();
const fromDate = today.toISOString();
const toDate = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString();

console.log('Testing correct parameters from Swagger docs...\n');

// Test 1: reservationsFromDate/reservationsToDate
const url1 = `https://api.courtreserve.com/api/v1/reservationreport/listactive?reservationsFromDate=${encodeURIComponent(fromDate)}&reservationsToDate=${encodeURIComponent(toDate)}`;
console.log('Test 1: reservationsFromDate/reservationsToDate');
console.log('URL:', url1);

fetch(url1, {
  method: 'GET',
  headers: {
    'Authorization': `Basic ${authToken}`,
    'Content-Type': 'application/json',
  },
})
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data.IsSuccessStatusCode);
    console.log('Error:', data.ErrorMessage || 'None');
    if (data.Data && Array.isArray(data.Data)) {
      console.log('✅ SUCCESS! Found', data.Data.length, 'reservations');
      if (data.Data.length > 0) {
        console.log('First reservation:', JSON.stringify(data.Data[0], null, 2));
      }
    }
  })
  .catch(err => console.error('Error:', err));

// Test 2: createdOrUpdatedOnFrom/createdOrUpdatedOnTo
setTimeout(() => {
  const url2 = `https://api.courtreserve.com/api/v1/reservationreport/listactive?createdOrUpdatedOnFrom=${encodeURIComponent(fromDate)}&createdOrUpdatedOnTo=${encodeURIComponent(toDate)}`;
  console.log('\n\nTest 2: createdOrUpdatedOnFrom/createdOrUpdatedOnTo');
  console.log('URL:', url2);

  fetch(url2, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data.IsSuccessStatusCode);
      console.log('Error:', data.ErrorMessage || 'None');
      if (data.Data && Array.isArray(data.Data)) {
        console.log('✅ SUCCESS! Found', data.Data.length, 'reservations');
        if (data.Data.length > 0) {
          console.log('First reservation:', JSON.stringify(data.Data[0], null, 2));
        }
      }
    })
    .catch(err => console.error('Error:', err));
}, 2000);

// Test 3: Event registration
setTimeout(() => {
  const url3 = `https://api.courtreserve.com/api/v1/eventregistrationreport/listactive?registrationsFromDate=${encodeURIComponent(fromDate)}&registrationsToDate=${encodeURIComponent(toDate)}`;
  console.log('\n\nTest 3: Event registrations');
  console.log('URL:', url3);

  fetch(url3, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${authToken}`,
      'Content-Type': 'application/json',
    },
  })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data.IsSuccessStatusCode);
      console.log('Error:', data.ErrorMessage || 'None');
      if (data.Data && Array.isArray(data.Data)) {
        console.log('✅ SUCCESS! Found', data.Data.length, 'events');
        if (data.Data.length > 0) {
          console.log('First event:', JSON.stringify(data.Data[0], null, 2));
        }
      }
    })
    .catch(err => console.error('Error:', err));
}, 4000);
