import { Router }       from 'express';
import { ModelVenue } from '../data/Venue.mjs';
const router = Router();
export default router;

// all routes starts with /payment
router.get("/ticketPayment", ticketPayment_page);
router.get("/venuePayment", venuePayment_page);

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
 * Renders the ticket payment page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
 async function ticketPayment_page(req, res) {
	console.log("Ticket payment page accessed");
	return res.render('payment/ticketPayment', {
	});
}

async function venuePayment_page(req, res) {
	console.log("venuePayment page accessed");
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];
	console.log("cust: " + cust);
	console.log("perf: " + perf);
	console.log("admin: " + admin);
	const venues = await ModelVenue.findAll({
		raw: true
	});		
	console.log("venues is a list of objects:" + venues);
	return res.render('payment/venuePayment', {
		cust: cust,
		perf: perf,
		admin: admin,
		"venues": venues
	});
}