const express = require('express');
const roomRoutes = require('../routes/roomRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Hotel Management API đang chạy.'
  });
});

app.use('/api', roomRoutes);

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});