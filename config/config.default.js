// default config, overridden by config.production.js
module.exports = {
  port: 3000,
  trustCloudflare: false,
  from: '"Fred Foo 👻" <foo@example.com>',
  to: '"Fred Foo 👻" <foo@example.com>',
  subject: 'New Form Submission',
  smtpSettings: {
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'USERNAME',
      pass: 'PASSWORD',
    },
  },
  fields: {
    name: {
      required: true,
      maxLength: 128,
    },
    replyTo: {
      required: true,
      maxLength: 320,
    },
    message: {
      required: true,
      maxLength: 1000,
    },
  },
};
