/**
 * Sync Sequelize models with MySQL database
 * Creates tables based on model definitions instead of manually written SQL
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize, initializeDatabase } = require(path.join(__dirname, '..', 'src', 'config', 'sequelize'));

(async () => {
  try {
    console.log('🔄 Syncing Sequelize models with MySQL...');
    console.log(`Database: ${process.env.MYSQL_DATABASE}`);
    
    // Initialize database (creates tables via sequelize.sync)
    const seq = await initializeDatabase();
    console.log('✅ All Sequelize models synced successfully');
    
    // List created tables
    const tables = await seq.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${process.env.MYSQL_DATABASE}'
    `);
    
    console.log('\n📋 Created tables:');
    tables[0].forEach((row, idx) => {
      console.log(`  ${idx + 1}. ${row.TABLE_NAME}`);
    });
    
    console.log('\n✨ Schema sync completed successfully!');
    await seq.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Schema sync failed:', error.message);
    if (error.sql) console.error('SQL:', error.sql);
    process.exit(1);
  }
})();
