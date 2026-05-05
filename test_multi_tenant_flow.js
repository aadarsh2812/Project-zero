const http = require('http');

const API_BASE = 'http://localhost:8080/api/v1';

async function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: 'localhost',
      port: 8080,
      path: `/api/v1${path}`,
      method: method,
      headers: headers
    };

    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch (e) {
          parsed = data;
        }
        resolve({ statusCode: res.statusCode, body: parsed });
      });
    });

    req.on('error', error => reject(error));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function login(username, password) {
  const res = await request('POST', '/auth/login', { username, password });
  if (res.statusCode !== 200 || !res.body.token) {
    throw new Error(`Login failed for ${username}: ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

async function runTest() {
  console.log("--- Starting Multi-Tenant Flow Test ---");

  // 0. Login as superadmin
  console.log("\n0. Logging in as superadmin...");
  const superAdminToken = await login('superadmin', 'superadmin123');
  console.log("Superadmin logged in.");

  // 1. Create two hotels
  console.log("\n1. Creating Hotel A...");
  const resA = await request('POST', '/hotels', { name: "Hotel A" }, superAdminToken);
  if (!resA.body || !resA.body.id) throw new Error("Failed to create Hotel A");
  const hotelA = resA.body;
  console.log("Hotel A created with ID:", hotelA.id);

  console.log("Creating Hotel B...");
  const resB = await request('POST', '/hotels', { name: "Hotel B" }, superAdminToken);
  if (!resB.body || !resB.body.id) throw new Error("Failed to create Hotel B");
  const hotelB = resB.body;
  console.log("Hotel B created with ID:", hotelB.id);

  // 2. Login as admins
  console.log("\n2. Logging in as Hotel Admins...");
  const tokenA = await login(`admin_${hotelA.id}`, 'admin123');
  const tokenB = await login(`admin_${hotelB.id}`, 'admin123');
  console.log("Hotel Admins logged in.");

  // 3. Create menu items for both hotels
  console.log(`\n3. Creating Menu Item for Hotel A (${hotelA.id})...`);
  const resMenuA = await request('POST', `/menu/items?hotelId=${hotelA.id}`, { name: "Burger (Hotel A)", price: 100 }, tokenA);
  console.log("Response Menu A:", resMenuA.statusCode, resMenuA.body);
  const menuA = resMenuA.body;
  console.log("Menu Item A created:", menuA ? menuA.name : null);

  console.log(`Creating Menu Item for Hotel B (${hotelB.id})...`);
  const resMenuB = await request('POST', `/menu/items?hotelId=${hotelB.id}`, { name: "Pizza (Hotel B)", price: 200 }, tokenB);
  console.log("Response Menu B:", resMenuB.statusCode, resMenuB.body);
  const menuB = resMenuB.body;
  console.log("Menu Item B created:", menuB ? menuB.name : null);

  // 4. Verify Menu Isolation (Public access)
  console.log("\n4. Verifying Menu Isolation...");
  const fetchedMenuA = (await request('GET', `/menu/items?hotelId=${hotelA.id}`)).body;
  console.log("Hotel A Menu Items:", fetchedMenuA.map(m => m.name));

  const fetchedMenuB = (await request('GET', `/menu/items?hotelId=${hotelB.id}`)).body;
  console.log("Hotel B Menu Items:", fetchedMenuB.map(m => m.name));

  // 5. Create orders for both hotels (Public access)
  console.log("\n5. Creating Order for Hotel A...");
  const orderA = (await request('POST', `/orders?hotelId=${hotelA.id}`, {
    customerName: "Alice",
    items: [{ menuItemId: menuA.id, quantity: 1, name: "Burger", price: 100 }]
  })).body;
  console.log("Order A created with ID:", orderA.id);

  console.log("Creating Order for Hotel B...");
  const orderB = (await request('POST', `/orders?hotelId=${hotelB.id}`, {
    customerName: "Bob",
    items: [{ menuItemId: menuB.id, quantity: 1, name: "Pizza", price: 200 }]
  })).body;
  console.log("Order B created with ID:", orderB.id);

  // 6. Verify Order Isolation (Public access)
  console.log("\n6. Verifying Order Isolation...");
  const fetchedOrdersA = (await request('GET', `/orders?hotelId=${hotelA.id}`)).body;
  console.log("Hotel A Orders count:", fetchedOrdersA.length);
  console.log("Hotel A Order details:", fetchedOrdersA.map(o => o.customerName));

  const fetchedOrdersB = (await request('GET', `/orders?hotelId=${hotelB.id}`)).body;
  console.log("Hotel B Orders count:", fetchedOrdersB.length);
  console.log("Hotel B Order details:", fetchedOrdersB.map(o => o.customerName));

  // Assertions
  const passed = 
    fetchedMenuA.length === 1 && fetchedMenuA[0].name === "Burger (Hotel A)" &&
    fetchedMenuB.length === 1 && fetchedMenuB[0].name === "Pizza (Hotel B)" &&
    fetchedOrdersA.length === 1 && fetchedOrdersA[0].customerName === "Alice" &&
    fetchedOrdersB.length === 1 && fetchedOrdersB[0].customerName === "Bob";

  if (passed) {
    console.log("\n✅ ALL TESTS PASSED! Multi-tenant isolation is working correctly.");
  } else {
    console.log("\n❌ TESTS FAILED! Data mixed up across hotels.");
  }
}

runTest().catch(console.error);
