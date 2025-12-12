const mongoose = require('mongoose');
const path = require('path');
const LibraryAuditLog = require(path.join(__dirname, 'server/src/models/LibraryAuditLog'));

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
            console.log(`Latest Log: ${latest.timestamp}`);
            console.log(`Sample Action: ${latest.action}`);

            // Check logs strictly from today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayCount = await LibraryAuditLog.countDocuments({ timestamp: { $gte: today } });
            console.log(`Logs from Today (${today.toDateString()}): ${todayCount}`);
        } else {
            console.log("No logs found. Seeding specific logs...");
            await LibraryAuditLog.create({
                action: 'BORROW',
                bookId: new mongoose.Types.ObjectId(),
                studentId: new mongoose.Types.ObjectId(),
                adminId: new mongoose.Types.ObjectId(),
                timestamp: new Date(),
                metadata: { info: "Manual Seed" }
            });
            console.log("Seeded 1 log entry for TODAY.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
