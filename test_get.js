const https = require('https');

const req = https.request({
  hostname: 'jjzvxsnr-8080.inc1.devtunnels.ms',
  port: 443,
  path: '/api/v1/orders?hotelId=c112b49b',
  method: 'GET'
}, res => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Body:', body.substring(0, 500)));
});
req.end();
