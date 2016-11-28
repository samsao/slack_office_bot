const Constants = require("./constants");

function HelpCommands() {
	//Dictionary with command as key and description as value.
	this.commands = {};
	this.commands[Constants.ListTasks] = 'You can call me by messaging `@officebot ' + Constants.ListTasks + '` and I\'ll list all the tasks for today';
	this.commands[Constants.ListMyTasks] = 'By sending `' + Constants.ListMyTasks + '` in private message, I can list you all your tasks';
	this.commands[Constants.Help] = 'You can ask for help again anytime by tagging or sending me `'+Constants.Help+'`';
}

module.exports = HelpCommands;