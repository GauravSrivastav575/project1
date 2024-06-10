const express = require('express');
const router = express.Router({mergeParams:true});
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const passport = require('passport');
const { storeReturnTo,isLoggedIn } = require('../middleware');
const users = require('../controllers/users')


router.route('/userRegister')
      .get(users.renderRegisterForm)
      .post(catchAsync(users.registerUser))

router.route('/userLogin')
      .get(users.renderLoginForm)
      .post(storeReturnTo, passport.authenticate('local',{failureFlash: true, failureRedirect: '/userLogin'}),catchAsync(users.loginUser))

router.get('/logout',users.logoutUser);

router.route('/offerRide')
      .get(isLoggedIn, users.renderofferRide)
      .post(isLoggedIn, catchAsync(users.offerRide))

router.route('/requestRide')
      .get(isLoggedIn, users.renderrequestRide)
      .post(isLoggedIn,catchAsync(users.requestRide))
module.exports = router;

