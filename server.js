const express = require("express");
const multer = require("multer");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const app = express();
const port = 3000;

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

  db.query(
    `INSERT INTO transport_data (
      serial_no, date, dc_no, vehicle_no, material, loading_point,
      unloading_point, weight, rate, amount, contractor,
      dc_image, unloading_weight_bill_image, loading_weight_bill_image
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.serial_no || null,
      data.date,
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
    [contractor, amount_paid, date],
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

// ✅ FIXED: Case-insensitive contractor match
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