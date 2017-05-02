/**
 * This class is for date util methods.
 */

/**
 * Constructor
 */
function DateUtil() {
	this.dayNames = new Array(7);

	this.dayNames[0] = "Sunday";
	this.dayNames[1] = "Monday";
	this.dayNames[2] = "Tuesday";
	this.dayNames[3] = "Wednesday";
	this.dayNames[4] = "Thursday";
	this.dayNames[5] = "Friday";
	this.dayNames[6] = "Saturday";
}

DateUtil.prototype.currentDay = function() {
	var date = new Date();
	var day = date.getDay(); //0 for us is Sunday
	return day;
}

DateUtil.prototype.previousDay = function() {
	var yesterday = this.currentDay() - 1;
	
	//if it is Sunday (0), the previous day for the bot is Saturday.
	if (yesterday == -1) {
		return 6;
	}
	return yesterday;
}
module.exports = DateUtil;