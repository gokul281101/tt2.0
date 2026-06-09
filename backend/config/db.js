const mongoose = require('mongoose');
const dns = require('dns');

// Set public DNS servers to resolve MongoDB SRV/Atlas connection issues on IPv6/local DNS
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('Warning: Could not set custom DNS servers:', e.message);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
