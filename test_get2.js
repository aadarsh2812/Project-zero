const https = require('https');

const req = https.request({
  hostname: 'jjzvxsnr-8080.inc1.devtunnels.ms',
  port: 443,
  path: '/api/v1/orders?hotelId=c112b49b',
  method: 'GET',
  headers: {
    'Origin': 'http://localhost:5173',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  }
}, res => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Body:', body.substring(0, 500)));
});
req.end();
