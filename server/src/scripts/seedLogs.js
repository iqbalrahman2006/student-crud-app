const mongoose = require('mongoose');
const LibraryAuditLog = require('../../models/LibraryAuditLog');

const run = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/student_db', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to DB");

        const count = await LibraryAuditLog.countDocuments();
        console.log(`Total Audit Logs: ${count}`);

        if (count === 0) {
            console.log("No logs found. Seeding...");
            await LibraryAuditLog.create({
                action: 'BORROW',
                bookId: new mongoose.Types.ObjectId(),
                studentId: new mongoose.Types.ObjectId(),
                adminId: new mongoose.Types.ObjectId(),
                timestamp: new Date(), // Today
                metadata: { info: "Seeded Log 1" }
            });
            await LibraryAuditLog.create({
                action: 'RETURN',
                bookId: new mongoose.Types.ObjectId(),
                studentId: new mongoose.Types.ObjectId(),
                adminId: new mongoose.Types.ObjectId(),
                timestamp: new Date(Date.now() - 3600000), // 1 hour ago
                metadata: { info: "Seeded Log 2" }
            });
            console.log("Seeded 2 logs.");
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayCount = await LibraryAuditLog.countDocuments({ timestamp: { $gte: today } });
            console.log(`Logs from Today: ${todayCount}`);
            if (todayCount === 0) {
                console.log("No logs for today. Seeding 1 for today...");
                await LibraryAuditLog.create({
                    action: 'BORROW',
                    bookId: new mongoose.Types.ObjectId(),
                    studentId: new mongoose.Types.ObjectId(),
                    adminId: new mongoose.Types.ObjectId(),
                    timestamp: new Date(),
                    metadata: { info: "Seeded Today" }
                });
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
