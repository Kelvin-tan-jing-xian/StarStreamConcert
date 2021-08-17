import Http             from 'http';
import Express from "express";
import ExpHandlebars from "express-handlebars";
import ExpSession from "express-session";
import BodyParser from "body-parser";
import CookieParser from "cookie-parser";

import MethodOverrides from "method-override";
import Path from "path";

import Flash from "connect-flash";
import FlashMessenger from "flash-messenger";

import Handlebars from "handlebars";
import { allowInsecurePrototypeAccess } from "@handlebars/allow-prototype-access";

import nodemailer from "nodemailer";
import {google} from "googleapis";

import { initialize_https } from './utils/https.mjs';

const Server = Express();
const ServerHttp  = Http.createServer(Server);
const ServerHttps = initialize_https(Server);
const Port = process.env.PORT || 3000;

// const { google } = require('googleapis');


// These id's and secrets should come from .env file.
const CLIENT_ID = '676747649537-dldinldb4oehsaf21ppj9erusdr8vt13.apps.googleusercontent.com';
const CLIENT_SECRET = 'H_xdl_7rL4O2_KbWXrou5eoI';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//047raAoa1FVduCgYIARAAGAQSNwF-L9Irkox21YPTpv2U0d24th7e5sdopkCWt2d8-4_DaiZUdKT_JVclj_2HNj0Lb87E_MdbcOc';


const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

export async function sendMail(email) {
    try {
      const accessToken = await oAuth2Client.getAccessToken();

      const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: 'trumenlim@gmail.com',
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          refreshToken: REFRESH_TOKEN,
          accessToken: accessToken,
        },
      });

      const mailOptions = {
        from: 'TRUMENLIM<trumenlim@gmail.com>',
        to: email,
        subject: 'Password reset for StarStream',
        text: 'To reset the password for your account, click on the link below:',
        html: `<h3>To reset the password for your account, click on the link below</h3><a href="https://localhost/auth/reset/${email}" target="_blank"`,
      };

      const result = await transport.sendMail(mailOptions);
      return result;
    } catch (error) {
      return error;
    }
  }
 






  

/**
 * Template Engine
 * You may choose to use Nunjucks if you want to recycle everything from your old project.
 * Strongly recommended. However, do note the minor differences in syntax. :)
 * Trust me it saves your time more.
 * https://www.npmjs.com/package/express-nunjucks
 */
Server.set("views", "templates"); //	Let express know where to find HTML templates
Server.set("view engine", "handlebars"); //	Let express know what template engine to use
Server.engine(
  "handlebars",
  ExpHandlebars({
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    defaultLayout: "main",
  })
);
//	Let express know where to access static files
//	Host them at localhost/public
Server.use("/public", Express.static("public"));

/**
 * Form body parsers etc
 */
Server.use(BodyParser.urlencoded({ extended: false }));
Server.use(BodyParser.json());
Server.use(CookieParser());
Server.use(MethodOverrides("_method"));

import { SessionStore, initialize_database } from "./data/database.mjs";
/**
 * Express Session
 */
Server.use(
  ExpSession({
    name: "example-app",
    secret: "random-secret",
    store: SessionStore,
    resave: false,
    saveUninitialized: false,
  })
);

import { initialize_passport } from "./utils/passport.mjs";

/**
 * Initialize passport
 **/
initialize_passport(Server);

/**
 * Initialize database
 */
initialize_database(false);

/**
 * Flash Messenger
 */
Server.use(Flash());
Server.use(FlashMessenger.middleware);

//-----------------------------------------

//-----------------------------------------

/**
 * TODO: Setup global contexts here. Basically stuff your variables in locals
 */
Server.use(function (req, res, next) {
  res.locals.user = req.user || null;
  res.locals.stream = req.stream || null;
  next();
});

import Routes from "./routes/main.mjs";
Server.use("/", Routes);

/**
 * DEBUG USAGE
 * Use this to check your routes
 * Prints all the routes registered into the application
 **/
import { ListRoutes } from "./utils/routes.mjs";
console.log(`=====Registered Routes=====`);
ListRoutes(Server._router).forEach((route) => {
  console.log(`${route.method.padStart(8)} | /${route.path}`);
});
console.log(`===========================`);


import { initialize_socket } from './utils/socket.mjs';
initialize_socket(Server, ServerHttps);
/**
 * Start the server in infinite loop
 */
 ServerHttp.listen(Port, function() {
	console.log(`Server listening at port ${Port}`);
});

ServerHttps.listen(443, function () {
	console.log(`Server listening at port ${443}`);
});
