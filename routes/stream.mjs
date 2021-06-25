import { Router }       from 'express';
import { flashMessage } from '../utils/flashmsg.mjs';
import { ModelStream }    from '../data/stream.mjs';
import { ModelTicket } from '../data/ticket.mjs';
import { UploadFile } from '../utils/multer.mjs';
import {remove_file} from '../utils/multer.mjs';
import {Path} from '../utils/multer.mjs';

const router = Router();
export default router;


router.use("/",                authorizer);	//..Applies to every route in this router
// all routes starts with /stream
router.get("/create",     create_page);
router.post("/create", UploadFile.single("concertPoster"), create_process);
router.get("/retrieve", retrieve_page);
router.get("/update/:uuid", update_page);
router.post('/update/:uuid', UploadFile.single('concertPoster'), update_process);
router.delete('/delete/:uuid', delete_process);
router.get('/book', book_page);
router.get("/payment/:uuid", payment_page);
router.post("/myPurchases/:uuid", myPurchases_page);
router.get("/retrieveall", retrieveall_page);
router.get("/retrieve-data" , retrieve_data);


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
 * Renders the Create page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function create_page(req, res) {
	console.log("create page accessed");
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];
	console.log("cust: " + cust);
	console.log("perf: " + perf);
	console.log("admin: " + admin);

	return res.render('stream/create', {
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
	//	Create new stream, now that all the test above passed
	try {
		if (!req.body.concertName) {
		  throw Error("Missing Concert name");
		}
		if (!req.body.artistName) {
			throw Error("Missing artist name");
		}
  
		if (!req.body.concertStory) {
		  throw Error("Missing Concert Story");
		}
		if (!req.body.concertDate) {
		  throw Error("Missing Concert Date");
		}
		const stream = await ModelStream.create({
            "concertName":     req.body.concertName,
			"artistName": req.body.artistName,
            "concertStory":    req.body.concertStory,
            "concertDate":  req.body.concertDate,
            "concertTime": req.body.concertTime,
            "concertPrice": req.body.concertPrice,
            "concertPoster": req.file.path,
		});

		flashMessage(res, 'success', 'Successfully created a stream', 'fas fa-sign-in-alt', true);
		return res.redirect("/stream/retrieve");
	}
	catch (error) {
		//	Else internal server error
		console.error(`Failed to create a new stream: ${req.body.concertName} `);
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
		console.log("cust: " + cust);
		console.log("perf: " + perf);
		console.log("admin: " + admin);
		const total = await ModelStream.count();
		const pageIdx   = req.query.page    ? parseInt(req.query.page,  10) : 1; // page number, can have 10 pages maximum
		const pageSize  = req.query.pageSize? parseInt(req.query.pageSize, 1) : 10; // only 10 stream per page
		const pageTotal = Math.floor(total / pageSize);
	
		const streams = await ModelStream.findAll({
			offset: (pageIdx - 1) * pageSize,
			limit : pageSize,
			order : [
				['concertName', 'ASC']
			],
			raw: true
		});		

		return res.render('stream/retrieve', {
			cust: cust,
			perf: perf,
			admin: admin,
			"streams"   : streams,
			"pageTotal": pageTotal,
			"pageIdx"  : pageIdx,
			"pageSize" : pageSize
		});
	}	
	catch(error){
	console.error("Failed to retrieve list of streams");
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

		const total = await ModelStream.count();
		const pageIdx   = req.query.page    ? parseInt(req.query.page,  10) : 1; // page number, can have 10 pages maximum
		const pageSize  = req.query.pageSize? parseInt(req.query.pageSize, 1) : 10; // only 10 streams per page
		const pageTotal = Math.floor(total / pageSize);

		const streams = await ModelStream.findAll({
			offset: (pageIdx - 1) * pageSize,
			limit : pageSize,
			order : [
				['concertName', 'ASC']
			],
			raw: true
		});		
		// streams[0].update()	//	This will crash... if raw is enabled
		return res.render('stream/book', {
			"streams"   : streams,
			"pageTotal": pageTotal,
			"pageIdx"  : pageIdx,
			"pageSize" : pageSize,
			cust: cust,
			perf: perf,
			admin: admin
		});

	}
	catch(error){
		console.error("Failed to retrieve list of streams");
		console.error(error);
		return res.status(500).end();

	}
}

/**
 * Renders the stream update page, Basically the same page as create with
 * prefills and cancellation.
 * @param {Request}  req Express request  object
 * @param {Response} res Express response object
 */
 async function update_page(req, res) {
	try {
		const content = await ModelStream.findOne({where: { "uuid": req.params["uuid"] }});
		console.log("Is content a list? :" + content);
		if (content) {
			// render to update.handlebars
			return res.render('stream/update', {
				"mode"   : "update",
				"content": content
			});
		}
		else {
			console.error(`Failed to retrieve stream ${req.params["uuid"]}`);
			console.error(error);
			return res.status(410).end();
		}
	}
	catch (error) {
		console.error(`Failed to retrieve stream ${req.params["uuid"]}`);
		console.error(error);
		return res.status(500).end();	//	Internal server error	# Usually should not even happen !! :)
	}
}

/**
 * Handles the update process.
 * @param {Request}  req Express request object
 * @param {Response} res Express response object
 */
 async function update_process(req, res) {


	try {
		if (!req.body.concertName){
			throw Error("Missing concert name");
		}
		if (!req.body.artistName){
			throw Error("Missing artist name");
		}

		if (!req.body.concertStory) {
			throw Error("Missing Concert Story");
		}
		if (!req.body.concertDate){
			throw Error("Missing Concert Date");
		}
		const contents = await ModelStream.findAll({where: { "uuid": req.params["uuid"] } });

		//	Whether this update request need to swap files?
		const replaceFile = (req.file)? true : false;

		switch (contents.length) {
			// /feedback/RetrieveFeedback
			case 0      : return res.redirect(410, "/stream/retrieve")
			case 1      : break;
			     default: return res.status(409, "/stream/retrieve")
		}
		
		//	Save previous file path...
		const previous_file = contents[0].concertPoster;

		
		const data={
			concertName:     req.body.concertName,
			artistName: req.body.artistName,
			concertStory:    req.body.concertStory,
			concertDate:  req.body.concertDate,
			concertTime: req.body.concertTime,
			concertPrice: req.body.concertPrice,
			concertPoster: req.file.path,
				
		};

		//	Assign new file if necessary
		if (replaceFile) {
			data["concertPoster"] = `${Path}/file/${req.file.filename}`;
		}
		else if (req.body.concertPoster) {
			data["concertPoster"] = req.body.concertPoster;
		}
		
		await (await contents[0].update(data)).save();

		//	Remove old file when success and replacing file
		if (replaceFile) {
			remove_file(previous_file);
		}
		
		flashMessage(res, 'success', "stream updated", 'fas fa-sign-in-alt', true);
		return res.redirect(`/stream/update/${req.params.uuid}`);
	}
	catch(error) {
		console.error(`Failed to update stream ${req.params.uuid}`);
		console.error(error);

		//	Clean up and remove file if error
		if (req.file) {
			console.error("Removing uploaded file");
			remove_file(`./uploads/${req.file.filename}`);
		}
		
		flashMessage(res, "error", "The server met an unexpected error", 'fas fa-sign-in-alt', true);

		return res.redirect(500, "/stream/retrieve")
	}	
}

/**
 * Handles the deletion of streams.
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
		const targets = await ModelStream.findAll({where: { "uuid": req.params.uuid }});

		switch(targets.length) {
			case 0      : return res.status(409);
			case 1      : console.log("Found 1 eligible stream to be deleted"); break;
			     default: return res.status(409);
		}
		const affected = await ModelStream.destroy({where: { "uuid": req.params.uuid}});

		if (affected == 1) {
			//	Delete all files associated
			targets.forEach((target) => { 
				remove_file(target.concertPoster);
			});

			console.log(`Deleted stream: ${req.params.uuid}`);
			return res.redirect("/stream/retrieve");
		}
		//	There should only be one, so this else should never occur anyway
		else {
			console.error(`More than one entries affected by: ${req.params.uuid}, Total: ${affected}`);
			return res.status(409);
		}
	}
	catch (error) {
		console.error(`Failed to delete stream: ${req.params.uuid}`);
		console.error(error);
		return res.status(500);
	}
}
/**
 * Renders the stream payment page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
 async function payment_page(req, res) {
	console.log("stream payment page accessed");
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];
	console.log("cust: " + cust);
	console.log("perf: " + perf);
	console.log("admin: " + admin);
	try {
		const content = await ModelStream.findOne({where : {"uuid": req.params.uuid}});
		if (content) {
			return res.render('stream/payment', {
				cust: cust,
				perf: perf,
				admin: admin,
				"content": content
	});

		} 
		else 
		{
			console.error(`Failed to access stream payment page ${req.params.uuid}`);
			console.error(error);
			return res.status(500).end();	//	Internal server error	# Usually should not even happen !!

		}
	} 
	catch (error) {
		console.error(`Failed to access stream payment page ${req.params["uuid"]}`);
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
		// we need req.params.uuid to find the stream that you chose to buy 
		const ticket = await ModelTicket.create({
			// Ryo pls find a way to access the getter uuid stream
			"stream_id": uuid(),
			"user_id": req.user.uuid,
			"concertName": req.body.concertName,
			"artistName": req.body.artistName,
			"concertDate": req.body.concertDate,
			"concertTime": req.body.concertTime,
			"concertPrice": req.body.concertPrice
		});
		flashMessage(res, 'success', 'Successfully created a ticket', 'fas fa-sign-in-alt', true);

		const tickets = await ModelTicket.findAll({
			where: {
				"user_id": req.user.uuid
			},
			order : [
				['concertName', 'ASC']
			],
			raw: true
		});		

		return res.render('stream/myPurchases', {
			cust: cust,
			perf: perf,
			admin: admin,
			"tickets": tickets
		});
		
	}
	catch (error) {
		console.error(`Failed to access myPurchases page ${req.params["uuid"]}`);
		console.error(error);
		return res.status(500).end();	//	Internal server error	# Usually should not even happen !!
	}

}


/**
 * Draw Bootstrap table
 * @param {import('express').Request}  req 
 * @param {import('express').Response} res 
 */
 async function retrieveall_page(req, res) {
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];
	console.log("cust: " + cust);
	console.log("perf: " + perf);
	console.log("admin: " + admin);

	return res.render("stream/retrieveall", {
		cust: cust,
		perf: perf,
		admin: admin
	});
 }
 /**
 * Provides bootstrap table with data
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
 async function retrieve_data(req, res) {
	try{
		let pageSize = parseInt(req.query.limit);
		let offset = parseInt(req.query.offset);
		let sortBy = (req.query.sort)? req.query.sort : "dateCreated";
		let sortOrder = (req.query.order)? req.query.order : "desc";
		let search = req.query.search;

		if (pageSize < 0) {
			throw new HttpError(400, "Invalid page size");
		}
		if (offset < 0) {
			throw new HttpError(400, "Invalid offset index");
		}
		/** @type {import('sequelize/types').WhereOptions} */
		const conditions = (search)? {
			[Op.or]: {
				"concertName": { [Op.substring]: search},
				"artistName": { [Op.substring]: search}
			}
		} : undefined;
		const total = await ModelStream.count({where : conditions});
		const pageTotal = Math.ceil(total / pageSize);

		const pageContents = await ModelStream.findAll({
			offset: offset,
			limit: pageSize,
			order: [[sortBy, sortOrder.toUpperCase()]],
			where: conditions,
			raw: true 
		});		
		return res.json({
			"total": total,
			"rows":  pageContents
		});
	}
	catch(error){
		console.error("Unable to retrieve streams");
		console.error(error);
		return res.status(500).end();

	}
}