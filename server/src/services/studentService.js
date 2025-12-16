const Student = require('../models/Student');

class StudentService {
    async getAll({ page = 1, limit = 200, sort = { createdAt: -1 }, filter = {} } = {}) {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build Match Stage (Filter)
        const matchStage = {};
        if (filter.search) {
            matchStage.$or = [
                { name: { $regex: filter.search, $options: 'i' } },
                { email: { $regex: filter.search, $options: 'i' } },
                { department: { $regex: filter.search, $options: 'i' } }
            ];
        }
        if (filter.status) matchStage.status = filter.status;
        if (filter.department) matchStage.department = filter.department;

        // Aggregation Pipeline
        const pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'borrowtransactions',
                    localField: '_id',
                    foreignField: 'studentId',
                    as: 'transactions'
                }
            },
            {
                $addFields: {
                    borrowedBooksCount: {
                        $size: {
                            $filter: {
                                input: '$transactions',
                                as: 'txn',
                                cond: { $eq: ['$$txn.status', 'BORROWED'] }
                            }
                        }
                    },
                    hasOverdue: {
                        $gt: [
                            {
                                $size: {
                                    $filter: {
                                        input: '$transactions',
                                        as: 'txn',
                                        cond: {
                                            $and: [
                                                { $eq: ['$$txn.status', 'BORROWED'] },
                                                { $lt: ['$$txn.dueDate', new Date()] }
                                            ]
                                        }
                                    }
                                }
                            },
                            0
                        ]
                    },
                    lastBorrowDate: { $max: '$transactions.issuedAt' }
                }
            },
            { $project: { transactions: 0 } }, // Optimization: Exclude heavy array
            { $sort: sort },
            { $skip: skip },
            { $limit: limitNum }
        ];

        const students = await Student.aggregate(pipeline);
        const total = await Student.countDocuments(matchStage);

        return {
            data: students,
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        };
    }

    async getById(id) {
        const student = await Student.findById(id);
        if (!student) throw new Error('Student not found');
        return student;
    }

    async create(data) {
        const student = await Student.create(data);
        return student;
    }

    async update(id, data) {
        const student = await Student.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (!student) throw new Error('Student not found');
        return student;
    }

    async delete(id) {
        const student = await Student.findByIdAndDelete(id);
        if (!student) throw new Error('Student not found');
        return true;
    }
}

module.exports = new StudentService();
