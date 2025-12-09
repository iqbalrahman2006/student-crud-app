const cron = require('node-cron');
const Transaction = require('../models/Transaction');
const Student = require('../models/Student'); // Assumption: Student model needed for email
const sendEmail = require('./mailer');

const initScheduler = () => {
    console.log("⏰ Library Scheduler Initialized");

    // Run every day at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
        console.log("Running Daily Overdue Checker...");
        await checkOverdueBooks();
    });
};

const checkOverdueBooks = async () => {
    try {
        // 3 Days Before
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + 3);
        const reminderStart = new Date(reminderDate); reminderStart.setHours(0, 0, 0, 0);
        const reminderEnd = new Date(reminderDate); reminderEnd.setHours(23, 59, 59, 999);

        // Due Today
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

        // Overdue (Due yesterday)
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStart = new Date(yesterday); yesterdayStart.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date(yesterday); yesterdayEnd.setHours(23, 59, 59, 999);

        // Fetch all issued books
        const activeLoans = await Transaction.find({ status: 'Issued' }).populate('student').populate('book');
        console.log(`Checking ${activeLoans.length} active loans for notifications...`);

        let sentCount = 0;

        for (const txn of activeLoans) {
            if (!txn.student || !txn.student.email) continue;

            const due = new Date(txn.dueDate);
            let subject = "";
            let message = "";

            // Logic 1: Reminder (3 days before)
            if (due >= reminderStart && due <= reminderEnd) {
                subject = "Reminder: Book Due in 3 Days";
                message = `Dear ${txn.student.name},\n\nThe book "${txn.book.title}" is due on ${due.toLocaleDateString()}. Please return or renew it soon.`;
            }
            // Logic 2: Due Today
            else if (due >= todayStart && due <= todayEnd) {
                subject = "URGENT: Book Due Today";
                message = `Dear ${txn.student.name},\n\nThe book "${txn.book.title}" is due TODAY (${due.toLocaleDateString()}). Please return it by closing time to avoid fines.`;
            }
            // Logic 3: Overdue (Just turned overdue)
            else if (due < todayStart) {
                subject = "OVERDUE NOTICE: Library Book Return";
                message = `Dear ${txn.student.name},\n\nThe book "${txn.book.title}" was due on ${due.toLocaleDateString()}. Please return it immediately.`;
            }

            if (subject) {
                await sendEmail({
                    email: txn.student.email,
                    subject: subject,
                    message: message
                });
                sentCount++;
            }
        }
        console.log(`Sent ${sentCount} notifications.`);
    } catch (err) {
        console.error("Scheduler Error:", err);
    }
};

module.exports = { initScheduler, checkOverdueBooks };
