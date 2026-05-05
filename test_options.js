const http = require('https');

const req = http.request({
  hostname: 'jjzvxsnr-8080.inc1.devtunnels.ms',
  port: 443,
  path: '/api/v1/orders',
  method: 'OPTIONS',
  headers: {
    'Origin': 'http://localhost:5173',
    'Access-Control-Request-Method': 'GET'
  }
}, res => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
});
req.end();
