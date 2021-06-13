import { Router }       from 'express';
import { flashMessage } from '../utils/flashmsg.mjs';
// must be caps
import { ModelVenue }    from '../data/Venue.mjs';
// must be caps
import { UserRole, ModelUser } from '../data/User.mjs';
import { UploadFile } from '../utils/multer.mjs';

const router = Router();
export default router;


router.use("/",                authorizer);	//..Applies to every route in this router
// all routes starts with /venue
// these CRUD only for admin
router.get("/create", ensure_admin, create_page);
router.post("/create", UploadFile.single("venuePoster"), create_process);
router.get("/retrieve", ensure_admin, retrieve_page);
router.get("/update/:uuid", ensure_admin, update_page);
router.post('/update/:uuid', ensure_admin, UploadFile.single('venuePoster'), update_process);
router.delete('/delete/:uuid', ensure_admin, delete_process);
// performer book and pay venue
router.get('/book', book_page);
router.get("/payment/:uuid", payment_page);
router.get("/myPurchases/:uuid", myPurchases_page);
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
 * Authorize user
 * @param {Request}  req Express request  object
 * @param {Response} res Express response object
 * @param {NextFunction} next Express next handle function
**/
function authorizer(req, res, next) {

	if (req.user === undefined || req.isUnauthenticated()) {
		return res.render("error", {
			"code"   : 401,
			"message": "Unauthorized. Please login!"
		});	//	Unauthorized
	}
	else {
		next();	// Okay No problem, allow to proceed
	}
}
/**
 * Ensure Logged in user is admin
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
async function ensure_admin(req, res, next) {
	/** @type {ModelUser} */
	const user = req.user;
	if (user.role != UserRole.Admin) {
		return res.sendStatus(403).end();
	}
	else {
		return next();
	}
}

/**
 * Renders the create page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function create_page(req, res) {
	console.log("create page accessed");
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];
	console.log(cust);
	console.log(perf);
	console.log(admin);

	return res.render('venue/create', {
		cust: cust,
		perf: perf,
		admin: admin
	});
}


/**
 * Process the create form body
 * @param {import('express').Request}  req Express Request handle
 * @param {import('express').Response} res Express Response handle
 */
 async function create_process(req, res) {
	console.log("create contents received");
	console.log(`${req.file.path}`);
	console.log(req.body);

    // Add in form validations
    //
	//	Create new venue, now that all the test above passed
	try {
		const venue = await ModelVenue.create({
            "venueName":     req.body.venueName,
            "venueStory":    req.body.venueStory,
            "venueDate":  req.body.venueDate,
            "venueTime": req.body.venueTime,
            "venuePrice": req.body.venuePrice,
            "venuePoster": req.file.path
		});

		flashMessage(res, 'success', 'Successfully created a venue', 'fas fa-sign-in-alt', true);
		return res.redirect("/venue/retrieve"); // don't use render
	}
	catch (error) {
		//	Else internal server error
		console.error(`Failed to create a new venue: ${req.body.venueName} `);
		console.error(error);
		return res.status(500).end();
	}
}

/**
 * Renders the retrieve page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function retrieve_page(req, res) {
	console.log("retrieve page accessed");
	try{
		var role = roleResult(req.user.role);
		var cust = role[0];
		var perf = role[1];
		var admin = role[2];
		console.log(cust);
		console.log(perf);
		console.log(admin);

		const venues = await ModelVenue.findAll({
			order : [
				['venueName', 'ASC']
			],
			raw: true
		});		
		return res.render('venue/retrieve', {
			cust       : cust,
			perf       : perf,
			admin      : admin,
			"venues"   : venues,
		});

	}
	catch(error){
		console.error("Failed to retrieve list of venues");
		console.error(error);
		return res.status(500).end();

	}
}

/**
 * Renders the book page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function book_page(req, res) {
	console.log("book page accessed");
	try{

		var role = roleResult(req.user.role);
		var cust = role[0];
		var perf = role[1];
		var admin = role[2];
		console.log("cust: " + cust);
		console.log("perf: " + perf);
		console.log("admin: " + admin);

		const total = await ModelVenue.count();
		const pageNumber   = req.query.page    ? parseInt(req.query.page,  10) : 1; // page number, can have 10 pages maximum
		const pageSize  = req.query.pageSize? parseInt(req.query.pageSize, 1) : 10; // only 10 venue per page
		const pageTotal = Math.floor(total / pageSize);

		const venues = await ModelVenue.findAll({
			offset: (pageNumber - 1) * pageSize,
			limit : pageSize,
			order : [
				['venueName', 'ASC']
			],
			raw: true
		});		
		// venues[0].update()	//	This will crash... if raw is enabled
		return res.render('venue/book', {
			"venues"   : venues,
			"pageTotal": pageTotal,
			"pageNumber"  : pageNumber,
			"pageSize" : pageSize,
			cust: cust,
			perf: perf,
			admin: admin
		});

	}
	catch(error){
		console.error("Failed to retrieve list of venues");
		console.error(error);
		return res.status(500).end();

	}
}

/**
 * Renders the venue update page, Basically the same page as create with
 * prefills and cancellation.
 * @param {Request}  req Express request  object
 * @param {Response} res Express response object
 */
 async function update_page(req, res) {
	try {
		const content = await ModelVenue.findOne({where: { "uuid": req.params.uuid }});
		if (content) {
			// render to update.handlebars
			return res.render('venue/update', {
				"mode"   : "update",
				"content": content
			});
		}
		else {
			console.error(`Failed to retrieve venue ${req.params["uuid"]}`);
			console.error(error);
			return res.status(410).end();
		}
	}
	catch (error) {
		console.error(`Failed to retrieve venue ${req.params["uuid"]}`);
		console.error(error);
		return res.status(500).end();	//	Internal server error	# Usually should not even happen !!
	}
}

/**
 * Handles the update process.
 * @param {Request}  req Express request object
 * @param {Response} res Express response object
 */
async function update_process(req, res) {

	try {
		//	Please verify your contents
		if (!req.body.venueName)
			throw Error("Missing venueName");
	}
	catch(error) {
		console.error(`Malformed request to update venue ${req.params.uuid}`);
		console.error(req.body);
		console.error(error);
		return res.status(400).end();
	}

	try {
		const contents = await ModelVenue.findAll({where: { "uuid": req.params.uuid } });

		//	Whether this update request need to swap files?
		const replaceFile = (req.file)? true : false;

		switch (contents.length) {
				// The HyperText Transfer Protocol (HTTP) 410 Gone client error response code indicates that access to 
				// the target resource is no longer available at the origin server and that this condition is likely to 
				// be permanent
			case 0      : return res.redirect(410, "/venue/retrieve")
			case 1      : break;
			//The HTTP 409 Conflict response status code indicates a request conflict with current state of the target resource.
			default     : return res.status(409, "/venue/retrieve")
		}
		/** @type {string} */
		req.body.venueDate = Array.isArray(req.body["venueDate"])? req.body["venueDate"].join(',') : req.body["venueDate"];
		/** @type {string} */
		req.body.venueTime = Array.isArray(req.body["venueTime"])? req.body["venueTime"].join(',') : req.body["venueTime"];
		
		//	Save previous file path...
		const previous_file = contents[0].venuePoster;
		const data          = {
			"venueName"         : req.body.venueName,
			"venueStory"         : req.body.venueStory,
			"venueDate"      : req.body.venueDate,
			"venueTime"      : req.body.venueTime,
			"venuePrice": req.body.venuePrice,
			"venuePoster":req.file.path
		};

		//	Assign new file if necessary
		// if (replaceFile) {
		// 	data["venuePoster"] = `${venuePoster}/${req.file.filename}`;
		// }
		if (req.body.venuePoster) {
			data["venuePoster"] = req.body.venuePoster;
		}
		
		await (await contents[0].update(data)).save();

		//	Remove old file when success and replacing file
		// if (replaceFile) {
		// 	remove_file(previous_file);
		// }
		
		flashMessage(res, 'success', "Venue updated", 'fas fa-sign-in-alt', true);
		return res.redirect(`/venue/update/${req.params.uuid}`);
	}
	catch(error) {
		console.error(`Failed to update venue ${req.params.uuid}`);
		console.error(error);

		//	Clean up and remove file if error
		// if (req.file) {
		// 	console.error("Removing uploaded file");
		// 	remove_file(`./uploads/${req.file.filename}`);
		// }
		
		flashMessage(res, "error", "The server met an unexpected error", 'fas fa-sign-in-alt', true);

		return res.redirect(500, "/venue/retrieve")
	}	
}

/**
 * Handles the deletion of venue.
 * @param {Request}  req Express request  object
 * @param {Response} res Express response object
 */
 async function delete_process(req, res) {

	const regex_uuidv4 = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
	// if uuid doesnt match with uuidv4, give error
	if (!regex_uuidv4.test(req.params.uuid))
		return res.status(400);
	
	//	Perform additional checks such as whether it belongs to the current user
	/** @type {ModelUser} */
	// const user = req.user;

	try {
		const targets = await ModelVenue.findAll({where: { "uuid": req.params.uuid }});

		switch(targets.length) {
			case 0      : return res.status(409);
			case 1      : console.log("Found 1 eligible venue to be deleted"); break;
			     default: return res.status(409);
		}
		const affected = await ModelVenue.destroy({where: { "uuid": req.params.uuid}});

		if (affected == 1) {
			//	Delete all files associated
			// targets.forEach((target) => { 
			// 	remove_file(target.venuePoster);
			// });

			console.log(`Deleted venue: ${req.params.uuid}`);
			return res.redirect("/venue/retrieve");
		}
		//	There should only be one, so this else should never occur anyway
		else {
			console.error(`More than one entries affected by: ${req.params.uuid}, Total: ${affected}`);
			return res.status(409);
		}
	}
	catch (error) {
		console.error(`Failed to delete venue: ${req.params.uuid}`);
		console.error(error);
		return res.status(500);
	}
}

/**
 * Renders the venue payment page.
 * @param {Request}  req Express request object
 * @param {Response} res Express response object
 */
async function payment_page(req, res) {
	console.log("venuePayment page accessed");
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];
	console.log("cust: " + cust);
	console.log("perf: " + perf);
	console.log("admin: " + admin);
	try {
		const content = await ModelVenue.findOne({where: { "uuid": req.params.uuid }});
		console.log("Is content a list? "+ content);
		if (content) {
			return res.render('venue/payment', {
				cust: cust,
				perf: perf,
				admin: admin,
				"content": content
			});
		}
		else {
			console.error(`Failed to access venue payment page ${req.params["uuid"]}`);
			console.error(error);
			return res.status(410).end();
		}
	}
	catch (error) {
		console.error(`Failed to access venue payment page ${req.params["uuid"]}`);
		console.error(error);
		return res.status(500).end();	//	Internal server error	# Usually should not even happen !!
	}

}

/**
 * Renders myPurchases page.
 * @param {Request}  req Express request object
 * @param {Response} res Express response object
 */
async function myPurchases_page(req, res) {
	console.log("myPurchases page accessed");
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];
	try {
		// we need req.params.uuid to find the venue that you chose to buy 
		const contents = await ModelVenue.findAll({where: { "uuid": req.params.uuid}});
		const data = {
			"user_id": req.user.uuid
		};
		await (await contents[0].update(data)).save();
		const venues = await ModelVenue.findAll({
			where: {
				"user_id": req.user.uuid
			},
			order : [
				['venueName', 'ASC']
			],
			raw: true
		});		

		return res.render('venue/myPurchases', {
			cust: cust,
			perf: perf,
			admin: admin,
			"venues": venues
		});
		
	}
	catch (error) {
		console.error(`Failed to access myPurchases page ${req.params["uuid"]}`);
		console.error(error);
		return res.status(500).end();	//	Internal server error	# Usually should not even happen !!
	}

}


