const mongoose = require('mongoose');
const {isEmail} = require('validator');
const Schema = mongoose.Schema
const bcrypt = require('bcrypt')

///name,code,userName

///schemas
const userSchema = new Schema({
    email:{
        type:String
        ,required:[true, 'Please enter an email']
        ,lowercase:true
        ,unique: true
        ,trim: true
        ,validate:[isEmail,'please enter a valid email']
    }
    ,password:{
        type:String,
        required:[true, 'Please enter a password']
        ,minlength:[6,'Minimum requirement is 6']
    }
    ,username:{
        type: String,
        required: [true, 'Please enter your username'],
        unique: true,
        lowercase: true,
        trim: true,
    }

})



userSchema.pre('save', async function (next) {
    const user = this;
    console.log("working")
  
    // Only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();
  
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (err) {
      next(err);
    }
  });

  userSchema.statics.login = async function (email, password) {
    const user = await this.findOne({ email });
    if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
    return user;
    }
    throw Error('incorrect password');
    }
    throw Error('incorrect email');
  }

 const User = mongoose.model('User', userSchema);
  
module.exports = User