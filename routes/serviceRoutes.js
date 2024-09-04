const express = require('express');
const serviceController = require('../controllers/serviceController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    serviceController.getAllServices
  )
  .post(
    // authController.protect,
    // authController.restrictTo('admin'),
    serviceController.createService
  );

router
  .route('/:id')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    serviceController.getService
  )
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    serviceController.updateService
  );

// router.route('/pay').post(authController.protect, serviceController.payService);

// router.route('/success').get(authController.protect, serviceController.success);

// router.route('/cancel').get(authController.protect, serviceController.cancel);

module.exports = router;
