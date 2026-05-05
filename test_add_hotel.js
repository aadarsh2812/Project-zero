const http = require('http');

const data = JSON.stringify({
  name: "Test Hotel 2",
  plan: "Starter"
});

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/v1/hotels',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let body = '';
  res.on('data', d => {
    body += d;
  });
  res.on('end', () => {
    console.log(body);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
