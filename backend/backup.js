const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
require('dotenv').config();

// Set public DNS servers to resolve MongoDB SRV/Atlas connection issues on IPv6/local DNS
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('Warning: Could not set custom DNS servers:', e.message);
}

const backup = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('Error: MONGO_URI is not defined in the environment variables.');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully.');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const runDir = path.join(backupDir, `backup-${timestamp}`);
    fs.mkdirSync(runDir);

    console.log(`Starting backup of ${collections.length} collections into: ${runDir}`);

    for (const col of collections) {
      const name = col.name;
      console.log(`Backing up collection: ${name}...`);
      const documents = await db.collection(name).find({}).toArray();
      const filePath = path.join(runDir, `${name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), 'utf-8');
      console.log(`Saved ${documents.length} documents to ${name}.json`);
    }

    console.log('\nBackup complete successfully! 🎉');
  } catch (error) {
    console.error('Error during backup:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

backup();
