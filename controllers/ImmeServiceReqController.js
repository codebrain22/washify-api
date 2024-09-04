const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const ImmeServiceRequest = require('../models/immeServiceReqModel');
const Service = require('../models/serviceModel');

exports.getAllImmeServiceRequests = catchAsync(async (req, res, next) => {
  // 1. Filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  //Remove special query parameters from the query object/filtering
  excludedFields.forEach((el) => delete queryObj[el]);

  //const query = Tour.find(queryObj);
  let query = ImmeServiceRequest.find(queryObj);

  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('requestedOn');
  }

  //3) Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields); //this method of selecting certain fields is called projecting
  } else {
    query = query.select('-__v');
  }

  //execute the query
  const immeServiceRequests = await query.populate('service');

  res.status(200).json({
    status: 'success',
    result: immeServiceRequests.length,
    data: {
      serviceRequests: immeServiceRequests,
    },
  });
});

exports.getImmeServiceRequest = catchAsync(async (req, res, next) => {
  const immeServiceRequest = await ImmeServiceRequest.findById(
    req.params.id
  ).populate('service');

  if (!immeServiceRequest) {
    return next(new AppError('No service request found!', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      serviceRequest: immeServiceRequest,
    },
  });
});

exports.deleteImmeServiceRequest = catchAsync(async (req, res, next) => {
  const immeServiceRequest = await ImmeServiceRequest.findByIdAndDelete(req.params.id);

   if (!immeServiceRequest) {
     return next(new AppError('No service request found!', 404));
   }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createImmeServiceRequest = catchAsync(async (req, res, next) => {
  //get service, service request from request body
  //const { service, immeServiceRequest } = req.body;
  //Create service
  const requestBody = { ...req.body };
  const newService = await Service.create(requestBody);
  //create ImmediateServiceRequest
  const newImmeServiceRequest = await ImmeServiceRequest.create(
    Object.assign({ service: newService._id }, requestBody)
  );
  //assign service Id to userServiceRequest service attribute
  //newImmeServiceRequest.service = newService._id;

  res.status(201).json({
    status: 'success',
    data: {
      newServiceRequest: newImmeServiceRequest,
    },
  });
});
