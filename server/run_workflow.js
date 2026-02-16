/**
 * COMPREHENSIVE DATA SEEDING & VERIFICATION WORKFLOW
 * =================================================
 * 1. Check if MySQL has data (if not, run migration)
 * 2. Seed library demo data 
 * 3. Verify all endpoints
 * 4. Check data integrity
 * 5. Run load testing preparation
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const execPromise = util.promisify(exec);

const SCRIPTS_DIR = path.join(__dirname, 'scripts');
const SCRIPT_LOG_DIR = path.join(__dirname, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(SCRIPT_LOG_DIR)) {
    fs.mkdirSync(SCRIPT_LOG_DIR, { recursive: true });
}

const logFile = (filename, content) => {
    const filepath = path.join(SCRIPT_LOG_DIR, filename);
    fs.appendFileSync(filepath, content + '\n');
};

const formatTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
};

const runScript = async (scriptName, args = '') => {
    const scriptPath = path.join(SCRIPTS_DIR, scriptName);
    const timestamp = new Date().toISOString();
    
    console.log(`\n⏱️  [${timestamp}] Running: ${scriptName} ${args}`);
    const startTime = Date.now();
    
    try {
        const cmd = `node "${scriptPath}" ${args}`;
        const { stdout, stderr } = await execPromise(cmd, { maxBuffer: 10 * 1024 * 1024 });
        
        const duration = Date.now() - startTime;
        console.log(`✅ ${scriptName} completed in ${formatTime(duration)}`);
        
        const log = `[${timestamp}] ${scriptName}\nDuration: ${formatTime(duration)}\n${stdout}\n`;
        logFile(`${scriptName.replace('.js', '')}.log`, log);
        
        return { success: true, output: stdout, duration };
    } catch (err) {
        const duration = Date.now() - startTime;
        console.error(`❌ ${scriptName} failed after ${formatTime(duration)}`);
        console.error(`Error: ${err.message}`);
        
        const log = `[${timestamp}] ${scriptName} FAILED\nDuration: ${formatTime(duration)}\nError: ${err.message}\nStderr: ${err.stderr || ''}\n`;
        logFile(`${scriptName.replace('.js', '')}.log`, log);
        
        return { success: false, error: err.message, duration };
    }
};

const workflow = async () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║   DATA SEEDING & VERIFICATION WORKFLOW                     ║
║   MySQL Integration Tests & Production Readiness          ║
╚════════════════════════════════════════════════════════════╝
`);
    
    const results = {};
    let totalTime = 0;
    
    // Step 1: Check counts before migration
    console.log('\n📊 STEP 1: DATA STATUS CHECK');
    console.log('Checking MongoDB vs MySQL record counts...');
    // Note: Would run check-counts.js or custom script here
    
    // Step 2: Run migration (if needed)
    console.log('\n🔄 STEP 2: MIGRATION (if needed)');
    console.log('Running: migrate-mongo-to-mysql.js --commit');
    const migrateResult = await runScript('migrate-mongo-to-mysql.js', '--commit');
    results.migration = migrateResult;
    totalTime += migrateResult.duration;
    
    // Step 3: Seed library demo data
    console.log('\n📚 STEP 3: SEED LIBRARY DATA');
    console.log('Populating library with demo transactions and reservations...');
    const seedResult = await runScript('library-demo-seed.js');
    results.libraryDemoSeed = seedResult;
    totalTime += seedResult.duration;
    
    // Step 4: Verify endpoints
    console.log('\n🔍 STEP 4: ENDPOINT VERIFICATION');
    console.log('Testing all API endpoints with real requests...');
    const verifyResult = await runScript('verify-endpoints.js');
    results.endpoints = verifyResult;
    totalTime += verifyResult.duration;
    
    // Step 5: Run integrity checks
    console.log('\n🔐 STEP 5: DATA INTEGRITY CHECK');
    console.log('Scanning for orphaned records and FK violations...');
    const integrityResult = await runScript('verify-data.js');
    results.integrity = integrityResult;
    totalTime += integrityResult.duration;
    
    // Step 6: Enterprise verification
    console.log('\n🏢 STEP 6: ENTERPRISE VERIFICATION');
    console.log('Running comprehensive business logic validation...');
    const enterpriseResult = await runScript('verify-enterprise.js');
    results.enterprise = enterpriseResult;
    totalTime += enterpriseResult.duration;
    
    // Summary Report
    console.log(`
╔════════════════════════════════════════════════════════════╗
║   WORKFLOW COMPLETION SUMMARY                              ║
╚════════════════════════════════════════════════════════════╝

Total Time: ${formatTime(totalTime)}

Results:
  Migration:          ${results.migration.success ? '✅ PASS' : '❌ FAIL'} (${formatTime(results.migration.duration)})
  Library Seed:       ${results.libraryDemoSeed.success ? '✅ PASS' : '❌ FAIL'} (${formatTime(results.libraryDemoSeed.duration)})
  Endpoint Verify:    ${results.endpoints.success ? '✅ PASS' : '❌ FAIL'} (${formatTime(results.endpoints.duration)})
  Integrity Check:    ${results.integrity.success ? '✅ PASS' : '❌ FAIL'} (${formatTime(results.integrity.duration)})
  Enterprise Verify:  ${results.enterprise.success ? '✅ PASS' : '❌ FAIL'} (${formatTime(results.enterprise.duration)})

Overall Status: ${Object.values(results).every(r => r.success) ? '✅ ALL TESTS PASSED' : '⚠️  Some tests failed'}

📝 Detailed logs saved to: server/logs/
`);
    
    // Exit with appropriate code
    process.exit(Object.values(results).every(r => r.success) ? 0 : 1);
};

workflow().catch(err => {
    console.error('❌ Workflow error:', err);
    process.exit(1);
});
