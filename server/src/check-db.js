const mongoose = require('mongoose');

const uri = 'mongodb://127.0.0.1:27017/studentDB';
console.log('Testing MongoDB connection to:', uri);

mongoose.connect(uri)
    .then(() => {
        console.log('✅ SUCCESS: Connected to MongoDB!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ ERROR: Could not connect to MongoDB.');
        console.error('Details:', err.message);
        console.error('Suggestion: Ensure MongoDB is installed and running (mongod).');
        process.exit(1);
    });
