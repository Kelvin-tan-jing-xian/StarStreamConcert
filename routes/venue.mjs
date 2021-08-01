import { Router } from "express";
// must be caps
import { ModelUser } from "../data/user.mjs";
import { ModelVenue } from "../data/Venue.mjs";
import { ModelVenueBookings } from "../data/VenueBookings.mjs";
import { flashMessage } from "../utils/flashmsg.mjs";

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
router.post("/payment/:uuid", booking_payment_process);
router.get("/myPurchases", myPurchases_page);

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
    // const filter    = JSON.parse(req.query.filter);
    // console.log(filter);

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
    // const condition = {
    //   "venueName":  { [Op.substring]: filter.venueName },
    //   "venueStory": { [Op.substring]: filter.venueStory}
    // }

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
    console.error("Failed to retrieve json data");
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
    var bought = false;
    // const booking = await ModelVenueBookings.findAll({
    //   where:{
    //     performer_id: req.user.uuid
    //   }
    // });
    if (req.user.uuid == ModelVenueBookings.performer_id) {
      bought = true;
    }

    return res.render("venue/book", {
      cust: cust,
      perf: perf,
      admin: admin,
      bought: bought,
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
    //   var computed = content.concertPrice * 100;

    // const totalSlots = ["10am ~ 1pm", "3pm ~ 6pm", "7pm ~ 10pm", "12pm ~ 3am"];
    // var bookedSlots = await ModelVenueBookings.findAll({
    //   where: {
    //     //venue_id:
    //     //venueDate:
    //     //venueTime:
    //     //show time slots only after date is selected
    //     [Op.in]: totalSlots,
    //   }
    // });
    // bookedSlots = bookedSlots.map(booking => booking.venueTime);
    // var availableSlots = totalSlots.filter(x=>!bookedSlots.includes(x));
    if (content) {
      return res.render("venue/payment", {
        cust: cust,
        perf: perf,
        admin: admin,
        content: content,
        // computed:computed,
        // availableSlots:availableSlots,
      });
    }
  } catch (error) {
    console.error(`Failed to access venue payment page ${req.params["uuid"]}`);
    console.error(error);
    return res.status(500).end(); //	Internal server error	# Usually should not even happen !!
  }
}

/**
 * Process the payment form
 * @param {import('express').Request}  req Express Request handle
 * @param {import('express').Response} res Express Response handle
 */
async function booking_payment_process(req, res) {
  console.log("booking details received");
  console.log(req.body);

  // Add in form validations
  //
  //	Create new venue, now that all the test above passed
  try {
    if (!req.body.venueDate) {
      throw Error("Missing venueDate");
    }
    if (!req.body.venueTime) {
      throw Error("Missing venueTime");
    }
    if (!req.body.amount) {
      throw Error("Missing amount");
    }


    const venuebooking = await ModelVenueBookings.create({
      venue_id: req.params.uuid,
      performer_id: req.user.uuid,
      venueDate: req.body.venueDate,
      venueTime: req.body.venueTime,
    });


    flashMessage(
      res,
      "success",
      "Successfully created a booking",
      "fas fa-sign-in-alt",
      true
    );
    return res.redirect(`/venue/myPurchases`); // don't use render
  } catch (error) {
    //	Else internal server error
    console.error(`Failed to create a new booking: performer_id ${req.user.uuid} `);
    console.error(error);
    return res.status(500).end();
  }
}

/**
 * Renders myPurchases page.
 * @param {Request}  req Express request object
 * @param {Response} res Express response object
 */
async function myPurchases_page(req, res) {
  console.log("myPurchases page accessed");
  console.log(req.user);
  var role = roleResult(req.user.role);
  var cust = role[0];
  var perf = role[1];
  var admin = role[2];
  // try {
    // const venue = await ModelVenue.findOne({
    //   where:{
    //     "uuid": req.params.uuid }
    // },{
    //   include: ModelUser
    // });
    // ModelUser.hasMany(ModelVenue, { as: 'Venue' });
    // ModelVenue.hasMany(ModelUser, { as: 'Performers'})
    // Format is Model.get<TableName>()
    // /** @type {[ModelVenue]} */
    // const booked = await venue.getPerformers();
    // console.log(booked);
    // for (var index = 0; index < booked.length; index++) {
    //   // booked[index].<tableName>;
    //   booked[index].Venuebookings.venueDate = req.body.venueDate;
    //   booked[index].Venuebookings.venueTime = req.body.venueTime;
    //   booked[index].Venuebookings.save();
    // }

//Stopped here djwiqdjidjwqidqid

    // const user   = await ModelUser.findOne({
    //   where: { uuid: req.user.uuid }
    // });
    // find the venue that you chose to buy
    const booked = await ModelVenueBookings.findAll({
      where:   { performer_id: req.user.uuid },
      raw:  true
    });

    const bookings = [];

    for (const book of booked) {
      bookings.push({
          "booking": book,
          "venue": await ModelVenue.findByPk(book.venue_id, { raw: true})
      })
    }

    if (booked) {
      return res.render("venue/myPurchases", {
        cust: cust,
        perf: perf,
        admin: admin,
        bookings: bookings
      });
    }
    else {
      console.error(`Failed to render myPurchases page cuz booked is null with venue_id : ${req.params["uuid"]}`);
      console.error(error);
      return res.status(410).end();
    }

  // } catch (error) {
  //   console.error(`Failed to access myPurchases page with venue_id:  ${req.params["uuid"]}`);
  //   console.error(error);
  //   return res.status(500).end(); //	Internal server error	# Usually should not even happen !!
  // }
}

async function viewMyPurchases_page(req, res) {
  console.log("myPurchases page accessed");
  var role = roleResult(req.user.role);
  var cust = role[0];
  var perf = role[1];
  var admin = role[2];
  try {
    const booked = await ModelVenueBookings.findAll({
      where:   { performer_id: req.user.uuid },
      raw:  true
    });

    const bookings = [];

    for (const book of booked) {
      bookings.push({
          "booking": book,
          "venue": await ModelVenue.findByPk(book.venue_id, { raw: true})
      })
    }
    if (booked) {
      return res.render("venue/myPurchases", {
      cust: cust,
      perf: perf,
      admin: admin,
      bookings: bookings,
      });

    }
  } catch (error) {
    console.error(`Failed to access myPurchases page ${req.user["uuid"]}`);
    console.error(error);
    return res.status(500).end(); //	Internal server error	# Usually should not even happen !!
  }
}
