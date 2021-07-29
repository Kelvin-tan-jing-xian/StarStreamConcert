import ORM from 'sequelize';

const { Sequelize, DataTypes, Model } = ORM;


/**
 * A database entity model that represents contents in the database.
 * This model is specifically designed for users
 * @see "https://sequelize.org/master/manual/model-basics.html#taking-advantage-of-models-being-classes"
**/
export class ModelVenueBookings extends Model {
	/**
	 * Initializer of the model
	 * @see Model.init
	 * @access public
	 * @param {Sequelize} database The configured Sequelize handle
	**/
	static initialize(database) {
		ModelVenueBookings.init({
			// do I need booking_id?
            "venue_id"     : { type: DataTypes.CHAR(36),    primaryKey: true, allowNull: false },
			"performer_id" : { type: DataTypes.CHAR(36),    primaryKey: true, allowNull: false},
			"dateCreated"  : { type: DataTypes.DATE(),      allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
			"dateUpdated"  : { type: DataTypes.DATE(),      allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
			"venueDate"    : { type: DataTypes.STRING(64),  allowNull: false },
			"venueTime"    : { type: DataTypes.STRING(12800), allowNull: false },
		}, {
			"sequelize": database,
			"modelName": "VenueBookings",
			"hooks"    : {
				"afterUpdate": ModelVenueBookings._auto_update_timestamp
			}
		});
	}

	/**
	 * Emulates "TRIGGER" of "AFTER UPDATE" in most SQL databases.
	 * This function simply assist to update the 'dateUpdated' timestamp.
	 * @private
	 * @param {ModelVenueBookings}     instance The entity model to be updated
	 * @param {UpdateOptions} options  Additional options of update propagated from the initial call
	**/
	static _auto_update_timestamp(instance, options) {
		// @ts-ignore
		instance.dateUpdated = Sequelize.literal('CURRENT_TIMESTAMP');
	}

	/** The universally unique identifier of the user */
	get venue_id() { return String(this.getDataValue("venue_id")); }
	get performer_id()    { return String(this.getDataValue("performer_id")); }
	get venueDate()    { return String(this.getDataValue("venueDate")); }
	get venueTime()    { return String(this.getDataValue("venueTime")); }

// get() {
//       const rawValue = this.getDataValue(username);
//       return rawValue ? rawValue.toUpperCase() : null;
//     }
	set venue_id(venue_id) { this.setDataValue("venue_id", venue_id); }
	set performer_id(performer_id)    { this.setDataValue("performer_id", performer_id); }
	set venueDate(venueDate)    { this.setDataValue("venueDate", venueDate); }
	set venueTime(venueTime)    { this.setDataValue("venueTime", venueTime); }

}