import ORM from 'sequelize';

const { Sequelize, DataTypes, Model } = ORM;

/**
 * For enumeration use
**/
export class UserRole {
	static get User() { return "user"; }
	static get Customer() { return "customer"; }
	static get Performer() { return "performer"; }
	static get Admin() { return "admin"; }
}

/**
 * A database entity model that represents contents in the database.
 * This model is specifically designed for users
 * @see "https://sequelize.org/master/manual/model-basics.html#taking-advantage-of-models-being-classes"
**/
export class ModelUser extends Model {
	/**
	 * Initializer of the model
	 * @see Model.init
	 * @access public
	 * @param {Sequelize} database The configured Sequelize handle
	**/
	static initialize(database) {
		ModelUser.init({
			//  Must drop table if u change anything here
			"uuid"       : { type: DataTypes.CHAR(36),    primaryKey: true, defaultValue: DataTypes.UUIDV4 },
			"dateCreated": { type: DataTypes.DATE(),      allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
			"dateUpdated": { type: DataTypes.DATE(),      allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
			"name"       : { type: DataTypes.STRING(64),  allowNull: false },
			"email"      : { type: DataTypes.STRING(128), allowNull: false },
			"password"   : { type: DataTypes.STRING(64),  allowNull: false },
			"role"       : { type: DataTypes.ENUM(UserRole.Customer, UserRole.Performer, UserRole.Admin), defaultValue: UserRole.Customer, allowNull: false },
			"verified"   : { type: DataTypes.BOOLEAN,     allowNull: false, defaultValue: false },
			"profile_pic": { type: DataTypes.STRING(64), allowNull: false, defaultValue: "public/img/profile.png"},
		}, {
			"sequelize": database,
			// can be "user"
			"modelName": "Users",
			"hooks"    : {
				"afterUpdate": ModelUser._auto_update_timestamp
			}
		});
	}

	/**
	 * Emulates "TRIGGER" of "AFTER UPDATE" in most SQL databases.
	 * This function simply assist to update the 'dateUpdated' timestamp.
	 * @private
	 * @param {ModelUser}     instance The entity model to be updated
	 * @param {UpdateOptions} options  Additional options of update propagated from the initial call
	**/
	static _auto_update_timestamp(instance, options) {
		// @ts-ignore
		instance.dateUpdated = Sequelize.literal('CURRENT_TIMESTAMP');
	}
	verify(){ this.setDataValue("verified", true); }
	// setAdmin() { this.setDataValue("role", "admin");}
	get role()  { return this.getDataValue("role"); }
	get uuid()  { return this.getDataValue("uuid"); }
	get email() { return this.getDataValue("email"); }
}