require('dotenv').config();

const app = require('./app');
const connectDatabase = require('./config/database');

const PORT = process.env.PORT || 3000;

async function start() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Vishnu Moorti Kala Centre server running on port ${PORT}`);
    console.log(`Public site:  http://localhost:${PORT}`);
    console.log(`Admin panel:  http://localhost:${PORT}/admin`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
