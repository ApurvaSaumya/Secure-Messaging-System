var express = require("express");

var path = require("path");

var multer = require("multer");

var app = express();

var bodyParser = require("body-parser");

var request = require("request");

var CryptoJS = require('crypto-js');

var bcrypt = require('bcrypt');

var nodemailer = require("nodemailer");

var mongoose = require("mongoose");

var uniqueValidator = require('mongoose-unique-validator');

mongoose.connect("mongodb://localhost/secure");

var User = require("./models/user");

const fs = require('fs');

const steggy = require('steggy-noencrypt');

// var jimp = require('jimp');

var passport = require("passport");

var localStrategy = require("passport-local");

app.set("view engine","ejs");

app.use( express.static( "outputs" ) );

app.use(bodyParser.urlencoded({extended:true}));

app.use(require("express-session")({
	secret:"Tijw Hvsv jt uif cftu",
	resave:false,
	saveUninitialized:false
}));

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'official.alternate786@gmail.com',
    pass: 'leo@october'
  }
});
	
var storage = multer.diskStorage({ 
	destination: function (req, file, cb) { 

		cb(null, "uploads") 
	}, 
	filename: function (req, file, cb) { 
	cb(null, file.fieldname+ "abc" + ".png") 
	}
});

var storage1 = multer.diskStorage({ 
	destination: function (req, file, cb) { 

		cb(null, "outputs") 
	}, 
	filename: function (req, file, cb) { 
	cb(null, file.fieldname+ "abc" + ".png") 
	}
});

var fname = "mypic";

const maxSize = 1 * 1000 * 10000; 
	
var upload = multer({ 
	storage: storage, 
	limits: { fileSize: maxSize }, 
	fileFilter: function (req, file, cb){ 

		var filetypes = /jpeg|jpg|png/; 
		var mimetype = filetypes.test(file.mimetype); 
		var extname = filetypes.test(path.extname( 
					file.originalname).toLowerCase()); 
		
		if (mimetype && extname) { 
			return cb(null, true); 
		} 
		cb("Error: File upload only supports the "
				+ "following filetypes - " + filetypes); 
	} 

}).single(fname);


app.get("/",function(req,res){ 
	res.render("landing"); 
}); 

//==============
//embedd
//==============

app.get("/embedd", function(req,res)
{
	res.render("index");
});


var msg;

app.post("/send",function (req, res, next) { 
		
	upload(req,res,function(err) { 

		if(err) { 
			res.send(err) 
		} 
		else { 
			msg = req.body.msg;

			//========================
			// Encryption 
			//========================

			var hash = ""; 
			var txt = req.body.msg;
  			const passphrase = '12345678';
  			hash = CryptoJS.AES.encrypt(txt, passphrase).toString();
  			
  			var pathfile = './uploads/'+fname+'abc.png';
  			const original = fs.readFileSync(pathfile);
			const message = hash;
 
			const concealed = steggy.conceal(original, message /*, encoding */);
			fs.writeFileSync('./outputs/output.png', concealed);

			console.log("File Name: "+fname+"abc");
			console.log("Message to send: "+msg);
			console.log("Encrypted Message:  "+hash); 

			const image = fs.readFileSync('./outputs/output.png');
			const revealed = steggy.reveal(image /*, encoding */);
			var enc = revealed.toString();

			//const passphrase = '12345678';
  			const bytes = CryptoJS.AES.decrypt(enc, passphrase);
 			const originalText = bytes.toString(CryptoJS.enc.Utf8);

 			console.log("Decrypted Text "+ originalText);

 			res.render("success",{enc:hash,original:originalText});

		} 
	}); 
});



//=====================
//steganalyze
//=====================

app.post("/stegano", function(req,res)
{
	upload(req,res,function(err) { 

		if(err) { 
			res.send(err) 
		} 
		else { 
			//========================
			// Decryption 
			//========================

			//var hash = ""; 
			//var txt = req.body.msg;
  			const passphrase = '12345678';
  			//hash = CryptoJS.AES.encrypt(txt, passphrase).toString();
  			
  			var pathfile = './uploads/'+fname+'abc.png';
  			const image = fs.readFileSync(pathfile);
			const message = "";

			const revealed = steggy.reveal(image /*, encoding */);
			var enc = revealed.toString();


			//const passphrase = '12345678';
  			const bytes = CryptoJS.AES.decrypt(enc, passphrase);
 			const originalText = bytes.toString(CryptoJS.enc.Utf8);

 			console.log("Decrypted Text "+ originalText);

 			res.render("anasuccess",{enc:enc,original:originalText});

		} 
	}); 
});

//=====================
//Signup
//=====================


var uid="";
app.get("/signup",function (req,res) {
	
	res.render("signup.ejs");
});

app.post("/signup",function (req,res) {
	var pass = req.body.password;

	bcrypt.hash(pass, 10, function(err, hash) {

	User.create({email:req.body.email,password:hash},function(err,user)
	{
		if(err)
		{
			console.log(err);
			res.redirect("/signup");
		}
		else
		{

			uid = user._id;
			//+++++++++++++++++++++++
			//Email Verification link
			//+++++++++++++++++++++++

			var link = "http://localhost:3000/verifyUserEmail/"+uid;


			var mailOptions = {
  					from: 'official.alternate786@gmail.com',
  					to: user.email,
  					subject: 'EMAIL VERIFICATION',
  					html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"
					};

					transporter.sendMail(mailOptions, function(error, info){
  					if (error) {
    					console.log(error);
  					}
  					else {
    					console.log('Email sent: ' + info.response);
  					}
					});

			res.redirect("/userpage");
		}

	});

	});
});


//===============
//LOGIN
//===============


app.get("/login",function (req,res) {
	res.render("login.ejs");
});

app.post("/login", function(req,res)
{
	User.findOne({email:req.body.email},function(err,user)
	{
		if(err)
		{
			console.log(err);
			res.redirect("/login");
		}
		else
		{
			var pass = req.body.password;
			bcrypt.compare(pass, user.password, function(errr, rese) { 
  				if(rese) {
  					uid = user._id;
   					res.redirect("/userpage");
  				} else {
  					console.log("error");
   					res.redirect("/login");
  			} 
		});
	}
	});
});



//=====================
//Verify Email
//=====================

app.get("/verifyUserEmail/:id",function(req,res)
{

 	User.findOneAndUpdate({_id:req.params.id},{$set:{verified:"True"}},function(er,usr)
 	{
 		if(er)
 		{
 			console.log(er);
 		}
 		else
 		{
 			res.redirect("/userpage");
 		}
 	});
});


//=============
//userpage
//=============

app.get("/userpage",isLoggedIn,function(req,res)
{
	User.findOne({_id:uid},function(err,user)
	{
		if(err)
		{
			console.log(err);
			res.redirect("/login");
		}
		else
		{
		console.log(user);
		res.render("userpage.ejs",{user:user});
		}
	});
	
});

//=============
//analyze
//=============

app.get("/analyze", function(req,res)
{
	res.render("analyze");
});


//==================
//Send mail
//==================

app.post("/mail", function(req,res)
{
	var mailOptions = {
  					from: 'official.alternate786@gmail.com',
  					to: req.body.email,
  					subject: 'Confidential !!',
  					text: 'The attached image has important data embedded. Handle with Care.',
  					attachments: [{
     					filename: 'output.png',
     					path: __dirname +'/outputs/output.png',
     					cid: 'imgsent' 
					}]
					};

					transporter.sendMail(mailOptions, function(error, info){
  					if (error) {
    					console.log(error);
  					}
  					else {
    					console.log('Email sent: ' + info.response);
    					res.render("scmail");
  					}
					});
});

//============
//isloggedin
//============

function isLoggedIn(req,res,next) {
	if(uid!="")
	{
		//console.log(uid);
		return next();
	}
	res.redirect("/login");
}


//========
//logout
//========

app.get("/logout",function (req,res) {
	uid="";
	res.redirect("/");
});


//==========
//Port
//==========

var port = 3000||process.env.PORT;
app.listen(port,function(){
	console.log("Listening at 3000");
});
