// ...existing code...
require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/studentdb';
        await mongoose.connect(uri); // no legacy options
        console.log('MongoDB connected');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message || error);
        process.exit(1);
    }
};

module.exports = connectDB;
// ...existing code...