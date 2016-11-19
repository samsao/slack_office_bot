/**
 * This is the main bot file. All bot logic should go here.
 */
'use strict'

// imports
const fs = require('fs');
const Task = require('./model/task.js');

function Bot() {
	// tasks is a two-dimensional array where the first dimension is the group
	// and the second dimension are the tasks in the group.
	// It is to make it easier to group recurring tasks.
	this.tasks = [];
}

/**
 * Reads the tasks.json file and create the tasks.
 */
Bot.prototype.generateTasks = function() {
	// empty the tasks first
	this.tasks = [];
	// read the JSON file
	var tasksJSON = JSON.parse(fs.readFileSync('model/tasks.json', 'utf8')).tasks;
	for (var i in tasksJSON) {
		var title = tasksJSON[i].title;
		var description = tasksJSON[i].description;
		var tacos = tasksJSON[i].tacos;
		var days = tasksJSON[i].days;
		var tasks = [];
		for (var j in days) {
			var task = new Task(title, description, tacos, days[j]);
			tasks.push(task);
		}
		this.tasks.push(tasks);
	}
}

module.exports = Bot;