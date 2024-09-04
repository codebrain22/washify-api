const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const PaymentDetail = require('../models/paymentDetailsModel');

exports.getAllPaymentDetails = catchAsync(async (req, res, next) => {
  // 1. Filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  //Remove special query parameters from the query object/filtering
  excludedFields.forEach((el) => delete queryObj[el]);

  //const query = Tour.find(queryObj);
  let query = PaymentDetail.find(queryObj);

  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('createdOn');
  }

  //3) Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields); //this method of selecting certain fields is called projecting
  } else {
    query = query.select('-__v');
  }

  //execute the query
  const paymentDetails = await query;

  res.status(200).json({
    status: 'success',
    result: paymentDetails.length,
    data: {
      paymentDetails: paymentDetails,
    },
  });
});

exports.getPaymentDetail = catchAsync(async (req, res, next) => {
  const paymentDetail = await PaymentDetail.findById(req.params.id);

  if (!paymentDetail) {
    return next(new AppError('No payment details found!', 404))
  }
  
  res.status(500).json({
    status: 'success',
    data: {
      paymentDetail: paymentDetail,
    },
  });
});

exports.updatePaymentDetail = catchAsync(async (req, res, next) => {
  const paymentDetail = await PaymentDetail.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true, });

  if (!paymentDetail) {
    return next(new AppError('No payment details found!', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      paymentDetail: paymentDetail,
    },
  });
});

exports.deletePaymentDetail = catchAsync(async (req, res, next) => {
  const paymentDetail = await PaymentDetail.findByIdAndDelete(req.params.id);

  if (!paymentDetail) {
    return next(new AppError('No payment details found!', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createPaymentDetail = catchAsync(async (req, res, next) => {
  const newPaymentDetail = await PaymentDetail.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      newPaymentDetail: newPaymentDetail,
    },
  });
});

