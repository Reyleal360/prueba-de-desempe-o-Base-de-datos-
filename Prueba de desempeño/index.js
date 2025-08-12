import express from 'express';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { pool } from './backend/db.js'; // <-- importa tu pool
import { importFile } from './backend/import.js';

const app = express();

// Para usar __dirname con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas
const uploadDir = path.join(__dirname, 'backend', 'upload');
const publicDir = path.join(__dirname, 'public');
console.log("📂 publicDir =", publicDir);

// Middlewares
app.use(express.static(publicDir));
app.use(bodyParser.json());

// ---------------- CSV Endpoints ----------------

// Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

// Listar CSV
app.get('/files', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Error reading file folder' });
        const csvFiles = files.filter(file => file.toLowerCase().endsWith('.csv'));
        if (csvFiles.length === 0) return res.status(404).json({ error: 'No CSV files found' });
        res.json(csvFiles);
    });
});

// Ver CSV como JSON
app.get('/view/:file', (req, res) => {
    const filePath = path.join(uploadDir, req.params.file);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

    const results = [];
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', data => results.push(data))
        .on('end', () => res.json(results))
        .on('error', error => res.status(500).json({ error: error.message }));
});

// Importar CSV a demanda
app.post('/import/:file', async (req, res) => {
    try {
        const stats = await importFile(req.params.file);
        if (!stats.found) return res.status(404).json({ error: 'File not found' });
        return res.json({ message: 'Import executed', import: stats });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Error importing' });
    }
});

// Actualizar CSV
app.put('/update/:file', async (req, res) => {
    const filePath = path.join(uploadDir, req.params.file);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

    const newData = req.body;
    if (!Array.isArray(newData) || newData.length === 0) return res.status(400).json({ error: 'Invalid data' });

    const headers = Object.keys(newData[0]);
    const csvRows = [headers.join(',')];
    newData.forEach(row => csvRows.push(headers.map(h => row[h]).join(',')));

    try {
        await fs.promises.writeFile(filePath, csvRows.join('\n'));
        const stats = await importFile(req.params.file);
        return res.json({ message: 'File updated and imported successfully', import: stats });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Error saving/importing file' });
    }
});

// ---------------- CRUD Users ----------------

// Listar todos
app.get('/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Obtener por ID
app.get('/users/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE Id_user = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Crear
app.post('/users', async (req, res) => {
    const { users_name, Email } = req.body;
    if (!users_name || !Email) return res.status(400).json({ error: 'users_name and Email required' });

    try {
        const [result] = await pool.query('INSERT INTO users (users_name, Email) VALUES (?, ?)', [users_name, Email]);
        res.status(201).json({ message: 'User created', id: result.insertId });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: 'Database error' });
    }
});

// Actualizar
app.put('/users/:id', async (req, res) => {
    const { users_name, Email } = req.body;
    if (!users_name || !Email) return res.status(400).json({ error: 'users_name and Email required' });

    try {
        const [result] = await pool.query('UPDATE users SET users_name = ?, Email = ? WHERE Id_user = ?', [users_name, Email, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User updated' });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: 'Database error' });
    }
});

// Eliminar
app.delete('/users/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM users WHERE Id_user = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});



// ---------------- CRUD Transactions ----------------

// Listar todas
// 1️⃣ Total de transacciones por usuario
app.get('/report/transactions-by-user', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.Id_user, u.users_name, COUNT(t.Transaction_identification) AS total_transactions
            FROM users u
            LEFT JOIN transactions t ON u.Id_user = t.Id_user
            GROUP BY u.Id_user, u.users_name
            ORDER BY total_transactions DESC;
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 2️⃣ Total facturado por usuario
app.get('/report/billed-amount-by-user', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.Id_user, u.users_name, SUM(i.Billed_Amount) AS total_billed
            FROM users u
            LEFT JOIN invoices i ON u.Id_user = i.Id_user
            GROUP BY u.Id_user, u.users_name
            ORDER BY total_billed DESC;
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// 3️⃣ Usuarios con facturas pendientes de pago
app.get('/report/pending-invoices', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT u.Id_user, u.users_name, u.Email
            FROM users u
            INNER JOIN invoices i ON u.Id_user = i.Id_user
            WHERE i.Amount_Paid < i.Billed_Amount;
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});


// ---------------- Iniciar servidor ----------------
app.listen(3000, () => {
    console.log('🚀 served running in http://localhost:3000');
});
