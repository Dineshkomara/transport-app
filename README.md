# 🚛 Transport Business Management App

A simple and efficient web-based application to manage transport records for your logistics business. Built with **Node.js**, **Express**, **MySQL**, and **Vanilla JS**.

---

## ✨ Features

- Add and manage transport data
- View transport entries by:
  - Entire records
  - Vehicle Number
  - Contractor Name
- Add payment records and view payment history
- Filter transport data by date or month
- Bulk transport entry via editable table (coming soon)
- Download transport data as CSV

---

## 📁 Folder Structure

```
transport-app/
├── public/
│   ├── index.html
│   ├── all.html
│   ├── vehicle.html
│   ├── contractor.html
│   ├── all-payments.html
│   ├── script.js
│   ├── vehicle.js
│   ├── all-payments.js
│   ├── all.js
│   ├── contractor.js
│   └── style.css
├── uploads/
├── package-lock.json
├── contractor.js
├── all.js
├── server.js
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/Dineshkomara/transport-app.git
cd transport-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up MySQL

Create a MySQL database and run the following schema:

```sql
CREATE DATABASE IF NOT EXISTS transport;
USE transport;

CREATE TABLE transport_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serial_no VARCHAR(20),
    date DATE NOT NULL,
    dc_no VARCHAR(50) NOT NULL,
    vehicle_no VARCHAR(50) NOT NULL,
    material VARCHAR(100) NOT NULL,
    loading_point VARCHAR(100) NOT NULL,
    unloading_point VARCHAR(100) NOT NULL,
    weight FLOAT NOT NULL,
    rate FLOAT NOT NULL,
    amount FLOAT AS (weight * rate / 1000) STORED,
    contractor VARCHAR(100) NOT NULL,
    dc_image VARCHAR(255),
    unloading_weight_bill_image VARCHAR(255),
    loading_weight_bill_image VARCHAR(255)
);

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contractor VARCHAR(100) NOT NULL,
    amount_paid FLOAT NOT NULL,
    date DATE NOT NULL
);
```

> ⚠️ Update your MySQL credentials in `server.js`.

---

## 🛠 Running Locally

```bash
npm start
```

Open your browser and go to:  
👉 [http://localhost:3000](http://localhost:3000)

---

## 🧩 Tech Stack

- **Frontend**: HTML, CSS, JavaScript, DataTables
- **Backend**: Node.js, Express
- **Database**: MySQL
- **File Uploads**: Multer
- **CSV Export**: JS Blob and File Download

---

## 📦 Deployment Options

- Railway (recommended for Node.js + MySQL)
- Render (for static sites only or backend + remote DB)
- Host frontend on GitHub Pages and backend on a VPS

---

## 📝 License

MIT License – Free to use and customize.