const catchAsync = require('../utils/catchAsync');
const sendGridMail = require('../utils/email');
const emailTemplate = require('../utils/emailTemplate');
const User = require('../models/userModel');
const immeServiceReqRouter = require('../models/immeServiceReqModel');
const Service = require('../models/serviceModel');
const ImmediateServiceRequest = require('../models/immeServiceReqModel');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  // 1. Filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  //Remove special query parameters from the query object/filtering
  excludedFields.forEach((el) => delete queryObj[el]);

  //const query = Tour.find(queryObj);
  let query = User.find(queryObj);

  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('role');
  }

  //3) Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields); //this method of selecting certain fields is called projecting
  } else {
    query = query.select('-__v');
  }

  //4) Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 5;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  let numUsers;
  if (req.query.page) {
    numUsers = await User.countDocuments();
    if (skip >= numUsers) {
      return next(new AppError('This page does not exist!', 404));
    }
  }

  //execute the query
  const users = await query;

  res.status(200).json({
    status: 'success',
    result: numUsers,
    data: {
      users: users,
    },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate('services');

  if (!user) {
    return next(new AppError('No user found!', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: user,
    },
  });
});

//Update (me) user data
exports.updateMe = async (req, res, next) => {
  try {
    // 1. Create error if user post password data is not
    if (req.body.password || req.body.passwordConfirm) {
      return res.status(400).json({
        status: 'fail',
        message:
          'This route is not for password updates. Please user /update-my-password',
      });
    }
    // 3. Filtered out unwanted names that are not allowed to be updated
    const filteredBody = filterObj(
      req.body,
      'preferredName',
      'email',
      'phone',
      'address',
      'socialMediaHandles',
      'subscription'
    );
    // 3. Update user document
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      { new: true, runValidators: true }
    );

    if (req.body.subscription) {
      const messageTitle ='Thank you for subscribing with us';
      const messageBody = `Your subscription to ${req.body.subscription.toUpperCase()} service was successful. Please note that users that are on subscriptions are only billed monthly. Click on the button below to track your orders`;
      const redirectionLink = `${process.env.FRONT_END_URL}/dashboard/my-orders`;
      const buttonTitle = 'My orders';

      // send email
      await sendGridMail({
        email: req.body.email,
        subject: 'New subscription',
        message: emailTemplate(messageTitle, messageBody, buttonTitle, redirectionLink),
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
};

//Update user data
exports.createUser = catchAsync(async (req, res, next) => {
  try {
    //If user exists
    let user = await immeServiceReqRouter.findOne({ email: req.body.email });

    // If user does exists, create new
    if (!user) {
      user = await immeServiceReqRouter.create({
        preferredName: req.body.preferredName,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
      });
    } 

    const userId = user._id;
    const serviceId = req.body.service;
    // Update service
    const newService = updateService(serviceId, userId, res);
    // Update user
    const newUser = updateUserServicesHandler('unregistered', userId, serviceId, res);

    if (newService && newUser) {
      const messageTitle = `Hi ${req.body.preferredName}`;
      const messageBody = `We have received your service request. We will get back to you shortly. Thank you for working with us`;
      const redirectionLink = ``;
      const buttonTitle = '';

      // send email
      await sendGridMail({
        email: req.body.email,
        subject: 'Service request received',
        message: emailTemplate(messageTitle, messageBody, buttonTitle, redirectionLink),
      });
    }
  
    // Return success results
    res.status(201).json({
      status: 'success',
      data: {
        user: newUser,
        service: newService,
      },
    });
  }
  catch (error) {
    // Return error results
    res.status(400).json({
      status: 'fail',
      data: 'An error occurred while requesting a service'
    });
  }
});


// Update user requested services
exports.updateUserServices =  async (req, res, next) => {
  const userId = req.user.id;
  const serviceId = req.body.service;
  updateUserServicesHandler('registered', userId, serviceId, res);
};

// Used in updateUserServices and createUser controllers
async function updateUserServicesHandler(mode, userId, serviceId, res) {
   try {
     // 1. Update user document
     let updatedUser;
     if (mode === 'registered') {
       updatedUser = await User.findByIdAndUpdate(
         userId,
         {
           $push: { services: serviceId },
         },
         { new: true, runValidators: false }
       );
     } else {
       updatedUser = await ImmediateServiceRequest.findByIdAndUpdate(
         userId,
         {
           $push: { services: serviceId },
         },
         { new: true, runValidators: false }
       );
     }

    return updatedUser;
    
   } catch (error) {
     res.status(400).json({
       status: 'fail',
       message: error.message,
     });
   }

}

async function updateService(serviceId, userId, res) {
  try {
    // 1. Update user document
    const updatedService = await Service.findByIdAndUpdate(
      serviceId,
      {
        onceOff: userId,
      },
      { new: true, runValidators: true }
    );

    return updatedService;
    
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
}

//Update user added payment details
exports.updateUserPaymentDetails = async (req, res, next) => {
  try {
    // 1. Update user document
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $push: { peymentDetails: req.body.peymentDetails },
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
};


//Delete (me) user data
exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.status(200).json({
      status: 'success',
      message: 'Your account has been deleted permanently',
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
};