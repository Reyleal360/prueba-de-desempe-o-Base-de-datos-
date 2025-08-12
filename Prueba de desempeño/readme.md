# 📊 CSV Viewer & Editor

This project allows you to **view and edit CSV files** directly from a web browser, retrieving the data from a **Node.js + Express backend**.  
The CSV files are read from the server and can be modified and saved back to the server.

---

## 🚀 Features
- Automatic listing of all CSV files available on the server.
- Display CSV files in HTML tables.
- Direct cell-by-cell editing from the browser.
- Save changes back to the original CSV file.
- Modern UI styles.
- Backend in Node.js with Express and `csv-parser`.
-It also allows you to export changes to the database.

---

## 📂 Project Structure
index.js
backend/
│ └── upload/
│          ├── users.csv
│          ├── transaction.csv
│          └── invoice_data.csv
│ ├──db.conection.js
│ ├──import.js
│ └── db.js
public/
├── index.html
├──css/
│    └──styles.css
├──js/
│    └──dashboard.js


---

## ⚙️ Technologies Used
### Backend
- **Node.js** — Runtime environment.
- **Express** — HTTP server framework.
- **csv-parser** — CSV file reader.
- **fs** and **path** — File and path management.

### Frontend
- **HTML5** — Page structure.
- **CSS3** — Styling.
- **JavaScript (Fetch API)** — API consumption and data manipulation.

---

## 📥 Installation & Setup

## 1. Clone the repository:
   git clone https://github.com/youruser/csv-project.git
   cd csv-project


##  Install dependencies:

npm install express csv-parser
Folder structure:


backend/upload/   # Place your CSV files here
public/index.html # Frontend
Place your .csv files in:


backend/upload/
## Start the server:


node index.js
Open in your browser:
http://localhost:3000


##  🛠️ API Endpoints
GET /files
Returns the list of available CSV files.

## Example Response:


["users.csv", "transaction.csv", "invoice_data.csv"]
GET /view/:file
Returns the content of a CSV as JSON.

## Example:

GET /view/users.csv
Response:

[
  {
    "Id_user": "1",
    "users_name": "John Doe",
    "Email": "john@example.com"
  }
]
PUT /update/:file
Receives a JSON array with updated data and overwrites the corresponding CSV file.

## Example:

PUT /update/users.csv
Content-Type: application/json

[
  { "Id_user": "1", "users_name": "Jane Doe", "Email": "jane@example.com" }
]
## Response:

{ "message": "File updated successfully" }
📌 Usage
Select a CSV file from the dropdown menu.

Click Load to view its content.

Edit the fields directly in the table.

Click Save changes to update the file on the server.

## ⚙️ 👤 Author
Reinaldo Leal — Clan Ciénaga