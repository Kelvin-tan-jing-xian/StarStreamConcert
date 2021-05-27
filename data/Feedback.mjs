import ORM from 'sequelize'
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
export class ModelFeedback extends Model {
	/**
	 * Initializer of the model
	 * @see Model.init
	 * @access public
	 * @param {Sequelize} database The configured Sequelize handle
	**/
	static initialize(database) {
		ModelFeedback.init({
			// If u make any changes to these columns, u have to drop table and recreate 
			"uuid"       : { type: DataTypes.CHAR(36),    primaryKey: true, defaultValue: DataTypes.UUIDV4 },
			"dateCreated": { type: DataTypes.DATE(),      allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
			"dateUpdated": { type: DataTypes.DATE(),      allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
			"name": {type: DataTypes.STRING(64), defaultValue:"IDK", allowNull: false},
			"Rating"  : { type: DataTypes.STRING(64),  allowNull: false },
			"feedbackResponse" : { type: DataTypes.STRING(128), allowNull: false },
			"feedbackType" : {  type: DataTypes.STRING(64), allowNull: false},
			"reply": { type: DataTypes.STRING(64), defaultValue: "", allowNull: false},
											// If u change the ENUM(), need to drop and recreate
			"role"       : { type: DataTypes.ENUM(UserRole.Customer, UserRole.Performer), defaultValue: UserRole.Customer, allowNull: false },
			"verified"   : { type: DataTypes.BOOLEAN,     allowNull: false, defaultValue: false }
		}, {
			"sequelize": database,
			"modelName": "Feedbacks",
			"hooks"    : {
				"afterUpdate": ModelFeedback._auto_update_timestamp
			}
		});
	}

	/**
	 * Emulates "TRIGGER" of "AFTER UPDATE" in most SQL databases.
	 * This function simply assist to update the 'dateUpdated' timestamp.
	 * @private
	 * @param {ModelFeedback}     instance The entity model to be updated
	 * @param {UpdateOptions} options  Additional options of update propagated from the initial call
	**/
	static _auto_update_timestamp(instance, options) {
		// @ts-ignore
		instance.dateUpdated = Sequelize.literal('CURRENT_TIMESTAMP');
	}

	get role()  { return this.getDataValue("role"); }
	get uuid()  { return this.getDataValue("uuid"); }
	get feedbackResponse() { return this.getDataValue("feedbackResponse"); }
}