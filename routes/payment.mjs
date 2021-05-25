import { Router }       from 'express';

const router = Router();
export default router;


router.get("/ticketPayment", ticketPayment_page);
router.get("/venuePayment", venuePayment_page);

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
	console.log("Venue payment page accessed");
	return res.render('payment/venuePayment', {
	});
}