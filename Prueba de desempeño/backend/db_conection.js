import { pool } from './db.js';

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión exitosa a la base de datos');
        connection.release();
        process.exit(0); // Cerrar script
    } catch (error) {
        console.error('❌ Error al conectar a la base de datos:', error.message);
        process.exit(1);
    }
}

testConnection();