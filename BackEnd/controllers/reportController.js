const db = require("../db");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Setup multer for file uploads (e.g., blood test report files)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);  // Ensure the upload directory path is correctly set
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);  // Set a unique filename using timestamp
  },
});

const upload = multer({ storage: storage }).single("report_file"); 

// Upload Blood Test Report
exports.uploadBloodTestReport = async (req, res) => {
  // First, handle file upload
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: "Error uploading the file: " + err.message });
    }

    // If no file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No report file uploaded" });
    }

    // Get form data
    const { patientId, doctorName, date, comment } = req.body;
    const reportFile = req.file.filename; // Filename stored by multer

    // Get the full file path (relative or absolute)
    const filePath = path.join(uploadDir, reportFile); // Full path to the file

    // Validate form data
    if (!patientId || !doctorName || !date) {
      return res.status(400).json({ message: "Please provide all required fields" });
    }

    // SQL query to insert blood test report details into the database
    const insertSql = `
      INSERT INTO blood_test_reports (patient_id, doctor_name, report_file, date, comment, file_path, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    try {
      const [result] = await db.execute(insertSql, [
        patientId,
        doctorName,
        reportFile,
        date,
        comment,
        filePath,  // Save the file path in the database
      ]);

      res.status(201).json({
        message: "Blood test report uploaded successfully!",
        reportId: result.insertId,
        filePath: filePath,  // Return the full file path in the response
      });
    } catch (error) {
      console.error("Error inserting blood test report:", error);
      res.status(500).json({ message: "Database error: " + error.message });
    }
  });
};
