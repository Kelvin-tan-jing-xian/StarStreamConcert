import { Router }       from 'express';
import { flashMessage } from '../utils/flashmsg.mjs';
import { ModelFeedback }    from '../data/feedback.mjs';

const router = Router();
export default router;



router.get("/addFeedback",     addFeedback_page);
router.post("/addFeedback" , addFeedback_process);
router.get("/listFeedback", listFeedback_page);
router.get("/updateFeedback/:uuid", updateFeedback_page);
router.post('/updateFeedback/:uuid', updateFeedback_process);
router.delete('/deleteFeedback/:uuid', deleteFeedback_process);

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

/**
 * Renders the addFeedback page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function addFeedback_page(req, res) {
	console.log("feedback page accessed");
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];
	console.log("cust: " + cust);
	console.log("perf: " + perf);
	console.log("admin: " + admin);

	return res.render('feedback/addFeedback', {
		cust: cust,
		perf: perf,
		admin: admin
	});
}


/**
 * Process the addFeedback form body
 * @param {import('express').Request}  req Express Request handle
 * @param {import('express').Response} res Express Response handle
 */
 async function addFeedback_process(req, res) {
	console.log("feedbackPage contents received");
	console.log(req.body);

    // Add in form validations
    //
	//	Create new feedback, now that all the test above passed
	try {
		console.log('Im inside the try block!');
	
		const feedback = await ModelFeedback.create({
			"name": req.body.name,
      		"Rating":     req.body.Rating,
          	"feedbackType":    req.body.feedbackType,
        	"feedbackResponse":  req.body.feedbackResponse	
			
		});

		flashMessage(res, 'success', 'Successfully created a feedback', 'fas fa-sign-in-alt', true);
		return res.redirect("/feedback/listFeedback"); // don't use render
		}
		catch (error) {
		//	Else internal server error
		console.error(`Failed to create a new feedback: ${req.body.Rating} `);
		console.error(error);
		return res.status(500).end();
	}
}

/**
 * Renders the listFeedback page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function listFeedback_page(req, res) {
	console.log("listFeedback page accessed");
	try{
		const total = await ModelFeedback.count();
		const pageIdx   = req.query.page    ? parseInt(req.query.page,  10) : 1;
		const pageSize  = req.query.pageSize? parseInt(req.query.pageSize, 10) : 10;
		const pageTotal = Math.floor(total / pageSize);

		const feedbacks = await ModelFeedback.findAll({
			offset: (pageIdx - 1) * pageSize,
			limit : pageSize,
			order : [
				['Rating', 'ASC']
			],
			raw: true
		});		
		// venues[0].update()	//	This will crash... if raw is enabled
		return res.render('feedback/listFeedback', {
			"feedbacks"   : feedbacks,
			"pageTotal": pageTotal,
			"pageIdx"  : pageIdx,
			"pageSize" : pageSize
		});

	}
	catch(error){
		console.error("Failed to retrieve list of feedbacks");
		console.error(error);
		return res.status(500).end();

	}
}

/**
 * Renders the feedback update page, Basically the same page as addFeedback with
 * prefills and cancellation.
 * @param {Request}  req Express request  object
 * @param {Response} res Express response object
 */
 async function updateFeedback_page(req, res) {
	try {
		const content = await ModelFeedback.findOne({where: { "uuid": req.params["uuid"] }});
		if (content) {
			// render to updateVenue.handlebars
			return res.render('feedback/updateFeedback', {
				"mode"   : "update",
				"content": content
			});
		}
		else {
			console.error(`Failed to retrieve feedback ${req.params["uuid"]}`);
			console.error(error);
			return res.status(410).end();
		}
	}
	catch (error) {
		console.error(`Failed to retrieve feedback ${req.params["uuid"]}`);
		console.error(error);
		return res.status(500).end();	//	Internal server error	# Usually should not even happen !!
	}
}

/**
 * Handles the update process.
 * @param {Request}  req Express request object
 * @param {Response} res Express response object
 */
async function updateFeedback_process(req, res) {

	try {
		//	Please verify your contents
		if (!req.body["Rating"])
			throw Error("Missing Rating");
	}
	catch(error) {
		console.error(`Malformed request to update feedback ${req.params["uuid"]}`);
		console.error(req.body);
		console.error(error);
		return res.status(400).end();
	}

	try {
		const contents = await ModelFeedback.findAll({where: { "uuid": req.params["uuid"] } });



		switch (contents.length) {
			case 0      : return res.redirect(410, "/feedback/listFeedback")
			case 1      : break;
			     default: return res.status(409, "/feedback/listFeedback")
		}
		
		/** @type {string} */
		req.body["responseType"] = Array.isArray(req.body["responseType"])? req.body["responseType"].join(',') : req.body["responseType"];
		
		
		const data          = {
			"Rating"         : req.body.Rating,
			"feedbackResponse"         : req.body.feedbackResponse,
			"feedbackType"      : req.body.feedbackType,
			// "reply": req.body.reply

		};
		await (await contents[0].update(data)).save();

	
		
		flashMessage(res, 'success', "Feedback updated", 'fas fa-sign-in-alt', true);
		return res.redirect(`/feedback/updateFeedback/${req.params.uuid}`);
	}
	catch(error) {
		console.error(`Failed to update feedback ${req.params.uuid}`);
		console.error(error);

		
		flashMessage(res, "error", "The server met an unexpected error", 'fas fa-sign-in-alt', true);

		return res.redirect(500, "/feedback/listFeedback")
	}	
}

/**
 * Handles the deletion of venue.
 * @param {Request}  req Express request  object
 * @param {Response} res Express response object
 */
 async function deleteFeedback_process(req, res) {

	const regex_uuidv4 = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i

	if (!regex_uuidv4.test(req.params.uuid))
		return res.status(400);
	
	//	Perform additional checks such as whether it belongs to the current user
	/** @type {ModelUser} */
	// const user = req.user;

	try {
		const targets = await ModelFeedback.findAll({where: { "uuid": req.params.uuid }});

		switch(targets.length) {
			case 0      : return res.status(409);
			case 1      : console.log("Found 1 eligible feedback to be deleted"); break;
			     default: return res.status(409);
		}
		
		const affected = await ModelFeedback.destroy({where: { "uuid": req.params.uuid}});

		if (affected == 1) {
			//	Delete all files associated
			// targets.forEach((target) => { 
			// 	remove_file(target.venuePoster);
			// });

			console.log(`Deleted feedback: ${req.params.uuid}`);
			return res.redirect("/feedback/listFeedback");
		}
		//	There should only be one, so this else should never occur anyway
		else {
			console.error(`More than one entries affected by: ${req.params.uuid}, Total: ${affected}`);
			return res.status(409);
		}
	}
	catch (error) {
		console.error(`Failed to delete feedback: ${req.params.uuid}`);
		console.error(error);
		return res.status(500);
	}
}