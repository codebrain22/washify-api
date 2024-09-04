const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/social-login', authController.socialLogin);

// This route is not protected because it must be accessed by unregistered users
router.post('/create-user', userController.createUser);

router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.patch(
  '/update-my-password',
  authController.protect,
  authController.updatePassword
);
router.patch('/update-me', authController.protect, userController.updateMe);
router.patch('/update-user-service', authController.protect, userController.updateUserServices);
router.patch('/add-payent-details', authController.protect, authController.restrictTo('admin'), userController.updateUserPaymentDetails);
router.delete('/delete-me', authController.protect, userController.deleteMe);


router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('admin'),
    userController.getAllUsers
  );
  // .post(userController.createUser);

router
  .route('/:id')
  .get(
    authController.protect,
    // authController.restrictTo('admin'),
    userController.getUser
  )

module.exports = router;
