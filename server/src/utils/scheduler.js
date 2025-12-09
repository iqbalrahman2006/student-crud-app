const cron = require('node-cron');
const Transaction = require('../models/Transaction');
const sendEmail = require('./mailer');
const logLibraryAction = require('./libraryLogger');

const initScheduler = () => {
    console.log("⏰ Enterprise Library Scheduler Initialized");

    // Run every day at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
        console.log("Running Enterprise Overdue Engine...");
        await checkOverdueBooks();
    });
};

const checkOverdueBooks = async () => {
    try {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

        // Reminder (3 Days Before)
        const reminderDate = new Date(); reminderDate.setDate(reminderDate.getDate() + 3);
        const reminderStart = new Date(reminderDate); reminderStart.setHours(0, 0, 0, 0);
        const reminderEnd = new Date(reminderDate); reminderEnd.setHours(23, 59, 59, 999);

        // Final Warning (7 Days Overdue)
        const fatalDate = new Date(); fatalDate.setDate(fatalDate.getDate() - 7);
        const fatalStart = new Date(fatalDate); fatalStart.setHours(0, 0, 0, 0);
        const fatalEnd = new Date(fatalDate); fatalEnd.setHours(23, 59, 59, 999);

        const activeLoans = await Transaction.find({ status: 'Issued' }).populate('student').populate('book');
        let sentCount = 0;

        for (const txn of activeLoans) {
            if (!txn.student || !txn.student.email) continue;
            const due = new Date(txn.dueDate);
            let subject = "";
            let type = "";

            // 1. Due Today
            if (due >= todayStart && due <= todayEnd) {
                subject = "URGENT: Book Due Today";
                type = "DUE_TODAY";
            }
            // 2. Reminder Notice
            else if (due >= reminderStart && due <= reminderEnd) {
                subject = "Reminder: Due in 3 Days";
                type = "REMINDER";
            }
            // 3. Final Warning
            else if (due >= fatalStart && due <= fatalEnd) {
                subject = "FINAL NOTICE: Severe Overdue";
                type = "FINAL_WARNING";
            }
            // 4. Standard Overdue (Every 3 days maybe? for now just catch the crossing)
            else if (due < todayStart && !type) {
                // Check if we want to span daily or just once. 
                // Simple logic: if strictly yesterday
                const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
                if (due.getDate() === yesterday.getDate()) {
                    subject = "Overdue Notice";
                    type = "OVERDUE";
                }
            }

            if (subject) {
                const html = `
                    <h3>Library Notification: ${type}</h3>
                    <p>Dear ${txn.student.name},</p>
                    <p>The book <strong>${txn.book.title}</strong> is ${type.replace('_', ' ')}.</p>
                    <p>Due Date: ${due.toLocaleDateString()}</p>
                    <p>Please take necessary action.</p>
                `;

                await sendEmail({
                    email: txn.student.email,
                    subject: subject,
                    html: html
                });

                // CC Admin
                // await sendEmail({ email: 'admin@university.com', ... }) 

                await logLibraryAction('OVERDUE', {
                    studentId: txn.student._id,
                    bookId: txn.book._id,
                    metadata: { type, info: `Sent ${type} to ${txn.student.email}` }
                });

                sentCount++;
            }
        }
        console.log(`Enterprise Scheduler: Sent ${sentCount} notices.`);
    } catch (err) {
        console.error("Scheduler Error:", err);
    }
};

module.exports = { initScheduler, checkOverdueBooks };
