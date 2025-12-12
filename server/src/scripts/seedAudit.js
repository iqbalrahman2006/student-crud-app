const mongoose = require('mongoose');
const LibraryAuditLog = require('../../models/LibraryAuditLog');

const run = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/student_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected");

        await LibraryAuditLog.create({
            action: 'BORROW',
            timestamp: new Date(),
            metadata: { info: "Manual Seed for User Verification" }
        });

        console.log("Seeded 1 Audit Log");

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
