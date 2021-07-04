import ORM from 'sequelize';
import { UserRole } from '../data/user.mjs';

const { Sequelize, DataTypes, Model } = ORM;


/**
 * A database entity model that represents contents in the database.
 * This model is specifically designed for streams
 * @see "https://sequelize.org/master/manual/model-basics.html#taking-advantage-of-models-being-classes"
**/
export class ModelStream extends Model {
	/**
	 * Initializer of the model
	 * @see Model.init
	 * @access public
	 * @param {Sequelize} database The configured Sequelize handle
	**/
	static initialize(database) {
		ModelStream.init({
			"uuid"       : { type: DataTypes.CHAR(36),    primaryKey: true, defaultValue: DataTypes.UUIDV4 },
			"performer_id": { type: DataTypes.CHAR(36),    primaryKey: true, defaultValue: DataTypes.UUIDV4 },
			"dateCreated": { type: DataTypes.DATE(),      allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
			"dateUpdated": { type: DataTypes.DATE(),      allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
			"concertName"       : { type: DataTypes.STRING(64),  allowNull: false },
			"artistName" : { type: DataTypes.STRING(64), allowNull: false },
			"concertStory": {type: DataTypes.STRING(64), allowNull: false },
			"concertDate"      : { type: DataTypes.DATEONLY, allowNull: false },
			"concertTime"   : { type: DataTypes.STRING(64),  allowNull: false },
			"concertPrice":   { type: DataTypes.DECIMAL, allowNull: false },
			"concertPoster": { type: DataTypes.STRING(64), allowNull: false},
		}, {
			"sequelize": database,
			"modelName": "Streams",
			"hooks"    : {
				"afterUpdate": ModelStream._auto_update_timestamp
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

	get role()  { return this.getDataValue("role"); }
	get uuid()  { return this.getDataValue("uuid"); }
	get concertDate() { return this.getDataValue("concertDate"); }
	get concertName() {return this.getDataValue("concertName"); }
	get artistName() {return this.getDataValue("artistName"); }
	get concertStory() {return this.getDataValue("concertStory"); }
	get concertTime() {return this.getDataValue("concertTime"); }
	get concertPrice() {return this.getDataValue('concertPrice'); }
	get concertPoster() {return this.getDataValue("concertPoster")}
}