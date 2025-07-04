const express = require("express");
const multer = require("multer");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const app = express();
const port = 3000;
const fs = require("fs");
const XLSX = require("xlsx");

// Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function formatToMySQLDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes("-")) return dateStr; // already formatted
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const y = year.length === 2 ? `20${year}` : year;
    return `${y}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
}

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "transport",
});

db.connect((err) => {
  if (err) console.error("❌ DB Error:", err);
  else console.log("✅ MySQL Connected");
});

app.post("/add-transport", upload.fields([
  { name: "dc_image" },
  { name: "unloading_weight_bill_image" },
  { name: "loading_weight_bill_image" }
]), (req, res) => {
  const data = req.body;
  const files = req.files;
  const amount = (data.weight * data.rate) / 1000;
  const formattedDate = formatToMySQLDate(data.date);

  db.query(
    `INSERT INTO transport_data (
      serial_no, date, dc_no, vehicle_no, material, loading_point,
      unloading_point, weight, rate, amount, contractor,
      dc_image, unloading_weight_bill_image, loading_weight_bill_image
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.serial_no || null,
      formattedDate,
      data.dc_no,
      data.vehicle_no,
      data.material,
      data.loading_point,
      data.unloading_point,
      data.weight,
      data.rate,
      amount,
      data.contractor,
      files.dc_image?.[0]?.filename || null,
      files.unloading_weight_bill_image?.[0]?.filename || null,
      files.loading_weight_bill_image?.[0]?.filename || null
    ],
    (err) => {
      if (err) return res.status(500).json(err);
      res.sendStatus(200);
    }
  );
  console.log("Received transport data:", data);
  console.log("Received files:", files);
});

app.post("/add-payment", (req, res) => {
  const { contractor, amount_paid, date } = req.body;
  db.query(
    "INSERT INTO payments (contractor, amount_paid, date) VALUES (?, ?, ?)",
    [contractor, amount_paid, formatToMySQLDate(date)],
    (err) => {
      if (err) return res.status(500).json(err);
      res.sendStatus(200);
    }
  );
});

app.get("/payments/all", (req, res) => {
  db.query("SELECT * FROM payments ORDER BY date", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

app.get("/transport/vehicles", (req, res) => {
  db.query("SELECT DISTINCT vehicle_no FROM transport_data", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows.map(r => r.vehicle_no));
  });
});

app.get("/transport/contractors", (req, res) => {
  db.query("SELECT DISTINCT contractor FROM transport_data", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows.map(r => r.contractor));
  });
});

app.get("/transport/vehicle/:vehicle", (req, res) => {
  db.query(
    "SELECT * FROM transport_data WHERE vehicle_no = ?",
    [req.params.vehicle],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

app.get("/transport/contractor/:contractor", (req, res) => {
  db.query(
    "SELECT * FROM transport_data WHERE contractor = ?",
    [req.params.contractor],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

app.get("/payments/:contractor", (req, res) => {
  db.query(
    "SELECT * FROM payments WHERE LOWER(contractor) = LOWER(?) ORDER BY date",
    [req.params.contractor],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      res.json(rows);
    }
  );
});

app.listen(port, () => console.log(`🚀 Server running at http://localhost:${port}`));

app.get("/payments/all", (req, res) => {
  db.query("SELECT * FROM payments ORDER BY date", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

app.get("/transport/all", (req, res) => {
  db.query("SELECT * FROM transport_data", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

app.post("/add-multiple-entries", (req, res) => {
  const entries = req.body.entries.map(entry => ({
    ...entry,
    date: formatToMySQLDate(entry.date)
  }));

  const values = entries.map(entry => [
    entry.serial_no,
    entry.date,
    entry.dc_no,
    entry.vehicle_no,
    entry.material,
    entry.loading_point,
    entry.unloading_point,
    entry.weight,
    entry.rate,
    entry.contractor
  ]);

  const sql = `INSERT INTO transport_data 
    (serial_no, date, dc_no, vehicle_no, material, loading_point, unloading_point, weight, rate, contractor) 
    VALUES ?`;

  db.query(sql, [values], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Entries added", result });
  });
});

app.post("/upload-file", upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send("No file uploaded");

  const ext = path.extname(file.originalname);
  let workbook;
  try {
    workbook = XLSX.readFile(file.path);
  } catch (err) {
    return res.status(500).send("Failed to read file");
  }

  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    raw: false,
    dateNF: "dd-mm-yyyy"
  });

  if (!data.length) return res.status(400).send("No data in file");

  const values = data.map(row => [
    row.serial_no || null,
    formatToMySQLDate(row.date),
    row.dc_no,
    row.vehicle_no,
    row.material,
    row.loading_point,
    row.unloading_point,
    row.weight,
    row.rate,
    (row.weight * row.rate) / 1000,
    row.contractor,
    null, null, null
  ]);

  const sql = `INSERT INTO transport_data (
    serial_no, date, dc_no, vehicle_no, material, loading_point,
    unloading_point, weight, rate, amount, contractor,
    dc_image, unloading_weight_bill_image, loading_weight_bill_image
  ) VALUES ?`;

  db.query(sql, [values], (err, result) => {
    fs.unlinkSync(file.path);
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "File processed", rowsInserted: result.affectedRows });
  });
});
