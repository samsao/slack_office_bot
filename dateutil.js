/**
 * This class is for date util methods.
 */

/**
 * Constructor
 */
function DateUtil() {
	this.dayNames = new Array(7);
	this.dayNames[0] = "Monday";
	this.dayNames[1] = "Tuesday";
	this.dayNames[2] = "Wednesday";
	this.dayNames[3] = "Thursday";
	this.dayNames[4] = "Friday";
	this.dayNames[5] = "Saturday";
	this.dayNames[6] = "Sunday";
}

DateUtil.prototype.currentDay = function() {
	var date = new Date();
	var day = date.getDay() - 1; //0 for us is monday
	//this will return sunday as 6 instead of -1
	if (day == -1) {
		return 6;
	}
	return day;
}

DateUtil.prototype.previousDay = function() {
	var yesterday = this.currentDay() - 1;
	
	//if it is monday, the previous day for the bot is friday.
	if (yesterday == -1) {
		return 4;
	}
	return yesterday;
}
module.exports = DateUtil;