const Student = require('../models/Student');

class StudentService {
    async getAll({ page = 1, limit = 50, sort = { createdAt: -1 }, filter = {} } = {}) {
        const skip = (page - 1) * limit;

        // Build Mongoose Filter
        const query = {};
        if (filter.search) {
            query.$or = [
                { name: { $regex: filter.search, $options: 'i' } },
                { email: { $regex: filter.search, $options: 'i' } },
                { department: { $regex: filter.search, $options: 'i' } }
            ];
        }
        if (filter.status) query.status = filter.status;
        if (filter.department) query.department = filter.department;

        const students = await Student.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const total = await Student.countDocuments(query);

        return {
            data: students,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
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
