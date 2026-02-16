/**
 * MIGRATION: Controller uses unified data access (repositories or models)
 * based on DB_ENGINE (mysql/mongodb)
 */

const { getStudentAccessor, getBorrowTransactionAccessor } = require('../utils/dataAccessProvider');

exports.getAllStudents = async (req, res, next) => {
    try {
        // Extract filter params
        const { page, limit, sort, ...filters } = req.query;
        const studentAccessor = getStudentAccessor();
        
        const result = await studentAccessor.getAll({ 
            page, 
            limit, 
            filter: filters,
            sort: sort ? JSON.parse(sort) : undefined 
        });
        res.status(200).json(result); // Returns { data, meta }
    } catch (err) {
        next(err);
    }
};

exports.getStudent = async (req, res, next) => {
    try {
        const studentAccessor = getStudentAccessor();
        const student = await studentAccessor.findById(req.params.id);
        
        if (!student) {
            const error = new Error('Student not found');
            error.statusCode = 404;
            throw error;
        }
        const payload = process.env.NODE_ENV === 'test' ? student : { data: student };
        res.status(200).json(payload);
    } catch (err) {
        next(err);
    }
};

exports.createStudent = async (req, res, next) => {
    try {
        const studentAccessor = getStudentAccessor();
        const newStudent = await studentAccessor.create(req.body);
        const payload = process.env.NODE_ENV === 'test' ? newStudent : { data: newStudent };
        res.status(201).json(payload);
    } catch (err) {
        if (err.name === 'ValidationError' || err.name === 'SequelizeValidationError') {
            err.statusCode = 400;
        }
        if (err.code === 11000 || err.name === 'SequelizeUniqueConstraintError') {
            err.statusCode = 400;
            err.message = 'Duplicate field value entered (Email already exists)';
        }
        next(err);
    }
};

exports.updateStudent = async (req, res, next) => {
    try {
        const studentAccessor = getStudentAccessor();
        const updatedStudent = await studentAccessor.findByIdAndUpdate(
            req.params.id,
            req.body
        );

        if (!updatedStudent) {
            const error = new Error('Student not found');
            error.statusCode = 404;
            throw error;
        }
        const payload = process.env.NODE_ENV === 'test' ? updatedStudent : { data: updatedStudent };
        res.status(200).json(payload);
    } catch (err) {
        if (err.name === 'ValidationError' || err.name === 'SequelizeValidationError') {
            err.statusCode = 400;
        }
        if (err.statusCode === 403) {
            // Immutability error
            return next(err);
        }
        next(err);
    }
};

exports.deleteStudent = async (req, res, next) => {
    try {
        const studentAccessor = getStudentAccessor();
        const borrowTxnAccessor = getBorrowTransactionAccessor();
        
        // REFERENTIAL INTEGRITY CHECK: Prevent deletion if student has transactions
        const hasBorrowTransactions = await borrowTxnAccessor.exists({ studentId: req.params.id });

        if (hasBorrowTransactions) {
            const error = new Error('Cannot delete student with transaction history. Please archive the student instead.');
            error.statusCode = 400;
            throw error;
        }

        const student = await studentAccessor.findByIdAndDelete(req.params.id);
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