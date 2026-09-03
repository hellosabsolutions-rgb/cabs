# FleetOS Backend Server (Node.js + Express + MongoDB)

High-performance, production-ready REST API backend for the FleetOS Fleet Management System.

## 🚀 Key Features & Performance Optimizations

1. **MongoDB Connection Pooling**: Configured with up to 10 reusable connections, fast timeouts (5s), and automatic reconnection monitoring.
2. **Lean Queries (`.lean()`)**: Read endpoints return plain JSON objects without Mongoose document hydration overhead, making queries **up to 5x faster**.
3. **Database Indexes**: Compound and single-field B-tree indexes applied on search and filter columns (e.g. `registrationNumber`, `status`, `type`, `date`, `departmentName`).
4. **Gzip Response Compression**: All responses compressed using `compression` middleware to minimize payload size.
5. **Security**: Hardened with `helmet` HTTP headers and CORS configuration.
6. **Rate Limiting**: Configured with `express-rate-limit` (300 requests/15min) to prevent brute-force attacks.
7. **Graceful Shutdown**: Intercepts `SIGINT` and `SIGTERM` to close active HTTP requests and MongoDB connections cleanly without data loss.
8. **Universal CRUD Factory**: Standardized controller supporting filtering, regex search (`?search=`), sorting (`?sort=-createdAt`), field projection (`?fields=`), and pagination (`?page=1&limit=25`).

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB installed locally **OR** a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster connection string.

### 2. Configure Environment Variables
Edit `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/fleetos
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```
> For MongoDB Atlas, replace `MONGO_URI` with:
> `mongodb+srv://<username>:<password>@cluster0.mongodb.net/fleetos?retryWrites=true&w=majority`

### 3. Seed Mock Fleet Data
Populate MongoDB with all initial fleet vehicles, drivers, trips, fuel logs, and contracts:
```bash
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```
The server will run on **http://localhost:5000**.

---

## 📡 REST API Endpoints

All list endpoints support:
- `?search=<query>` (case-insensitive multi-field search)
- `?page=1&limit=25` (pagination)
- `?sort=-createdAt` (sorting)
- `?fields=name,status` (field projection)
- `?<field>=<value>` (exact filtering)

| Resource | Endpoint | Description |
|---|---|---|
| **Health Check** | `GET /api/health` | Server status, uptime, and database health |
| **Dashboard** | `GET /api/dashboard/stats` | Aggregated fleet counts, totals & financials |
| **Vehicles** | `/api/vehicles` | CRUD for commercial & department vehicles |
| **Drivers** | `/api/drivers` | CRUD for drivers, licenses, and duty statuses |
| **Attendance** | `/api/attendance` | Daily driver punch-ins, hours & duties |
| **Driver Expenses** | `/api/driver-expenses` | Daily bata, night halt, and reimbursements |
| **Contracts** | `/api/contracts` | Department contracts, rates & document files |
| **Duty Logs** | `/api/duty-logs` | Daily official duty slips & weekend trips |
| **Monthly Bills** | `/api/bills` | Department billing invoices & status |
| **Payments** | `/api/payments` | Treasury & RTGS department payments |
| **Fuel Logs** | `/api/fuel-logs` | Fuel refills, meter photos & pump receipts |
| **FASTag** | `/api/fastag` | Toll plaza deductions & FASTag recharges |
| **Trips** | `/api/trips` | Commercial outstation & local trip bookings |
| **Expenses** | `/api/expenses` | Fleet operating expenses |
| **Compliance** | `/api/compliance` | Vehicle/driver permits, insurance & pollution |
| **Maintenance** | `/api/maintenance` | Vehicle services, repairs, and tyre changes |
