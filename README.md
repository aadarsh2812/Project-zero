# Project Zero — Hotel QR Ordering System

A full-stack hotel room/table ordering system where guests scan a QR code, browse the menu, and place orders that appear live on a kitchen display. Admins manage the menu, monitor orders, and process payments through a dedicated dashboard.

---

## Login Credentials

### Admin Dashboard (http://localhost:3002)
| Field    | Value      |
|----------|------------|
| Username | `admin`    |
| Password | `admin123` |

### Kitchen Display System (http://localhost:3001)
| Field    | Value      |
|----------|------------|
| Username | `admin`    |
| Password | `admin123` |

> Both the Admin Dashboard and Kitchen Display share the same hotel credentials stored in the database. These are seeded automatically on first run.

### Customer App (http://localhost:3000)
No login required. Customers are identified by a session token generated when they scan the QR code. Access via:
```
http://localhost:3000?hotelId=1&tableNo=<table_number>
```

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Spring Boot 4.0.3, Java 25, Gradle  |
| Database  | PostgreSQL 15 (Docker)              |
| Cache     | Redis 7 (Docker)                    |
| Real-time | WebSocket (SockJS + STOMP)          |
| Frontend  | React 18 + Vite + Ant Design 5      |

---

## Project Structure

```
Project Zero/
├── ProjectZero/ProjectZero/          # Spring Boot backend
│   └── src/main/java/com/Project/ProjectZero/
│       ├── config/                   # Redis, WebSocket, CORS, DataInitializer
│       ├── controller/               # AdminController, OrderController, MenuController, CustomerController
│       ├── dto/                      # Request/Response DTOs
│       ├── model/                    # Hotel, MenuItem, MenuCategory, Order, OrderItem, Customer
│       ├── repository/               # Spring Data JPA repositories
│       └── service/                  # Business logic, Redis pub/sub, WebSocket
├── customer-app/                     # Customer PWA (port 3000)
├── kitchen-app/                      # Kitchen Display System (port 3001)
├── admin-app/                        # Admin Dashboard (port 3002)
├── docker-compose.yml                # PostgreSQL + Redis containers
├── START HERE.bat                    # One-click launcher
└── SETUP_AND_RUN.ps1                 # Full setup script
```

---

## Running the Application

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — for PostgreSQL & Redis
- Java 25 JDK
- Node.js 24 LTS

### Quick Start (Recommended)
Double-click **`START HERE.bat`** in the project root. It will:
1. Start Docker containers (PostgreSQL + Redis)
2. Build and run the Spring Boot backend
3. Start all three React frontends

### Manual Start

**1. Start infrastructure (Docker)**
```bash
docker compose up -d
```

**2. Start the backend**
```bash
cd ProjectZero/ProjectZero
./gradlew bootRun
```

**3. Start the frontends** (each in a separate terminal)
```bash
# Customer App
cd customer-app && npm install && npm run dev

# Kitchen App
cd kitchen-app && npm install && npm run dev

# Admin App
cd admin-app && npm install && npm run dev
```

---

## Application URLs

| App                | URL                          | Description                        |
|--------------------|------------------------------|------------------------------------|
| Customer PWA       | http://localhost:3000        | Guest ordering via QR code         |
| Kitchen KDS        | http://localhost:3001        | Live order display for kitchen     |
| Admin Dashboard    | http://localhost:3002        | Menu management, orders, payments  |
| Backend API        | http://localhost:8080        | REST API                           |

---

## API Endpoints

### Authentication
| Method | Endpoint            | Description              |
|--------|---------------------|--------------------------|
| POST   | `/api/admin/login`  | Admin/kitchen login      |

### Menu
| Method | Endpoint                          | Description            |
|--------|-----------------------------------|------------------------|
| GET    | `/api/menu/{hotelId}`             | Get full menu          |
| GET    | `/api/admin/{hotelId}/categories` | List categories        |
| POST   | `/api/admin/{hotelId}/categories` | Add category           |
| DELETE | `/api/admin/{hotelId}/categories/{id}` | Delete category   |
| GET    | `/api/admin/{hotelId}/items`      | List menu items        |
| POST   | `/api/admin/{hotelId}/items`      | Add menu item          |
| PUT    | `/api/admin/{hotelId}/items/{id}` | Update menu item       |
| DELETE | `/api/admin/{hotelId}/items/{id}` | Delete menu item       |

### Orders
| Method | Endpoint                          | Description                        |
|--------|-----------------------------------|------------------------------------|
| POST   | `/api/orders`                     | Place a new order (customer)       |
| GET    | `/api/orders/customer?token=...`  | Get orders by customer token       |
| GET    | `/api/orders/hotel/{hotelId}/active` | Active orders for KDS           |
| GET    | `/api/orders/hotel/{hotelId}`     | All orders for admin               |
| PATCH  | `/api/orders/status`              | Update order status (kitchen)      |
| GET    | `/api/orders/ref/{orderRef}`      | Lookup order by reference ID       |
| POST   | `/api/admin/offline-payment`      | Mark order as paid offline         |

### Customers
| Method | Endpoint                          | Description                        |
|--------|-----------------------------------|------------------------------------|
| POST   | `/api/customers/session`          | Create or resume customer session  |

---

## Real-Time Architecture

- **Redis Pub/Sub** — When a customer places an order, the backend publishes to channel `hotel_kitchen_{hotelId}`
- **WebSocket (SockJS + STOMP)** — Kitchen and customer apps connect to `/ws`
  - Kitchen subscribes to: `/topic/hotel/{hotelId}/kitchen`
  - Customer subscribes to: `/topic/customer/{customerId}/status`
- **Order status flow**: `PENDING` → `CONFIRMED` → `PREPARING` → `READY` → `DELIVERED` / `PAID`

---

## Database

**Connection:** `postgresql://postgres:postgres@localhost:5432/hoteldb`

### Key Tables
| Table           | Description                            |
|-----------------|----------------------------------------|
| `hotels`        | Hotel record with admin credentials    |
| `menu_categories` | Menu sections (e.g. Starters, Mains) |
| `menu_items`    | Individual dishes with price & image   |
| `customers`     | Guest sessions (token-based)           |
| `orders`        | Order header with status & payment     |
| `order_items`   | Line items linked to each order        |

### Seed Data (auto-loaded on first run)
- **Hotel:** "The Grand Hotel" — `123 Main Street, City Center`
- **Menu categories:** Starters, Main Course, Drinks, Desserts
- **Sample items:** 11 pre-loaded dishes (Garlic Bread, Grilled Chicken, Pasta Carbonara, etc.)

---

## Environment & Configuration

**`application.properties` (backend)**
```
spring.datasource.url=jdbc:postgresql://localhost:5432/hoteldb
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.redis.host=localhost
spring.redis.port=6379
server.port=8080
```

**Redis session key format:** `session:{token}` (TTL: 8 hours)

---

## Customer Flow

1. Guest scans QR code → lands on `http://localhost:3000?hotelId=1&tableNo=5`
2. App creates/resumes a session (name + table number stored in Redis)
3. Guest browses menu, adds items to cart, places order
4. Order saved to PostgreSQL, published via Redis → Kitchen KDS updates live
5. Kitchen marks order as Ready/Delivered → WebSocket pushes status back to guest
6. Admin can process offline cash/card payment from the dashboard

---

## QR Code Generation

In the Admin Dashboard, navigate to the **QR Generator** section. Enter a table number to generate a QR code containing:
```
http://localhost:3000?hotelId=1&tableNo=<number>
```
Print or display the QR code at the table.
#   P r o j e c t - z e r o  
 