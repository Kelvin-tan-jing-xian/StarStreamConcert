import ORM from 'sequelize';
import { UserRole } from '../data/user.mjs';
const { Sequelize, DataTypes, Model } = ORM;


/**
 * A database entity model that represents contents in the database.
 * This model is specifically designed for streams
 * @see "https://sequelize.org/master/manual/model-basics.html#taking-advantage-of-models-being-classes"
**/
export class ModelTicket extends Model {
	/**
	 * Initializer of the model
	 * @see Model.init
	 * @access public
	 * @param {Sequelize} database The configured Sequelize handle
	**/
	static initialize(database) {
		ModelTicket.init({
			"uuid"       : { type: DataTypes.CHAR(36),    primaryKey: true, defaultValue: DataTypes.UUIDV4 },
            "stream_id"  : { type: DataTypes.CHAR(36)},
            "user_id"    : { type: DataTypes.CHAR(36)},
			"dateCreated": { type: DataTypes.DATE(),      allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
			"dateUpdated": { type: DataTypes.DATE(),      allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
			"concertName"       : { type: DataTypes.STRING(64),  allowNull: false },
			"artistName" : { type: DataTypes.STRING(64), allowNull: false },
			"concertDate"      : { type: DataTypes.DATE(), allowNull: false },
			"concertTime"   : { type: DataTypes.STRING(64),  allowNull: false },
			"concertPrice":   { type: DataTypes.STRING(64), allowNull: false },
		}, {
			"sequelize": database,
			"modelName": "Tickets",
			"hooks"    : {
				"afterUpdate": ModelTicket._auto_update_timestamp
			}
		});
	}

	/**
	 * Emulates "TRIGGER" of "AFTER UPDATE" in most SQL databases.
	 * This function simply assist to update the 'dateUpdated' timestamp.
	 * @private
	 * @param {ModelStream}     instance The entity model to be updated
	 * @param {UpdateOptions} options  Additional options of update propagated from the initial call
	**/
	static _auto_update_timestamp(instance, options) {
		// @ts-ignore
		instance.dateUpdated = Sequelize.literal('CURRENT_TIMESTAMP');
	}

}