/**
 * This class is for util methods.
 */

/**
 * Constructor
 */
function Util() {
	this.dayNames = new Array(7);
	this.dayNames [0] = "Sunday";
	this.dayNames [1] = "Monday";
	this.dayNames [2] = "Tuesday";
	this.dayNames [3] = "Wednesday";
	this.dayNames [4] = "Thursday";
	this.dayNames [5] = "Friday";
	this.dayNames [6] = "Saturday";
}

Util.prototype.currentDay = function() {
	var date = new Date();
	var day = date.getDay() - 1; //0 for us is monday
	//this will return sunday as 6 instead of -1
	if (day == -1) {
		return 6;
	}
	return day
}
module.exports = Util;