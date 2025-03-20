const db = require('../db'); // Correct path to your db file

// Get all CCU beds data
const getCCUBeds = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM ccu_beds');
    res.json(results);
  } catch (err) {
    console.error('Error fetching CCU beds data:', err);
    res.status(500).json({ error: 'Error fetching data from CCU beds' });
  }
};

// Get all ICCU beds data
const getICCUBeds = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM iccu_beds');
    res.json(results);
  } catch (err) {
    console.error('Error fetching ICCU beds data:', err);
    res.status(500).json({ error: 'Error fetching data from ICCU beds' });
  }
};

// Get all Normal Ward beds data
const getNormalWardBeds = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM normal_ward_beds');
    res.json(results);
  } catch (err) {
    console.error('Error fetching Normal Ward beds data:', err);
    res.status(500).json({ error: 'Error fetching data from Normal Ward beds' });
  }
};

module.exports = {
  getCCUBeds,
  getICCUBeds,
  getNormalWardBeds,
};
