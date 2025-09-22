const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const runMigrations = async () => {
  let connection;
  
  try {
    // Connect to MySQL server (without database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_ROOT_PASSWORD || process.env.DB_PASSWORD
    });

    console.log('📊 Connected to MySQL server');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }

    console.log('✅ Database schema created successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

const runSeeds = async () => {
  let connection;
  
  try {
    // Connect to the healthcare database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'healthcare_user',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'healthcare_db'
    });

    console.log('📊 Connected to healthcare database');

    // Read and execute seed data
    const seedPath = path.join(__dirname, 'seed.sql');
    const seedData = await fs.readFile(seedPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = seedData.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }

    console.log('✅ Seed data inserted successfully');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Run migrations and seeds
const main = async () => {
  console.log('🚀 Starting database setup...');
  await runMigrations();
  await runSeeds();
  console.log('🎉 Database setup completed!');
  process.exit(0);
};

if (require.main === module) {
  main();
}

module.exports = { runMigrations, runSeeds };