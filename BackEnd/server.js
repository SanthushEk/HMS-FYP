require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
