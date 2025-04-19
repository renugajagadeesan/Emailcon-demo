import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 465,
        secure: true, // Use SSL/TLS
        auth: {
          user:"certification@imageconindia.com",
          pass:"Star@certificate01",
        },
        tls: {
          // Do not fail on invalid certificates
          rejectUnauthorized: false,
        },
});

const mailOptions = {
  from: '"AliasName megarajan55@gmail.com via" <certification@imageconindia.com>',  // Alias name via authenticated email
  to: 'renugajagadeesan@gmail.com',
  subject: 'Test Email with Alias',
  text: 'This email is sent using an alias name.'
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});
