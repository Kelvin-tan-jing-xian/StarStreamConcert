import ORM from 'sequelize';
import { UserRole } from '../data/user.mjs';

const { Sequelize, DataTypes, Model } = ORM;


/**
 * A database entity model that represents contents in the database.
 * This model is specifically designed for users
 * @see "https://sequelize.org/master/manual/model-basics.html#taking-advantage-of-models-being-classes"
**/
export class ModelVenue extends Model {
	/**
	 * Initializer of the model
	 * @see Model.init
	 * @access public
	 * @param {Sequelize} database The configured Sequelize handle
	**/
	static initialize(database) {
		ModelVenue.init({
			"uuid"       : { type: DataTypes.CHAR(36),    primaryKey: true, defaultValue: DataTypes.UUIDV4, allowNull: false },
			"dateCreated": { type: DataTypes.DATE(),      allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
			"dateUpdated": { type: DataTypes.DATE(),      allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
			"venueName"  : { type: DataTypes.STRING(64),  allowNull: false },
			"venueStory" : { type: DataTypes.STRING(12800), allowNull: false },
			"venuePrice" : {  type: DataTypes.DECIMAL, allowNull: false},
			"venuePoster": {  type: DataTypes.STRING(128),allowNull: false},  // change to false once you can file upload
		
		}, {
			"sequelize": database,
			"modelName": "Venues",
			"hooks"    : {
				"afterUpdate": ModelVenue._auto_update_timestamp
			}
		});
	}

	/**
	 * Emulates "TRIGGER" of "AFTER UPDATE" in most SQL databases.
	 * This function simply assist to update the 'dateUpdated' timestamp.
	 * @private
	 * @param {ModelVenue}     instance The entity model to be updated
	 * @param {UpdateOptions} options  Additional options of update propagated from the initial call
	**/
	static _auto_update_timestamp(instance, options) {
		// @ts-ignore
		instance.dateUpdated = Sequelize.literal('CURRENT_TIMESTAMP');
	}

	get role()  { return this.getDataValue("role"); }
	get uuid()  { return this.getDataValue("uuid"); }
	get venueStory() { return this.getDataValue("venueStory"); }
	get venuePrice() { return this.getDataValue("venuePrice"); }
}