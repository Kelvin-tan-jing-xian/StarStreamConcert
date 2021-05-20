import { Router }       from 'express';
import { flashMessage } from '../utils/flashmsg.mjs';
import { ModelComments }    from '../data/Comments.mjs';

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

// Comments Section
router.get("/streamPage", async function(req, res) {
	console.log("streamPage page accessed");
	return res.render('streamPage', {
		comments: ['Heelo']
	});
});

// Create
router.post('/streamPage', async function (req, res) {
	console.log("Input form submitted");
	try {
		const comments = await ModelComments.create({
            "name":     "TestUser",
            "comments":    req.body.comments,
		});

		flashMessage(res, 'success', 'Successfully created a comments', true);
		return res.redirect("/streamPage");
	}
	catch (error) {
		//	Else internal server error
		console.error(`Failed to create a new comment: ${req.body.comments} `);
		console.error(error);
		return res.status(500).end();
	}

});


router.get('/profile', async function(req,res){
	console.log ("profile page accessed");
	return res.render('profile',{
	});
});


	
	


