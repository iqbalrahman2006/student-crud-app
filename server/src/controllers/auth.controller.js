const Student = require('../models/Student');

const ADMIN_EMAIL = 'iqbal@gmail.com';
const ADMIN_PASS = 'Qwerty123!';

/**
 * @desc    Standalone Login Endpoint
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // 2. Admin Check
        if (email === ADMIN_EMAIL) {
            if (password === ADMIN_PASS) {
                return res.status(200).json({
                    success: true,
                    user: {
                        name: 'Admin User',
                        email: ADMIN_EMAIL,
                        role: 'admin'
                    }
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
        }

        // 3. Student Check
        const student = await Student.findOne({ email });

        if (!student) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Password Logic: <FirstName>123!
        // We assume name is "First Last" or just "First"
        const firstName = student.name.split(' ')[0];
        const expectedPass = `${firstName}123!`;

        if (password !== expectedPass) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Success - Student
        return res.status(200).json({
            success: true,
            user: {
                _id: student._id,
                name: student.name,
                email: student.email,
                role: 'student',
                status: student.status
            }
        });

    } catch (err) {
        console.error('Auth Error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};
