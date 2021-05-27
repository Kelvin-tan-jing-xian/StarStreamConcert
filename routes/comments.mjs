import { Router }       from 'express';
import { ModelComments }    from '../data/Comments.mjs';

const router = Router();
export default router;


router.get("/stream", retrieve_comments);
router.post("/stream", create_comments);
router.post('/updateComment/:uuid', update_comment);
router.delete("/deleteComment/:uuid", delete_comment);


/**
 * Renders the stream page and Retrieve comments
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function retrieve_comments(req, res) {
	console.log("Stream comment page accessed");
	try{
		const comment_Mod = await ModelComments.findAll({
			attributes: ['uuid','name', 'comments', 'dateCreated']
		});
		return res.render('stream', {
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
 async function create_comments(req, res) {
	console.log("Comments input received");

	//	Create new comment
	try {
		const comments = await ModelComments.create({
            "name":     req.user.name,
            "comments":    req.body.comments,
		});
		return res.redirect("/stream");
	}
	catch (error) {
		//	Else internal server error
		console.error(`Failed to create a new comment: ${req.body.comments} `);
		console.error(error);
		return res.status(500).end();
	}
}

/**
 * Renders the stream page and Update Comment
 * @param {Request}  req Express request object
 * @param {Response} res Express response object
 */
 async function update_comment(req, res) {

	try {
		const contents = await ModelComments.findOne({where: { "uuid": req.params["uuid"] } });

		const data = {
			"comments": req.body.update_comments,
			'dateCreated': new Date(),
		};
		await (await contents.update(data)).save();	
		return res.redirect(`/stream`);
	}
	catch(error) {
		console.error(`Failed to update comment: ${req.params.uuid}`);
		console.error(error);
		return res.redirect(500, "/stream")
	}	
}

/**
 * Delete Comments
 * @param {Request}  req Express request  object
 * @param {Response} res Express response object
 */
async function delete_comment(req, res) {
	const regex_uuidv4 = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{12}$/i

	if (!regex_uuidv4.test(req.params.uuid))
		return res.status(400);

        try {
            const del = await ModelComments.destroy({where: { "uuid": req.params.uuid}});
    
            if (del == 1) {    
                console.log(`Deleting comment for uuid: ${req.params.uuid}`);
                console.log(`Comment deleted`);
                return res.redirect("/stream");
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