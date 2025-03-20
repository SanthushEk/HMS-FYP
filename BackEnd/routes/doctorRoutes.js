const express = require("express");
const multer = require("multer");
const path = require("path");
const doctorController = require("../controllers/doctorController");

const router = express.Router();
const fs = require("fs");
const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Setup Multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Doctor Routes
router.post("/register", doctorController.registerDoctor);
router.get("/", doctorController.getAllDoctors);
router.get("/:doctorId", doctorController.getDoctorById);
router.put("/:doctorId", doctorController.updateDoctor);
router.delete("/:doctorId", doctorController.deleteDoctor);
router.post("/upload-doctor-image/:doctorId", upload.single("image"), doctorController.uploadDoctorImage);


module.exports = router;
