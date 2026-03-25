const express = require('express');
const r = express.Router();
const c = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');
r.post('/webhook', c.handleWebhook);
r.post('/create-checkout', protect, c.createCheckout);
r.post('/portal', protect, c.createPortalSession);
r.get('/status', protect, c.getStatus);
module.exports = r;
