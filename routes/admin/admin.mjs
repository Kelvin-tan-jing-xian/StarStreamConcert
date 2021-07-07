import { Router }              from 'express';
import { UserRole, ModelUser } from '../../data/User.mjs';
// Cannot find module ... imported from ....
import { UploadFile } from "../../utils/multer.mjs";
import { ModelVenue } from "../../data/Venue.mjs";
import { ModelFeedback } from "../../data/Feedback.mjs";
import { flashMessage } from "../../utils/flashmsg.mjs";
import {remove_file} from '../../utils/multer.mjs';
import {Path} from '../../utils/multer.mjs';

const router = Router();
export default router;

router.use(ensure_admin);
// all routes starts with /admin
router.get('/homePage', async function(req,res){
	console.log ("admin homePage accessed");
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];
	console.log(cust);
	console.log(perf);
	console.log(admin);

	// render homePage.handlebars
	return res.render('admin/homePage',{
		cust: cust,
		perf: perf,
		admin: admin
	});
});
router.get("/auth/retrieve", auth_retrieve_page);
router.get("/venue/create", create_page);
router.post("/venue/create", UploadFile.single("venuePoster"), venue_create_process);
router.get("/venue/retrieve", venue_retrieve_page);
router.get("/venue/update/:uuid", venue_update_page);
router.post("/venue/update/:uuid",UploadFile.single("venuePoster"),venue_update_process);
router.delete("/venue/delete/:uuid",  venue_delete_process);
router.get("/stream/retrieveall", stream_retrieveall_page);
router.get("/feedback/retrieve", feedback_retrieve_page);
router.get("/feedback/update/:uuid", feedback_update_page);
router.post('/feedback/update/:uuid',  feedback_update_process);
router.delete('/feedback/delete/:uuid', feedback_delete_process);
router.get("/create", admin_create_page);
router.post("/create", admin_create_process);





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
 * Ensure Logged in user is admin
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @param {import('express').NextFunction} next 
 */
 async function ensure_admin(req, res, next) {
    /** @type {ModelUser} */
    const user = req.user;
    if (user.role != UserRole.Admin) {
		console.log("HTTP 403 Forbidden")
		var role = roleResult(req.user.role);
        var cust = role[0];
        var perf = role[1];
        var admin = role[2];
        return res.render("error_403", {
			cust: cust,
			perf: perf,
			admin: admin
		});
    }
    else {
        return next();
    }
}

/**
 * Draw Bootstrap table
 * @param {import('express').Request}  req 
 * @param {import('express').Response} res 
 */
async function auth_retrieve_page(req, res) {
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

  return res.render("venue/create", {
    cust: cust,
    perf: perf,
    admin: admin,
  });
}
/**
 * Process the create form body
 * @param {import('express').Request}  req Express Request handle
 * @param {import('express').Response} res Express Response handle
 */
async function venue_create_process(req, res) {
  console.log("create contents received");
  console.log(`${req.file.path}`);
  console.log(req.body);

  // Add in form validations
  //
  //	Create new venue, now that all the test above passed
  try {
    if (!req.body.venueName) {
      throw Error("Missing venueName");
    }
    if (!req.body.venueStory) {
      throw Error("Missing venueStory");
    }
    if (!req.body.venueDate) {
      throw Error("Missing venueDate");
    }

    const venue = await ModelVenue.create({
      venueName: req.body.venueName,
      venueStory: req.body.venueStory,
      venueDate: req.body.venueDate,
      venueTime: req.body.venueTime,
      venuePrice: req.body.venuePrice,
      venuePoster: req.file.path,
    });

    flashMessage(
      res,
      "success",
      "Successfully created a venue",
      "fas fa-sign-in-alt",
      true
    );
    return res.redirect("/admin/venue/retrieve"); // don't use render
  } catch (error) {
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
async function venue_retrieve_page(req, res) {
  console.log("retrieve page accessed");
  try {
    var role = roleResult(req.user.role);
    var cust = role[0];
    var perf = role[1];
    var admin = role[2];
    console.log(cust);
    console.log(perf);
    console.log(admin);

    return res.render("venue/retrieve", {
      cust: cust,
      perf: perf,
      admin: admin,
    });
  } catch (error) {
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
async function venue_update_page(req, res) {
  try {
    var role = roleResult(req.user.role);
    var cust = role[0];
    var perf = role[1];
    var admin = role[2];
    console.log("cust: " + cust);
    console.log("perf: " + perf);
    console.log("admin: " + admin);

    const content = await ModelVenue.findOne({
      where: { uuid: req.params.uuid },
    });
    if (content) {
      // render to update.handlebars
      return res.render("venue/update", {
        cust: cust,
        perf: perf,
        admin: admin,
        content: content,
      });
    } else {
      console.error(`Failed to retrieve venue ${req.params["uuid"]}`);
      console.error(error);
      return res.status(410).end();
    }
  } catch (error) {
    console.error(`Failed to retrieve venue ${req.params["uuid"]}`);
    console.error(error);
    return res.status(500).end(); //	Internal server error	# Usually should not even happen !!
  }
}
/**
 * Handles the update process.
 * @param {Request}  req Express request object
 * @param {Response} res Express response object
 */
async function venue_update_process(req, res) {
  try {
    if (!req.body.venueName) {
      throw Error("Missing venueName");
    }
    if (!req.body.venueStory) {
      throw Error("Missing venueStory");
    }
    if (!req.body.venueDate) {
      throw Error("Missing venueDate");
    }
    const contents = await ModelVenue.findAll({
      where: { uuid: req.params.uuid },
    });
    //	Whether this update request need to swap files?
		const replaceFile = (req.file)? true : false;

		const previous_file = contents[0].venuePoster;

    const data = {
      venueName: req.body.venueName,
      venueStory: req.body.venueStory,
      venueDate: req.body.venueDate,
      venueTime: req.body.venueTime,
      venuePrice: req.body.venuePrice,
      venuePoster: req.file.path,
    };
		//	Assign new file if necessary
		if (replaceFile) {
			data["venuePoster"] = `${Path}/file/${req.file.filename}`;
		}
    else if (req.body.venuePoster) {
      data["venuePoster"] = req.body.venuePoster;
    }

    await (await contents[0].update(data)).save();
		//	Remove old file when success and replacing file
		if (replaceFile) {
			remove_file(previous_file);
		}

    flashMessage(res, "success", "Venue updated", "fas fa-sign-in-alt", true);
    return res.redirect(`/admin/venue/update/${req.params.uuid}`);
  } 
  catch (error) {
    console.error(`Failed to update venue ${req.params.uuid}`);
    console.error(error);

    //	Clean up and remove file if error
    if (req.file) {
    	console.error("Removing uploaded file");
    	remove_file(`./dynamic/file/${req.file.filename}`);
    }

    flashMessage(res,"error","The server met an unexpected error","fas fa-sign-in-alt",true);

    return res.redirect(500, "/admin/venue/retrieve");
  }
}
/**
 * Handles the deletion of venue.
 * @param {Request}  req Express request  object
 * @param {Response} res Express response object
 */
async function venue_delete_process(req, res) {
  const regex_uuidv4 =
    /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
  // if uuid doesnt match with uuidv4, give error
  if (!regex_uuidv4.test(req.params.uuid)) return res.status(400);

  //	Perform additional checks such as whether it belongs to the current user
  /** @type {ModelUser} */
  // const user = req.user;

  try {
    const targets = await ModelVenue.findAll({
      where: { uuid: req.params.uuid },
    });

    switch (targets.length) {
      case 0:
        return res.status(409);
      case 1:
        console.log("Found 1 eligible venue to be deleted");
        break;
      default:
        return res.status(409);
    }
    const affected = await ModelVenue.destroy({
      where: { uuid: req.params.uuid },
    });

    if (affected == 1) {
      //	Delete all files associated
      targets.forEach((target) => {
      	remove_file(target.venuePoster);
      });

      console.log(`Deleted venue: ${req.params.uuid}`);
      return res.redirect("/admin/venue/retrieve");
    }
    //	There should only be one, so this else should never occur anyway
    else {
      console.error(
        `More than one entries affected by: ${req.params.uuid}, Total: ${affected}`
      );
      return res.status(409);
    }
  } catch (error) {
    console.error(`Failed to delete venue: ${req.params.uuid}`);
    console.error(error);
    return res.status(500);
  }
}
/**
 * Draw Bootstrap table
 * @param {import('express').Request}  req 
 * @param {import('express').Response} res 
 */
 async function stream_retrieveall_page(req, res) {
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
 * Renders the retrieve page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function feedback_retrieve_page(req, res) {
    console.log("retrieve page accessed");
    try{
        var role = roleResult(req.user.role);
    	var cust = role[0];
   		var perf = role[1];
    	var admin = role[2];
        const total = await ModelFeedback.count();
        const pageIdx   = req.query.page    ? parseInt(req.query.page,  10) : 1;
        const pageSize  = req.query.pageSize? parseInt(req.query.pageSize, 10) : 10;
        const pageTotal = Math.floor(total / pageSize);

        const feedbacks = await ModelFeedback.findAll({
            offset: (pageIdx - 1) * pageSize,
            limit : pageSize,
            order : [
                ['rating', 'ASC']
            ],
            raw: true
        });     
        // venues[0].update()   //  This will crash... if raw is enabled
        return res.render('feedback/retrieve', {
            "feedbacks"   : feedbacks,
            "pageTotal": pageTotal,
            "pageIdx"  : pageIdx,
            "pageSize" : pageSize,
            cust: cust,
         	perf: perf,
          	admin: admin,
        });

    }
    catch(error){
        console.error("Failed to retrieve list of feedbacks");
        console.error(error);
        return res.status(500).end();

    }
}
/**
 * Renders the feedback update page, Basically the same page as create with
 * prefills and cancellation.
 * @param {Request}  req Express request  object
 * @param {Response} res Express response object
 */
 async function feedback_update_page(req, res) {
    try {
        var role = roleResult(req.user.role);
        var cust = role[0];
        var perf = role[1];
        var admin = role[2];
        console.log(cust);
        console.log(perf);
        console.log(admin);
    
        const content = await ModelFeedback.findOne({where: { "uuid": req.params["uuid"] }});
        if (content) {
            // render to update.handlebars
            return res.render('feedback/update', {
                cust:cust,
                perf:perf,
                admin:admin,
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
        return res.status(500).end();   //  Internal server error   # Usually should not even happen !!
    }
}
/**
 * Handles the update process.
 * @param {Request}  req Express request object
 * @param {Response} res Express response object
 */
async function feedback_update_process(req, res) {

    try {
        //  Please verify your contents
        if (!req.body["reply"])
            throw Error("Missing reply");
    }
    catch(error) {
        console.error(`Malformed request to update feedback ${req.params["uuid"]}`);
        console.error(req.body);
        console.error(error);
        return res.status(400).end();
    }

    try {
        const contents = await ModelFeedback.findAll({where: { "uuid": req.params["uuid"] } });
        const data          = {

            "reply": req.body.reply

        };
        await (await contents[0].update(data)).save();

    
        
        flashMessage(res, 'success', "Feedback updated", 'fas fa-sign-in-alt', true);
        return res.redirect(`/admin/feedback/update/${req.params.uuid}`);
    }
    catch(error) {
        console.error(`Failed to update feedback ${req.params.uuid}`);
        console.error(error);

        
        flashMessage(res, 'danger', "The server met an unexpected error", 'fas fa-sign-in-alt', true);

        return res.redirect(500, "/admin/feedback/retrieve")
    }   
}
/**
 * Handles the deletion of venue.
 * @param {Request}  req Express request  object
 * @param {Response} res Express response object
 */
 async function feedback_delete_process(req, res) {

    const regex_uuidv4 = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i

    if (!regex_uuidv4.test(req.params.uuid))
        return res.status(400);
    
    //  Perform additional checks such as whether it belongs to the current user
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
            //  Delete all files associated
            // targets.forEach((target) => { 
            //  remove_file(target.venuePoster);
            // });

            console.log(`Deleted feedback: ${req.params.uuid}`);
            return res.redirect("/admin/feedback/retrieve");
        }
        //  There should only be one, so this else should never occur anyway
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

/**
 * Renders the adminn create page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
 async function admin_create_page(req, res) {
  console.log("create page accessed");
  var role = roleResult(req.user.role);
  var cust = role[0];
  var perf = role[1];
  var admin = role[2];
  console.log(cust);
  console.log(perf);
  console.log(admin);
  // dont put / in the render 
  return res.render("admin/create", {
    cust: cust,
    perf: perf,
    admin: admin,
  });
}

/**
 * Process the registration form body
 * @param {import('express').Request}  req Express Request handle
 * @param {import('express').Response} res Express Response handle
 */
 async function admin_create_process(req, res) {
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

		flashMessage(res, 'success', 'Successfully created an admin account. Please login', 'fas fa-sign-in-alt', true);
		return res.redirect("/auth/login");
	}
	catch (error) {
		//	Else internal server error
		console.error(`Failed to create a new user: ${req.body.email} `);
		console.error(error);
		return res.status(500).end();
	}
}