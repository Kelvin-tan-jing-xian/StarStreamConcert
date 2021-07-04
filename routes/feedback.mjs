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
router.get("/retrieve-data", retrieve_data);
router.get("/my",     view_my_feedback_page);
router.get("/thankyou",thankyou_page);
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
            "user_id": req.user.uuid,
            "name": req.user.name,
            "email": req.user.email,
            "Rating":     req.body.rating,
            "feedbackType":    req.body.feedbackType,
            "feedbackGiven":  req.body.feedbackGiven,
            "reply": "none",    
            "role": req.user.role
        });

        flashMessage(res, 'success', 'Successfully created a feedback', 'fas fa-sign-in-alt', true);
        return res.redirect("thankyou"); // don't use render
        }
        catch (error) {
        //  Else internal server error
        console.error(`Failed to create a new feedback: ${req.body.rating} `);
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
 * Renders the retrieve page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function view_my_feedback_page(req, res) {
    console.log("view page accessed");
    var role = roleResult(req.user.role);
    var cust = role[0];
    var perf = role[1];
    var admin = role[2];
    console.log(cust);
    console.log(perf);
    console.log(admin);
    const feedbacks = await ModelFeedback.findAll({where: {
        "user_id" : req.user.uuid
    }});
    return res.render('feedback/my',{
        cust:cust,
        perf:perf,
        admin:admin,
        "feedbacks": feedbacks
    });
}

// Function for thankYOuPAge

/**
 * Renders the thankyou page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
 async function thankyou_page(req, res) {
    console.log("thank you page accessed");
    var role = roleResult(req.user.role);
    var cust = role[0];
    var perf = role[1];
    var admin = role[2];
    console.log(cust);
    console.log(perf);
    console.log(admin);

    return res.render('feedback/thankyou',{
        cust:cust,
        perf:perf,
        admin:admin
    });
}