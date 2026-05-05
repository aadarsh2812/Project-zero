// Test user login issue
const http = require('http');

async function loginAndTest() {
  // We need to login as superadmin to get token
  const loginData = JSON.stringify({ username: 'superadmin', password: 'superadmin123' });
  
  const loginReq = http.request({
    hostname: 'localhost', port: 8080, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
  }, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      const data = JSON.parse(body);
      const token = data.token;
      console.log('Token:', token);
      
      // Let's get hotels
      const getHotelsReq = http.request({
        hostname: 'localhost', port: 8080, path: '/api/v1/hotels', method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }, res2 => {
        let body2 = '';
        res2.on('data', d => body2 += d);
        res2.on('end', () => {
          const hotels = JSON.parse(body2);
          console.log('Hotels:', hotels.length);
          if (hotels.length > 0) {
              const hotel = hotels[0];
              console.log('Hotel 0:', hotel.id);
          }
        });
      });
      getHotelsReq.end();
    });
  });
  loginReq.write(loginData);
  loginReq.end();
}

loginAndTest();
