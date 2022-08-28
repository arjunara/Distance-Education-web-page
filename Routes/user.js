const { Router } = require('express');

const router = Router();
const {
  addNewUser,
  deleteUser,
  loginhandler,
  getUserDetails,
  changePasswordHandler
} = require('../Controllers/userController');

const { passwordReset, passwordRecovery, changePwdHandler } = require('../Controllers/authController');

//POST create new User
router.post('/register', addNewUser);

//DELETE delete existed user
router.delete('/:id', deleteUser);

//POST login the user
router.post('/login', loginhandler);

//GET user Profile
router.get('/:id', getUserDetails);

//Change Password in simple way
router.patch('/password_change', changePasswordHandler);

//change password with Email notification (for Forgot Password feature)
router.post('/forgot_password/auth/recover', passwordRecovery);
router.get('/auth/password_reset/:token', passwordReset);
router.post('/auth/password_reset/:token', changePwdHandler);

module.exports = router;
