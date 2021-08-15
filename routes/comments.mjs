import { Router }       from 'express';
import { ModelComments }    from '../data/Comments.mjs';
import { UserRole }     from '../data/user.mjs';
import JWT              from 'jsonwebtoken';
import ORM   from 'sequelize';

const { Op } = ORM;
const router = Router();
export default router;

router.get("/:streamId", page_stream);
// customer can create, update, delete own comments
router.post("/:streamId", create_process);
router.post("/update/:stream_id/:uuid", update_process);
router.delete("/delete/:stream_id/:uuid", delete_process);

function roleResult(role) {
	if (role == "performer") {
	  // if user is performer, it cannot be customer
	  var perf = true;
	  var cust = false;
	  var admin = false;
	} else if (role == "customer") {
	  // if user is performer, it cannot be customer
	  var cust = true;
	  var perf = false;
	  var admin = false;
	} else {
	  var cust = false;
	  var perf = false;
	  var admin = true;
	}
  
	return [cust, perf, admin];
  }


  
/**
 * Renders the page for live streaming
 * @param {import('express').Request}  req 
 * @param {import('express').Response} res 
 */
async function page_stream(req, res) {
	var role = roleResult(req.user.role);
	var cust = role[0];
	var perf = role[1];
	var admin = role[2];

	//	Create a validation token to be used for socket connection
	const  token = JWT.sign({
		role: (req.user.role == UserRole.Performer) ? "HOST" : "GUEST",
		userId:   req.user.uuid,
		username: req.user.name,
		streamId: req.params.streamId
	}, "the-key", {});
	
	// Comments Section
	const comment_Mod = await ModelComments.findAll({
		where: {
			stream_id: {
				[Op.eq]: req.params.streamId,
			}
		},
		order: [
			// Sort comment in datetime order
			['dateCreated', 'DESC'],
		]
	});
	if (req.user.role == "admin" || req.user.role == "performer" ) {
		const change = await ModelComments.update({ validUser: true }, {
			where: {
			  uuid: {[Op.not]: null,}
			}
		});
	}
	else {
		for (var i = 0; i < comment_Mod.length; i++) {
			if (comment_Mod[i].customer_id == req.user.uuid) {
				const change = await ModelComments.update({ validUser: true }, {
					where: {
					  uuid: comment_Mod[i].uuid
					}
				  });
			}
			else{
				const change = await ModelComments.update({ validUser: false }, {
					where: {
					  uuid: comment_Mod[i].uuid
					}
				  });
			}
		};
	} 

	return res.render("comments/create", {
		streamId: req.params.streamId,
		userId:   req.user.uuid,
		username: req.user.name,
		role:     (req.user.role == UserRole.Performer) ? "HOST" : "GUEST",
		token:    token,
		showComments: comment_Mod,
		cust: cust,
		perf: perf,
		admin: admin,
	});
}

/**
 * Process the comment input
 * @param {import('express').Request}  req Express Request handle
 * @param {import('express').Response} res Express Response handle
 */
 async function create_process(req, res) {
	console.log("Comments input received");

	//	Create new comment
	try {
		const comments = await ModelComments.create({
            "name"		:  req.user.name,
            "comments"	:  req.body.comments,
			"customer_id"  	:  req.user.uuid,
			"stream_id" :  req.params.streamId,
			"validUser" :  true,
		});
		return res.redirect("/live/" + req.params.streamId);
	}
	catch (error) {
		//	Else internal server error
		console.error(`Failed to create a new comment: ${req.body.comments} `);
		console.error(error);
		return res.status(500).end();
	}
}

/**
 * Renders the create page and Update Comment
 * @param {Request}  req Express request object
 * @param {Response} res Express response object
 */
 async function update_process(req, res) {

	try {
		const contents = await ModelComments.findOne({
			where: { 
				[Op.and]: [
					{"uuid": req.params["uuid"]},
					{"stream_id": req.params["stream_id"]},
				]
			} 
		});

		const data = {
			"comments": req.body.update_comments,
			'dateCreated': new Date(),
		};
		await (await contents.update(data)).save();	
		return res.redirect(`/live/` + req.params["stream_id"]);
	}
	catch(error) {
		console.error(`Failed to update comment: ${req.params.uuid}`);
		console.error(error);
		return res.redirect(500, "/live/" + req.params["stream_id"])
	}	
}

/**
 * Delete Comments
 * @param {Request}  req Express request  object
 * @param {Response} res Express response object
 */
async function delete_process(req, res) {
	const regex_uuidv4 = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{12}$/i

	if (!regex_uuidv4.test(req.params.uuid))
		return res.status(400);

        try {
            const del = await ModelComments.destroy({
				where: { 
					[Op.and]: [
						{"uuid": req.params["uuid"]},
						{"stream_id": req.params["stream_id"]},
					]
				} 
			});
    
            if (del == 1) {    
                console.log(`Deleting comment for uuid: ${req.params.uuid}`);
                console.log(`Comment deleted`);
                return res.redirect("/live/" + req.params["stream_id"]);
            }
            else {
                console.error(`More than one entries of: ${req.params.uuid}, Total: ${del}`);
                return res.status(409);
            }
        }
        catch (error) {
		console.error(`Failed to delete comment: ${req.params.uuid}`);
		console.error(error);
		return res.status(500);
	}
}