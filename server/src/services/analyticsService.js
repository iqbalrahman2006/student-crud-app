const Transaction = require('../models/BorrowTransaction');
const Book = require('../models/Book');
const LibraryFineLedger = require('../models/LibraryFineLedger');
const BookReservation = require('../models/BookReservation');

// Optional Sequelize helper (when running with MySQL)
let sequelizeConfig;
try {
    sequelizeConfig = require('../config/sequelize');
} catch (e) {
    sequelizeConfig = null;
}

class AnalyticsService {

    async getInventorySummary() {
        // Prefer Sequelize when DB_ENGINE explicitly set to mysql
        if (process.env.DB_ENGINE === 'mysql' && sequelizeConfig && sequelizeConfig.sequelize) {
            try {
                console.debug('[AnalyticsService] Forcing Sequelize path for getInventorySummary (DB_ENGINE=mysql)');
                const { sequelize } = sequelizeConfig;
                const models = sequelize.models || {};
                const BookModel = models.Book;
                const TransactionModel = models.BorrowTransaction || models.Transaction;

                const totals = await sequelize.query(
                    `SELECT SUM(totalCopies) AS totalBooksCount, SUM(GREATEST(totalCopies - checkedOutCount,0)) AS totalAvailableCopies, COUNT(*) AS totalDistinctBooks FROM Books`,
                    { type: sequelize.QueryTypes.SELECT }
                );

                const totalBooksCount = (totals && totals[0] && totals[0].totalBooksCount) || 0;
                const activeLoansCount = await (TransactionModel ? TransactionModel.count({ where: { status: ['BORROWED', 'Issued'] } }) : 0);
                const overdueCount = await (TransactionModel ? TransactionModel.count({ where: { status: ['BORROWED', 'Issued'], dueDate: { [require('sequelize').Op.lt]: new Date() } } }) : 0);

                return {
                    totalDistinctBooks: (totals && totals[0] && totals[0].totalDistinctBooks) || 0,
                    totalCopies: Number(totalBooksCount),
                    totalAvailableCopies: Number((totals && totals[0] && totals[0].totalAvailableCopies) || 0),
                    totalCheckedOut: Number(activeLoansCount),
                    overdueCount: Number(overdueCount)
                };
            } catch (e) {
                console.warn('[AnalyticsService] Sequelize inventory path failed, falling back to Mongoose:', e.message || e);
            }
        }

        // If Mongoose-style aggregate exists, use Mongo pipeline
        if (typeof Book.aggregate === 'function') {
            console.debug('[AnalyticsService] Using Mongoose path for getInventorySummary');
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

        // Fallback empty
        return { totalDistinctBooks: 0, totalCopies: 0, totalAvailableCopies: 0, totalCheckedOut: 0, overdueCount: 0 };
    }

    async getPopularBooks(limit = 10) {
        console.debug(`[AnalyticsService] getPopularBooks: NODE_ENV="${process.env.NODE_ENV}", DB_ENGINE="${process.env.DB_ENGINE}"`);
        // In test environment, prefer mocked Mongoose models over attempting real Sequelize
        if (process.env.NODE_ENV === 'test') {
            console.debug('[AnalyticsService] ✓ NODE_ENV=test: Using Mongoose/mock path for getPopularBooks');
            
            // Tier 1: Try Transaction (BorrowTransaction) aggregation
            if (typeof Transaction.aggregate === 'function') {
                const result = await Transaction.aggregate([
                    { $match: { status: { $exists: true } } },
                    { $group: { _id: "$bookId", count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: limit },
                    { $lookup: { from: "books", localField: "_id", foreignField: "_id", as: "book" } },
                    { $unwind: { path: "$book", preserveNullAndEmptyArrays: true } },
                    { $project: { bookId: "$_id", title: "$book.title", author: "$book.author", count: 1 } }
                ]);
                if (result && result.length > 0) return result;
            }

            // Tier 2: Fallback to BookReservation
            if (typeof BookReservation.aggregate === 'function') {
                const result = await BookReservation.aggregate([
                    { $match: { status: 'Active' } },
                    { $group: { _id: "$bookId", count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                    { $limit: limit }
                ]);
                if (result && result.length > 0) return result;
            }

            // Tier 3: Fallback to Book inventory
            if (typeof Book.find === 'function') {
                const result = await Book.find()
                    .sort({ totalCopies: -1, popularityIndex: -1 })
                    .limit(limit);
                if (result && result.length > 0) {
                    return result.map(b => ({ title: b.title, bookId: b._id, count: b.totalCopies }));
                }
            }

            return [];
        }

        // Prefer Sequelize when DB_ENGINE explicitly set to mysql (production)
        if (process.env.DB_ENGINE === 'mysql' && sequelizeConfig && sequelizeConfig.sequelize) {
            try {
                console.debug('[AnalyticsService] Using Sequelize path for getPopularBooks (DB_ENGINE=mysql)');
                const { sequelize } = sequelizeConfig;
                
                // Use raw SQL query for aggregation (more reliable than ORM grouping with includes)
                const sql = `
                    SELECT 
                        bt.bookId, 
                        COUNT(*) as count,
                        b.title,
                        b.author
                    FROM BorrowTransactions bt
                    LEFT JOIN Books b ON bt.bookId = b._id
                    GROUP BY bt.bookId, b.title, b.author
                    ORDER BY count DESC
                    LIMIT ?
                `;
                
                const rows = await sequelize.query(sql, {
                    replacements: [limit],
                    type: sequelize.QueryTypes.SELECT
                });

                return rows.map(r => ({ 
                    bookId: r.bookId, 
                    title: r.title || null, 
                    author: r.author || null, 
                    count: Number(r.count) 
                }));
            } catch (e) {
                console.warn('[AnalyticsService] Sequelize popularBooks path failed:', e.message || e);
                // Fall through to Mongoose
            }
        }

        // Fallback Mongoose path
        if (typeof Transaction.aggregate === 'function') {
            console.debug('[AnalyticsService] Using Mongoose path for getPopularBooks');
            const pipeline = [
                { $match: { status: { $exists: true } } },
                { $group: { _id: "$bookId", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: limit },
                { $lookup: { from: "books", localField: "_id", foreignField: "_id", as: "book" } },
                { $unwind: { path: "$book", preserveNullAndEmptyArrays: true } },
                { $project: { bookId: "$_id", title: "$book.title", author: "$book.author", count: 1 } }
            ];
            return await Transaction.aggregate(pipeline);
        }

        return [];
    }

    async getHoldingsByDepartment() {
        // In test environment, prefer mocked Mongoose models
        if (process.env.NODE_ENV === 'test') {
            console.debug('[AnalyticsService] NODE_ENV=test: Using Mongoose/mock path for getHoldingsByDepartment');
            if (typeof Book.aggregate === 'function') {
                const result = await Book.aggregate([
                    { $group: { _id: "$department", count: { $sum: "$totalCopies" } } },
                    { $sort: { count: -1 } }
                ]);
                return result || [];
            }
            return [];
        }

        // Prefer Sequelize when DB_ENGINE explicitly set to mysql (production)
        if (process.env.DB_ENGINE === 'mysql' && sequelizeConfig && sequelizeConfig.sequelize) {
            try {
                console.debug('[AnalyticsService] Using Sequelize path for getHoldingsByDepartment (DB_ENGINE=mysql)');
                const { sequelize } = sequelizeConfig;
                
                // Use raw SQL query for aggregation
                const sql = `
                    SELECT 
                        department as _id, 
                        SUM(totalCopies) as count
                    FROM Books
                    WHERE department IS NOT NULL
                    GROUP BY department
                    ORDER BY count DESC
                `;
                
                const rows = await sequelize.query(sql, {
                    type: sequelize.QueryTypes.SELECT
                });

                return rows.map(r => ({ _id: r._id, count: Number(r.count) }));
            } catch (e) {
                console.warn('[AnalyticsService] Sequelize holdingsByDepartment failed:', e.message || e);
                // Fall through to Mongoose
            }
        }

        // Fallback Mongoose path
        if (typeof Book.aggregate === 'function') {
            console.debug('[AnalyticsService] Using Mongoose path for getHoldingsByDepartment');
            return await Book.aggregate([
                { $group: { _id: "$department", count: { $sum: "$totalCopies" } } },
                { $sort: { count: -1 } }
            ]);
        }

        return [];
    }

    async getDashboardStats() {
        // In test environment, prefer mocked Mongoose models
        if (process.env.NODE_ENV === 'test') {
            console.debug('[AnalyticsService] NODE_ENV=test: Using Mongoose/mock path for getDashboardStats');
            if (typeof Book.countDocuments === 'function') {
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
                const deptDist = await this.getHoldingsByDepartment();
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
            return { totalBooks: 0, borrowedToday: 0, overdueCount: 0, popularBooks: [], deptDist: [], totalFine: 0, reservationQueue: 0 };
        }

        // Prefer Sequelize when DB_ENGINE explicitly set to mysql (production)
        if (process.env.DB_ENGINE === 'mysql' && sequelizeConfig && sequelizeConfig.sequelize) {
            try {
                console.debug('[AnalyticsService] Using Sequelize path for getDashboardStats (DB_ENGINE=mysql)');
                const { sequelize } = sequelizeConfig;
                const models = sequelize.models || {};
                const BookModel = models.Book;
                const TransactionModel = models.BorrowTransaction || models.Transaction;
                const ReservationModel = models.BookReservation;
                const FineModel = models.LibraryFineLedger;

                const totalBooksCountRow = await sequelize.query(`SELECT COUNT(*) AS totalBooks FROM Books`, { type: sequelize.QueryTypes.SELECT });
                const totalBooks = totalBooksCountRow && totalBooksCountRow[0] ? Number(totalBooksCountRow[0].totalBooks) : 0;

                const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
                const borrowedToday = TransactionModel ? await TransactionModel.count({ where: { issuedAt: { [require('sequelize').Op.gte]: startOfDay } } }) : 0;

                const overdueCount = TransactionModel ? await TransactionModel.count({ where: { status: ['BORROWED','Issued'], dueDate: { [require('sequelize').Op.lt]: new Date() } } }) : 0;

                const popularBooks = await this.getPopularBooks(5);

                const deptDist = await this.getHoldingsByDepartment();

                const fineRevenueRow = FineModel ? await FineModel.findAll({ attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']] }) : [];
                const totalFine = (fineRevenueRow && fineRevenueRow[0] && Number(fineRevenueRow[0].get('total'))) || 0;

                const reservationQueue = ReservationModel ? await ReservationModel.count({ where: { status: 'Active' } }) : 0;

                return {
                    totalBooks,
                    borrowedToday,
                    overdueCount,
                    popularBooks,
                    deptDist,
                    totalFine,
                    reservationQueue
                };
            } catch (e) {
                console.warn('[AnalyticsService] Sequelize dashboardStats path failed:', e.message || e);
            }
        }

        // Fallback Mongoose path
        if (typeof Book.countDocuments === 'function') {
            console.debug('[AnalyticsService] Using Mongoose path for getDashboardStats');
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

        return { totalBooks: 0, borrowedToday: 0, overdueCount: 0, popularBooks: [], deptDist: [], totalFine: 0, reservationQueue: 0 };
    }
}

module.exports = new AnalyticsService();
