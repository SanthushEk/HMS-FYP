const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const patientController = require("../controllers/patientController");

const router = express.Router();
const uploadDir = path.join(__dirname, "../uploads");

// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup Multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique file name
  },
});

const upload = multer({ storage: storage });

// Patient Routes
router.post("/register", patientController.registerPatient);
router.get("/wards-and-beds", patientController.getWardsAndBeds);
router.get("/", patientController.getAllPatients);
router.get("/:patientId", patientController.getPatientById);
router.put("/:patientId", patientController.updatePatient);

// Upload patient image
router.post("/upload-patient-image/:patientId", upload.single("image"), patientController.uploadPatientImage);

// Fetch general information by patient ID
router.get("/:patientId/general-info", patientController.getGeneralInfoByPatientId);

// Save or update general information for a patient
router.put("/:patientId/general-info", patientController.saveOrUpdateGeneralInfo);

// Add the new route for medical conditions
router.put("/:patientId/medical-info", patientController.saveOrUpdateMedicalCondition);
// Fetch Medical information by patient ID
router.get("/:patientId/medical-info", patientController.getMedicalInfoByPatientId);

router.put("/:patientId/relative-info", patientController.saveOrUpdateRelativeInfo);
router.get("/:patientId/relative-info", patientController.getRelativeInfoByPatientId);

// Add the route for doctor notes
router.post("/add_note/:patientId", patientController.addDoctorNote);

router.get("/:patientId/investigations", patientController.getAllDoctorNotes);
router.delete("/:patientId/investigations/:investigationId", patientController.deleteInvestigations);
router.post("/:patientId/add_note", patientController.addDoctorNote);

module.exports = router;
