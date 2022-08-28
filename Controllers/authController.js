const User = require('../models/user');
const { isEmail } = require('validator');
const createResponse = require('../Utils/resMessage');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const passRegex = /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[a-zA-Z!#$@^%&? "])[a-zA-Z0-9!#$@^%&?]{6,16}$/;

//When user click forgot Password link, page redirected and user has to send email to send password reset link
const passwordRecovery = async (req, res, next) => {
  const email = req.body.email;
  if (!email || !isEmail(email))
    return createResponse(res, 402, undefined, 'your email is not valid, please check the email address');
  try {
    //check user is existed or not
    const dbUser = await User.findOne({ email });
    if (!dbUser)
      return createResponse(
        res,
        500,
        undefined,
        `your email address ${email} is not associated with any account, please check and try again`
      );
    //create passwordResetToken and send to user data

    const pwResetToken = await bcrypt.hash(email + dbUser.name + process.env.SECRET_KEY, 8);

    const tokenExpiry = new Date(Date.now() + 1000 * 60 * 60); //1Hr expiry
    // console.log(tokenExpiry);
    const addedtoken = new User({ ...dbUser, passwordResetToken: pwResetToken, resetTokenExpiry: tokenExpiry });
    const result = await User.findOneAndUpdate(
      { email },
      { passwordResetToken: pwResetToken, resetTokenExpiry: tokenExpiry }
    );
    if (!result) return createResponse(res, 402, undefined, 'password token not generated');

    //generate a mail link and send to the respective user
    const mailLink = `${req.protocol}://${req.headers.host}/api/user/auth/password_reset/${pwResetToken}`;
    let mailMessage = {
      from: 'venkatesh venkatesh@gmail.com',
      to: `${email}`,
      subject: 'Password Reset recover Email',
      text: `Hi ${dbUser.name} \n
          Please click on the following link to reset your password`,
      html: `<a href="#">${mailLink}</a>
        <p>\n\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n</p>`
    };

    //created account in mailtrap.io and checking the mail response for development purpose
    const mailTransporter = nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: '31db5a250da935',
        pass: '56a967434a2ffc'
      }
    });

    mailTransporter.sendMail(mailMessage, (err, info) => {
      if (err) {
        console.log(err);
        return createResponse(res, 500, undefined, undefined, err);
      } else {
        return createResponse(res, 200, { mail_id: info.messageId }, 'Mail has to sent successfull');
      }
    });
  } catch (err) {
    console.log(err);
    return createResponse(res, 500, undefined, undefined, err);
  }
};

const passwordReset = async (req, res, next) => {
  const resetToken = req.params.token;
  const dbRes = await User.findOne({ passwordResetToken: resetToken, resetTokenExpiry: { $gt: Date.now() } });
  console.log(dbRes);
  if (!dbRes) return res.render('error.pug', { errorMsg: 'Your Password Reset token is expired!' });
  else return res.render('resetForm.pug');
};

const changePwdHandler = async (req, res, next) => {
  const { newPwd, cnewPwd } = req.body;
  try {
    if (newPwd === cnewPwd && passRegex.test(newPwd)) {
      let hashedNewPwd = bcrypt.hashSync(newPwd, 10);

      const dbRes = await User.findOneAndUpdate(
        { passwordResetToken: req.params.token, resetTokenExpiry: { $gt: Date.now() } },
        {
          password: hashedNewPwd,
          passwordResetToken: null,
          resetTokenExpiry: null
        }
      );
      console.log('-------', dbRes);
      if (!dbRes) res.render('error.pug', { errorMsg: 'Either password is misMatch or password resetToken expired' });
      return res.render('resetSuccess.pug');
    }
  } catch (err) {
    console.log(err);
    return res.render('error.pug', { errorMsg: `Unable to reset your password due to this error stack: \n\n ${err}` });
  }
};

module.exports = { passwordRecovery, passwordReset, changePwdHandler };
