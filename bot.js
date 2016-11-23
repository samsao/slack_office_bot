/**
 * This is the main bot file. All bot logic should go here.
 */
'use strict'

// imports
const Fs = require('fs');
const Client = require('node-rest-client').Client;
const Task = require('./model/task.js');
const User = require('./model/user.js');
const Util = require('./util.js');
const WebClient = require('@slack/client').WebClient;
var Scheduler = require('./messageScheduler.js')

function Bot() {
	// tasks is a two-dimensional array where the first dimension is the group
	// and the second dimension are the tasks in the group.
	// It is to make it easier to group recurring tasks.

	this.tasks = [];
	this.util = new Util();
	this.client = new Client();
	this.client.registerMethod("slackTeams", "https://beepboophq.com/api/v1/slack-teams", "GET");
	this.initializeWebClient();

	//As soon as the bot start it should setup the reminder.
	this.setupTaskReminder()
}

/**
 * Reads the tasks.json file and create the tasks.
 */
Bot.prototype.generateTasks = function() {
	// empty the tasks first
	this.tasks = [];

	// read the JSON file
	var tasksJSON = JSON.parse(Fs.readFileSync('model/tasks.json', 'utf8')).tasks;
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
	var attachments = this.formatTasks(this.tasks)

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

Bot.prototype.formatTasks = function(tasks) {
	var attachments = [];
	for (var i in tasks) {
		var tasks = tasks[i];
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
	return attachments
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

/**
 * Initialize Slack Web API client.
 * It gets the Access Token from BeepBoop.
 *
 */
Bot.prototype.initializeWebClient = function() {
	var beepBoopToken = process.env.BEEPBOOP_TOKEN || '';
	var args = {
		headers: {
			"Authorization": "Bearer " + beepBoopToken
		}
	};

	var self = this;
	this.client.methods.slackTeams(args, function(data, response) {
		self.webClient = new WebClient(data.results[0].slack_bot_access_token);
	});
}

/**
 * FIXME temporary to test sending messages
 * Good news: it works :)
 *
 */
Bot.prototype.sendMessageTest = function(userID) {
	// this.webClient.chat.sendMessage('Hello ' + user.name + '!', userID);
	this.webClient.chat.postMessage(userID,
		'You are really a peste', {
			as_user: true
		},
		function(err, res) {
			if (err) {
				console.log('Error:', err);
			} else {
				console.log('Message sent: ', res);
			}
		});
}

Bot.prototype.setupTaskReminder = function() {
	var remindScheduler = new Scheduler()
	var self = this
	remindScheduler.scheduleCallback([1,2,3,4,5],21, function() {
		self.remindUserTasks();
	});
}

Bot.prototype.remindUserTasks = function() {
	var usersTasks = this.getUsersTasks()
	for(var userID in usersTasks) {
		//FIXME: Setup proper format and callback
		let formatedTasks = this.formatTasks([usersTasks[userID]])
		this.webClient.chat.postMessage(userID,
		'Here is a list of your tasks:', {
			attachments: formatedTasks,
			as_user: true
		},
		function(err, res) {
			if (err) {
				console.log('Error:', err);
			} else {
				console.log('Message sent: ', res);
			}
		});
	}
}

Bot.prototype.getUsersTasks = function() {
	var userTaskDictionary = {};
	this.tasks.forEach(function(taskGroup){
		taskGroup.forEach(function(task){
			if (task.assignee != null) {
				if (userTaskDictionary[task.assignee.id] == null) {
					userTaskDictionary[task.assignee.id] = []
				}
				userTaskDictionary[task.assignee].push(task)
			}
		});
	});
	return userTaskDictionary
}

module.exports = Bot;