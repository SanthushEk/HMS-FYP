const express = require('express');
const {
  getCCUBeds,
  getICCUBeds,
  getNormalWardBeds
} = require('../controllers/wardController'); // Import the wardController functions
const router = express.Router();

// Route to get all CCU beds data
router.get('/ccu_beds', getCCUBeds);

// Route to get all ICCU beds data
router.get('/iccu_beds', getICCUBeds);

// Route to get all Normal Ward beds data
router.get('/normal_ward_beds', getNormalWardBeds);

module.exports = router;
