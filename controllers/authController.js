const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
//const sendEmail = require('../utils/email');
const sendGridMail = require('../utils/email');
const emailTemplate = require('../utils/emailTemplate');
const User = require('../models/userModel');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  //Create and send a cookie
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);
  //Remove the password from the output
  user.password = undefined;

  jwtExpirationDate = 30 * 24 * 60 * 60 * 1000

  // send email
  const messageTitle = `Hi ${user.preferredName}`;
  const messageBody = `Welcome to Washify. Your account has been created successfully. Now you can signin to request your first service. Thank you for signing up with us. `;
  const redirectionLink = `${process.env.FRONT_END_URL}/signin`;
  const buttonTitle = 'Sign In';

  sendGridMail({
    email: user.email,
    subject: 'New account creation',
    message: emailTemplate(messageTitle, messageBody, buttonTitle, redirectionLink
    ),
  });

  res.status(statusCode).json({
    status: 'success',
    token: token,
    expiresIn: jwtExpirationDate,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const {
    preferredName,
    email,
    phone,
    address,
    socialMediaHandles,
    role,
    password,
    passwordConfirm,
  } = req.body;

  const newUser = await User.create({
    preferredName: preferredName,
    email: email,
    phone: phone,
    address: address,
    socialMediaHandles: socialMediaHandles,
    password: password,
    passwordConfirm: passwordConfirm,
    role: role,
  });
  //Create new user and send bank token and created user data.
  createSendToken(newUser, 201, res);
});


exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1. Check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2. Check if user exists && password is correct
  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password)) || user.active === false) {
    return next(new AppError('Looks like you have provided incorrect email or password!', 401));
  }
  // 3. If everything ok, send the token to the client
  createSendToken(user, 200, res);
});

exports.socialLogin = catchAsync(async (req, res, next) => {
  const { id, name, email, provider } = req.body;
  // 1. Check if the user exists
  if (!email || !id) {
    return next(new AppError('Could not detect your email and id!', 400));
  }
  const user = await User.findOne ({ email: email})
  // 2. Login user if user exists
  if(user) {
    // If everything ok, send the token to the client
    createSendToken(user, 200, res);
  } else {
    // 3. Create user if user doe not exists
    const newUser = await User.create(
      {
        preferredName: name,
        email: email,
        socialLoginId: id,
        provider: provider,
      });
    //Create new user and send bank token and created user data.
    createSendToken(newUser, 201, res);
  }
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Getting the token and check if it's exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in.', 401));
  }
  // 2. Verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'Looks like the user for this token does not longer exist! Please consider signing up again.',
        401
      )
    );
  }

  // 4. Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'Your password was recently changed! Please login again.',
        401
      )
    );
  }
  //Grant Access to protected route
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array e.g ['admin'] let's say role='user'... code below for this
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have enough privileges to perform this action.',
      });
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError(
        'The email address is either incorrect or does not exist!',
        404
      )
    );
  }
  //2. Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3. Send it to user's email
  // const resetURL = `${req.protocol}://${req.get(
  //   'host'
  // )}/reset-password/${resetToken}`;
  // const message = `You are getting this email because you have requested password reset. 
  //   Please visit ${resetURL} to reset your password. If you did not request this action, please ignore the email.`;
  const messageTitle = 'Reset Password';
  const messageBody = `You are getting this email because you have requested password reset. A unique link to reset your password has been generated for you. Please note that the link is only valid for the next 10 minutes. To reset your password, click on the button below and follow the instructions`;
  const redirectionLink = `${process.env.FRONT_END_URL}/reset-password/${resetToken}`;
  const buttonTitle = 'Reset Password';

  try {
    // send email
    await sendGridMail({
      email: user.email,
      subject: 'Password Reset Token (Only Valid For 10 Minutes)',
      message:  emailTemplate(messageTitle, messageBody, buttonTitle, redirectionLink),
    });

    return res.status(200).json({
      status: 'success',
      message: 'Token send to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'Looks like there was an error while trying to send the email! Please try again later.'
      ),
      500
    );
  }

  // try {
  //   await sendEmail({
  //     email: user.email,
  //     subject: 'Password Reset Token (Only Valid For 10 Minutes)',
  //     message: message,
  //   });

  //   return res.status(200).json({
  //     status: 'success',
  //     message: 'Token send to email',
  //   });
  // } catch (error) {
  //   user.passwordResetToken = undefined;
  //   user.passwordResetExpires = undefined;
  //   await user.save({ validateBeforeSave: false });
  //   return next(
  //     new AppError(
  //       'Looks like there was an error while trying to send the email! Please try again later.'
  //     ),
  //     500
  //   );
  // }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2. If token has not expired, and the is user, set the new password
  if (!user) {
    return next(
      new AppError('Looks like the token is invalid or has expired!', 400)
    );
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3. Update changedPasswordAt for the users
  // 4. Log the user in, send JWT token
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2. Check if the posted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('You have entered an incorrect password!', 401));
  }

  // 3. If so, update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4. Log user in, send JWT back to the user
  createSendToken(user, 200, res);
});
