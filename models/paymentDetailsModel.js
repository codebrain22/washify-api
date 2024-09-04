const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const paymentDetailsSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true,
  },
  bankName: {
    type: String,
    required: [true, 'Please select the bank name'],
    enum: ['Standard Bank', 'FNB', 'Capitec', 'Nedbank', 'Absa'],
    unique: true,
    trim: true,
  },
  branchCode: {
    type: String,
    required: [true, 'Branch code is required'],
    trim: true,
  },
  accountNumber: {
    type: String,
    required: [true, 'Account number is required'],
    trim: true,
  },
  reference: {
    type: String,
    trim: true,
  },

  createdOn: {
    type: Date,
    default: Date.now(),
  },
  owner: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
  },
});

paymentDetailsSchema.plugin(uniqueValidator);

const PaymentDetails = mongoose.model('PaymentDetails', paymentDetailsSchema);

module.exports = PaymentDetails;
