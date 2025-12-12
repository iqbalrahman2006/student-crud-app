const Transaction = require('../models/BorrowTransaction');
const Book = require('../models/Book');
const LibraryFineLedger = require('../models/LibraryFineLedger');
const BookReservation = require('../models/BookReservation');

class AnalyticsService {

    async getInventorySummary() {
        // Aggregation to get book copies stats
        const bookStats = await Book.aggregate([
            {
                $group: {
                    _id: null,
                    totalBooksCount: { $sum: "$totalCopies" },
                    totalAvailableCopies: { $sum: { $subtract: ["$totalCopies", "$checkedOutCount"] } },
                    totalDistinctBooks: { $sum: 1 }
                }
            }
        ]);

        const activeLoansCount = await Transaction.countDocuments({ status: { $in: ['BORROWED', 'Issued'] } });

        const overdueCount = await Transaction.countDocuments({
            status: { $in: ['BORROWED', 'Issued'] },
            dueDate: { $lt: new Date() }
        });

        const stats = bookStats[0] || { totalBooksCount: 0, totalAvailableCopies: 0, totalDistinctBooks: 0 };

        return {
            totalDistinctBooks: stats.totalDistinctBooks,
            totalCopies: stats.totalBooksCount,
            totalAvailableCopies: stats.totalBooksCount - activeLoansCount,
            totalCheckedOut: activeLoansCount,
            overdueCount: overdueCount
        };
    }

    async getPopularBooks(limit = 10) {
        const pipeline = [
            { $match: { status: { $exists: true } } }, // Any transaction? or just Borrow? Prompt says "action: BORROW" but we don't store action in Transaction, we assume existence is borrow.
            { $group: { _id: "$bookId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
            { $lookup: { from: "books", localField: "_id", foreignField: "_id", as: "book" } },
            { $unwind: { path: "$book", preserveNullAndEmptyArrays: true } },
            { $project: { bookId: "$_id", title: "$book.title", author: "$book.author", count: 1 } }
        ];
        return await Transaction.aggregate(pipeline);
    }

    async getHoldingsByDepartment() {
        return await Book.aggregate([
            { $group: { _id: "$department", count: { $sum: "$totalCopies" } } },
            { $sort: { count: -1 } }
        ]);
    }

    async getDashboardStats() {
        const totalBooks = await Book.countDocuments();
        const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

        const borrowedToday = await Transaction.countDocuments({
            issuedAt: { $gte: startOfDay }
        });

        const overdueCount = await Transaction.countDocuments({
            status: { $in: ['BORROWED', 'Issued'] },
            dueDate: { $lt: new Date() }
        });

        const popularBooks = await this.getPopularBooks(5);
        const deptDist = await Book.aggregate([
            { $group: { _id: "$department", count: { $sum: 1 } } }
        ]);
        const fineRevenue = await LibraryFineLedger.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]);
        const totalFine = fineRevenue.length > 0 ? fineRevenue[0].total : 0;
        const reservationQueue = await BookReservation.countDocuments({ status: 'Active' });

        return {
            totalBooks,
            borrowedToday,
            overdueCount,
            popularBooks,
            deptDist,
            totalFine,
            reservationQueue
        };
    }
}

module.exports = new AnalyticsService();
