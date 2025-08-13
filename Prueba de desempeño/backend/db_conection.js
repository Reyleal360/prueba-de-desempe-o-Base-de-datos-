import { pool } from './db.js';

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Successful connection to the database');
        connection.release();
        process.exit(0); 
    } catch (error) {
        console.error('❌ Error connecting to database:', error.message);
        process.exit(1);
    }
}

testConnection();