/**
 * This is the main bot file. All bot logic should go here.
 */
'use strict'

// imports
const Fs = require('fs');
const Client = require('node-rest-client').Client;
const Task = require('./model/task.js');
const TaskAction = require('./model/taskAction.js');
const User = require('./model/user.js');
const Util = require('./util.js');
const WebClient = require('@slack/client').WebClient;
const Scheduler = require('./messageScheduler.js')

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
	this.setupTaskReminder();
}

/**
 * Reads the tasks.json file and create the tasks.
 */
Bot.prototype.generateTasks = function() {
	// empty the tasks first
	this.tasks = new Array(5);
	
	// read the JSON file
	var tasksJSON = JSON.parse(Fs.readFileSync('model/tasks.json', 'utf8')).tasks;

	//Create new array to hold tasks
	for(var i = 0; i < 5;i++){
		this.tasks[i] = [];
	} 
	//insert tasks in the array
	for (var i in tasksJSON) {
		var title = tasksJSON[i].title;
		var description = tasksJSON[i].description;
		var tacos = tasksJSON[i].tacos;
		var days = tasksJSON[i].days;
		for (var j in days) {
			var task = new Task(title, description, tacos, days[j]);
			this.tasks[j].push(task);
		}
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
	var currentDay = this.util.currentDay();
	var attachments = [];
	var msgTitle = 'Here are the tasks for the day:';
	//If not a valid day in the array should be empty tasks
	var tasksToList = this.tasks[currentDay];
	if (tasksToList) {
		attachments = this.formatTasks(tasksToList);
	} else {
		msgTitle = 'There are no tasks for today! :beers:';
	}

	if (replace) {
		msg.respond({
			text: msgTitle,
			attachments: attachments,
		});
	} else {
		msg.say({
			text: msgTitle,
			attachments: attachments,
		});
	}
}

Bot.prototype.formatTasksToPick = function(tasks) {
	var action = new TaskAction('Pick','Pick task','button', 0);
	var formatedTasks = formatTasks(userTasks, 'pick_task_callback',[action]);
	return formatedTasks
}
Bot.prototype.filterAndListUserTasksPM = function(userID) {
	var tasksDictionary = this.getUsersTasks();
	var userTasks = tasksDictionary[userID];
	this.listUserTasksPM(userTasks, userID);
}

Bot.prototype.listUserTasksPM = function(userTasks, userID) {
	var unpickAction = new TaskAction('Pick','Pick task','button', 0);
	var doneAction = new TaskAction('Done','Finish task','button', 1);
	var formatedTasks = formatTasks(userTasks, 'update_task_callback',[unpickAction,doneAction]);

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

Bot.prototype.formatTasks = function(tasks, callbackID, taskActions) {
	var attachments = [];
	for (var i in tasks) {
		var task = tasks[i];
		var actions = [];

		if (!task.assignee) {
			for (var action in taskActions) {
				actions.push({
					name: action.name,
					text: action.text,
					type: action.type,
					value: action.value
				});
			}
		}

		attachments.push({
			title: task.title,
			text: task.description,
			fields: [{
				title: "Tacos",
				value: task.tacos,
				short: true
			}],
			callback_id: callbackID,
			attachment_type: "default",
			actions: actions
		});
	}
	return attachments
}

/**
 * Assign a task
 *
 * @param user JSON representing a user returned by slack API
 * @param index index of task on today's list
 * @param value selected value of the action
 */
Bot.prototype.assignTask = function(user, index, value) {

	var day = this.util.currentDay()
	var task = this.getTask(index, day);
	if (task) {
		task.assignee = new User(user.id, user.name);
	}
}

/**
 * update a task
 *
 * @param user JSON representing a user returned by slack API
 * @param groupId task group id
 * @param value selected value of the action
 */
Bot.prototype.updateTask = function(user, groupId, value) {
	var day = this.util.currentDay()
	var task = this.getTask(groupId, day);
	if (task) {
		//Unpick
		if (value == 0) {
			task.assignee = null;
			/** TODO: list tasks again in a channel*/
		} else {
			//finish
			task.done = true;
		}
	}

}

Bot.prototype.unpickTask = function(task) {

}
/**
 * Get a task by group id and day
 *
 * @param index index of task on today's list
 * @param day selected day of the task
 * @return Task
 */
Bot.prototype.getTask = function(index, day) {
	var tasks = this.tasks[day];
	return tasks[index];
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
	var remindScheduler = new Scheduler();
	var self = this;
	remindScheduler.scheduleCallback([1,2,3,4,5],[21], function() {
		self.remindUserTasks();
	});
}

/*
	Remind all users of their tasks in private channel
 */
Bot.prototype.remindUserTasks = function() {
	var usersTasks = this.getUsersTasks();
	for(var userID in usersTasks) {
		//FIXME: Setup proper format and callback
		let formatedTasks = this.formatTasks([usersTasks[userID]])
		this.listUserTasksPM(formatedTasks,userID)
	}
}

Bot.prototype.getUsersTasks = function() {
	var userTaskDictionary = {};
	this.tasks.forEach(function(taskGroup){
		taskGroup.forEach(function(task){
			if (task.assignee) {
				if (!userTaskDictionary[task.assignee.id]) {
					userTaskDictionary[task.assignee.id] = []
				}
				userTaskDictionary[task.assignee.id].push(task)
			}
		});
	});
	return userTaskDictionary
}

module.exports = Bot;