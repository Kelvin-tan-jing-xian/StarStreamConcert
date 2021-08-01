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
			"ticket_id"       : { type: DataTypes.CHAR(36),    primaryKey: true, defaultValue: DataTypes.UUIDV4 },
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
get ticket_id() { return String(this.getDataValue("ticket_id"));}
get stream_id() { return String(this.getDataValue("stream_id"));}
get user_id() { return String(this.getDataValue("user_id"));}
get concertName() { return String(this.getDataValue("concertName"));}
get artistName() { return String(this.getDataValue("artistName"));}
get concertDate() { return String(this.getDataValue("concertDate"));}
get concertTime() { return String(this.getDataValue("concertTime"));}
get concertPrice() { return String(this.getDataValue("concertPrice"));}

set ticket_id(ticket_id) {this.setDataValue("ticket_id", ticket_id); }
set stream_id(stream_id) {this.setDataValue("stream_id", stream_id);}
set user_id(user_id) {this.setDataValue("user_id", user_id);}
set concertName(concertName) {this.setDataValue("concertName", concertName);}
set artistName(artistName) {this.setDataValue("artistName", artistName);}
set concertDate(concertDate) {this.setDataValue("concertDate", concertDate);}
set concertTime(concertTime) {this.setDataValue("concertTime", concertTime);}
set concertPrice(concertPrice) {this.setDataValue("concertPrice", concertPrice);}


}

