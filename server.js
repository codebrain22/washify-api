const mongoose = require('mongoose');
const dotenv = require('dotenv');

//Handle synchronous uncaught exception - This must be at the top before any code excecutes
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION!☹ shutting down...');
  console.log(err.name, err);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');
const sendEmail = require('./utils/email');

mongoose.set('strictQuery', true);

const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('connection established--');
  }).catch((err) => {
  sendEmail({
    email: process.env.EMAIL_SUPPORT,
    subject: err.name,
    message: err,
  });
  console.log(err.message);
});

const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log(`Server started --`);
});

//Handle any unhandled/uncaught rejected promises
process.on('unhandledRejection', (err) => {
  console.log('UHANDLED REJECTION!☹ shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});


