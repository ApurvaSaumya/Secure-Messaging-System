var mongoose = require("mongoose");
var passportlocalmongoose = require("passport-local-mongoose");
var uniqueValidator = require('mongoose-unique-validator');


var UserSchema = new mongoose.Schema({

	email:{type:String, unique: true},
	password:String,
	verified:{type:String,default:'False'},

});

UserSchema.plugin(uniqueValidator);

//UserSchema.plugin(passportlocalmongoose);

module.exports = mongoose.model("User",UserSchema);