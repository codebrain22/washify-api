const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      required: [true, 'Please choose the service type'],
      enum: {
        values: ['Basic', 'Premium', 'Advanced'],
      },
      trim: true,
    },
    pickupTime: {
      type: Date,
      required: [true, 'Please select the pick-up time'],
    },
    paymentMethod: {
      type: String,
      enum: ['In-app payment', 'Cash on delivery', 'Monthly subscription'],
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Approved', 'Pending', 'Monthly'],
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'Pending collection',
        'Collected',
        'Washing',
        'Drying',
        'Ironing',
        'Folding',
        'Returned',
        'Cancelled',
      ],
      default: 'Pending collection',
      trim: true,
    },
    returnedOn: {
      type: Date,
    },
    requestedOn: {
      type: Date,
      default: Date.now(),
    },
    message: {
      type: String,
      trim: true,
    },
    reference: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    onceOff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ImmediateServiceRequest',
    },
  },
  { timestamps: true }
);

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
