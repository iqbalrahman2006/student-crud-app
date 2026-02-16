/**
 * MIGRATION: BookReservationRepository (DAL for BookReservation model)
 * ========================================================
 * Manages book reservations and queue logic.
 * ========================================================
 */

const BaseRepository = require('./BaseRepository');
const { Op } = require('sequelize');

class BookReservationRepository extends BaseRepository {
    constructor(reservationModel, sequelize) {
        super(reservationModel, sequelize);
    }

    /**
     * Get active reservations for a book (ordered by queuePosition)
     */
    async getActiveReservationsForBook(bookId) {
        try {
            return await this.model.findAll({
                where: { book: bookId, status: 'Active' },
                order: [['queuePosition', 'ASC']],
                raw: true
            });
        } catch (err) {
            const error = new Error(`Database error in getActiveReservationsForBook: ${err.message}`);
            error.statusCode = 500;
            throw error;
        }
    }

    /**
     * Get active reservations for a student
     */
    async getActiveReservationsForStudent(studentId) {
        try {
            return await this.model.findAll({
                where: { student: studentId, status: 'Active' },
                order: [['queuePosition', 'ASC']],
                raw: true
            });
        } catch (err) {
            const error = new Error(`Database error in getActiveReservationsForStudent: ${err.message}`);
            error.statusCode = 500;
            throw error;
        }
    }

    /**
     * Create a reservation and assign queue position
     * (TRANSACTIONAL)
     */
    async createReservation(bookId, studentId, expiryDate) {
        const transaction = await this.sequelize.transaction();
        try {
            // Get max queue position for this book
            const maxPosition = await this.model.max('queuePosition', {
                where: { book: bookId, status: 'Active' },
                transaction
            });

            const queuePosition = (maxPosition || 0) + 1;

            const reservation = await this.model.create(
                {
                    _id: require('crypto').randomBytes(12).toString('hex'),
                    book: bookId,
                    student: studentId,
                    status: 'Active',
                    queuePosition,
                    expiryDate,
                    timestamp: new Date()
                },
                { transaction, validate: true }
            );

            await transaction.commit();
            return reservation.get({ plain: true });
        } catch (err) {
            await transaction.rollback();
            this._handleError(err);
        }
    }

    /**
     * Fulfill a reservation (TRANSACTIONAL)
     * Marks as Fulfilled and updates queuePositions of remaining reservations
     */
    async fulfillReservation(reservationId) {
        const transaction = await this.sequelize.transaction();
        try {
            const reservation = await this.model.findByPk(reservationId, { transaction });
            if (!reservation) {
                await transaction.rollback();
                const error = new Error('Reservation not found');
                error.statusCode = 404;
                throw error;
            }

            reservation.status = 'Fulfilled';
            reservation.fulfilledAt = new Date();
            await reservation.save({ transaction });

            // Decrement queue positions for remaining Active reservations
            const remaining = await this.model.findAll({
                where: {
                    book: reservation.book,
                    status: 'Active',
                    queuePosition: { [Op.gt]: reservation.queuePosition }
                },
                transaction
            });

            for (const other of remaining) {
                other.queuePosition -= 1;
                await other.save({ transaction });
            }

            await transaction.commit();
            return reservation.get({ plain: true });
        } catch (err) {
            await transaction.rollback();
            this._handleError(err);
        }
    }
}

module.exports = BookReservationRepository;
