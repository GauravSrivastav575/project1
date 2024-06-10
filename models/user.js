const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const passport = require('passport');
const { Schema } = mongoose;

const userSchema = new Schema({
    email: String,
    phone: String,
    isRider: {
        type: Boolean,
        default: false
    }
  });
  userSchema.plugin(passportLocalMongoose);
  module.exports = mongoose.model('User',userSchema);