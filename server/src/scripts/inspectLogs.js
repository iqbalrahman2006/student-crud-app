const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const LibraryAuditLog = require('../models/LibraryAuditLog');
// Register referenced models to avoid MissingSchemaError
require('../models/Student');
require('../models/Book');
require('../models/User'); // Assuming AdminId refs User

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studentdb', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB");

        const count = await LibraryAuditLog.countDocuments();
        console.log(`Total Audit Logs: ${count}`);

        const samples = await LibraryAuditLog.find().sort({ timestamp: 1 }).limit(5).lean();
        console.log("Oldest 5 Logs:");
        samples.forEach(log => {
            console.log(`ID: ${log._id}, Time: ${log.timestamp} (Type: ${typeof log.timestamp}), Action: ${log.action}`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

inspect();
