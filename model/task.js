/**
 * This class represents a task
 */

/**
 * Constructor
 */
var Task = function(title, description, tacos, day) {
	this.title = title;
	this.description = description;
	this.tacos = tacos;
	this.day = day;
	this.assignee = null;
	this.done = false;
}

module.exports = Task;