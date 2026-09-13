require('dotenv').config();

const express = require('express');
const pool = require('../config/db');

// ─── Routes ──────────────────────────────────────────────────────────────────
const authRoutes = require('../routes/authRoutes');
const roomRoutes = require('../routes/roomRoutes');
const bookingRoutes = require('../routes/bookingRoutes');
const customerRoutes = require('../routes/customerRoutes');
const invoiceRoutes = require('../routes/invoiceRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ─── API Endpoints ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);          // Public: /api/auth/login, /api/auth/register
app.use('/api/rooms', roomRoutes);          // Protected: ADMIN, STAFF
app.use('/api/bookings', bookingRoutes);    // Protected: ADMIN, STAFF, CUSTOMER
app.use('/api/customers', customerRoutes);  // Protected: ADMIN, STAFF
app.use('/api/invoices', invoiceRoutes);    // Protected: ADMIN, STAFF

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Hotel Management API đang chạy.' });
});

// ─── Start server ─────────────────────────────────────────────────────────────
async function startServer() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    app.listen(PORT, () => {
      console.log(`Server đang chạy tại http://localhost:${PORT}`);
      console.log(
        `MySQL đã kết nối tới ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'hotel_management'}`
      );
    });
  } catch (error) {
    console.error('Không thể kết nối MySQL:', error.message);
    process.exit(1);
  }
}

startServer();
