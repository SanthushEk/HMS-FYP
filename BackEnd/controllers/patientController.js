const db = require("../db");
const crypto = require("crypto");
const path = require("path");
const { relative } = require("path/win32");

exports.registerPatient = async (req, res) => {
  const { fullName, dob, gender, phone, email, nic, address, ward, bedNo } =
    req.body;

  const patientSql = `
      INSERT INTO patients_personal_info 
      (full_name, dob, gender, phone, email, nic, address, ward, bedNo) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  try {
    const [patientResult] = await db.execute(patientSql, [
      fullName,
      dob,
      gender,
      phone,
      email,
      nic,
      address,
      ward || null,
      bedNo || null,
    ]);

    res.status(201).json({
      message: "Patient registered successfully!",
      patientId: patientResult.insertId,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

exports.getWardsAndBeds = async (req, res) => {
  try {
    // Query to get available beds from all three tables
    const sql =
      "SELECT 'CCU' AS ward, bed_id FROM ccu_beds WHERE status = 'vacant' UNION " +
      "SELECT 'ICCU' AS ward, bed_id FROM iccu_beds WHERE status = 'vacant' UNION " +
      "SELECT 'Normal Ward' AS ward, bed_id FROM normal_ward_beds WHERE status = 'vacant'";
    const [bedsResult] = await db.execute(sql);
    res.status(200).json(bedsResult);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

//Get detail to patient Table
exports.getAllPatients = async (req, res) => {
  try {
    const sql = "SELECT * FROM patients_personal_info";
    const [result] = await db.execute(sql);
    res.status(200).json(result);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

// Get a patient by ID
exports.getPatientById = async (req, res) => {
  try {
    const { patientId } = req.params;
    const [rows] = await db.execute(
      "SELECT * FROM patients_personal_info WHERE patient_id = ?",
      [patientId]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Patient not found" });

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a patient
exports.updatePatient = async (req, res) => {
  const { patientId } = req.params;
  const { full_name, dob, gender, phone, email, nic, address, ward, bedNo } =
    req.body;

  const sql = `UPDATE patients_personal_info 
               SET full_name = ?, dob = ?, gender = ?, phone = ?, email = ?, nic = ?, address = ?,ward = ?, bedNo = ? 
               WHERE patient_id = ?`;

  try {
    const [result] = await db.execute(sql, [
      full_name,
      dob,
      gender,
      phone,
      email,
      nic,
      address,
      ward,
      bedNo,
      patientId,
    ]);

    if (result.affectedRows > 0) {
      res
        .status(200)
        .json({ message: "Patient Personal details updated successfully" });
    } else {
      res.status(404).json({ message: "Patient not found" });
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

//Upload Patient Image
exports.uploadPatientImage = async (req, res) => {
  console.log("File received:", req.file);
  try {
    const { patientId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = path.join("uploads", file.filename);

    const updateFilePathSql =
      "UPDATE patients_personal_info SET file_path = ? WHERE patient_id = ?";
    const [result] = await db.execute(updateFilePathSql, [filePath, patientId]);

    if (result.affectedRows > 0) {
      res
        .status(200)
        .json({ message: "Profile image uploaded successfully", filePath });
    } else {
      res.status(404).json({ message: "Patient not found" });
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ message: "Error uploading image" });
  }
};

//General Information
exports.saveOrUpdateGeneralInfo = async (req, res) => {
  const { patientId } = req.params;
  const { bloodGroup, height, weight, bloodPressure, pulse, temperature } =
    req.body;
  try {
    // Check if the patient exists
    const [patientExists] = await db.execute(
      "SELECT 1 FROM patients_personal_info WHERE patient_id = ?",
      [patientId]
    );

    if (patientExists.length === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Insert or update the general information
    const result = await db.execute(
      `INSERT INTO patient_general_info (patient_id, bloodGroup, height, weight, bloodPressure, pulse, temperature)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      bloodGroup = ?, height = ?, weight = ?, bloodPressure = ?, pulse = ?, temperature = ?, updated_at = CURRENT_TIMESTAMP`,
      [
        patientId,
        bloodGroup,
        height,
        weight,
        bloodPressure,
        pulse,
        temperature,
        bloodGroup,
        height,
        weight,
        bloodPressure,
        pulse,
        temperature,
      ]
    );

    if (result.affectedRows > 0) {
      return res
        .status(200)
        .json({ message: "General information saved successfully!" });
    } else {
      return res
        .status(400)
        .json({ message: "Failed to save general information" });
    }
  } catch (error) {
    console.error("Error saving/updating general info:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

// Get General Information by patient ID
exports.getGeneralInfoByPatientId = async (req, res) => {
  const { patientId } = req.params;

  try {
    // Query to fetch general information for the patient
    const [generalInfo] = await db.execute(
      "SELECT * FROM patient_general_info WHERE patient_id = ?",
      [patientId]
    );

    if (generalInfo.length === 0) {
      return res.status(404).json({ message: "General information not found" });
    }

    res.status(200).json(generalInfo[0]); // Return the first (and only) result
  } catch (error) {
    console.error("Error fetching general info:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

//Add Or Update Medical Data Function
exports.saveOrUpdateMedicalCondition = async (req, res) => {
  const { patientId } = req.params;
  const {
    symptom,
    symptom_type,
    consultant_doctor,
    patient_type,
    admit_date,
    symptom_description,
  } = req.body;

  try {
    // Check if the patient exists
    const [patientExists] = await db.execute(
      "SELECT 1 FROM patients_personal_info WHERE patient_id = ?",
      [patientId]
    );

    if (patientExists.length === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Format the admit date for MySQL
    const formatDateForMySQL = (dateString) => {
      if (!dateString) return null;
      const date = new Date(dateString);
      return date.toISOString().slice(0, 19).replace("T", " "); // Converts to "YYYY-MM-DD HH:MM:SS"
    };

    // Ensure all values are properly defined
    const medicalData = {
      symptom: symptom || null,
      symptomType: symptom_type || null,
      consultantDoctor: consultant_doctor || null,
      patientType: patient_type || null,
      admitDate: admit_date ? formatDateForMySQL(admit_date) : null,
      symptomDescription: symptom_description || null,
    };

    console.log("Submitting Data:", medicalData); // Debugging log

    // Check if a record already exists for this patient
    const [existingRecord] = await db.execute(
      "SELECT * FROM medical_conditions WHERE patient_id = ?",
      [patientId]
    );

    let query, params;
    if (existingRecord.length > 0) {
      // Update existing record
      query = `
        UPDATE medical_conditions 
        SET symptom = ?, symptom_type = ?, consultant_doctor = ?, patient_type = ?, admit_date = ?, symptom_description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE patient_id = ?
      `;
      params = [
        medicalData.symptom,
        medicalData.symptomType,
        medicalData.consultantDoctor,
        medicalData.patientType,
        medicalData.admitDate,
        medicalData.symptomDescription,
        patientId,
      ];
    } else {
      // Insert new record
      query = `
        INSERT INTO medical_conditions 
        (patient_id, symptom, symptom_type, consultant_doctor, patient_type, admit_date, symptom_description) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      params = [
        patientId,
        medicalData.symptom,
        medicalData.symptomType,
        medicalData.consultantDoctor,
        medicalData.patientType,
        medicalData.admitDate,
        medicalData.symptomDescription,
      ];
    }

    // Execute the query
    const [result] = await db.execute(query, params);

    if (result.affectedRows > 0) {
      return res
        .status(200)
        .json({ message: "Medical condition information saved successfully!" });
    } else {
      return res
        .status(400)
        .json({ message: "Failed to save medical condition information" });
    }
  } catch (error) {
    console.error("Error saving/updating medical condition info:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

// Get General Information by patient ID
exports.getMedicalInfoByPatientId = async (req, res) => {
  const { patientId } = req.params;
  try {

    const [medicalInfo] = await db.execute(
      "SELECT * FROM medical_conditions WHERE patient_id = ?",
      [patientId]
    );

    if (medicalInfo.length === 0) {
      return res.status(404).json({ message: "Medical information not found" });
    }

    res.status(200).json(medicalInfo[0]); 
  } catch (error) {
    console.error("Error fetching Medical info:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

//Add Update Relative Information Sector
exports.saveOrUpdateRelativeInfo = async (req, res) => {
  const { patientId } = req.params;
  const {
    relative_name,
    relationship,
    address,
    email,
    secondary_relative,
    contact_number,
  } = req.body;

  try {
    // Check if the patient exists
    const [patientExists] = await db.execute(
      "SELECT 1 FROM patients_personal_info WHERE patient_id = ?",
      [patientId]
    );

    if (patientExists.length === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }
    // Ensure all values are properly defined
    const RelativeInfo = {
      relative_name: relative_name || null,
      relationship: relationship || null,
      address: address || null,
      email: email || null,
      secondary_relative: secondary_relative || null,
      contact_number: contact_number || null,
    };

    console.log("Submitting Data:", RelativeInfo); // Debugging log

    // Check if a record already exists for this patient
    const [existingRecord] = await db.execute(
      "SELECT * FROM relatives_info WHERE patient_id = ?",
      [patientId]
    );

    let query, params;
    if (existingRecord.length > 0) {
      // Update existing record
      query = `
        UPDATE relatives_info
        SET relative_name= ?, relationship = ?, address = ?, email = ?, secondary_relative = ?, contact_number = ?, created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE patient_id = ?
      `;
      params = [
        RelativeInfo.relative_name,
        RelativeInfo.relationship,
        RelativeInfo.address,
        RelativeInfo.email,
        RelativeInfo.secondary_relative,
        RelativeInfo.contact_number,
        patientId,
      ];
    } else {
      // Insert new record
      query = `
        INSERT INTO relatives_info 
        (patient_id, relative_name, relationship, address, email, secondary_relative, contact_number) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      params = [
        patientId,
        RelativeInfo.relative_name,
        RelativeInfo.relationship,
        RelativeInfo.address,
        RelativeInfo.email,
        RelativeInfo.secondary_relative,
        RelativeInfo.contact_number,
      ];
    }

    // Execute the query
    const [result] = await db.execute(query, params);

    if (result.affectedRows > 0) {
      return res
        .status(200)
        .json({
          message: "Relative Information information saved successfully!",
        });
    } else {
      return res
        .status(400)
        .json({ message: "Failed to save Relative information" });
    }
  } catch (error) {
    console.error("Error saving/updating Relative info:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

// Get Relative Information by patient ID
exports.getRelativeInfoByPatientId = async (req, res) => {
  const { patientId } = req.params;

  try {
    // Query to fetch general information for the patient
    const [RelativeInfo] = await db.execute(
      "SELECT * FROM relatives_info WHERE patient_id = ?",
      [patientId]
    );

    if (RelativeInfo.length === 0) {
      return res
        .status(404)
        .json({ message: "Relative information not found" });
    }

    res.status(200).json(RelativeInfo[0]); // Return the first (and only) result
  } catch (error) {
    console.error("Error fetching Relative info:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

exports.addDoctorNote = async (req, res) => {
  const { noteTitle, noteDescription, doctorName, patientId } = req.body;

  // Validate the input
  if (!noteTitle || !noteDescription || !doctorName || !patientId) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const sql = `
      INSERT INTO doctor_notes (note_title, note_description, doctor_name, patient_id) 
      VALUES (?, ?, ?, ?)
    `;
    const values = [noteTitle, noteDescription, doctorName, patientId];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error inserting note:", err);
        return res.status(500).json({ message: "Database error" });
      }
      res
        .status(201)
        .json({ message: "Note added successfully", noteId: result.insertId });
    });
  } catch (error) {
    console.error("Error adding note:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//Get detail from doctor_note Table
exports.getAllDoctorNotes = async (req, res) => {
  try {
    const sql = "SELECT * FROM doctor_notes";
    const [result] = await db.execute(sql);
    res.status(200).json(result);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

//Delete Doctor Note
exports.deleteInvestigations = async (req, res) => {
  const { patientId, investigationId } = req.params;

  console.log(
    `Attempting to delete investigation with ID: ${investigationId} for patient: ${patientId}`
  );

  try {
    const result = await db.query(
      "DELETE FROM doctor_notes WHERE id = ? AND patient_id = ?",
      [investigationId, patientId]
    );

    console.log(result); // Log the result of the delete query

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Investigation not found or already deleted" });
    }

    res.json({ message: "Investigation deleted successfully" });
  } catch (error) {
    console.error("Error deleting investigation:", error); // Log the error
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add Doctor Note
exports.addDoctorNote = async (req, res) => {
  const { note_title, note_description, doctor_name } = req.body;
  const { patientId } = req.params; // Get patient_id from the route parameter

  // Validate the input (basic validation)
  if (!note_title || !note_description || !doctor_name || !patientId) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if patient_id exists in patients_personal_info
  const checkPatient = `SELECT * FROM patients_personal_info WHERE patient_id = ?`;
  try {
    const [patient] = await db.execute(checkPatient, [patientId]);

    if (patient.length === 0) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // If patient exists, insert the doctor note
    const newNote = `INSERT INTO doctor_notes (note_title, note_description, doctor_name, patient_id) 
                     VALUES (?, ?, ?, ?)`;

    const [noteResult] = await db.execute(newNote, [
      note_title,
      note_description,
      doctor_name,
      patientId, // Pass patient_id to the query
    ]);

    res.status(201).json({
      message: "Doctor note added successfully!",
      noteId: noteResult.insertId,
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};
//Add Prescription detail
exports.addPrescription = async (req, res) => {
  const {
    patient_id,
    doctor_name,
    prescription_date,
    diagnosis,
    allergy_info,
    medicines // Array of medicines
  } = req.body;

  // 1. Insert the prescription data into the prescriptions table
  const insertPrescriptionSql = `
    INSERT INTO prescriptions (patient_id, doctor_name, prescription_date, diagnosis, allergy_info)
    VALUES (?, ?, ?, ?, ?)
  `;

  try {
    const [prescriptionResult] = await db.execute(insertPrescriptionSql, [
      patient_id,
      doctor_name,
      prescription_date,
      diagnosis,
      allergy_info,
    ]);

    // 2. Capture the prescription_id from the inserted prescription
    const prescription_id = prescriptionResult.insertId;

    // 3. Prepare the medicine insertion query for multiple medicines
    const insertMedicinesSql = `
      INSERT INTO prescription_medicines (prescription_id, medicine_name, dosage, frequency)
      VALUES ?
    `;

    // Prepare values for the medicines array to be inserted in one query
    const medicinesValues = medicines.map((medicine) => [
      prescription_id,
      medicine.medicine_name,
      medicine.dosage,
      medicine.frequency,
    ]);

    // 4. Insert medicines into the prescription_medicines table
    await db.query(insertMedicinesSql, [medicinesValues]);

    // 5. Return success response
    return res.status(200).json({
      message: "Prescription added successfully!",
      prescription_id,
    });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ message: "Database error: " + error.message });
  }
};

//Get Prescription Detail
exports.getAllPrescription= async (req, res) => {
  const { patientId } = req.params;

  const prescriptionQuery = `
    SELECT 
      p.prescription_id,
      p.patient_id,
      p.doctor_name,
      p.prescription_date,
      p.diagnosis,
      p.allergy_info,
      pm.medicine_name,
      pm.dosage,
      pm.frequency
    FROM prescriptions p
    LEFT JOIN prescription_medicines pm
      ON p.prescription_id = pm.prescription_id
    WHERE p.patient_id = ?
  `;

  try {
    const [prescriptionData] = await db.execute(prescriptionQuery, [patientId]);

    if (prescriptionData.length === 0) {
      return res.status(404).json({ message: "No prescriptions found." });
    }

    // Group the medicines by prescription_id
    const prescriptions = [];
    let currentPrescription = null;

    prescriptionData.forEach((row) => {
      if (currentPrescription?.prescription_id !== row.prescription_id) {
        currentPrescription = {
          prescription_id: row.prescription_id,
          patient_id: row.patient_id,
          doctor_name: row.doctor_name,
          prescription_date: row.prescription_date,
          diagnosis: row.diagnosis,
          allergy_info: row.allergy_info,
          medicines: [],
        };
        prescriptions.push(currentPrescription);
      }

      // Push the medicine details into the current prescription's medicines array
      currentPrescription.medicines.push({
        medicine_name: row.medicine_name,
        dosage: row.dosage,
        frequency: row.frequency,
      });
    });

    res.status(200).json(prescriptions);
  } catch (error) {
    console.error("Error fetching prescriptions with medicines:", error);
    res.status(500).json({ message: "Database error: " + error.message });
  }
};

// Delete prescription
exports.deletePrescription = async (req, res) => {
  const { prescriptionId } = req.params;

  try {
    // Start by deleting associated medicines from prescription_medicines table
    const deleteMedicinesSql = `DELETE FROM prescription_medicines WHERE prescription_id = ?`;
    await db.execute(deleteMedicinesSql, [prescriptionId]);

    // Then, delete the prescription from prescriptions table
    const deletePrescriptionSql = `DELETE FROM prescriptions WHERE prescription_id = ?`;
    await db.execute(deletePrescriptionSql, [prescriptionId]);

    res.status(200).json({ message: "Prescription deleted successfully." });
  } catch (error) {
    console.error("Error deleting prescription:", error);
    res.status(500).json({ message: "Error deleting prescription: " + error.message });
  }
};
