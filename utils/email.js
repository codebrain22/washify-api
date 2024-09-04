const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

//SendGrid email service
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendGridMail = async (options) => {

  const msg = {
    to: options.email,
    from: 'admin@washify.co.za', // Use the email address or domain you verified above
    subject: options.subject,
    html: options.message.toString(),
  };

  sendMail(msg);

}

const sendMail = async (msg) => {
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error(error);

    if (error.response) {
      console.error(error.response.body);
    }
  }
}



//Nodemailer email service
const sendEmail = async (options) => {
    // 1.Create a transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      // host: 'smtp.gmail.com',
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    // 2. Define the email options
  const mailOptions = {
    from: 'WASHIFY <washishy.io>',
    to: options.email,
    subject: options.subject,
    html: options.message,
  }
    // 3. Actually send the email
  await transporter.sendMail(mailOptions)
}

module.exports = sendGridMail;