require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const itemsRoutes = require('./routes/items');
const outletsRoutes = require('./routes/outlets');
const stockRoutes = require('./routes/stock');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/outlets', outletsRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', require('./routes/reports'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/opening-balances', require('./routes/openingBalances'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: "Browns Café Stock API" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🟤 Browns Café API running on http://localhost:${PORT}`);
});
