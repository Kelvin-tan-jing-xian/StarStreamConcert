import { Router }       from 'express';
import { ModelComments }    from '../data/Comments.mjs';
import ORM   from 'sequelize';

const { Op } = ORM;
const router = Router();
export default router;

// customer can create, update, delete own comments
router.get("/create", create_retrieve_page);
router.post("/create", create_process);
router.post("/update/:uuid", update_process);
router.delete("/delete/:uuid", delete_process);


/**
 * Renders the create page and Retrieve comments
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function create_retrieve_page(req, res) {
	console.log("create comment page accessed");
	try{
		const comment_Mod = await ModelComments.findAll({
			attributes: ['uuid','name', 'comments', 'dateCreated', 'user_id', "validUser"]
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
				if (comment_Mod[i].user_id == req.user.uuid) {
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
		return res.render('comments/create', {
			showComments: comment_Mod,
		});
	}
	catch(error){
		console.error('Failed to retrieve comment')
	}
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
			"user_id"  	:  req.user.uuid,
			"validUser" :  true,
		});
		return res.redirect("/comments/create");
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
		const contents = await ModelComments.findOne({where: { "uuid": req.params["uuid"] } });

		const data = {
			"comments": req.body.update_comments,
			'dateCreated': new Date(),
		};
		await (await contents.update(data)).save();	
		return res.redirect(`/comments/create`);
	}
	catch(error) {
		console.error(`Failed to update comment: ${req.params.uuid}`);
		console.error(error);
		return res.redirect(500, "/comments/create")
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
            const del = await ModelComments.destroy({where: { "uuid": req.params.uuid}});
    
            if (del == 1) {    
                console.log(`Deleting comment for uuid: ${req.params.uuid}`);
                console.log(`Comment deleted`);
                return res.redirect("/comments/create");
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