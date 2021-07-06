import { Router }       from 'express';
import { flashMessage } from '../utils/flashmsg.mjs';

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

router.post("/profile", async function(req,res){
	try {
		console.log("Input name and email received");
		const user = await ModelUser.findOne({
			where:{"uuid": req.user.uuid }
		})
		const data={
			name: req.body.name,
			email: req.body.email,	
		};
		await (await user.update(data)).save();
		flashMessage(res, 'success', "Successfully Updated User!", 'fas fa-sign-in-alt', true);
		return res.redirect(`/profile`);
	} catch (error) {
		console.error(`Failed to update user ${req.user.name}`);
		console.error(error);		
		flashMessage(res, "danger", "The server met an unexpected error", 'fas fa-sign-in-alt', true);

		return res.redirect(500, "/profile")

	}

});

router.delete("/profile/:uuid", async function(req,res){
	const regex_uuidv4 = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
	// if uuid doesnt match with uuidv4, give error
	if (!regex_uuidv4.test(req.params.uuid)) return res.status(400);
	try {
		const targets = await ModelUser.findAll({
			// can be "uuid" too
		where: { uuid: req.params.uuid },
		});

		switch (targets.length) {
		case 0:
			return res.status(409);
		case 1:
			console.log("Found 1 eligible user to be deleted");
			break;
		default:
			return res.status(409);
		}
		const affected = await ModelUser.destroy({
		where: { uuid: req.params.uuid },
		});

		if (affected == 1) {

		console.log(`Deleted user: ${req.user.name}`);
		return res.redirect("/index");
		}
	} catch (error) {
		console.error(`Failed to delete user: ${req.user.name}`);
		console.error(error);
		return res.status(500);
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


