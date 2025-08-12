import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, 'upload');

const importOrder = ['users.csv', 'transaction.csv', 'invoice_data.csv'];

async function processFile(file) {
    const filePath = path.join(uploadDir, file);
    if (!fs.existsSync(filePath)) {
        return { file, found: false, inserted: 0, failed: 0 };
    }

    return await new Promise((resolve, reject) => {
        const inserts = [];

        fs.createReadStream(filePath)
            .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
            .on('data', (row) => {
                try {
                    if (file === 'users.csv') {
                        inserts.push(pool.query(
                            `INSERT IGNORE INTO users (Id_user, users_name, Identification_Number, Address, Phone, Email)
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [
                                row.Id_user ? parseInt(row.Id_user) : null,
                                row.users_name || null,
                                row.Identification_Number || null,
                                row.Address || null,
                                row.Phone || null,
                                row.Email || null
                            ]
                        ));
                    }
                    else if (file === 'transaction.csv') {
                        let transactionDate = null;
                        if (row.Date_and_Time_of_the_Transaction) {
                            const date = new Date(row.Date_and_Time_of_the_Transaction);
                            if (!isNaN(date.getTime())) {
                                transactionDate = date.toISOString().slice(0, 19).replace('T', ' ');
                            }
                        }

                        inserts.push(pool.query(
                            `INSERT IGNORE INTO transactions (Transaction_identification, Id_user, Date_and_Time_of_the_Transaction, Transaction_Amount, Transaction_Status, Transaction_Type)
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [
                                row.Transaction_identification || null,
                                row.Id_user ? parseInt(row.Id_user) : null,
                                transactionDate,
                                row.Transaction_Amount ? parseFloat(row.Transaction_Amount) : 0,
                                row.Transaction_Status || 'Earring',
                                row.Transaction_Type || 'Bill Payment'
                            ]
                        ));
                    }
                    else if (file === 'invoice_data.csv') {
                        let billingPeriod = row.Billing_Period;
                        if (billingPeriod && /^\d{4}-\d{2}$/.test(billingPeriod)) {
                            billingPeriod += '-01';
                        }

                        inserts.push(pool.query(
                            `INSERT IGNORE INTO invoices (invoice_id, Id_user, Used_Platform, Invoice_Number, Billing_Period, Billed_Amount, Amount_Paid, Transaction_identification)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                row.invoice_id ? parseInt(row.invoice_id) : null,
                                row.Id_user ? parseInt(row.Id_user) : null,
                                row.Used_Platform || null,
                                row.Invoice_Number || null,
                                billingPeriod || null,
                                row.Billed_Amount ? parseFloat(row.Billed_Amount) : 0,
                                row.Amount_Paid ? parseFloat(row.Amount_Paid) : 0,
                                row.Transaction_identification || null
                            ]
                        ));
                    }
                } catch (rowError) {
                    // Collect failures via Promise rejections later
                }
            })
            .on('end', async () => {
                try {
                    const results = await Promise.allSettled(inserts);
                    const successful = results.filter(r => r.status === 'fulfilled').length;
                    const failedResults = results.filter(r => r.status === 'rejected');
                    const failed = failedResults.length;
                    const errorMessages = failedResults.slice(0, 5).map(r => r.reason?.message || String(r.reason));
                    if (failed > 0) {
                        console.error(`❌ Errors when importing ${file}:`);
                        errorMessages.forEach((msg, i) => console.error(`  ${i + 1}. ${msg}`));
                    }
                    resolve({ file, found: true, inserted: successful, failed, errors: errorMessages });
                } catch (err) {
                    reject(err);
                }
            })
            .on('error', (error) => reject(error));
    });
}

async function importCSV(files = importOrder) {
    const stats = [];
    for (const file of files) {
        const s = await processFile(file);
        stats.push(s);
    }
    return stats;
}

async function importFile(file) {
    return (await importCSV([file]))[0];
}

// CLI entrypoint: close pool only when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    importCSV()
        .then(async (stats) => {
            console.log('📊 Import results:', stats);
            await pool.end();
            process.exit(0);
        })
        .catch(async (err) => {
            console.error('❌ Error importing:', err?.message || err);
            await pool.end();
            process.exit(1);
        });
}

export { importCSV, importFile };