import { Router }       from 'express';
import { flashMessage } from '../utils/flashmsg.mjs';
import { ModelVenue }    from '../data/Venue.mjs';
import { UploadFile } from '../utils/multer.mjs';

const router = Router();
export default router;



router.get("/addVenue",     addVenue_page);
router.post("/addVenue", UploadFile.single("venuePoster"), addVenue_process);
router.get("/listVenue", listVenue_page);
router.get("/updateVenue/:uuid", updateVenue_page);
router.post('/updateVenue/:uuid', UploadFile.single('venuePoster'), updateVenue_process);
router.delete('/deleteVenue/:uuid', deleteVenue_process);


/**
 * Renders the addVenue page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function addVenue_page(req, res) {
	console.log("addVenue page accessed");
	return res.render('venue/addVenue', {
		"mode": "create"
	});
}


/**
 * Process the addVenue form body
 * @param {import('express').Request}  req Express Request handle
 * @param {import('express').Response} res Express Response handle
 */
 async function addVenue_process(req, res) {
	console.log("addVenue contents received");
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
		return res.redirect("/venue/listVenue"); // don't use render
	}
	catch (error) {
		//	Else internal server error
		console.error(`Failed to create a new venue: ${req.body.venueName} `);
		console.error(error);
		return res.status(500).end();
	}
}

/**
 * Renders the listVenue page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function listVenue_page(req, res) {
	console.log("listVenue page accessed");
	try{
		const total = await ModelVenue.count();
		const pageIdx   = req.query.page    ? parseInt(req.query.page,  10) : 1;
		const pageSize  = req.query.pageSize? parseInt(req.query.pageSize, 10) : 10;
		const pageTotal = Math.floor(total / pageSize);

		const venues = await ModelVenue.findAll({
			offset: (pageIdx - 1) * pageSize,
			limit : pageSize,
			order : [
				['venueName', 'ASC']
			],
			raw: true
		});		
		// venues[0].update()	//	This will crash... if raw is enabled
		return res.render('venue/listVenue', {
			"venues"   : venues,
			"pageTotal": pageTotal,
			"pageIdx"  : pageIdx,
			"pageSize" : pageSize
		});

	}
	catch(error){
		console.error("Failed to retrieve list of venues");
		console.error(error);
		return res.status(500).end();

	}
}

/**
 * Renders the venue update page, Basically the same page as addVenue with
 * prefills and cancellation.
 * @param {Request}  req Express request  object
 * @param {Response} res Express response object
 */
 async function updateVenue_page(req, res) {
	try {
		const content = await ModelVenue.findOne({where: { "uuid": req.params["uuid"] }});
		if (content) {
			// render to updateVenue.handlebars
			return res.render('venue/updateVenue', {
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
async function updateVenue_process(req, res) {

	try {
		//	Please verify your contents
		if (!req.body["venueName"])
			throw Error("Missing venueName");
	}
	catch(error) {
		console.error(`Malformed request to update venue ${req.params["uuid"]}`);
		console.error(req.body);
		console.error(error);
		return res.status(400).end();
	}

	try {
		const contents = await ModelVenue.findAll({where: { "uuid": req.params["uuid"] } });

		//	Whether this update request need to swap files?
		const replaceFile = (req.file)? true : false;

		switch (contents.length) {
			case 0      : return res.redirect(410, "/venue/listVenue")
			case 1      : break;
			     default: return res.status(409, "/venue/listVenue")
		}
		/** @type {string} */
		req.body["venueDate"] = Array.isArray(req.body["venueDate"])? req.body["venueDate"].join(',') : req.body["venueDate"];
		/** @type {string} */
		req.body["venueTime"] = Array.isArray(req.body["venueTime"])? req.body["venueTime"].join(',') : req.body["venueTime"];
		
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
		return res.redirect(`/venue/updateVenue/${req.params.uuid}`);
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

		return res.redirect(500, "/venue/listVenue")
	}	
}

/**
 * Handles the deletion of venue.
 * @param {Request}  req Express request  object
 * @param {Response} res Express response object
 */
 async function deleteVenue_process(req, res) {

	const regex_uuidv4 = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i

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
			return res.redirect("/venue/listVenue");
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