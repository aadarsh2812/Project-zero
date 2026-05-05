const http = require('http');

async function testAdd() {
  const loginData = JSON.stringify({ username: 'superadmin', password: 'superadmin123' });
  
  const loginReq = http.request({
    hostname: 'localhost', port: 8080, path: '/api/v1/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
  }, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      const token = JSON.parse(body).token;
      
      const hotelData = JSON.stringify({ name: "Second Hotel", plan: "Pro", status: "ACTIVE" });
      const addReq = http.request({
        hostname: 'localhost', port: 8080, path: '/api/v1/hotels', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': hotelData.length, 'Authorization': `Bearer ${token}` }
      }, res2 => {
        console.log('Status code:', res2.statusCode);
        let body2 = '';
        res2.on('data', d => body2 += d);
        res2.on('end', () => {
          console.log('Response:', body2);
        });
      });
      addReq.write(hotelData);
      addReq.end();
    });
  });
  loginReq.write(loginData);
  loginReq.end();
}
testAdd();
