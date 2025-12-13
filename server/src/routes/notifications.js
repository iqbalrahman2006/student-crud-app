const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const sendEmail = require('../utils/mailer');
const ensureLibraryRole = require('../middleware/rbac');

// Blast Email to All Active Students
router.post('/blast', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const { subject, message } = req.body;

        // Find all active students with emails
        const students = await Student.find({ status: 'Active', email: { $exists: true, $ne: '' } });

        let sentCount = 0;
        let failCount = 0;

        // In a real app, this should be a queue (BullMQ/RabbitMQ)
        // For this demo, we'll loop (ok for < 100 students)
        const emailPromises = students.map(async (student) => {
            try {
                await sendEmail({
                    email: student.email,
                    subject: subject || "Important Announcement from University",
                    message: message || "Dear Student, please check your dashboard for new updates.",
                    html: `<p>Dear ${student.name},</p><p>${message || "Please check your dashboard for new updates."}</p><p>Regards,<br>University Admin</p>`
                });
                sentCount++;
            } catch (err) {
                console.error(`Failed to email ${student.email}`, err);
                failCount++;
            }
        });

        await Promise.all(emailPromises);

        res.status(200).json({
            status: 'success',
            data: {
                total: students.length,
                sent: sentCount,
                failed: failCount
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
