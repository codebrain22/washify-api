// const paypal = require('paypal-rest-sdk');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Service = require('../models/serviceModel');

// paypal.configure({
//   mode: 'sandbox', //sandbox or live
//   client_id:
//     'AZVb8D3RbaSCLINf0ssLPckWXX8294WuXvM_E7zPzozG09oGgpfz61phRrpHNwxv-qT5fmIinnpSWwhN',
//   client_secret:
//     'ECHblcjtK0ngZ1Lo4FnlXW1U69xY62k9C2m-SFi5fA5-JUWLnR6-sv1PUYyx5pvcVfeQDii6oHrywcgy',
// });

exports.getAllServices = catchAsync(async (req, res, next) => {
  // 1. Filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  //Remove special query parameters from the query object/filtering
  excludedFields.forEach((el) => delete queryObj[el]);

  //const query = Tour.find(queryObj);
  let query = Service.find(queryObj);

  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('pickupTime');
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

  let numServices = await Service.countDocuments();
  if(req.query.page) {
    numServices = await Service.countDocuments();
    if(skip >= numServices) {
      return next(new AppError('Sorry, we have no orders to display for this page!', 404));
    }
  }

  //execute the query  - populate to get sub-documents attached
  const services = await query.populate('owner').populate('onceOff');

  res.status(200).json({
    status: 'success',
    result: numServices,
    data: {
      services: services,
    },
  });
});

exports.getService = catchAsync(async (req, res, next) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    return next(new AppError('No service found!', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      service: service,
    },
  });
});

exports.createService = catchAsync(async (req, res, next) => {
  const newService = await Service.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      newService: newService,
    },
  });
});

exports.updateService = catchAsync(async (req, res, next) => {
  const service = await Service.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!service) {
    return next(new AppError('No services found!', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      service: service,
    },
  });
});