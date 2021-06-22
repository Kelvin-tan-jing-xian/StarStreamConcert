import ORM from 'sequelize';
import { UserRole } from '../data/user.mjs';
const { Sequelize, DataTypes, Model } = ORM;


/**
 * A database entity model that represents contents in the database.
 * This model is specifically designed for users
 * @see "https://sequelize.org/master/manual/model-basics.html#taking-advantage-of-models-being-classes"
**/
export class ModelComments extends Model {
	/**
	 * Initializer of the model
	 * @see Model.init
	 * @access public
	 * @param {Sequelize} database The configured Sequelize handle
	**/
	static initialize(database) {
		ModelComments.init({
			"uuid"       : { type: DataTypes.CHAR(36),    primaryKey: true, defaultValue: DataTypes.UUIDV4 },
			"stream_id"   : { type: DataTypes.CHAR(36), 	  allowNull: false},
			"user_id"   : { type: DataTypes.CHAR(36), 	  allowNull: false},
            "name"       : { type: DataTypes.STRING(64),  allowNull: false },
			"dateCreated": { type: DataTypes.DATE(),      allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
			"comments"   : { type: DataTypes.STRING(500), allowNull: false },
			"validUser"	 : { type: DataTypes.BOOLEAN,    allowNull: false },
		}, {
			"sequelize": database,
			"modelName": "Comments",
			"hooks"    : {
				"afterUpdate": ModelComments._auto_update_timestamp
			}
		});
	}

	/**
	 * Emulates "TRIGGER" of "AFTER UPDATE" in most SQL databases.
	 * This function simply assist to update the 'dateUpdated' timestamp.
	 * @private
	 * @param {ModelComments}     instance The entity model to be updated
	 * @param {UpdateOptions} options  Additional options of update propagated from the initial call
	**/
	static _auto_update_timestamp(instance, options) {
		// @ts-ignore
		instance.dateUpdated = Sequelize.literal('CURRENT_TIMESTAMP');
	}

	get uuid()  { return this.getDataValue("uuid"); }
	get user_id()  { return this.getDataValue("user_id"); }
    get name()  { return this.getDataValue("name"); }
    get dateCreated() { return this.getDataValue("dateCreated"); }
	get comments() { return this.getDataValue("comments"); }
}