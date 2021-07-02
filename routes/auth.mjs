import { Router }       from 'express';
import { flashMessage } from '../utils/flashmsg.mjs';
import { ModelUser }    from '../data/User.mjs';
import Hash             from 'hash.js';
import Passport         from 'passport';
import ORM   from 'sequelize';

import ExpressHBS       from 'express-handlebars';
import SendGrid         from '@sendgrid/mail';
import JWT              from 'jsonwebtoken';

SendGrid.setApiKey("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");

const { Op } = ORM;

const router = Router();
export default router;

/**
 * Regular expressions for form testing
 **/ 
const regexEmail = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
//	Min 3 character, must start with alphabet
const regexName  = /^[a-zA-Z][a-zA-Z]{2,}$/;
//	Min 8 character, 1 upper, 1 lower, 1 number, 1 symbol
const regexPwd   = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const hbsRender  = ExpressHBS.create({});

router.get("/login",     login_page);
router.post("/login",    login_process);
router.get("/register",  register_page);
router.post("/register", register_process);
router.get("/logout",    logout_process);
router.get("/retrieve", retrieve_page);
router.get("/retrieve-data", retrieve_data);
router.delete("/delete/:uuid", delete_process);
router.get("/verify/:token", verify_process);

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
 * Renders the login page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function login_page(req, res) {
	console.log("Login page accessed");
	return res.render('auth/login');
}

/**
 * Render the registration page
 * @param {import('express').Request}  req Express Request handle
 * @param {import('express').Response} res Express Response handle
 */
async function register_page(req, res) {
	console.log("Register page accessed");
	return res.render('auth/register');
}

/**
 * Process the login form body
 * @param {import('express').Request}  req Express Request handle
 * @param {import('express').Response} res Express Response handle
 * @param {import('express').NextFunction}
 */
async function login_process(req, res, next) {
	console.log("login contents received");
	console.log(req.body);

	let errors = [];
	//	Check your Form contents
	//	Basic IF ELSE STUFF no excuse not to be able to do this alone
	//	Common Sense
	try {
		if (! regexEmail.test(req.body.email)) {
			errors = errors.concat({ text: "Invalid email address!" });
		}

		if (! regexPwd.test(req.body.password)) {
			errors = errors.concat({ text: "Password Requires minimum 8 characters, at least 1 Uppercase letter, 1 Lowercase Letter, 1 number and 1 Special Character!" });
		}

		if (errors.length > 0) {
			throw new Error("There are validation errors");
		}
	}
	catch (error) {
		console.error("There is errors with the login form body.");
		console.error(error);
		return res.render('auth/login', { errors: errors });
	}

	return Passport.authenticate('local', {
		successRedirect: "/home",
		failureRedirect: "/auth/login",
		failureFlash:    true
	})(req, res, next);
}

/**
 * Process the registration form body
 * @param {import('express').Request}  req Express Request handle
 * @param {import('express').Response} res Express Response handle
 */
async function register_process(req, res) {
	console.log("Register contents received");
	console.log(req.body);
	let errors = [];
	//	Check your Form contents
	//	Basic IF ELSE STUFF no excuse not to be able to do this alone
	//	Common Sense
	try {
		if (! regexName.test(req.body.name)) {
			errors = errors.concat({ text: "Invalid name provided! It must have minimum 3 characters and starts with a letter." });
		}

		if (! regexEmail.test(req.body.email)) {
			errors = errors.concat({ text: "Invalid email address!" });
		}
		else {
			const user = await ModelUser.findOne({where: {email: req.body.email}});
			if (user != null) {
				errors = errors.concat({ text: "This email cannot be used!" }); // if the user register the second time
			}
		}

		if (! regexPwd.test(req.body.password)) {
			errors = errors.concat({ text: "Password Requires Minimum 8 characters, at least 1 Uppercase letter, 1 Lower Case Letter , 1 Number and 1 Special Character" });
		}
		else if (req.body.password !== req.body.password2) {
			errors = errors.concat({ text: "Password do not match!" });
		}

		if (errors.length > 0) {
			throw new Error("There are validation errors");
		}
	}
	catch (error) {
		console.error("There is errors with the registration form body.");
		console.error(error);
		return res.render('auth/register', { errors: errors });
	}

	//	Create new user, now that all the test above passed
	try {
		const user = await ModelUser.create({
				email:    req.body.email,
				password: Hash.sha256().update(req.body.password).digest("hex"),
				name:     req.body.name,
				role: req.body.role

		});
		await send_verification(user.uuid, user.email);

		flashMessage(res, 'success', 'Successfully created an account. Please login', 'fas fa-sign-in-alt', true);
		return res.redirect("/auth/login");
	}
	catch (error) {
		//	Else internal server error
		console.error(`Failed to create a new user: ${req.body.email} `);
		console.error(error);
		return res.status(500).end();
	}
}

/**
 * Sends a email to the specified address
 * @param uid {string}
 * @param email {string}
 */
async function send_verification(uid, email) {
	//	DO NOT PUT CREDENTIALS INSIDE PAYLOAD
	//	WHY? -> JWT can be decoded easily
	//		Whats the diff-> Signature don't match if mutated
	const token = JWT.sign({
		uuid:  uid
	}, 'the-key', {
		expiresIn: '30000'
	});
	
	//	Send Grid stuff
	return SendGrid.send({
		to:      email,
		from:    'altmile1@gmail.com',
		subject: `Verify your email`,
		html:    await hbsRender.render(`${process.cwd()}/templates/layouts/email-verify.handlebars`, {
			token:  token
		})
	});
}

/**
 * Logout current user
 * @param {import('express').Request}  req Express Request handle
 * @param {import('express').Response} res Express Response handle
 */
async function logout_process(req, res) {
	req.logout();
	return res.redirect("/index");
}

/**
 * Draw Bootstrap table
 * @param {import('express').Request}  req 
 * @param {import('express').Response} res 
 */
async function retrieve_page(req, res) {
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];
	console.log("cust: " + cust);
	console.log("perf: " + perf);
	console.log("admin: " + admin);

	return res.render("auth/retrieve", {
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
				"name": { [Op.substring]: search},
				"email": { [Op.substring]: search}
			}
		} : undefined;
		const total = await ModelUser.count({where : conditions});
		const pageTotal = Math.ceil(total / pageSize);

		const pageContents = await ModelUser.findAll({
			offset: offset,
			limit: pageSize,
			order: [[sortBy, sortOrder.toUpperCase()]],
			where: conditions,
			raw: true // Data only, model excluded
		});		
		return res.json({
			"total": total,
			"rows":  pageContents
		});
	}
	catch(error){
		console.error("Failed to retrieve all users");
		console.error(error);
		return res.status(500).end();

	}
}

/**
 * Handles the deletion of user.
 * @param {Request}  req Express request  object
 * @param {Response} res Express response object
 */
async function delete_process(req, res) {
  const regex_uuidv4 =
    /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
  // if uuid doesnt match with uuidv4, give error
  if (!regex_uuidv4.test(req.params.uuid)) return res.status(400);


  try {
    const targets = await ModelUser.findAll({
      where: { uuid: req.params.uuid },
    });

    switch (targets.length) {
      case 0:
        return res.status(409);
      case 1:
        console.log("Found 1 eligible user to be deleted");
        break;
      default:
        return res.status(409);
    }
    const affected = await ModelUser.destroy({
      where: { uuid: req.params.uuid },
    });

    if (affected == 1) {

      console.log(`Deleted user: ${req.params.uuid}`);
      return res.redirect("/auth/retrieve");
    }
    //	There should only be one, so this else should never occur anyway
    else {
      console.error(
        `More than one entries affected by: ${req.params.uuid}, Total: ${affected}`
      );
      return res.status(409);
    }
  } catch (error) {
    console.error(`Failed to delete user: ${req.params.uuid}`);
    console.error(error);
    return res.status(500);
  }
}

/**
 * Process the verification token
 * @param {import('express').Request}  req Express Request handle
 * @param {import('express').Response} res Express Response handle
 */
async function verify_process(req, res) {
	const token = req.params.token;
	let   uuid  = null;
	try {
		const payload = JWT.verify(token, 'the-key');

		uuid    = payload.uuid;
	}
	catch (error) {
		console.error(`The token is invalid`);
		console.error(error);
		// Bad request
		return res.sendStatus(400).end();
	}

	try {
		const user = await ModelUser.findByPk(uuid);
		user.verify();
		user.save();
		return res.render("auth/verified", {
			name: user.name
		});
	}
	catch (error) {
		console.error(`Failed to locate ${uuid}`);
		console.error(error);
		return res.sendStatus(500).end();
	}
}

