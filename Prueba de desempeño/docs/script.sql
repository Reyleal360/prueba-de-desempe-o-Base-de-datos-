-- Crear base de datos
CREATE DATABASE IF NOT EXISTS pd_reinaldo_leal_cienaga;
USE pd_reinaldo_leal_cienaga;

-- Tabla de usuarios
CREATE TABLE users (
    Id_user INT PRIMARY KEY,
    users_name VARCHAR(255) NOT NULL,
    Identification_Number VARCHAR(255) NOT NULL UNIQUE,
    Address TEXT NOT NULL,
    Phone VARCHAR(50) NOT NULL,
    Email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de transacciones
CREATE TABLE transactions (
    Transaction_identification VARCHAR(20) PRIMARY KEY,
    Id_user INT NOT NULL,
    Date_and_Time_of_the_Transaction DATETIME NOT NULL,
    Transaction_Amount DECIMAL(15,2) NOT NULL,
    Transaction_Status ENUM('Pendiente', 'Completada', 'Fallida') NOT NULL,
    Transaction_Type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Id_user) REFERENCES users(Id_user) ON DELETE CASCADE
);

-- Tabla de facturas
CREATE TABLE invoices (
    invoice_id INT PRIMARY KEY,
    Id_user INT NOT NULL,
    Used_Platform ENUM('Nequi', 'Daviplata') NOT NULL,
    Invoice_Number VARCHAR(50) NOT NULL UNIQUE,
    Billing_Period DATE NOT NULL,
    Billed_Amount DECIMAL(15,2) NOT NULL,
    Amount_Paid DECIMAL(15,2) NOT NULL DEFAULT 0,
    Transaction_identification VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (Id_user) REFERENCES users(Id_user) ON DELETE CASCADE,
    FOREIGN KEY (Transaction_identification) REFERENCES transactions(Transaction_identification) ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_users_identification ON users(Identification_Number);
CREATE INDEX idx_transactions_user ON transactions(Id_user);
CREATE INDEX idx_transactions_status ON transactions(Transaction_Status);
CREATE INDEX idx_invoices_user ON invoices(Id_user);
CREATE INDEX idx_invoices_period ON invoices(Billing_Period);
CREATE INDEX idx_invoices_platform ON invoices(Used_Platform);	

select * from users