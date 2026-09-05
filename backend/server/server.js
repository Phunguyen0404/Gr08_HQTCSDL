const path = require('path');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const bookingRoutes = require('../routes/bookingRoutes');

app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend/public')));
app.use('/css', express.static(path.join(__dirname, '../../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../../frontend/js')));
app.use('/assets', express.static(path.join(__dirname, '../../frontend/assets')));

app.use('/api/bookings', bookingRoutes);

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});