const User = require('../models/user');
const createResponse = require('../Utils/resMessage');
const { isEmail, isMobilePhone } = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwt_decode = require('jwt-decode');

const passRegex = /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[a-zA-Z!#$@^%&? "])[a-zA-Z0-9!#$@^%&?]{6,16}$/;

const passwordCriteria = JSON.stringify({
  1: 'minimum 6 character',
  2: 'maximum 16 character',
  3: 'atleast one lowercase letter',
  4: 'atleast one uppercase letter',
  5: 'atleast one special character'
});

const addNewUser = async (req, res, next) => {
  try {
    //validate input data
    const { name, email, number, password } = req.body;
    console.log(name, email, number, password);
    if (!name || !email || !number || !password) return createResponse(res, 402, undefined, 'Invalid Input details');

    if (name.length > 30) return createResponse(res, 402, undefined, 'name should be less then 30 char');
    if (!isEmail(email)) return createResponse(res, 400, undefined, 'Invalid email ID');
    if (!isMobilePhone(number, 'en-IN')) return createResponse(res, 402, undefined, 'Invalid phone Number');
    if (!passRegex.test(password))
      return createResponse(
        res,
        401,
        undefined,
        `password criteria does not match, It should follow ${passwordCriteria}`
      );
    //Validate if the user already exists

    if (name && email && number && password) {
      //all inputs OK then create hash password to send data to DB
      const hashedPassword = bcrypt.hashSync(password, 10);
      const userBody = { name, email, phoneNumber: number, password: hashedPassword };
      const newUser = new User(userBody);
      const result = await newUser.save();
      if (result) {
        // console.log(result);
        delete userBody.password;
        userBody.id = result._id;
        return createResponse(res, 200, userBody, 'user added successfully');
      }
    }
  } catch (err) {
    console.log(err);
    createResponse(res, 500, {}, undefined, err.message);
  }
};

const deleteUser = async (req, res, next) => {
  const userId = req.params.id;
  try {
    const result = await User.findOneAndDelete({ _id: userId });
    if (result) createResponse(res, 200, { id: userId, name: result.name }, 'user is deleted successfully');
  } catch (err) {
    createResponse(res, 501, undefined, undefined, err.message);
  }
};

const getUserDetails = async (req, res, next) => {
  const userId = req.params.id;
  try {
    const dbUser = await User.findById({ _id: userId });
    return createResponse(
      res,
      200,
      { id: userId, name: dbUser.name, email: dbUser.email, phoneNumber: dbUser.phoneNumber },
      'User profile fetched successfull'
    );
  } catch (err) {
    return createResponse(res, 500, undefined, undefined, err.message);
  }
};

// changePasswordHandler is one method

const changePasswordHandler = async (req, res, next) => {
  const { currentPassword, newPassword, cNewPassword } = req.body;
  try {
    //validation
    if (!passRegex.test(currentPassword))
      return createResponse(
        res,
        401,
        undefined,
        `password criteria does not match, It should follow ${{ passwordCriteria }}`
      );
    if (newPassword !== cNewPassword) return createResponse(res, 401, undefined, 'new password does not match');
    if (!passRegex.test(newPassword))
      return createResponse(
        res,
        401,
        undefined,
        `password criteria does not match, It should follow ${{ passwordCriteria }}`
      );

    //check current password is correct or not
    const token = req.headers.cookie;
    const decoded = jwt_decode(token);

    const userDB = await User.findById({ _id: decoded.id });
    // console.log('=====', userDB);
    const isCurrentPass = await bcrypt.compareSync(currentPassword, userDB.password);
    // console.log('-----', isCurrentPass);
    if (isCurrentPass) {
      const hashedPass = bcrypt.hashSync(newPassword, 10);
      await User.findOneAndUpdate({ _id: decoded.id }, { password: hashedPass })
        .then(result => {
          return createResponse(res, 200, undefined, 'password is updated successfully');
        })
        .catch(err => createResponse(res, 500, undefined, undefined, err.message));
    } else {
      return createResponse(res, 402, undefined, 'password is not matched with existed user data');
    }
  } catch (err) {
    console.log(err);
    return createResponse(res, 500, undefined, undefined, err);
  }
};

const loginhandler = async (req, res, next) => {
  //user can login using email & get the user details from req body
  //User data validation
  const { email, password } = req.body;

  if (!email || !password) return createResponse(res, 402, undefined, 'Invalid Input details');

  if (!isEmail(email)) return createResponse(res, 400, undefined, 'Invalid email ID');

  if (!passRegex.test(password))
    return createResponse(
      res,
      401,
      undefined,
      `password criteria does not match, It should follow ${{ passwordCriteria }}`
    );

  try {
    //check user data in the DB or Validate if the user exists
    let dbUser;
    if (email) dbUser = await User.findOne({ email });
    else dbUser = await User.findOne({ number });
    // console.log(dbUser);
    if (dbUser) {
      const id = dbUser._id;
      //check password with DB password
      const isMatch = await bcrypt.compareSync(password, dbUser.password);
      if (isMatch) {
        //token will expires in 1 hr
        const token = jwt.sign({ id: dbUser._id, name: dbUser.name }, process.env.SECRET_KEY, { expiresIn: 60 * 60 });

        //send jwt token to client
        res.cookie('accessToken', token, { expires: new Date(Date.now() + 1000 * 60 * 30), httpOnly: true });
        res.setHeader('x-auth-token', token);
        return createResponse(res, 200, { accessToken: token }, 'login is successful');
      } else {
        return createResponse(res, 402, undefined, 'password does not match. please enter correct password');
      }
    } else return createResponse(res, 402, undefined, 'User is not existed, try another detials');
  } catch (err) {
    console.log(err);
    createResponse(res, 500, {}, undefined, err.message);
  }
};

module.exports = { addNewUser, deleteUser, loginhandler, getUserDetails, changePasswordHandler };
