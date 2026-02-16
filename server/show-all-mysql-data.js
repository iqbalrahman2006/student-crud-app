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
          resolve({ error: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function displayData() {
  try {
    console.log('\n' + '='.repeat(100));
    console.log('                           MYSQL DATABASE - COMPLETE DATA VIEW');
    console.log('='.repeat(100) + '\n');

    // Students
    console.log('📚 STUDENTS (First 20 records):');
    console.log('-'.repeat(100));
    const students = await makeRequest('/students?limit=20&offset=0');
    if (students.data) {
      students.data.forEach((s, i) => {
        console.log(`\n${i + 1}. ${s.name} (ID: ${s._id})`);
        console.log(`   Email: ${s.email}`);
        console.log(`   Course: ${s.course || 'N/A'}`);
        console.log(`   Status: ${s.status}`);
        console.log(`   GPA: ${s.gpa || 'N/A'}`);
        console.log(`   Books Borrowed: ${s.borrowedBooksCount}`);
        console.log(`   Has Overdue: ${s.hasOverdue}`);
      });
      console.log(`\n📊 Total Students: ${students.meta?.total || students.data.length}`);
    }

    // Books
    console.log('\n\n' + '='.repeat(100));
    console.log('📖 BOOKS (First 20 records):');
    console.log('-'.repeat(100));
    const books = await makeRequest('/library/books?limit=20&offset=0');
    if (books.data) {
      books.data.forEach((b, i) => {
        console.log(`\n${i + 1}. ${b.title} (ID: ${b.id || b._id})`);
        console.log(`   Author: ${b.author || 'N/A'}`);
        console.log(`   ISBN: ${b.isbn || 'N/A'}`);
        console.log(`   Genre: ${b.genre || 'N/A'}`);
        console.log(`   Available: ${b.availableCopies || 0}`);
        console.log(`   Total Copies: ${b.totalCopies || 0}`);
      });
      console.log(`\n📊 Total Books: ${books.meta?.total || books.data.length}`);
    }

    // Overdue Books
    console.log('\n\n' + '='.repeat(100));
    console.log('⏰ OVERDUE BOOKS:');
    console.log('-'.repeat(100));
    const overdue = await makeRequest('/library/overdue?limit=50&offset=0');
    if (overdue.data) {
      console.log(`\n📊 Total Overdue: ${overdue.data.length || overdue.meta?.total || 0} books`);
      overdue.data.slice(0, 10).forEach((b, i) => {
        console.log(`\n${i + 1}. ${b.studentName} - "${b.bookTitle}" (Overdue by ${b.daysOverdue || 'N/A'} days)`);
      });
      if (overdue.data.length > 10) {
        console.log(`\n... and ${overdue.data.length - 10} more overdue books`);
      }
    }

    // Inventory Summary
    console.log('\n\n' + '='.repeat(100));
    console.log('📦 INVENTORY SUMMARY:');
    console.log('-'.repeat(100));
    const inventory = await makeRequest('/library/inventory');
    if (inventory.summary) {
      console.log(`\nTotal Copies Available: ${inventory.summary.totalAvailable || 0}`);
      console.log(`Total Copies Borrowed: ${inventory.summary.totalBorrowed || 0}`);
      console.log(`Total Copies in Library: ${inventory.summary.totalInLibrary || 0}`);
    }

    console.log('\n' + '='.repeat(100) + '\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Wait for server to be ready
setTimeout(displayData, 1000);
