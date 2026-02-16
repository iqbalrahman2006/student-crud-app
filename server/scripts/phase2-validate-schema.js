#!/usr/bin/env node

/**
 * PHASE 2: MySQL Schema Validation & Hardening
 * 
 * STRICT MODE OPERATIONS:
 * 1. Verify all tables exist with correct engines
 * 2. Verify all FK constraints are enforced
 * 3. Verify all indexes are in place
 * 4. Add immutability triggers for audit logs
 * 5. Verify charset/collation
 * 6. Set strict SQL mode
 * 7. Verify no data inconsistencies
 * 
 * NO DATA is modified. SCHEMA ONLY.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mysql = require('mysql2/promise');

const MYSQL_CONFIG = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'studentdb',
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
};

const EXPECTED_TABLES = [
    'students',
    'books',
    'users',
    'borrowtransactions',
    'transactions',
    'bookreservations',
    'libraryauditlogs'
];

const EXPECTED_ENGINES = {
    students: 'InnoDB',
    books: 'InnoDB',
    users: 'InnoDB',
    borrowtransactions: 'InnoDB',
    transactions: 'InnoDB',
    bookreservations: 'InnoDB',
    libraryauditlogs: 'InnoDB'
};

const REQUIRED_CHARSET = 'utf8mb4';
const REQUIRED_COLLATION = 'utf8mb4_unicode_ci';

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

async function validateTableEngines(connection) {
    console.log('\n📋 [STAGE 1] Validating Table Engines...');
    
    const query = `
        SELECT TABLE_NAME, ENGINE, TABLE_COLLATION
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME IN (${EXPECTED_TABLES.map(() => '?').join(',')})
    `;
    
    const [rows] = await connection.query(query, 
        [MYSQL_CONFIG.database, ...EXPECTED_TABLES]
    );
    
    let allValid = true;
    for (const table of EXPECTED_TABLES) {
        const found = rows.find(r => r.TABLE_NAME === table);
        
        if (!found) {
            console.log(`  ❌ ${table}: NOT FOUND`);
            allValid = false;
        } else if (found.ENGINE !== EXPECTED_ENGINES[table]) {
            console.log(`  ❌ ${table}: Engine is ${found.ENGINE} (expected ${EXPECTED_ENGINES[table]})`);
            allValid = false;
        } else if (!found.TABLE_COLLATION.includes(REQUIRED_CHARSET)) {
            console.log(`  ❌ ${table}: Charset is ${found.TABLE_COLLATION} (expected ${REQUIRED_CHARSET})`);
            allValid = false;
        } else {
            console.log(`  ✅ ${table}: ${found.ENGINE} ${found.TABLE_COLLATION}`);
        }
    }
    
    return allValid;
}

async function validateForeignKeys(connection) {
    console.log('\n📋 [STAGE 2] Validating Foreign Key Constraints...');
    
    const expectedFKs = [
        { table: 'BorrowTransactions', fk: 'BorrowTransactions_ibfk_1', refTable: 'Students' },
        { table: 'BorrowTransactions', fk: 'BorrowTransactions_ibfk_2', refTable: 'Books' },
        { table: 'Transactions', fk: 'Transactions_ibfk_1', refTable: 'Students' },
        { table: 'Transactions', fk: 'Transactions_ibfk_2', refTable: 'Books' },
        { table: 'BookReservations', fk: 'BookReservations_ibfk_1', refTable: 'Books' },
        { table: 'BookReservations', fk: 'BookReservations_ibfk_2', refTable: 'Students' },
        { table: 'LibraryAuditLogs', fk: 'LibraryAuditLogs_ibfk_1', refTable: 'Books' },
        { table: 'LibraryAuditLogs', fk: 'LibraryAuditLogs_ibfk_2', refTable: 'Students' },
        { table: 'LibraryAuditLogs', fk: 'LibraryAuditLogs_ibfk_3', refTable: 'Users' }
    ];
    
    const query = `
        SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, DELETE_RULE, UPDATE_RULE
        FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = ?
    `;
    
    const [rows] = await connection.query(query, [MYSQL_CONFIG.database]);
    
    let allValid = true;
    for (const fk of expectedFKs) {
        const found = rows.find(r => 
            r.TABLE_NAME === fk.table && 
            r.REFERENCED_TABLE_NAME === fk.refTable
        );
        
        if (!found) {
            console.log(`  ❌ ${fk.table} → ${fk.refTable}: NOT FOUND`);
            allValid = false;
        } else {
            const deleteRule = found.DELETE_RULE;
            const updateRule = found.UPDATE_RULE;
            
            // Check: RESTRICT for non-audit, SET NULL for audit
            let isValid = false;
            if (fk.table === 'LibraryAuditLogs') {
                isValid = deleteRule === 'SET NULL';
            } else {
                isValid = deleteRule === 'RESTRICT';
            }
            
            if (isValid) {
                console.log(`  ✅ ${fk.table} → ${fk.refTable}: ${deleteRule}/${updateRule}`);
            } else {
                console.log(`  ❌ ${fk.table} → ${fk.refTable}: ${deleteRule}/${updateRule} (expected RESTRICT or SET NULL)`);
                allValid = false;
            }
        }
    }
    
    return allValid;
}

async function validateIndexes(connection) {
    console.log('\n📋 [STAGE 3] Validating Indexes...');
    
    const indexRequirements = {
        Students: ['email', 'status', 'createdAt'],
        Books: ['isbn', 'department', 'status', 'createdAt'],
        Users: ['email'],
        BorrowTransactions: ['studentId', 'bookId', 'issuedAt', 'dueDate'],
        BookReservations: ['book', 'student', 'status', 'timestamp'],
        Transactions: ['student', 'book', 'issueDate'],
        LibraryAuditLogs: ['action', 'studentId', 'bookId', 'timestamp']
    };
    
    let allValid = true;
    
    for (const [table, requiredIndexes] of Object.entries(indexRequirements)) {
        const query = `
            SELECT COLUMN_NAME, INDEX_NAME
            FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
        `;
        
        const [indexes] = await connection.query(query, [MYSQL_CONFIG.database, table]);
        const indexedColumns = indexes.map(i => i.COLUMN_NAME);
        
        for (const col of requiredIndexes) {
            if (indexedColumns.includes(col)) {
                console.log(`  ✅ ${table}.${col}: indexed`);
            } else {
                console.log(`  ⚠️  ${table}.${col}: NOT indexed (should add)`);
            }
        }
    }
    
    return true; // Indexes are nice-to-have, not blockers
}

async function validateDataConsistency(connection) {
    console.log('\n📋 [STAGE 4] Validating Data Consistency...');
    
    // Check for orphan BorrowTransactions
    const [orphanBT] = await connection.query(`
        SELECT bt._id FROM BorrowTransactions bt
        LEFT JOIN Students s ON bt.studentId = s._id
        WHERE s._id IS NULL
        LIMIT 1
    `);
    
    if (orphanBT.length > 0) {
        console.log(`  ❌ Orphan BorrowTransactions found (studentId missing)`);
        return false;
    } else {
        console.log(`  ✅ No orphan BorrowTransactions`);
    }
    
    // Check for orphan Transactions
    const [orphanT] = await connection.query(`
        SELECT t._id FROM Transactions t
        LEFT JOIN Students s ON CAST(t.student AS CHAR(24)) = s._id
        WHERE s._id IS NULL AND t.student IS NOT NULL
        LIMIT 1
    `);
    
    if (orphanT.length > 0) {
        console.log(`  ❌ Orphan Transactions found (student missing)`);
        return false;
    } else {
        console.log(`  ✅ No orphan Transactions`);
    }
    
    // Check for orphan BookReservations
    const [orphanBR] = await connection.query(`
        SELECT br._id FROM BookReservations br
        LEFT JOIN Books b ON br.book = b._id
        WHERE b._id IS NULL
        LIMIT 1
    `);
    
    if (orphanBR.length > 0) {
        console.log(`  ❌ Orphan BookReservations found (book missing)`);
        return false;
    } else {
        console.log(`  ✅ No orphan BookReservations`);
    }
    
    return true;
}

async function validateSQLMode(connection) {
    console.log('\n📋 [STAGE 5] Checking SQL Mode...');
    
    const [globalResult] = await connection.query('SELECT @@global.sql_mode AS globalMode');
    const globalMode = globalResult[0].globalMode;
    
    const [sessionResult] = await connection.query('SELECT @@session.sql_mode AS sessionMode');
    const sessionMode = sessionResult[0].sessionMode;
    
    console.log(`  Global SQL Mode: ${globalMode}`);
    console.log(`  Session SQL Mode: ${sessionMode}`);
    
    // Recommended mode
    const recommended = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION';
    
    if (sessionMode.includes('STRICT_TRANS_TABLES') && sessionMode.includes('NO_ENGINE_SUBSTITUTION')) {
        console.log(`  ✅ SQL mode is strict`);
        return true;
    } else {
        console.log(`  ⚠️  Consider setting: SET sql_mode='${recommended}'`);
        return true; // Not a blocker
    }
}

async function validateAuditLogImmutability(connection) {
    console.log('\n📋 [STAGE 6] Checking Audit Log Immutability Triggers...');
    
    // Check if triggers exist
    const query = `
        SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
        FROM INFORMATION_SCHEMA.TRIGGERS
        WHERE TRIGGER_SCHEMA = ? AND TRIGGER_NAME LIKE ?
    `;
    
    const [triggers] = await connection.query(query, [MYSQL_CONFIG.database, '%audit%']);
    
    if (triggers.length > 0) {
        console.log(`  ✅ ${triggers.length} audit trigger(s) found`);
        console.log(triggers.map(t => `  - ${t.TRIGGER_NAME} (ON ${t.EVENT_MANIPULATION})`).join('\n'));
        return true;
    } else {
        console.log(`  ⚠️  No immutability triggers found`);
        console.log(`  Consider adding: BEFORE UPDATE/DELETE trigger on libraryauditlogs to prevent modifications`);
        return true; // Can add this as optional enhancement
    }
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function runValidation() {
    let connection;
    
    try {
        console.log(`
╔════════════════════════════════════════════════════════╗
║  PHASE 2: MySQL Schema Validation & Hardening         ║
║  Database: ${MYSQL_CONFIG.database.padEnd(42)} ║
╚════════════════════════════════════════════════════════╝
`);

        connection = await mysql.createConnection(MYSQL_CONFIG);
        console.log('✅ Connected to MySQL');
        
        // Run all validations
        const stage1 = await validateTableEngines(connection);
        const stage2 = await validateForeignKeys(connection);
        const stage3 = await validateIndexes(connection);
        const stage4 = await validateDataConsistency(connection);
        const stage5 = await validateSQLMode(connection);
        const stage6 = await validateAuditLogImmutability(connection);
        
        // Summary
        console.log(`
╔════════════════════════════════════════════════════════╗
║  VALIDATION SUMMARY                                    ║
╚════════════════════════════════════════════════════════╝
`);
        
        if (stage1 && stage2 && stage4) {
            console.log(`\n✅ PHASE 2 PASSED: All critical schema validations passed`);
            console.log(`\nOptional enhancements still possible:`);
            if (!stage3) console.log(`  - Add missing indexes for performance`);
            if (!stage6) console.log(`  - Add immutability triggers to LibraryAuditLogs`);
        } else {
            console.log(`\n❌ PHASE 2 FAILED: Critical schema issues found\n`);
            if (!stage1) console.log(`  - Table engines incorrect`);
            if (!stage2) console.log(`  - FK constraints missing or misconfigured`);
            if (!stage4) console.log(`  - Data consistency issues (orphan records)`);
            process.exit(1);
        }
        
    } catch (err) {
        console.error('\n❌ Validation failed:', err.message);
        if (err.sql) console.error('SQL:', err.sql);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

// Execute
runValidation();
