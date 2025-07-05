const db = require("../db");
const crypto = require("crypto");
const path = require("path");

exports.registerDoctor = async (req, res) => {
  const {
    name,
    dob,
    gender,
    phone,
    email,
    nic,
    medicalId,
    address,
    specialty,
    wallet_address, // 👈 New field
  } = req.body;

  const doctorSql = `
    INSERT INTO doctors 
    (name, dob, gender, phone, email, nic, medical_id, address, specialty, wallet_address) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  try {
    const [doctorResult] = await db.execute(doctorSql, [
      name,
      dob,
      gender,
      phone,
      email,
      nic,
      medicalId,
      address,
      specialty,
      wallet_address || null, 
    ]);

    // Set medical_id as username and NIC as the default password
    const username = medicalId;
    const password = crypto.createHash("sha256").update(nic).digest("hex");

    const userSql = `
      INSERT INTO users (username, password, role, doctor_id) 
      VALUES (?, ?, 'doctor', ?)`;

    await db.execute(userSql, [username, password, doctorResult.insertId]);

    res.status(201).json({
      message: "Doctor registered and user created successfully!",
      doctorId: doctorResult.insertId,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

exports.getAllDoctors = async (req, res) => {
  try {
    const sql = "SELECT * FROM doctors";
    const [result] = await db.execute(sql);
    res.status(200).json(result);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

exports.getDoctorById = async (req, res) => {
  const { doctorId } = req.params;
  try {
    const sql = "SELECT * FROM doctors WHERE doctor_id = ?";
    const [result] = await db.execute(sql, [doctorId]);

    if (result.length > 0) {
      res.status(200).json(result[0]);
    } else {
      res.status(404).json({ message: "Doctor not found" });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

exports.updateDoctor = async (req, res) => {
  const { doctorId } = req.params;
  const { name, dob, gender, phone, email, address, specialty } = req.body;

  const sql = `UPDATE doctors 
               SET name = ?, dob = ?, gender = ?, phone = ?, email = ?, address = ?, specialty = ? 
               WHERE doctor_id = ?`;

  try {
    const [result] = await db.execute(sql, [name, dob, gender, phone, email, address, specialty, doctorId]);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Doctor details updated successfully" });
    } else {
      res.status(404).json({ message: "Doctor not found" });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

exports.deleteDoctor = async (req, res) => {
  const { doctorId } = req.params;

  try {
    const deleteUserSql = "DELETE FROM users WHERE doctor_id = ?";
    await db.execute(deleteUserSql, [doctorId]);

    const sql = "DELETE FROM doctors WHERE doctor_id = ?";
    const [result] = await db.execute(sql, [doctorId]);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Doctor and related user deleted successfully" });
    } else {
      res.status(404).json({ message: "Doctor not found" });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

exports.uploadDoctorImage = async (req, res) => {
    console.log("File received:", req.file);
  try {
    const { doctorId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = path.join("uploads", file.filename);

    const updateFilePathSql = "UPDATE doctors SET file_path = ? WHERE doctor_id = ?";
    const [result] = await db.execute(updateFilePathSql, [filePath, doctorId]);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: "Profile image uploaded successfully", filePath });
    } else {
      res.status(404).json({ message: "Doctor not found" });
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Error uploading image" });
  }
};
