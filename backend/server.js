require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jsfinance';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Load route modules (will be created later)
const transactionRoutes = require('./routes/transactions');
const purchaseRoutes = require('./routes/purchases');
const commitmentRoutes = require('./routes/commitments');
const adminRoutes = require('./routes/admin');

app.use('/api/transactions', transactionRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/commitments', commitmentRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
});
