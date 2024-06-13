

const User = require('../models/user');
const RideRequest = require('../models/rideRequest');
// const  rider = require('../app');
const users = require('../app')
module.exports.renderRegisterForm = (req,res)=>{
    res.render('users/userRegister')
}

module.exports.registerUser = async(req,res)=>{
    try{
    const { email,username,password,phone,registerAsRider } = req.body;
    // console.log(registerAsRider);
    const user = new User({email,username,phone});
    if (registerAsRider) {
        user.isRider = true;
    }
    const registeredUser = await User.register(user,password);
    req.login(registeredUser, err =>{
        if(err) return next(err);
        req.flash('success','Welcome to Rojgar-Sarthi');
        res.cookie('currentUser',registeredUser._id);
        // console.log(registeredUser._id);
        res.redirect('/');
    })
    }catch(e){
        req.flash('error',e.message);
        res.redirect('/userRegister');
    }
}

module.exports.renderLoginForm = (req,res)=>{
    res.render('users/userLogin');
}

module.exports.loginUser = async(req,res)=>{
    const {username} = req.body;
    const user = await User.findOne({username});
    req.flash('success','Welcome Back');
    const redirectUrl = res.locals.returnTo || '/';
    res.cookie('currentUser',user._id);
    res.redirect(redirectUrl);
}

module.exports.logoutUser = (req,res,next)=>{
    req.logout(function (err){
        if(err) return next(err);
        req.flash('success','Good bye :(');
        res.clearCookie('currentUser');
        res.redirect('/');
    });
}

module.exports.renderofferRide = (req,res)=>{
    const {currentUser} = req.cookies;
    res.render('users/offerRide',{currentUser});
    // console.log(currentUser);
}
// module.exports.renderrequestRide = (req,res)=>{
//     const {currentUser} = req.cookies;
//     res.render('users/requestRide',{currentUser});
// }

module.exports.offerRide = async (req, res) => {
    // console.log(req.body);
    // const { startLat,startLng,endLat, endLng } = req.body;
    // // // Handle storing the ride details as needed
    // // // For example, you might save it to a database
    // console.log(`Starting location: {Longitude: ${startLng}, Latitude: ${startLat}}, Ending location: {Longitude: ${endLng}, Latitude: ${endLat}}`);
    req.flash('success', 'Ride offered successfully!');
    // res.json({
    //     message: "message"
    // });
    res.status(204).end();
    // res.redirect('/offerRide');
};

module.exports.requestRide = async (req, res) => {
    // console.log("User: ", rider);
    // console.log("HIIII");
    console.log(users);
    res.status(204).end();
    // res.send(req.body);
};