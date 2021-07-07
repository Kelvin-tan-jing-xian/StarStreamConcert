import { Router }       from 'express';
import { flashMessage } from '../utils/flashmsg.mjs';
import Hash             from 'hash.js';
import { UploadFile } from '../utils/multer.mjs';
import {Path} from '../utils/multer.mjs';

const router = Router();
export default router;
router.use(ensure_auth);
/**
 * Ensure logged in user
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
async function ensure_auth(req, res, next) {
	if (req.isAuthenticated() || req.path === "/index" || req.path === "/" || req.path === "/auth/login" || req.path === "/auth/register") {
		return next();
	}
	else {
		flashMessage(res, 'danger', 'Warning!!! Please Login to access the page', 'fa fa-exclamation-triangle', true);

		return res.redirect("/auth/login");
	}
}

// ---------------- 
//	Serves dynamic files from the dynamic folder
router.get("/dynamic/:path/:file*", async function (req, res) {	
	console.log(req.params);
	console.log(process.cwd());	 // current working directory


	return res.sendFile(`${process.cwd()}/dynamic/${req.params.path}/${req.params.file}`);
});

// ---------------- 
//	TODO: Attach additional routers here
import RouterAuth  from './auth.mjs';
import RouterAdmin from './admin/admin.mjs';
import RouterVenue from './venue.mjs';
import RouterStream from './stream.mjs';
import RouterFeedback from './feedback.mjs';
import RouterComments from './comments.mjs';
import RouterPayment from './payment.mjs';
import { ModelUser } from '../data/User.mjs';
router.use("/auth",  RouterAuth);
router.use("/admin", RouterAdmin);
router.use("/venue", RouterVenue);
router.use("/stream", RouterStream);
router.use("/feedback", RouterFeedback);
router.use("/comments", RouterComments);
router.use("/payment", RouterPayment);
router.get("/", async function (req, res) {
	return res.redirect("/index");
});

// Root Home page
router.get("/index", async function(req, res) {
	console.log("index page accessed");
	console.log(role);
	if (role != undefined){
		var role = roleResult(req.user.role);

		var cust = role[0];
		var perf = role[1];
		var admin = role[2];
		console.log("cust: " + cust);
		console.log("perf: " + perf);
		console.log("admin: " + admin);

		return res.render('index', {
			perf: perf,
			cust: cust,
			admin: admin
		});
	}
	else{
		// logout, just render index.handlebars
		return res.render('index');
	}
});
// ---------------- 
//	TODO:	Common URL paths here
router.get("/home",      async function(req, res) {
	console.log("Home page accessed after logging in");
	// After login
	// if role column of ModelUser is customer
	console.log(req.user.role);
	// cannot have document bla
	// accessing the role column of the users table
	if (req.user.role == 'customer') {
		return res.redirect('customerHomePage');
	}
	else if (req.user.role == 'performer') {
		return res.redirect('performerHomePage');
	}
	else{
		return res.redirect('/admin/homePage');
	}
});
// This function helps in showing different nav bars
function roleResult(role){
	if (role == 'performer') { // if user is performer, it cannot be customer
		var perf = true;
		var cust = false;
		var admin = false;
	}
	else if (role == 'customer'){
		// if user is performer, it cannot be customer
		var cust = true;
		var perf = false;
		var admin = false;
	}
	else{
		var cust = false;		
		var perf = false;
		var admin = true;

	}

	return [cust, perf, admin];
}


router.get('/profile', async function(req,res){
	console.log ("profile page accessed");
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];
	console.log(cust);
	console.log(perf);
	console.log(admin);
	return res.render('profile',{
		cust: cust,
		perf: perf,
		admin: admin,
	});
});





router.post('/profile', UploadFile.single('profile_pic'), async function(req,res){

	const contents = await ModelUser.findOne({
		where: { uuid: req.user.uuid },
	});
	//	Whether this update request need to swap files?
	const replaceFile = (req.file)? true : false;

	const previous_file = contents.profile_pic;

	const data = {
		profile_pic: req.file.path,
	};
	//	Assign new file if necessary
	if (replaceFile) {
			data["profile_pic"] = `${Path}/file/${req.file.filename}`;
		}
	else if (req.body.profile_pic) {
		data["profile_pic"] = req.body.profile_pic;
	}

	await (await contents.update(data)).save();

	return res.redirect("/profile");
});

router.delete('/profile/:uuid', async function (req, res) {
	const regex_uuidv4 = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
	if (!regex_uuidv4.test(req.params.uuid))
		return res.status(400);
	try{
		const del = await ModelUser.destroy({
			where: { uuid: req.params["uuid"] },
		});
		if (del == 1) {    
			console.log(`Account deleted`);
			req.logout();
			return res.redirect("/index");
		}
	}
	catch (error) {
		console.error(`Failed to delete account: ${req.params.uuid}`);
		console.error(error);
		return res.status(500);
	}
});

router.get('/profile/change-password', async function (req, res) {
	console.log("Change password page accessed");
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];

	return res.render('change_password', {
		cust: cust,
		perf: perf,
		admin: admin,
	});
});

router.post('/profile/change-password', async function(req,res){
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];

	const regexPwd   = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
	let errors = [];
	const currentPassword = Hash.sha256().update(req.body.current_password).digest("hex");
	try {
		if (req.user.password != currentPassword) {
			errors = errors.concat({ text: "Current Password do not match!" });
			return res.render('change_password', { 
				errors: errors,
				cust: cust,
				perf: perf,
				admin: admin,
			});
		}
		else if (!regexPwd.test(req.body.new_password)) {
			errors = errors.concat({ text: "Password Requires Minimum 8 characters, at least 1 Uppercase letter, 1 Lower Case Letter , 1 Number and 1 Special Character" });
			return res.render('change_password', {
				errors: errors,
				cust: cust,
				perf: perf,
				admin: admin,
			});
		}
		else if (req.body.new_password !== req.body.confirm_password) {
			errors = errors.concat({ text: "Password do not match!" });
			return res.render('change_password', {
				errors: errors,
				cust: cust,
				perf: perf,
				admin: admin,
			});
		}
		const update_password = await ModelUser.update({
			password: Hash.sha256().update(req.body.new_password).digest("hex")},{
			where: {
				uuid: req.user.uuid
			  }
		});
		return res.redirect("/profile");
	}
	catch (error) {
		console.log("Error in changing password page")
	}
});

router.get('/customerHomePage', async function(req,res){
	console.log ("customerHomePage accessed");
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];
	console.log(cust);
	console.log(perf);
	console.log(admin);

	return res.render('customerHomePage',{
		// pass these values to navbar.handlebars
		cust: cust,
		perf: perf,
		admin: admin
	});
});

router.get('/performerHomePage', async function(req,res){
	console.log ("performerHomePage accessed");
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];
	console.log(cust);
	console.log(perf);
	console.log(admin);

	return res.render('performerHomePage',{
		cust: cust,
		perf: perf,
		admin: admin
	});
});


// Error Route
router.use(function (req, res) {
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];
	return res.status(404).render("error_404",{
		cust: cust,
		perf: perf,
		admin: admin
	});
});


