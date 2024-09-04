const express = require('express');
const authController = require('../controllers/authController');
const paymentDetailsController = require('../controllers/paymentDetailsController');

const router = express.Router();

router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    paymentDetailsController.getAllPaymentDetails
  )
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    paymentDetailsController.createPaymentDetail
  )

router
  .route('/:id')
  .get(paymentDetailsController.getPaymentDetail)
  .patch(paymentDetailsController.updatePaymentDetail)
  .delete(paymentDetailsController.deletePaymentDetail);

module.exports = router;
