const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const immeServiceRequestSchema = new mongoose.Schema({
  preferredName: {
    type: 'string',
    required: [true, 'Name is required'],
    minlength: 3,
    trim: true,
  },

  email: {
    type: 'string',
    required: [true, 'Email address is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
  },

  address: {
    type: 'string',
    required: [true, 'Address is required'],
    trim: true,
  },
  active: { type: Boolean, default: true, selected: false },
  services: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
    },
  ],
});

immeServiceRequestSchema.plugin(uniqueValidator);

const ImmediateServiceRequest = mongoose.model(
  'ImmediateServiceRequest',
  immeServiceRequestSchema
);

module.exports = ImmediateServiceRequest;
