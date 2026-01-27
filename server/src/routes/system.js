const express = require('express');
const router = express.Router();
const dbIntegrityService = require('../services/dbIntegrityService');
const { controlledReseed } = require('../scripts/controlledReseed');
const ensureLibraryRole = require('../middleware/rbac');

/**
 * LAYER 6: System Integrity API Endpoints
 * 
 * Provides administrative endpoints for database integrity management
 */

// Scan for orphan records
router.post('/integrity/scan', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const orphans = await dbIntegrityService.detectOrphans();

        const totalOrphans =
            orphans.bookReservations.length +
            orphans.borrowTransactions.length +
            orphans.transactions.length +
            orphans.auditLogs.length +
            orphans.fineLedgers.length;

        res.status(200).json({
            status: 'success',
            data: {
                totalOrphans,
                orphans,
                message: totalOrphans > 0
                    ? `Found ${totalOrphans} orphan records`
                    : 'No orphan records detected'
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});

// Repair database (cleanup orphans)
router.post('/integrity/repair', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const { dryRun = false } = req.body;

        const results = await dbIntegrityService.cleanupOrphans({ dryRun });

        const totalDeleted = Object.values(results.deleted).reduce((sum, count) => sum + count, 0);

        res.status(200).json({
            status: 'success',
            data: {
                dryRun,
                totalDeleted,
                deleted: results.deleted,
                errors: results.errors,
                message: dryRun
                    ? `Would delete ${totalDeleted} orphan records`
                    : `Deleted ${totalDeleted} orphan records`
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});

// Get database health report
router.get('/integrity/health', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const report = await dbIntegrityService.generateHealthReport();

        res.status(200).json({
            status: 'success',
            data: report
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});

// Validate database integrity
router.get('/integrity/validate', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const report = await dbIntegrityService.validateIntegrity();

        res.status(200).json({
            status: 'success',
            data: report
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});

// Controlled database reseed
router.post('/reseed', ensureLibraryRole(['ADMIN']), async (req, res) => {
    try {
        const { dryRun = false, clearAll = true } = req.body;

        const results = await controlledReseed({ dryRun, clearAll, verbose: true });

        res.status(200).json({
            status: 'success',
            data: results,
            message: dryRun
                ? 'Dry run completed - no changes made'
                : 'Database reseeded successfully'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message
        });
    }
});

module.exports = router;
