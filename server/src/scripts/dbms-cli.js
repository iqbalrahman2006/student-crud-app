#!/usr/bin/env node

/**
 * DBMS Hardening Master CLI
 * 
 * Usage:
 *   node dbms-cli.js detect-orphans
 *   node dbms-cli.js cleanup-dry-run
 *   node dbms-cli.js cleanup-live
 *   node dbms-cli.js reseed-dry-run
 *   node dbms-cli.js reseed-live
 *   node dbms-cli.js validate-integrity
 *   node dbms-cli.js audit-consistency
 *   node dbms-cli.js health-report
 *   node dbms-cli.js full-check
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import tools
const { detectAllOrphans } = require('./detectOrphans');
const { cleanupDryRun, cleanupLive } = require('./cleanupOrphans');
const { controlledReseed } = require('./controlledReseed');
const { validateIntegrity, auditConsistency, generateHealthReport } = require('./dbmsValidation');

// MongoDB connection
async function connectDB() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studentdb';
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');
        return true;
    } catch (err) {
        console.error('❌ Failed to connect to MongoDB:', err.message);
        return false;
    }
}

async function disconnectDB() {
    try {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (err) {
        console.error('❌ Failed to disconnect:', err.message);
    }
}

async function runCommand(command) {
    const connected = await connectDB();
    if (!connected) process.exit(1);

    try {
        switch (command) {
            case 'detect-orphans':
                console.log('\n🔍 Running Orphan Detection...\n');
                await detectAllOrphans();
                break;

            case 'cleanup-dry-run':
                console.log('\n🧹 Running Cleanup (DRY RUN - No deletions)...\n');
                await cleanupDryRun();
                break;

            case 'cleanup-live':
                console.log('\n🚨 Running Cleanup (LIVE MODE - Will delete)...\n');
                const readline = require('readline');
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                rl.question('⚠️  This will DELETE orphan records. Type "YES" to confirm: ', async (answer) => {
                    rl.close();
                    if (answer === 'YES') {
                        await cleanupLive();
                    } else {
                        console.log('❌ Cleanup cancelled');
                    }
                    await disconnectDB();
                });
                return;

            case 'reseed-dry-run':
                console.log('\n🌱 Running Reseed (DRY RUN - No changes)...\n');
                await controlledReseed({ dryRun: true });
                break;

            case 'reseed-live':
                console.log('\n🌱 Running Reseed (LIVE MODE - Will create data)...\n');
                const readline2 = require('readline');
                const rl2 = readline2.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                rl2.question('⚠️  This will CLEAR and RESEED the database. Type "YES" to confirm: ', async (answer) => {
                    rl2.close();
                    if (answer === 'YES') {
                        await controlledReseed({ dryRun: false, clearAll: true });
                    } else {
                        console.log('❌ Reseed cancelled');
                    }
                    await disconnectDB();
                });
                return;

            case 'validate-integrity':
                console.log('\n✔️  Running Integrity Validation...\n');
                await validateIntegrity();
                break;

            case 'audit-consistency':
                console.log('\n✔️  Running Consistency Audit...\n');
                await auditConsistency();
                break;

            case 'health-report':
                console.log('\n📊 Generating Health Report...\n');
                await generateHealthReport();
                break;

            case 'full-check':
                console.log('\n🔍 Running Full Database Check...\n');
                await generateHealthReport();
                console.log('\n🔍 Detecting Orphans...\n');
                await detectAllOrphans();
                break;

            case 'help':
            default:
                console.log(`
DBMS Hardening Master CLI
=========================

Commands:
  detect-orphans       - Detect orphan records
  cleanup-dry-run      - Preview cleanup without deletions
  cleanup-live         - LIVE: Delete orphan records
  reseed-dry-run       - Preview reseed without changes
  reseed-live          - LIVE: Clear and reseed database
  validate-integrity   - Validate referential integrity
  audit-consistency    - Audit data consistency
  health-report        - Generate comprehensive health report
  full-check           - Run full database check

Examples:
  node dbms-cli.js detect-orphans
  node dbms-cli.js cleanup-dry-run
  node dbms-cli.js health-report
                `);
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    } finally {
        await disconnectDB();
    }
}

// Get command from arguments
const command = process.argv[2] || 'help';
runCommand(command);
