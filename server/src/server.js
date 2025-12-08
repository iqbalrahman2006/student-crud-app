require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;
console.log("Attempting to connect to MongoDB...");
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studentdb';

const connectWithRetry = () => {
    mongoose.connect(MONGO_URI)
        .then(() => {
            console.log('MongoDB Connected Successfully');

            const server = app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
                console.log(`API available at: http://localhost:${PORT}/api/v1`);
            });

            server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
                    console.error(`\nTo fix this, stop the other process using port ${PORT}:`);
                    console.error(`  Windows: netstat -ano | findstr :${PORT}`);
                    console.error(`  Then: taskkill /PID <PID> /F\n`);
                    process.exit(1);
                } else {
                    console.error('Server error:', err);
                    process.exit(1);
                }
            });
        })
        .catch((err) => {
            console.error('MongoDB Connection Failed. Retrying in 5 seconds...', err.message);
            setTimeout(connectWithRetry, 5000);
        });
};

connectWithRetry();
