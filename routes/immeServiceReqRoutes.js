const express = require('express');
const immeServiceReqController = require('../controllers/ImmeServiceReqController');

const router = express.Router();

router
  .route('/')
  .get(immeServiceReqController.getAllImmeServiceRequests)
  .post(immeServiceReqController.createImmeServiceRequest);

router
  .route('/:id')
  .get(immeServiceReqController.getImmeServiceRequest)
  .delete(immeServiceReqController.deleteImmeServiceRequest);

module.exports = router;
