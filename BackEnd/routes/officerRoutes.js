const express = require("express");
const multer = require("multer");
const path = require("path");
const officerController = require("../controllers/officerController");

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

// Officer Routes
router.post("/register", officerController.registerOfficer);
router.get("/", officerController.getAllOfficers);
router.get("/:officerId", officerController.getOfficerById);
router.put("/:officerId", officerController.updateOfficer);
router.delete("/:officerId", officerController.deleteOfficer);
router.post("/upload-officer-image/:officerId", upload.single("image"), officerController.uploadOfficerImage);


module.exports = router;
