const Sequelize = require('sequelize');

const sequelize = new Sequelize('studentdb', 'root', 'admin123', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

async function displayAllData() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('                    MYSQL DATABASE VIEWER');
    console.log('='.repeat(80) + '\n');

    // ===== STUDENTS =====
    console.log('📚 STUDENTS:\n');
    const [studentCount] = await sequelize.query('SELECT COUNT(*) as count FROM students');
    console.log(`Total Records: ${studentCount.count}\n`);
    
    const students = await sequelize.query('SELECT * FROM students ORDER BY id ASC', { 
      type: Sequelize.QueryTypes.SELECT 
    });
    
    if (students.length > 0) {
      console.table(students.slice(0, 50));
      if (students.length > 50) {
        console.log(`\n... and ${students.length - 50} more students`);
      }
    }

    // ===== BOOKS =====
    console.log('\n' + '='.repeat(80) + '\n');
    console.log('📖 BOOKS:\n');
    const [bookCount] = await sequelize.query('SELECT COUNT(*) as count FROM books');
    console.log(`Total Records: ${bookCount.count}\n`);
    
    const books = await sequelize.query('SELECT * FROM books ORDER BY id ASC', { 
      type: Sequelize.QueryTypes.SELECT 
    });
    
    if (books.length > 0) {
      console.table(books.slice(0, 50));
      if (books.length > 50) {
        console.log(`\n... and ${books.length - 50} more books`);
      }
    }

    // ===== BORROW TRANSACTIONS =====
    console.log('\n' + '='.repeat(80) + '\n');
    console.log('💳 BORROW TRANSACTIONS:\n');
    const [transactionCount] = await sequelize.query('SELECT COUNT(*) as count FROM borrowtransactions');
    console.log(`Total Records: ${transactionCount.count}\n`);
    
    const transactions = await sequelize.query('SELECT * FROM borrowtransactions ORDER BY id ASC', { 
      type: Sequelize.QueryTypes.SELECT 
    });
    
    if (transactions.length > 0) {
      console.table(transactions.slice(0, 50));
      if (transactions.length > 50) {
        console.log(`\n... and ${transactions.length - 50} more transactions`);
      }
    }

    // ===== SUMMARY =====
    console.log('\n' + '='.repeat(80));
    console.log('                         SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Students:      ${studentCount.count}`);
    console.log(`✅ Books:         ${bookCount.count}`);
    console.log(`✅ Transactions:  ${transactionCount.count}`);
    console.log('='.repeat(80) + '\n');

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

displayAllData();
