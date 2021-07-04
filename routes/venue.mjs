import { Router } from "express";
// must be caps
import { ModelVenue } from "../data/Venue.mjs";
// must be caps
import ORM from "sequelize";
const { Op } = ORM;
const router = Router();
export default router;

// all routes starts with /venue
// these CRUD only for admin
router.get("/retrieve-data", retrieve_data);
// performer book and pay venue
router.get("/book", book_page);
router.get("/book-data", book_page_retrieve_data);
router.get("/payment/:uuid", payment_page);
router.post("/myPurchases/:uuid", myPurchases_page);
router.get("/viewMyPurchases", viewMyPurchases_page);
router.get("/search", (req, res) => {
  try {
    var role = roleResult(req.user.role);
    var cust = role[0];
    var perf = role[1];
    var admin = role[2];
    console.log(cust);
    console.log(perf);
    console.log(admin);
    const { term } = req.query;
    ModelVenue.findAll({ where: { venueName: { [Op.substring]: term } } })
    .then(
      (venues) =>
        res.render("venue/book", {
          venues,
          cust: cust,
          perf: perf,
          admin: admin,
        })
    );
  } catch (error) {
    console.error(error);
  }
});
// This function helps in showing different nav bars
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
            venueName: { [Op.substring]: search },
            venueStory: { [Op.substring]: search },
          },
        }
      : undefined;
    const total = await ModelVenue.count({ where: conditions });
    const pageTotal = Math.ceil(total / pageSize);

    const pageContents = await ModelVenue.findAll({
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
    console.error("Failed to retrieve all venues");
    console.error(error);
    return res.status(500).end();
  }
}

/**
 * Renders the book page
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function book_page(req, res) {
  console.log("book page accessed");
  try {
    var role = roleResult(req.user.role);
    var cust = role[0];
    var perf = role[1];
    var admin = role[2];
    console.log("cust: " + cust);
    console.log("perf: " + perf);
    console.log("admin: " + admin);


    return res.render("venue/book", {
      cust: cust,
      perf: perf,
      admin: admin,
    });
  } catch (error) {
    console.error("Failed to draw book page");
    console.error(error);
    return res.status(500).end();
  }
}

/**
 * Provides bootstrap table with data
 * @param {import('express')Request}  req Express Request handle
 * @param {import('express')Response} res Express Response handle
 */
async function book_page_retrieve_data(req, res) {
  try {
    let pageSize = parseInt(req.query.limit);
    let offset = parseInt(req.query.offset);
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
            venueName: { [Op.substring]: search },
            venueStory: { [Op.substring]: search },
          },
        }
      : undefined;
    const total = await ModelVenue.count({ where: conditions });
    const pageTotal = Math.ceil(total / pageSize);

    const pageContents = await ModelVenue.findAll({
      offset: offset,
      limit: pageSize,
      where: conditions,
      raw: true, // Data only, model excluded
    });
    return res.json({
      total: total,
      rows: pageContents,
    });
  } catch (error) {
    console.error("Failed to retrieve data");
    console.error(error);
    return res.status(500).end();
  }
}









/**
 * Renders the venue payment page.
 * @param {Request}  req Express request object
 * @param {Response} res Express response object
 */
async function payment_page(req, res) {
  console.log("venuePayment page accessed");
  var role = roleResult(req.user.role);
  var cust = role[0];
  var perf = role[1];
  var admin = role[2];
  console.log("cust: " + cust);
  console.log("perf: " + perf);
  console.log("admin: " + admin);
  try {
    const content = await ModelVenue.findOne({
      where: { uuid: req.params.uuid },
    });
    console.log("Is content a list? " + content);
    if (content) {
      return res.render("venue/payment", {
        cust: cust,
        perf: perf,
        admin: admin,
        content: content,
      });
    } else {
      console.error(
        `Failed to access venue payment page ${req.params["uuid"]}`
      );
      console.error(error);
      return res.status(410).end();
    }
  } catch (error) {
    console.error(`Failed to access venue payment page ${req.params["uuid"]}`);
    console.error(error);
    return res.status(500).end(); //	Internal server error	# Usually should not even happen !!
  }
}

/**
 * Renders myPurchases page.
 * @param {Request}  req Express request object
 * @param {Response} res Express response object
 */
async function myPurchases_page(req, res) {
  console.log("myPurchases page accessed");
  var role = roleResult(req.user.role);
  var cust = role[0];
  var perf = role[1];
  var admin = role[2];
  try {
    // we need req.params.uuid to find the venue that you chose to buy
    const contents = await ModelVenue.findAll({
      where: { uuid: req.params.uuid },
    });
    const data = {
      user_id: req.user.uuid,
    };
    // this is wrong
    await (await contents[0].update(data)).save();

    const venues = await ModelVenue.findAll({
      where: {
        user_id: req.user.uuid,
      },
      order: [["venueName", "ASC"]],
      raw: true,
    });

    return res.render("venue/myPurchases", {
      cust: cust,
      perf: perf,
      admin: admin,
      venues: venues,
    });
  } catch (error) {
    console.error(`Failed to access myPurchases page ${req.params["uuid"]}`);
    console.error(error);
    return res.status(500).end(); //	Internal server error	# Usually should not even happen !!
  }
}

async function viewMyPurchases_page(req, res) {
  console.log("myPurchases page accessed");
  var role = roleResult(req.user.role);
  var cust = role[0];
  var perf = role[1];
  var admin = role[2];
  try {
    const venues = await ModelVenue.findAll({
      where: {
        user_id: req.user.uuid,
      },
      raw: true,
    });
    return res.render("venue/myPurchases", {
      cust: cust,
      perf: perf,
      admin: admin,
      venues: venues,
    });
  } catch (error) {
    console.error(`Failed to access myPurchases page ${req.user["uuid"]}`);
    console.error(error);
    return res.status(500).end(); //	Internal server error	# Usually should not even happen !!
  }
}
