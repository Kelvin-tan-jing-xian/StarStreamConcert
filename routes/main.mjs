import { Router }       from 'express';
import { flashMessage } from '../utils/flashmsg.mjs';


const router = Router();
export default router;

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
import RouterTicket from './ticket.mjs';
import RouterComments from './comments.mjs';
import RouterPayment from './payment.mjs';
router.use("/auth",  RouterAuth);
router.use("/admin", RouterAdmin);
router.use("/venue", RouterVenue);
router.use("/ticket", RouterTicket);
router.use("", RouterComments);
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
		return res.redirect('adminHomePage');
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
		admin: admin
	});
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

router.get('/adminHomePage', async function(req,res){
	console.log ("adminHomePage accessed");
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];
	console.log(cust);
	console.log(perf);
	console.log(admin);

	// render adminHomePage.handlebars
	return res.render('adminHomePage',{
		cust: cust,
		perf: perf,
		admin: admin

	});
});


