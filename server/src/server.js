require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

/**
 * MIGRATION MODE: Switch between MySQL (Sequelize) and MongoDB (Mongoose)
 * Set DB_ENGINE=mysql (default) or DB_ENGINE=mongodb in .env
 */
const DB_ENGINE = process.env.DB_ENGINE || 'mysql';

console.log(`
╔════════════════════════════════════════════════════╗
║  Database Engine: ${DB_ENGINE.toUpperCase().padEnd(36)} ║
╚════════════════════════════════════════════════════╝
`);

const initializeAndStart = async () => {
    try {
        if (DB_ENGINE === 'mysql') {
            // SEQUELIZE/MySQL mode
            console.log("🔄 Initializing Sequelize (MySQL)...");
            const { initializeDatabase } = require('./config/sequelize');
            const sequelize = await initializeDatabase();

            // Initialize repositories with Sequelize instance
            const { initializeRepositories } = require('./repositories');
            initializeRepositories(sequelize);

            // Initialize unified data access provider so controllers
            // using dataAccessProvider.get*Accessor() see initialized repos
            const { initializeDataAccess } = require('./utils/dataAccessProvider');
            initializeDataAccess(sequelize);

            console.log('✅ Sequelize initialized successfully');

            // LAYER 2: Database Health Check on Boot
            try {
                console.log('\n=== DATABASE HEALTH CHECK ===');
                const studentCount = await sequelize.models.Student.count();
                const bookCount = await sequelize.models.Book.count();
                const txnCount = await sequelize.models.BorrowTransaction.count();
                
                console.log(`Students:    ${studentCount}`);
                console.log(`Books:       ${bookCount}`);
                console.log(`Transactions: ${txnCount}`);
                
                if (studentCount === 0 || bookCount === 0) {
                    console.warn('⚠️  WARNING: Database appears to be empty. Run migration script:');
                    console.warn('   node server/scripts/migrate-mongo-to-mysql.js --commit');
                } else {
                    console.log('✅ Database health: READY');
                }
                console.log('==============================\n');
            } catch (err) {
                console.warn('⚠️  Health check warning:', err.message);
            }

            startServer();
        } else {
            // MONGOOSE/MongoDB mode (legacy)
            const mongoose = require('mongoose');
            mongoose.set('strictQuery', true);
            mongoose.set('strictPopulate', true);

            console.log("🔄 Connecting to MongoDB...");
            const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studentdb';

            await mongoose.connect(MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });

            console.log('✅ MongoDB connected successfully');

            try {
                const dbIntegrityService = require('./services/dbIntegrityService');
                const healthReport = await dbIntegrityService.generateHealthReport();

                console.log('\n=== DATABASE HEALTH REPORT ===');
                console.log(`Total Records: ${healthReport.summary.totalRecords}`);
                console.log(`Orphan Count: ${healthReport.summary.orphanCount}`);
                console.log(`Health Score: ${healthReport.summary.healthScore.toFixed(2)}%`);

                if (healthReport.summary.orphanCount > 0) {
                    console.warn(`⚠️  WARNING: ${healthReport.summary.orphanCount} orphan records detected`);
                } else {
                    console.log('✅ Database integrity: HEALTHY');
                }
                console.log('==============================\n');
            } catch (err) {
                console.warn('⚠️  Health check warning:', err.message);
            }

            startServer();
        }
    } catch (err) {
        console.error('❌ Database initialization failed:', err.message);
        console.error(err);
        process.exit(1);
    }
};

const startServer = () => {
    const server = app.listen(PORT, () => {
        console.log(`✅ Server running on port ${PORT}`);
        console.log(`📍 API available at: http://localhost:${PORT}/api/v1`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`\n❌ ERROR: Port ${PORT} is already in use!`);
            console.error(`\nTo fix this, stop the process using port ${PORT}:`);
            console.error(`  Windows: netstat -ano | findstr :${PORT}`);
            console.error(`  Then: taskkill /PID <PID> /F\n`);
            process.exit(1);
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
};

// Initialize database and start server
initializeAndStart();
