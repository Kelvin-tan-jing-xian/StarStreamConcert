//	STAND ALONE EXAMPLE, runs alone


//	The bare minimum includes or imports
import ORM             from 'sequelize';
const { Sequelize, DataTypes, Model, Op } = ORM;


///	Configuration phase

/**
 * Database configuration
 */
const Config = {
	database: 'itp211',
	username: 'itp211',
	password: 'itp211',
	host    : 'localhost',
	port    : 3306
};


/**
 * Database reference with Sequelize ORM
 */
export const Database = new Sequelize(
	Config.database, Config.username, Config.password, {
	port:     Config.port,
	host:     Config.host,      // Name or IP address of MySQL server
	dialect: 'mysql',           // Tells sequelize that MySQL is used
	operatorsAliases: false,
	define: {
		timestamps: false       // Don't create timestamp fields in database
	},
	pool: {                     // Database system params, don't need to know
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000
	}
});


//	Initialization phase
try {
	await Database.authenticate();
}
catch (error) {
	console.error(`Error connecting to database`);
}

console.log(`Database connection successful`);


//	Init your models
import { ModelUser, UserRole } from './data/user.mjs';

//	Put your models here
ModelUser.initialize(Database);

//	Sync your database
Database.sync({ drop: false });	//	drop is true => clear tables, recreate

//------------ Init completed
console.log(`Database init completed`);


////	-----	C R U D -----

import Hash from 'hash.js';

///	CREATE
const user = await ModelUser.create({
	"name":     "Test user",
	"email":    "test@mail.com",
	"password":  Hash.sha256().update("P@ssw0rd").digest("hex")
});

console.log(`User created: ${user.uuid}`);

//	Remember the user id
const uid  = user.uuid;


///	Update a user or all users?
//	FOR 1 MODEL

const target = await ModelUser.findOne({
	where: {
		"email": "shit@mail.com"
	}
});

console.log(`Found user : ${target.uuid}`);
//	Update the found instance
target.name = "Unholy Shit";
target.save();

//	UPDATE MULTIPLE (2 SOLUTION)

//	SOLUTION A
const targets = await ModelUser.findAll({
	where: {
		"email": "test@mail.com"
	}
});

console.log(`Found ${targets.length} to be updated`);
// targets.forEach (t => {
// 	t.name = "idiot";
// 	t.save();
// });


//	SOLUTION B
const [affected, result] = await ModelUser.update({
	"name": "Pundei"
}, {
	where: {
		"email": "test@mail.com"
	}
});

console.log(`Number of affected users : ${affected}`);


//	Retrieval 
const users_created_today = await ModelUser.findAll({
	where: {
		"dateCreated": {
			[Op.gt]: "2021-05-16"
		}
	}
});

console.log(`Users created today:`);
users_created_today.forEach (u => console.log(`User id ${u.uuid} ${u.name}`));

console.log(`Users created today:`);
for (var i = 0; i < users_created_today.length; ++i) {
	console.log(`User id ${users_created_today[i].uuid} ${users_created_today[i].name}`);
}

//	Paging
const qty       = await ModelUser.count({
	where: { "dateCreated": { [Op.gt]: "2021-05-16" } }
});
const pageSize  = 3;
const pageTotal = Math.ceil(qty / pageSize);	//	Int division ?? floored

const page_one = await ModelUser.findAll({ 
	where: { "dateCreated": { [Op.gt]: "2021-05-16" } },
	offset:  0,
	limit:   pageSize
});

page_one.forEach (u => console.log(`Page 1: ${u.uuid} ${u.name}`));

//	http://localhost:3000/list?pageSize=10&page=5&sortBy=dateCreated&order=Asc
// req.query.pageSize = 10
// req.query.page     = 5

for (var i = 0; i < pageTotal; ++i) {
	const page = await ModelUser.findAll({ 
		where: { "dateCreated": { [Op.gt]: "2021-05-16" } },
		offset:  i * pageSize,
		limit:   pageSize
	});
	page.forEach (u => console.log(`Page ${i + 1}: ${u.uuid} ${u.name}`));

	//	res.render("list", {
	//		listOfUSers: page
	//	});
}



//	DELETE
//	DELETE ONE OR DELETE MASS
await user.destroy();

//	Delete All
const deleted = await ModelUser.destroy({
	where: { 
		"name": "Pundei"
	}
});

console.log(`Deleted ${deleted} users`);


//	THE END OF YOUR AWESOME CRUD EXAMPLE