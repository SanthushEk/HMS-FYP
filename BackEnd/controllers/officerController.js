const db = require("../db");
const crypto = require("crypto");
const path = require("path");

// Register Officer
exports.registerOfficer = async (req, res) => {
  console.log(req.body); // Check incoming data

  const {
    name,
    dob,
    gender,
    phone,
    email,
    nic,
    medicalId,
    address,
    job_role,
    wallet_address, // 👈 Added
  } = req.body;

  const officerSql = `
    INSERT INTO officers 
    (name, dob, gender, phone, email, nic, medical_id, address, job_role, wallet_address) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`; // 👈 Added wallet_address in SQL

  try {
    const [officerResult] = await db.execute(officerSql, [
      name,
      dob,
      gender,
      phone,
      email,
      nic,
      medicalId,
      address,
      job_role,
      wallet_address || null, 
    ]);

    const validRoles = ["Nurse", "Lab Report Officer"];
    if (!validRoles.includes(job_role)) {
      return res.status(400).json({ message: "Invalid job role!" });
    }

    res.status(201).json({
      message: "Officer registered successfully!",
      officerId: officerResult.insertId,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

// Get All Officers
exports.getAllOfficers = async (req, res) => {
  try {
    const sql = "SELECT * FROM officers";
    const [result] = await db.execute(sql);
    res.status(200).json(result);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

// Get Officer by ID
exports.getOfficerById = async (req, res) => {
  const { officerId } = req.params;
  try {
    const sql = "SELECT * FROM officers WHERE officer_id = ?";
    const [result] = await db.execute(sql, [officerId]);

    if (result.length > 0) {
      res.status(200).json(result[0]);
    } else {
      res.status(404).json({ message: "Officer not found" });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

// Update Officer
exports.updateOfficer = async (req, res) => {
  const { officerId } = req.params;
  const { name, dob, gender, phone, email, address, job_role } = req.body;

  const sql = `UPDATE officers
               SET name = ?, dob = ?, gender = ?, phone = ?, email = ?, address = ?, job_role = ?
               WHERE officer_id = ?`;

  try {
    const [result] = await db.execute(sql, [
      name,
      dob,
      gender,
      phone,
      email,
      address,
      job_role,
      officerId,
    ]);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Officer details updated successfully" });
    } else {
      res.status(404).json({ message: "Officer not found" });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

// Delete Officer
exports.deleteOfficer = async (req, res) => {
  const { officerId } = req.params;

  try {
    const sql = "DELETE FROM officers WHERE officer_id = ?";
    const [result] = await db.execute(sql, [officerId]);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Officer deleted successfully" });
    } else {
      res.status(404).json({ message: "Officer not found" });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

// Upload Officer Image
exports.uploadOfficerImage = async (req, res) => {
  console.log("File received:", req.file);
  try {
    const { officerId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = path.join("uploads", file.filename);

    const updateFilePathSql =
      "UPDATE officers SET file_path = ? WHERE officer_id = ?";
    const [result] = await db.execute(updateFilePathSql, [filePath, officerId]);

    if (result.affectedRows > 0) {
      res
        .status(200)
        .json({ message: "Profile image uploaded successfully", filePath });
    } else {
      res.status(404).json({ message: "Officer not found" });
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Error uploading image" });
  }
};
