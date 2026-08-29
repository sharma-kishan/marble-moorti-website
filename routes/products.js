const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.publicList);
router.get('/:slug', productController.publicDetail);

module.exports = router;
