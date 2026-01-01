const express = require('express');
const router = express.Router();
const { scanQR } = require('../controllers/emergencyController');

/**
 * Emergency QR scan route - PUBLIC (No authentication)
 * This endpoint is accessed when someone scans a health card QR code
 * in an emergency situation
 */
router.post('/scan-qr', scanQR);

module.exports = router;
