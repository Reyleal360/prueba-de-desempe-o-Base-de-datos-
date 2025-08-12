import { pool } from './backend/db.js';

async function verifyImport() {
    try {
        console.log('🔍 Verifying data import...\n');

        // Verificar usuarios
        const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
        console.log(`👥 Imported users: ${users[0].count}`);

        // Verificar transacciones
        const [transactions] = await pool.query('SELECT COUNT(*) as count FROM transactions');
        console.log(`💳 Imported transactions: ${transactions[0].count}`);

        // Verificar facturas
        const [invoices] = await pool.query('SELECT COUNT(*) as count FROM invoices');
        console.log(`📄 Imported invoices: ${invoices[0].count}`);

        // Verificar integridad referencial
        const [orphanTransactions] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM transactions t 
            LEFT JOIN users u ON t.Id_user = u.Id_user 
            WHERE u.Id_user IS NULL
        `);
        console.log(`⚠️ Orphan transactions: ${orphanTransactions[0].count}`);

        const [orphanInvoices] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM invoices i 
            LEFT JOIN users u ON i.Id_user = u.Id_user 
            WHERE u.Id_user IS NULL
        `);
        console.log(`⚠️ Orphan invoices: ${orphanInvoices[0].count}`);

        // Mostrar algunos ejemplos
        console.log('\n📊 Examples of imported data:');
        
        const [sampleUsers] = await pool.query('SELECT * FROM users LIMIT 3');
        console.log('Users:', sampleUsers);

        const [sampleTransactions] = await pool.query('SELECT * FROM transactions LIMIT 3');
        console.log('Transactions:', sampleTransactions);

        const [sampleInvoices] = await pool.query('SELECT * FROM invoices LIMIT 3');
        console.log('Invoices:', sampleInvoices);

    } catch (error) {
        console.error('❌ Error verifying import:', error.message);
    } finally {
        await pool.end();
    }
}

verifyImport();