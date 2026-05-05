const http = require('http');

async function testCreds() {
  const loginData = JSON.stringify({ username: 'superadmin', password: 'superadmin123' });
  
  const loginReq = http.request({
    hostname: 'localhost', port: 8080, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
  }, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      const token = JSON.parse(body).token;
      
      const hotelId = '70191375'; // ID of the second hotel
      
      // Update admin user
      const adminData = JSON.stringify({ user: "sameuser", pass: "samepass" });
      const adminReq = http.request({
        hostname: 'localhost', port: 8080, path: `/api/v1/hotels/${hotelId}/credentials?type=admin`, method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Content-Length': adminData.length, 'Authorization': `Bearer ${token}` }
      }, res2 => {
        console.log('Admin update status:', res2.statusCode);
        
        // Update kitchen user
        const kitchenData = JSON.stringify({ user: "sameuser", pass: "samepass" });
        const kitchenReq = http.request({
          hostname: 'localhost', port: 8080, path: `/api/v1/hotels/${hotelId}/credentials?type=kitchen`, method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Content-Length': kitchenData.length, 'Authorization': `Bearer ${token}` }
        }, res3 => {
          console.log('Kitchen update status:', res3.statusCode);
        });
        kitchenReq.write(kitchenData);
        kitchenReq.end();
      });
      adminReq.write(adminData);
      adminReq.end();
    });
  });
  loginReq.write(loginData);
  loginReq.end();
}
testCreds();
