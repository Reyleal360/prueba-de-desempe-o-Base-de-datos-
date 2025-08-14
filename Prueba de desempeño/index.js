import express from 'express';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { pool } from './backend/db.js'; 
import { importFile } from './backend/import.js';

const app = express();

// To use __dirname with ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// routes
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
        if (err) return res.status(500).json({ error: 'Error leyendo carpeta de archivos' });
        const csvFiles = files.filter(file => file.toLowerCase().endsWith('.csv'));
        if (csvFiles.length === 0) return res.status(404).json({ error: 'No se encontraron archivos CSV' });
        res.json(csvFiles);
    });
});

// Ver CSV como JSON
app.get('/view/:file', (req, res) => {
    const filePath = path.join(uploadDir, req.params.file);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Archivo no encontrado' });

    const results = [];
    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', data => results.push(data))
        .on('end', () => res.json(results))
        .on('error', error => res.status(500).json({ error: error.message }));
});

// Actualizar CSV
app.put('/update/:file', (req, res) => {
    const filePath = path.join(uploadDir, req.params.file);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Archivo no encontrado' });

    const newData = req.body;
    if (!Array.isArray(newData) || newData.length === 0) return res.status(400).json({ error: 'Datos inválidos' });

    const headers = Object.keys(newData[0]);
    const csvRows = [headers.join(',')];
    newData.forEach(row => csvRows.push(headers.map(h => row[h]).join(',')));

    fs.writeFile(filePath, csvRows.join('\n'), err => {
        if (err) return res.status(500).json({ error: 'Error al guardar archivo' });
        res.json({ message: 'Archivo actualizado correctamente' });
    });
});

app.post('/import/:file', async (req, res) => {
    try {
        console.log(`🔄 Starting import of ${req.params.file}`);
        const result = await importFile(req.params.file);
        
        if (!result.found) {
            return res.status(404).json({ 
                error: `File ${req.params.file} not found`,
                import: result 
            });
        }

        console.log(`✅ Import completed for ${req.params.file}:`, result);
        res.json({ 
            message: `Import completed for ${req.params.file}`,
            import: result 
        });
    } catch (error) {
        console.error(`❌ Error importing ${req.params.file}:`, error);
        res.status(500).json({ 
            error: `Error importing ${req.params.file}: ${error.message}`,
            import: { file: req.params.file, found: false, inserted: 0, failed: 1 }
        });
    }
});

// ---------------- CRUD Users ----------------

// list all
app.get('/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get by ID
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

// create 
app.post('/users', async (req, res) => {
    try{
    const { 
    Id_user,
    users_name,
    Identification_Number,
    Address,
    Phone,
    Email
} = req.body


const query =`INSERT INTO users(Id_user,users_name,Identification_Number,Address,Phone,Email)
     VALUES (?,?,?,?,?,?)`
  
const values= [
    Id_user,
    users_name,
    Identification_Number,
    Address,
    Phone,
    Email
]

    const [result] = await pool.query(query,values)

    res.status(201).json({
        mensage:"user was created"
    })
    }catch(error){
        res.status(500).json({
            status:'error',
            endpoint: req.originalUrl,
            method:req.method,
            message:error.message
        });
    }
});

// uptade 
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

// delete 
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





// Total transactions per user

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

// Total billed per user
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



// Users with outstanding invoices

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


// ---------------- Run server ----------------
app.listen(3000, () => {
    console.log('🚀 served running in http://localhost:3000');
});
