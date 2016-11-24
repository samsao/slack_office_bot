/**
 * This class represents a task message action
 */

/**
 * Constructor
 */
var TaskMessageAction = function(name, text, type, value) {
	this.name = name;
	this.text = text;
	this.type = type;
	this.value = value;
}

module.exports = TaskMessageAction;