const BorrowTransaction = require('../models/BorrowTransaction');
const sendEmail = require('./mailer');
const logLibraryAction = require('./libraryLogger');
const cron = require('node-cron');

const initScheduler = () => {
    console.log("⏰ Enterprise Library Scheduler Initialized");

    // Run every day at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
        console.log("Running Enterprise Overdue Engine...");
        await checkOverdueBooks();
    });
};

// ... Email Helper ...
const sendEmailWithRetry = async (email, subject, html, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            await sendEmail({ email, subject, html });
            return true;
        } catch (err) {
            console.warn(`[Email Fail] Attempt ${i + 1}/${retries} to ${email}: ${err.message}`);
            if (i === retries - 1) throw err;
            await new Promise(res => setTimeout(res, 1000 * (i + 1)));
        }
    }
};

const checkOverdueBooks = async () => {
    try {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

        // Reminder 1: 7 Days Before
        const reminder7Date = new Date(); reminder7Date.setDate(reminder7Date.getDate() + 7);
        const r7Start = new Date(reminder7Date); r7Start.setHours(0, 0, 0, 0);
        const r7End = new Date(reminder7Date); r7End.setHours(23, 59, 59, 999);

        // Reminder 2: 2 Days Before
        const reminder2Date = new Date(); reminder2Date.setDate(reminder2Date.getDate() + 2);
        const r2Start = new Date(reminder2Date); r2Start.setHours(0, 0, 0, 0);
        const r2End = new Date(reminder2Date); r2End.setHours(23, 59, 59, 999);

        const activeLoans = await BorrowTransaction.find({ status: 'BORROWED' }).populate('studentId').populate('bookId');
        let sentCount = 0;
        let failCount = 0;

        for (const txn of activeLoans) {
            if (!txn.studentId || !txn.studentId.email) continue;
            const due = new Date(txn.dueDate);
            let subject = "";
            let type = "";

            // 1. Due Today
            if (due >= todayStart && due <= todayEnd) {
                subject = "URGENT: Book Due Today";
                type = "DUE_TODAY";
            }
            // 2. Reminder 7 Days
            else if (due >= r7Start && due <= r7End) {
                subject = "Reminder: Book Due in 7 Days";
                type = "REMINDER_7_DAYS";
            }
            // 3. Reminder 2 Days
            else if (due >= r2Start && due <= r2End) {
                subject = "Reminder: Book Due in 2 Days";
                type = "REMINDER_2_DAYS";
            }
            // 4. Overdue (Past Due)
            else if (due < todayStart) {
                // Throttle? For now just notify every run if over due? 
                // Prompt implies: "and overdue". Let's throttle to "Just turned overdue" (yesterday) OR "7 days overdue".
                // Simple logic: If due < today, it's overdue.
                // To avoid spam, let's stick to "Just Overdue (1 day)" and "Severe (7 days)".

                // 1 Day Overdue
                const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
                // 7 Days Overdue
                const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);

                if (due.toDateString() === yesterday.toDateString()) {
                    subject = "Overdue Notice";
                    type = "OVERDUE_1_DAY";
                } else if (due.toDateString() === weekAgo.toDateString()) {
                    subject = "FINAL NOTICE: Book is 1 Week Overdue";
                    type = "OVERDUE_7_DAYS";
                }
            }

            if (subject) {
                const html = `
                    <h3>Library Notification: ${type}</h3>
                    <p>Dear ${txn.studentId.name},</p>
                    <p>The book <strong>${txn.bookId.title}</strong> is ${type.replace('_', ' ')}.</p>
                    <p>Due Date: ${due.toLocaleDateString()}</p>
                    <p>Please take necessary action.</p>
                `;

                try {
                    await sendEmailWithRetry(txn.studentId.email, subject, html);

                    await logLibraryAction('OVERDUE', {
                        studentId: txn.studentId._id,
                        bookId: txn.bookId._id,
                        metadata: { type, info: `Sent ${type} to ${txn.studentId.email} (Success)` }
                    });
                    sentCount++;
                } catch (emailErr) {
                    failCount++;
                    console.error(`Failed to send email to ${txn.studentId.email}:`, emailErr.message);

                    // Log the failure to Audit Logs too!
                    await logLibraryAction('OVERDUE', {
                        studentId: txn.studentId._id,
                        bookId: txn.bookId._id,
                        metadata: { type, status: 'FAILED', error: emailErr.message }
                    });
                }
            }
        }
        console.log(`Enterprise Scheduler: Processed notifications. Sent: ${sentCount}, Failed: ${failCount}`);
    } catch (err) {
        console.error("Scheduler Error:", err);
    }
};

module.exports = { initScheduler, checkOverdueBooks };
