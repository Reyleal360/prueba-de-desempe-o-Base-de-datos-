import { pool } from './backend/db.js';

async function verifyImport() {
    try {
        console.log('🔍 Verificando importación de datos...\n');

        // Verificar usuarios
        const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
        console.log(`👥 Usuarios importados: ${users[0].count}`);

        // Verificar transacciones
        const [transactions] = await pool.query('SELECT COUNT(*) as count FROM transactions');
        console.log(`💳 Transacciones importadas: ${transactions[0].count}`);

        // Verificar facturas
        const [invoices] = await pool.query('SELECT COUNT(*) as count FROM invoices');
        console.log(`📄 Facturas importadas: ${invoices[0].count}`);

        // Verificar integridad referencial
        const [orphanTransactions] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM transactions t 
            LEFT JOIN users u ON t.Id_user = u.Id_user 
            WHERE u.Id_user IS NULL
        `);
        console.log(`⚠️ Transacciones huérfanas: ${orphanTransactions[0].count}`);

        const [orphanInvoices] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM invoices i 
            LEFT JOIN users u ON i.Id_user = u.Id_user 
            WHERE u.Id_user IS NULL
        `);
        console.log(`⚠️ Facturas huérfanas: ${orphanInvoices[0].count}`);

        // Mostrar algunos ejemplos
        console.log('\n📊 Ejemplos de datos importados:');
        
        const [sampleUsers] = await pool.query('SELECT * FROM users LIMIT 3');
        console.log('Usuarios:', sampleUsers);

        const [sampleTransactions] = await pool.query('SELECT * FROM transactions LIMIT 3');
        console.log('Transacciones:', sampleTransactions);

        const [sampleInvoices] = await pool.query('SELECT * FROM invoices LIMIT 3');
        console.log('Facturas:', sampleInvoices);

    } catch (error) {
        console.error('❌ Error verificando importación:', error.message);
    } finally {
        await pool.end();
    }
}

verifyImport();