import ORM from 'sequelize';
import { UserRole } from '../data/user.mjs';

const { Sequelize, DataTypes, Model } = ORM;


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
			"user_id"       : { type: DataTypes.CHAR(36),    primaryKey: true, defaultValue: DataTypes.UUIDV4 },
			"dateCreated": { type: DataTypes.DATE(),      allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
			"dateUpdated": { type: DataTypes.DATE(),      allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
			"name": {type: DataTypes.STRING(64), defaultValue:"IDK", allowNull: false},
			"email"      : { type: DataTypes.STRING(128), allowNull: false },
			"Rating"  : { type: DataTypes.STRING(64),  allowNull: false },
			"feedbackGiven" : { type: DataTypes.STRING(128), allowNull: false },
			"feedbackType" : {  type: DataTypes.STRING(64), allowNull: false},
			"reply": { type: DataTypes.STRING(64), defaultValue: "", allowNull: false},
											// If u change the ENUM(), need to drop and recreate
			"role"       : { type: DataTypes.ENUM(UserRole.Customer, UserRole.Performer), defaultValue: UserRole.Customer, allowNull: false },
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
}