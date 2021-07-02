import { Router }       from 'express';
import { flashMessage } from '../utils/flashmsg.mjs';
// must be caps
import { ModelFeedback }    from '../data/Feedback.mjs';
// must be caps
import { UserRole, ModelUser } from '../data/User.mjs';

const router = Router();
export default router;


router.get("/create",     create_page);
router.post("/create" , create_process);
router.get("/retrieve", ensure_admin, retrieve_page);
router.get("/retrieve-data", retrieve_data);
router.get("/update/:uuid", ensure_admin, update_page);
router.post('/update/:uuid', ensure_admin, update_process);
router.delete('/delete/:uuid', ensure_admin, delete_process);
router.get("/view",     view_page);
// router.get("/thankYouPage", thankYouPage);
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
 * Renders the create page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function create_page(req, res) {
    console.log("feedback page accessed");
    var role = roleResult(req.user.role);
    var cust = role[0];
    var perf = role[1];
    var admin = role[2];
    console.log("cust: " + cust);
    console.log("perf: " + perf);
    console.log("admin: " + admin);

    return res.render('feedback/create', {
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
    console.log("feedbackPage contents received");
    console.log(req.body);

    // Add in form validations
    //
    //  Create new feedback, now that all the test above passed
    try {
        console.log('Im inside the try block!');
    
        const feedback = await ModelFeedback.create({
            "name": req.user.name,
            "Rating":     req.body.rating,
            "feedbackType":    req.body.feedbackType,
            "feedbackGiven":  req.body.feedbackGiven,
            "reply": "none",    
            "role": req.user.role
        });

        flashMessage(res, 'success', 'Successfully created a feedback', 'fas fa-sign-in-alt', true);
        return res.redirect("/home"); // don't use render
        }
        catch (error) {
        //  Else internal server error
        console.error(`Failed to create a new feedback: ${req.body.rating} `);
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
 * Provides bootstrap table with data
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
 async function retrieve_data(req, res) {
	try {
	  let pageSize = parseInt(req.query.limit);
	  let offset = parseInt(req.query.offset);
	  let sortBy = req.query.sort ? req.query.sort : "dateCreated";
	  let sortOrder = req.query.order ? req.query.order : "desc";
	  let search = req.query.search;
  
	  if (pageSize < 0) {
		throw new HttpError(400, "Invalid page size");
	  }
	  if (offset < 0) {
		throw new HttpError(400, "Invalid offset index");
	  }
	  /** @type {import('sequelize/types').WhereOptions} */
	  const conditions = search
		? {
			[Op.or]: {
			  name: { [Op.substring]: search },
			  feedbackType: { [Op.substring]: search },
			},
		  }
		: undefined;
	  const total = await ModelFeedback.count({ where: conditions });
	  const pageTotal = Math.ceil(total / pageSize);
  
	  const pageContents = await ModelFeedback.findAll({
		offset: offset,
		limit: pageSize,
		order: [[sortBy, sortOrder.toUpperCase()]],
		where: conditions,
		raw: true, // Data only, model excluded
	  });
	  return res.json({
		total: total,
		rows: pageContents,
	  });
	} catch (error) {
	  console.error("Failed to retrieve all feedbacks");
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
 async function update_page(req, res) {
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
async function update_process(req, res) {

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



        switch (contents.length) {
            case 0      : return res.redirect(410, "/feedback/retrieve")
            case 1      : break;
                 default: return res.status(409, "/feedback/retrieve")
        }
        
       
        
        const data          = {

            "reply": req.body.reply

        };
        await (await contents[0].update(data)).save();

    
        
        flashMessage(res, 'success', "Feedback updated", 'fas fa-sign-in-alt', true);
        return res.redirect(`/feedback/update/${req.params.uuid}`);
    }
    catch(error) {
        console.error(`Failed to update feedback ${req.params.uuid}`);
        console.error(error);

        
        flashMessage(res, "error", "The server met an unexpected error", 'fas fa-sign-in-alt', true);

        return res.redirect(500, "/feedback/retrieve")
    }   
}

/**
 * Handles the deletion of venue.
 * @param {Request}  req Express request  object
 * @param {Response} res Express response object
 */
 async function delete_process(req, res) {

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
            return res.redirect("/feedback/retrieve");
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
    }}



/**
 * Renders the retrieve page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function view_page(req, res) {
    console.log("view page accessed");
    var role = roleResult(req.user.role);
    var cust = role[0];
    var perf = role[1];
    var admin = role[2];
    console.log(cust);
    console.log(perf);
    console.log(admin);

        // venues[0].update()   //  This will crash... if raw is enabled
    return res.render('feedback/view',{
        cust:cust,
        perf:perf,
        admin:admin
    });
}

// Function for thankYOuPAge