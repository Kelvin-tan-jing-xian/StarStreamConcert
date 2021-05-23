import { Router }       from 'express';
import { flashMessage } from '../utils/flashmsg.mjs';
import { ModelVenue }    from '../data/Venue.mjs';
import { UploadFile } from '../utils/multer.mjs';

const router = Router();
export default router;



router.get("/addVenue",     addVenue_page);
router.post("/addVenue", UploadFile.single("venuePoster"), addVenue_process);





/**
 * Renders the addVenue page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function addVenue_page(req, res) {
	console.log("addVenue page accessed");
	return res.render('venue/addVenue');
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