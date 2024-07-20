const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //1 create a transpoter
  const transpoter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PASS, 
    secure: false, 
    auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD
    }
  });
  
  //2 define email options
  const mailOptions = {
    from: 'Feastgram <buyandsellstuffonline8@gmail.com>',
    to: options.email,
    subject: options.subject,
    html: options.message
    //html: we can even send html to email
  };
  //3 send the   
  //console.log(mailOptions);
  await transpoter.sendMail(mailOptions);
};

module.exports = sendEmail;
//sendgrid,mailgun
// we will use mailtrap which is safe for development and testing
