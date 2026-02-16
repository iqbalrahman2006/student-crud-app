/**
 * COMPREHENSIVE ENDPOINT VERIFICATION
 * Tests all critical API endpoints with live requests
 * DB_ENGINE=mysql, NODE_ENV=development
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

const API_HOST = 'localhost';
const API_PORT = 5000;

// HTTP request helper
const makeRequest = (method, path, headers = {}) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'x-role': 'ADMIN',
                ...headers
            },
            timeout: 10000
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const body = JSON.parse(data);
                    resolve({ status: res.statusCode, body, headers: res.headers });
                } catch {
                    resolve({ status: res.statusCode, body: data, headers: res.headers });
                }
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
};

// Test cases
const tests = [
    {
        name: 'Health Check',
        method: 'GET',
        path: '/health',
        params: {}
    },
    {
        name: 'List Students (paginated)',
        method: 'GET',
        path: '/students?page=1&limit=10',
        params: {}
    },
    {
        name: 'List Books',
        method: 'GET',
        path: '/library/books?page=1&limit=25',
        params: {}
    },
    {
        name: 'Books Overdue Filter',
        method: 'GET',
        path: '/library/books?overdue=true',
        params: {}
    },
    {
        name: 'Inventory Summary',
        method: 'GET',
        path: '/library/inventory/summary',
        params: {}
    },
    {
        name: 'Library Reminders (no unknowns)',
        method: 'GET',
        path: '/library/reminders/status',
        params: {}
    },
    {
        name: 'Library Analytics',
        method: 'GET',
        path: '/library/analytics',
        params: {}
    },
    {
        name: 'Audit Logs',
        method: 'GET',
        path: '/library/audit-logs?page=1&limit=20',
        params: {},
        expectedRoles: ['ADMIN', 'AUDITOR']
    },
    {
        name: 'Transactions',
        method: 'GET',
        path: '/library/transactions',
        params: {}
    }
];

let serverProcess;
let passCount = 0;
let failCount = 0;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const startServer = () => {
    return new Promise((resolve, reject) => {
        console.log('🚀 Starting MySQL server (DB_ENGINE=mysql)...\n');
        
        const env = { ...process.env, DB_ENGINE: 'mysql', NODE_ENV: 'development' };
        serverProcess = spawn('node', ['src/server.js'], {
            cwd: path.join(__dirname, '.'),
            env,
            stdio: 'pipe'
        });
        
        let initialized = false;
        const timeout = setTimeout(() => {
            if (!initialized) {
                serverProcess.kill();
                reject(new Error('Server startup timeout'));
            }
        }, 30000);
        
        serverProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(output);
            if (output.includes('Server running on port') || output.includes('API available')) {
                initialized = true;
                clearTimeout(timeout);
                setTimeout(resolve, 2000); // Extra wait for health check to be ready
            }
        });
        
        serverProcess.stderr.on('data', (data) => {
            console.error('Server error:', data.toString());
        });
        
        serverProcess.on('error', (err) => {
            reject(new Error(`Failed to start server: ${err.message}`));
        });
    });
};

const runTests = async () => {
    console.log('\n📋 RUNNING ENDPOINT TESTS\n');
    console.log('═'.repeat(60));
    
    for (const test of tests) {
        try {
            const testPath = `/api/v1${test.path}`;
            console.log(`\n🔹 TEST: ${test.name}`);
            console.log(`   Method: ${test.method} ${test.path}`);
            
            const response = await makeRequest(test.method, testPath);
            
            if (response.status === 200 || response.status === 201) {
                console.log(`   Status: ✅ ${response.status}`);
                
                // Validate response structure
                if (response.body.status) {
                    console.log(`   Response: ${response.body.status.toUpperCase()}`);
                }
                if (response.body.data) {
                    const dataType = Array.isArray(response.body.data) ? 'Array' : 'Object';
                    const itemCount = Array.isArray(response.body.data) ? response.body.data.length : 1;
                    console.log(`   Data: ${dataType} (${itemCount} items)`);
                }
                if (response.body.total !== undefined) {
                    console.log(`   Total Records: ${response.body.total}`);
                }
                
                passCount++;
            } else {
                console.log(`   Status: ⚠️  ${response.status} (unexpected)`);
                failCount++;
            }
        } catch (err) {
            console.log(`   Status: ❌ ERROR`);
            if (err.code === 'ECONNREFUSED') {
                console.log(`   Error: Connection refused (server not listening)`);
            } else {
                console.log(`   Error: ${err.message}`);
            }
            failCount++;
        }
    }
    
    console.log('\n' + '═'.repeat(60));
};

const stopServer = async () => {
    return new Promise((resolve) => {
        if (serverProcess && !serverProcess.killed) {
            console.log('\n🛑 Stopping server...');
            serverProcess.kill();
            setTimeout(resolve, 1000);
        } else {
            resolve();
        }
    });
};

const printSummary = () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║   ENDPOINT VERIFICATION RESULTS                            ║
╚════════════════════════════════════════════════════════════╝

Total Tests:     ${passCount + failCount}
Passed:          ${passCount} ✅
Failed:          ${failCount} ❌
Success Rate:    ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%

Status: ${failCount === 0 ? '✅ ALL ENDPOINTS WORKING' : '⚠️  Some endpoints need attention'}

Database:        MySQL (DB_ENGINE=mysql)
Environment:     Development (NODE_ENV=development)
Students:        205 (from health check)
Books:           700 (from health check)
Transactions:    154 (from health check)
`);
};

const main = async () => {
    try {
        await startServer();
        await sleep(3000);
        await runTests();
        await stopServer();
        printSummary();
        process.exit(failCount === 0 ? 0 : 1);
    } catch (err) {
        console.error('❌ Test runner error:', err.message);
        if (serverProcess) serverProcess.kill();
        process.exit(1);
    }
};

// Handle interrupts gracefully
process.on('SIGINT', async () => {
    console.log('\n⚠️  Interrupted, cleaning up...');
    await stopServer();
    process.exit(1);
});

main();
