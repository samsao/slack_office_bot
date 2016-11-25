/**
 * This class represents a task
 */

/**
 * Constructor
 */
var Task = function(id, title, description, tacos, day) {
	this.id = id
	this.title = title;
	this.description = description;
	this.tacos = tacos;
	this.day = day;
	this.assignee = null;
	this.done = false;
}

module.exports = Task;