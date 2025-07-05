require("dotenv").config();
const db = require("./db");
const express = require("express");
const cors = require("cors");
const multer = require('multer');
const path = require("path");
const fs = require('fs');
const patientRoutes = require("./routes/patientRoute");
const doctorRoutes = require("./routes/doctorRoutes");
const officerRoutes = require("./routes/officerRoutes");
const wardRoutes = require("./routes/wardRoutes");
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded files

// Use the routes
app.use("/api/doctors", doctorRoutes);
app.use("/api/officers", officerRoutes);
app.use("/api", wardRoutes);
app.use("/api/patients", patientRoutes); // Register patient routes

// Configure Multer for File Uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); // Save files in the "uploads" directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Ensure unique filename
  }
});

const upload = multer({ storage: storage });

// API to Handle Lab Report Upload
app.post('/api/uploadLabReport', upload.single('file'), (req, res) => {
  const { patientId, reportType, date, comment } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = `uploads/${req.file.filename}`; // File URL

  // Insert data into the database
  const sql = `INSERT INTO lab_reports (patient_id, report_type, report_date, comment, file_path) VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [patientId, reportType, date, comment, filePath], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json({ message: 'Lab report uploaded successfully', filePath });
  });
});

// API to get lab reports for a patient
app.get('/api/lab_reports/:patientId', (req, res) => {
  const { patientId } = req.params;

  const sql = `SELECT * FROM lab_reports WHERE patient_id = ? ORDER BY report_date DESC`;
  
  db.query(sql, [patientId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'No lab reports found' });
    }

    res.status(200).json({ reports: result });
  });
});

// API to download a lab report file
app.get('/api/download/:fileName', (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join(__dirname, 'uploads', fileName);

  res.download(filePath, fileName, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to download file' });
    }
  });
});

// API to delete a lab report
app.delete('/api/lab_reports/:reportId', (req, res) => {
  const { reportId } = req.params;

  // Fetch the report to get the file path
  const sqlSelect = `SELECT file_path FROM lab_reports WHERE report_id = ?`;
  db.query(sqlSelect, [reportId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: 'Lab report not found' });
    }

    const filePath = result[0].file_path;

    // Delete the file from the server
    fs.unlink(path.join(__dirname, filePath), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to delete file' });
      }

      // Delete the report entry from the database
      const sqlDelete = `DELETE FROM lab_reports WHERE report_id = ?`;
      db.query(sqlDelete, [reportId], (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Failed to delete lab report' });
        }

        res.status(200).json({ message: 'Lab report deleted successfully' });
      });
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
