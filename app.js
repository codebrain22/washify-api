const express = require('express');
var cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression  = require('compression');

const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')
const userRouter = require('./routes/userRoutes');
const serviceRouter = require('./routes/serviceRoutes');
//TODO: To be removed
const paymentDetailsRouter = require('./routes/paymentDetailsRoutes');
const immeServiceReqRouter = require('./routes/immeServiceReqRoutes');

// assign the result of calling express...will add a bunch of methods to to the app variable
const app = express();

// This is CORS-enabled for all origins
app.use(cors())

// 1. GLOBAL MIDDLEWARES
//Set security HTTP headers
app.use(helmet());
//middleware for more about routes accessed
//Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiter middleware - limit requests from same API
const limiter = rateLimit({
  max: 500,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests have been made from this device. Please try again in an hour.'
});

app.use('/api', limiter);


//middleware to modify the incoming data - data from the body is added to the req
app.use(express.json({
  limit: '10kb'
}));

//Data sanitization against NoSQL query injection
app.use(mongoSanitize());
//Data sanitization against XXS
app.use(xss());
//Prevent against parameter pollution
app.use(hpp());
// TODO:
// app.use(hpp({ //to allow some params to be repeated with different values
//     whitelist: ['', '', ''],
//   })
// );

app.use(compression());

//Serving static files
app.use(express.static(`${__dirname}/public`))

//Middleware to capture the date the req was made - test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/services', serviceRouter);
app.use('/api/v1/once-off-service', immeServiceReqRouter);
app.use('/api/v1/payment-details', paymentDetailsRouter);

// Handle unavailable routes
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server.`, 404));
})

//Handle operational global errors
app.use(globalErrorHandler)

module.exports = app;
