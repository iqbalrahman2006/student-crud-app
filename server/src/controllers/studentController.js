const Student = require('../models/Student');

exports.getAllStudents = async (req, res, next) => {
    try {
        const students = await Student.find().sort({ createdAt: -1 });
        res.status(200).json(students);
    } catch (err) {
        next(err);
    }
};

exports.getStudent = async (req, res, next) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            const error = new Error('Student not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json(student);
    } catch (err) {
        next(err);
    }
};

exports.createStudent = async (req, res, next) => {
    try {
        const newStudent = await Student.create(req.body);
        res.status(201).json(newStudent);
    } catch (err) {
        if (err.name === 'ValidationError') {
            err.statusCode = 400;
        }
        if (err.code === 11000) {
            err.statusCode = 400;
            err.message = 'Duplicate field value entered (Email already exists)';
        }
        next(err);
    }
};

exports.updateStudent = async (req, res, next) => {
    try {
        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedStudent) {
            const error = new Error('Student not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json(updatedStudent);
    } catch (err) {
        if (err.name === 'ValidationError') err.statusCode = 400;
        next(err);
    }
};

exports.deleteStudent = async (req, res, next) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) {
            const error = new Error('Student not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({ message: 'Student deleted successfully' });
    } catch (err) {
        next(err);
    }
};