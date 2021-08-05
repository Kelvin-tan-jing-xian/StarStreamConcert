import { Router }       from 'express';
import { flashMessage } from '../utils/flashmsg.mjs';
import { ModelTicket }    from '../data/Ticket.mjs';
import { UploadFile } from '../utils/multer.mjs';

const router = Router();
export default router;


router.use("/",                authorizer);	//..Applies to every route in this router
// all routes starts with /ticket
router.get("/CreateTickets",     CreateTickets_page);
router.post("/CreateTickets", UploadFile.single("concertPoster"), CreateTickets_process);
router.get("/RetrieveTickets", RetrieveTickets_page);
router.get("/UpdateTickets/:uuid", UpdateTickets_page);
router.post('/UpdateTickets/:uuid', UploadFile.single('concertPoster'), UpdateTickets_process);
router.delete('/DeleteTickets/:uuid', DeleteTickets_process);
router.get('/BuyTickets', BuyTickets_page);



// This function helps in showing different nav bars
function roleResult(role){
	if (role == 'performer') { // if user is performer, it cannot be customer
		var perf = true;
		var cust = false;
		var admin = false;
	}
	else if (role == 'performer'){
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
 * Renders the CreatesTickets page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function CreateTickets_page(req, res) {
	console.log("CreateTickets page accessed");
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];
	console.log("cust: " + cust);
	console.log("perf: " + perf);
	console.log("admin: " + admin);

	return res.render('ticket/CreateTickets', {
		cust: cust,
		perf: perf,
		admin: admin
	});
}


/**
 * Process the CreateTickets form body
 * @param {import('express').Request}  req Express Request handle
 * @param {import('express').Response} res Express Response handle
 */
async function CreateTickets_process(req, res) {
	console.log("CreateTickets contents received");
	console.log(`${req.file.path}`);
	console.log(req.body);

    // Add in form validations
    //
	//	Create new ticket, now that all the test above passed
	try {
		const ticket = await ModelTicket.create({
            "concertName":     req.body.concertName,
			"artistName": req.body.artistName,
            "concertStory":    req.body.concertStory,
            "concertDate":  req.body.concertDate,
            "concertTime": req.body.concertTime,
            "concertPrice": req.body.concertPrice,
            "concertPoster": req.file.path,
			"concertVenue" : req.body.concertVenue,
		});

		flashMessage(res, 'success', 'Successfully created a ticket', 'fas fa-sign-in-alt', true);
		return res.redirect("/ticket/RetrieveTickets");
	}
	catch (error) {
		//	Else internal server error
		console.error(`Failed to create a new ticket: ${req.body.concertName} `);
		console.error(error);
		return res.status(500).end();
	}
}

/**
 * Renders the RetrieveTickets page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
 async function RetrieveTickets_page(req, res) {
	console.log("RetrieveTickets page accessed");
	try{
		var role = roleResult(req.user.role);
		var cust = role[0];
		var perf = role[1];
		var admin = role[2];
		console.log("cust: " + cust);
		console.log("perf: " + perf);
		console.log("admin: " + admin);
		const total = await ModelTicket.count();
		const pageIdx   = req.query.page    ? parseInt(req.query.page,  10) : 1; // page number, can have 10 pages maximum
		const pageSize  = req.query.pageSize? parseInt(req.query.pageSize, 1) : 10; // only 10 ticket per page
		const pageTotal = Math.floor(total / pageSize);
	
		const tickets = await ModelTicket.findAll({
			offset: (pageIdx - 1) * pageSize,
			limit : pageSize,
			order : [
				['concertName', 'ASC']
			],
			raw: true
		});		
		// tickets[0].update()	//	This will crash... if raw is enabled

		return res.render('ticket/RetrieveTickets', {
			cust: cust,
			perf: perf,
			admin: admin,
			"tickets"   : tickets,
			"pageTotal": pageTotal,
			"pageIdx"  : pageIdx,
			"pageSize" : pageSize
		});
	}	
	catch(error){
	console.error("Failed to retrieve list of tickets");
	console.error(error);
	return res.status(500).end();

	}
}

/**
 * Renders the BuyTickets page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
 async function BuyTickets_page(req, res) {
	console.log("BuyTickets page accessed");
	try{

		var role = roleResult(req.user.role);
		var cust = role[0];
		var perf = role[1];
		var admin = role[2];
		console.log("cust: " + cust);
		console.log("perf: " + perf);
		console.log("admin: " + admin);

		const total = await ModelTicket.count();
		const pageIdx   = req.query.page    ? parseInt(req.query.page,  10) : 1; // page number, can have 10 pages maximum
		const pageSize  = req.query.pageSize? parseInt(req.query.pageSize, 1) : 10; // only 10 tickets per page
		const pageTotal = Math.floor(total / pageSize);

		const tickets = await ModelTicket.findAll({
			offset: (pageIdx - 1) * pageSize,
			limit : pageSize,
			order : [
				['ticketName', 'ASC']
			],
			raw: true
		});		
		// tickets[0].update()	//	This will crash... if raw is enabled
		return res.render('ticket/BuyTickets', {
			"tickets"   : tickets,
			"pageTotal": pageTotal,
			"pageIdx"  : pageIdx,
			"pageSize" : pageSize,
			cust: cust,
			perf: perf,
			admin: admin
		});

	}
	catch(error){
		console.error("Failed to retrieve list of tickets");
		console.error(error);
		return res.status(500).end();

	}
}

/**
 * Renders the ticket update page, Basically the same page as CreateTickets with
 * prefills and cancellation.
 * @param {Request}  req Express request  object
 * @param {Response} res Express response object
 */
 async function UpdateTickets_page(req, res) {
	try {
		const content = await ModelTicket.findOne({where: { "uuid": req.params["uuid"] }});
		if (content) {
			// render to UpdateTickets.handlebars
			return res.render('ticket/UpdateTickets', {
				"mode"   : "update",
				"content": content
			});
		}
		else {
			console.error(`Failed to retrieve ticket ${req.params["uuid"]}`);
			console.error(error);
			return res.status(410).end();
		}
	}
	catch (error) {
		console.error(`Failed to retrieve ticket ${req.params["uuid"]}`);
		console.error(error);
		return res.status(500).end();	//	Internal server error	# Usually should not even happen !! :)
	}
}

/**
 * Handles the update process.
 * @param {Request}  req Express request object
 * @param {Response} res Express response object
 */
 async function UpdateTickets_process(req, res) {

	try {
		//	Please verify your contents
		if (!req.body["concertName"])
			throw Error("Missing concertName");
	}
	catch(error) {
		console.error(`Malformed request to update tickets ${req.params["uuid"]}`);
		console.error(req.body);
		console.error(error);
		return res.status(400).end();
	}

	try {
		const contents = await ModelTicket.findAll({where: { "uuid": req.params["uuid"] } });

		//	Whether this update request need to swap files?
		const replaceFile = (req.file)? true : false;

		switch (contents.length) {
			// /feedback/RetrieveFeedback
			case 0      : return res.redirect(410, "/ticket/RetrieveTickets")
			case 1      : break;
			     default: return res.status(409, "/ticket/RetrieveTickets")
		}
		/** @type {string} */
		req.body["concertDate"] = Array.isArray(req.body["concertDate"])? req.body["concertDate"].join(',') : req.body["concertDate"];
		/** @type {string} */
		req.body["concertTime"] = Array.isArray(req.body["concertTime"])? req.body["concertTime"].join(',') : req.body["concertTime"];
		
		//	Save previous file path...
		const previous_file = contents[0].concertPoster;

		
		const data          = {
			"concertName":     req.body.concertName,
			"artistName": req.body.artistName,
			"concertStory":    req.body.concertStory,
			"concertDate":  req.body.concertDate,
			"concertTime": req.body.concertTime,
			"concertPrice": req.body.concertPrice,
			"concertPoster": req.file.path,
			"concertVenue" : req.body.concertVenue
				
		};

		//	Assign new file if necessary
		// if (replaceFile) {
		// 	data["concertPoster"] = `${concertPoster}/${req.file.filename}`;
		// }
		if (req.body.concertPoster) {
			data["concertPoster"] = req.body.concertPoster;
		}
		
		await (await contents[0].update(data)).save();

		//	Remove old file when success and replacing file
		// if (replaceFile) {
		// 	remove_file(previous_file);
		// }
		
		flashMessage(res, 'success', "Ticket updated", 'fas fa-sign-in-alt', true);
		return res.redirect(`/ticket/UpdateTickets/${req.params.uuid}`);
	}
	catch(error) {
		console.error(`Failed to update ticket ${req.params.uuid}`);
		console.error(error);

		//	Clean up and remove file if error
		// if (req.file) {
		// 	console.error("Removing uploaded file");
		// 	remove_file(`./uploads/${req.file.filename}`);
		// }
		
		flashMessage(res, "error", "The server met an unexpected error", 'fas fa-sign-in-alt', true);

		return res.redirect(500, "/ticket/RetrieveTickets")
	}	
}

/**
 * Handles the deletion of tickets.
 * @param {Request}  req Express request  object
 * @param {Response} res Express response object
 */
 async function DeleteTickets_process(req, res) {

	const regex_uuidv4 = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
	// if uuid doesnt match with uuidv4, give error
	if (!regex_uuidv4.test(req.params.uuid))
		return res.status(400);
	
	//	Perform additional checks such as whether it belongs to the current user
	/** @type {ModelUser} */
	// const user = req.user;

	try {
		const targets = await ModelTicket.findAll({where: { "uuid": req.params.uuid }});

		switch(targets.length) {
			case 0      : return res.status(409);
			case 1      : console.log("Found 1 eligible ticket to be deleted"); break;
			     default: return res.status(409);
		}
		const affected = await ModelTicket.destroy({where: { "uuid": req.params.uuid}});

		if (affected == 1) {
			//	Delete all files associated
			// targets.forEach((target) => { 
			// 	remove_file(target.ticketPoster);
			// });

			console.log(`Deleted ticket: ${req.params.uuid}`);
			return res.redirect("/ticket/RetrieveTickets");
		}
		//	There should only be one, so this else should never occur anyway
		else {
			console.error(`More than one entries affected by: ${req.params.uuid}, Total: ${affected}`);
			return res.status(409);
		}
	}
	catch (error) {
		console.error(`Failed to delete ticket: ${req.params.uuid}`);
		console.error(error);
		return res.status(500);
	}
}