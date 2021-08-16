import Passport from 'passport';
import { Strategy } from 'passport-local';
import Hash from 'hash.js';
import { ModelUser } from '../data/User.mjs';

/**
 * Initialize the passport and configure local strategy
 * @param {import('express').Express} server 
 */
export function initialize_passport(server) {
	Passport.use(LocalStrategy);
	Passport.serializeUser(async function (user, done) {
		return done(null, user.uuid);
	});
	Passport.deserializeUser(async function (uid, done) {
		try {
			const user = await ModelUser.findByPk(uid);
			if (user == null) {
				throw new Error ("Invalid user id. It could be because you deleted this current account. Use incognito to solve this problem");
			}
			else {
				// no errors
				return done(null, user);
			}
		}
		catch (error) {
			console.error(`Failed to deserialize user ${uid}`);
			console.error(error);
			return done (error, false);
		}
	})

	server.use(Passport.initialize());
	server.use(Passport.session());
}

const LocalStrategy = new Strategy ({
	usernameField: "email",
	passwordField: "password"
}, async function (email, password, done) {

	try {
		const user = await ModelUser.findOne({where: {
			email:    email,
			password: Hash.sha256().update(password).digest('hex')
		}});

		if (user == null) {
			throw new Error ("Invalid Credentials, the email you entered is not registered");
		}
		else {
			return done(null, user);
		}
	}
	catch (error) {
		console.error(`Failed to auth user ${email}`);
		console.error(error);
		return done(error, false, {message: "Invalid user credentials"});
	}
});