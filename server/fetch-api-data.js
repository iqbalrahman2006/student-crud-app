const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1${path}`,
      method: 'GET',
      headers: {
        'x-role': 'ADMIN'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function displayData() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('                    MYSQL DATABASE - API VIEW');
    console.log('='.repeat(80) + '\n');

    // Students
    console.log('📚 STUDENTS (First 20 records):');
    const students = await makeRequest('/students?limit=20&offset=0');
    if (students.data) {
      console.table(students.data);
      console.log(`Total: ${students.total || students.data.length} students\n`);
    }

    // Books
    console.log('\n📖 BOOKS (First 20 records):');
    const books = await makeRequest('/books?limit=20&offset=0');
    if (books.data) {
      console.table(books.data);
      console.log(`Total: ${books.total || books.data.length} books\n`);
    }

    // Transactions
    console.log('\n💳 BORROW TRANSACTIONS (First 20 records):');
    const transactions = await makeRequest('/library/transactions?limit=20&offset=0');
    if (transactions.data) {
      console.table(transactions.data);
      console.log(`Total: ${transactions.total || transactions.data.length} transactions\n`);
    }

    console.log('='.repeat(80) + '\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Wait for server to be ready
setTimeout(displayData, 1000);
