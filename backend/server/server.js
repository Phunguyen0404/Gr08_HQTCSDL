require('dotenv').config();

const express = require('express');
const pool = require('../config/db');
const authRoutes = require('../routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Hello Express!');
});

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
