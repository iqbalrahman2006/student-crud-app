const mongoose = require('mongoose');
const LibraryAuditLog = require('./server/src/models/LibraryAuditLog');

const run = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/student_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to DB");

        const count = await LibraryAuditLog.countDocuments();
        console.log(`Total Audit Logs: ${count}`);

        if (count > 0) {
            const latest = await LibraryAuditLog.findOne().sort({ timestamp: -1 });
            const oldest = await LibraryAuditLog.findOne().sort({ timestamp: 1 });
            console.log(`Latest Log: ${latest.timestamp}`);
            console.log(`Oldest Log: ${oldest.timestamp}`);
            console.log(`Sample Action: ${latest.action}`);
        } else {
            console.log("No logs found. Seeding specific logs...");
            // Create some dummy logs for testing if empty
            await LibraryAuditLog.create({
                action: 'BORROW',
                bookId: new mongoose.Types.ObjectId(), // Fake ID
                studentId: new mongoose.Types.ObjectId(),
                adminId: new mongoose.Types.ObjectId(),
                timestamp: new Date(),
                metadata: { info: "Manual Seed" }
            });
            console.log("Seeded 1 log entry.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
