import { Router }       from 'express';
import { flashMessage } from '../utils/flashmsg.mjs'

const router = Router();
export default router;

// ---------------- 
//	Serves dynamic files from the dynamic folder
router.get("/dynamic/:path", async function (req, res) {	
	return res.sendFile(`./dynamic/${req.params.path}`)
});

// ---------------- 
//	TODO: Attach additional routers here
import RouterAuth  from './auth.mjs';
import RouterAdmin from './admin/admin.mjs';
import RouterVenue from './venue.mjs';
router.use("/auth",  RouterAuth);
router.use("/admin", RouterAdmin);
router.use("/venue", RouterVenue);

router.get("/", async function (req, res) {
	return res.redirect("/home");
});
// ---------------- 
//	TODO:	Common URL paths here
router.get("/home",      async function(req, res) {
	console.log("Home page accessed");
	return res.render('index', {
		title: "Hello  Not Today"
	});
});

router.get("/about", async function(req, res) {
	console.log("About page accessed");
	flashMessage(res, 'success', 'This is an important message', 'fas fa-sign-in-alt',        true);
	flashMessage(res, 'danger',  'Unauthorised access',          'fas fa-exclamation-circle', false);

	return res.render('about', {
		author: "The awesome programmer",
		values: [1, 2, 3, 4, 5, 6],
		success_msg: "Yayayaya",
		errors: [
			{ text: "Error 1" },
			{ text: "Error 2" },
			{ text: "Error 3" },
			{ text: "Error 4" },
			{ text: "Error 5" },
			{ text: "Error 6" }
		]
	});
});

router.get('/streamPage', page_streamPage);
function page_streamPage(req, res) {
	res.render('streamPage');
}

// Post Comments
router.post('/streamPage', (req, res) => {
	console.log("Input form submitted");
	var comments = [];
	comments.push(req.body.comment);
	res.render('streamPage', {
		comments: comments
	}) // renders ./streamPage.handlebars
});