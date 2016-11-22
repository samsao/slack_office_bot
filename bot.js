/**
 * This is the main bot file. All bot logic should go here.
 */
'use strict'

// imports
const fs = require('fs');
const Task = require('./model/task.js');
const User = require('./model/user.js');
const Util = require('./util.js');

function Bot() {
	// tasks is a two-dimensional array where the first dimension is the group
	// and the second dimension are the tasks in the group.
	// It is to make it easier to group recurring tasks.
	this.tasks = [];
	this.util = new Util();
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

/**
 * Lists the tasks
 *
 * @param msg Slack message
 * @param replace boolean to know if the message should be replaced or not
 */
Bot.prototype.listTasks = function(msg, replace) {
	// create the attachments
	var attachments = [];
	for (var i in this.tasks) {
		var tasks = this.tasks[i];
		var actions = [];
		for (var j in tasks) {
			var task = tasks[j];
			if (!task.assignee) {
				actions.push({
					name: "pick",
					text: "Pick " + this.util.dayNames[task.day],
					type: "button",
					value: task.day
				});
			}
		}
		attachments.push({
			title: tasks[0].title,
			text: tasks[0].description,
			fields: [{
				title: "Tacos",
				value: tasks[0].tacos,
				short: true
			}],
			callback_id: "pick_task_callback",
			attachment_type: "default",
			actions: actions
		});
	};

	if (replace) {
		msg.respond({
			text: 'Here are the tasks for the week:',
			attachments: attachments,
		});
	} else {
		msg.say({
			text: 'Here are the tasks for the week:',
			attachments: attachments,
		});
	}
}

/**
 * Assign a task
 *
 * @param user JSON representing a user returned by slack API
 * @param groupId task group id
 * @param day selected day of the task
 */
Bot.prototype.assignTask = function(user, groupId, day) {
	var task = this.getTask(groupId, day);
	task.assignee = new User(user.id, user.name);
}

/**
 * Get a task by group id and day
 *
 * @param groupId task group id
 * @param day selected day of the task
 * @return Task
 */
Bot.prototype.getTask = function(groupId, day) {
	var tasks = this.tasks[groupId];
	for (var i in tasks) {
		if (tasks[i].day == day) {
			return tasks[i];
		}
	}
	return null;
}

module.exports = Bot;