import { Router }       from 'express';
import { flashMessage } from '../utils/flashmsg.mjs';
import { ModelTicket }    from '../data/Ticket.mjs';
import { UploadFile } from '../utils/multer.mjs';

const router = Router();
export default router;



router.get("/CreateTickets",     CreateTickets_page);
router.post("/CreateTickets", UploadFile.single("concertPoster"), CreateTickets_process);
router.get("/RetrieveTickets", RetrieveTickets_page);



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
 * Renders the create ticket page
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
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];
	console.log("cust: " + cust);
	console.log("perf: " + perf);
	console.log("admin: " + admin);

	return res.render('ticket/RetrieveTickets', {
		cust: cust,
		perf: perf,
		admin: admin
	});
}

