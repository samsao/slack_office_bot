/**
 * This is the main bot file. All bot logic should go here.
 */
'use strict'

// imports
const Fs = require('fs');
const Client = require('node-rest-client').Client;
const Task = require('./model/task.js');
const TaskMessageAction = require('./model/taskMessageAction.js');
const TaskStatistics = require('./model/taskStatistics.js');
const User = require('./model/user.js');
const Util = require('./util.js');
const WebClient = require('@slack/client').WebClient;
const Scheduler = require('./messageScheduler.js');
const Constants = require('./constants');
const StringFormat = require('string-format');

function Bot() {
	this.tasks = [];
	this.util = new Util();
	this.client = new Client();
	this.client.registerMethod('slackTeams', 'https://beepboophq.com/api/v1/slack-teams', 'GET');
	this.initializeWebClient();
	//Calling here so it doesnt have to wait the scheduled task.
	this.generateTasks();
	//As soon as the bot start it should setup the reminder.
	this.setupRecurrentTasks();
}

/**
 * Reads the tasks.json file and create the tasks.
 */
Bot.prototype.generateTasks = function() {
	// empty the tasks first
	this.tasks = new Array(7);

	// read the JSON file
	var tasksJSON = JSON.parse(Fs.readFileSync('model/tasks.json', 'utf8')).tasks;

	//Create new array to hold tasks
	for (var i = 0; i < 7; i++) {
		this.tasks[i] = [];
	}
	//insert tasks in the array
	for (var i in tasksJSON) {
		var title = tasksJSON[i].title;
		var description = tasksJSON[i].description;
		var tacos = tasksJSON[i].tacos;
		var days = tasksJSON[i].days;
		var id = tasksJSON[i].id;
		for (var j in days) {
			var task = new Task(id, title, description, tacos, days[j]);
			this.tasks[days[j]].push(task);
		}
	}
}

/**
 * Lists the tasks in the channel
 * FIXME to be removed
 *
 * @param msg Slack message
 * @param replace boolean to know if the message should be replaced or not
 */
Bot.prototype.listTasks = function(msg, replace) {
	// create the attachments
	var attachments = this.getTodayTaskAttachments();
	var msgTitle = Constants.DayTasksTitle;
	//If not a valid day in the array should be empty tasks
	if (!attachments || attachments.length == 0) {
		attachments = [];
		msgTitle = Constants.NoTasksTitle;
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

/**
 * Lists the tasks in a specific channel
 *
 * @param channel_id Id of the channel to list
 */
Bot.prototype.listTasksOnChannel = function(channel_id) {
	// create the attachments
	var attachments = this.getTodayTaskAttachments();
	var msgTitle = Constants.DayTasksTitle;
	//If not a valid day in the array should be empty tasks
	if (!attachments) {
		attachments = [];
		msgTitle = Constants.NoTasksTitle;
	}

	this.webClient.chat.postMessage(channel_id,
		msgTitle, {
			attachments: attachments,
			as_user: true
		},
		function(err, res) {
			if (err) {
				console.log('Error:', err);
			}
		});
}

/**
 * Get list of attachments for today's tasks.
 */
Bot.prototype.getTodayTaskAttachments = function() {
	var currentDay = this.util.currentDay();
	//If not a valid day in the array should be empty tasks
	var tasksToList = this.tasks[currentDay];
	if (tasksToList) {
		return this.getTasksListMessageAttachments(tasksToList);
	}
	return null
}

/**
 * Get the attachments for tasks listing message
 *
 * @param tasks tasks to be sent in the message
 * @return formatted attachment to post as message
 */
Bot.prototype.getTasksListMessageAttachments = function(tasks) {
	var attachments = [];
	for (var i in tasks) {
		var task = tasks[i];
		if (!task.assignee) {
			attachments.push(this.getTaskPickAttachment(task));
		}
	}
	return attachments;
}

/**
 * Get the attachments for tasks listing message
 *
 * @param tasks tasks to be sent in the message
 * @return formatted attachment to post as message
 */
Bot.prototype.getTaskPickAttachment = function(task) {
	var actions = [new TaskMessageAction(Constants.ActionNamePick, 'Pick', 'button', task.id)];
	return this.getTaskMessageAttachment(task, Constants.TaskListCallBack, actions);
}

/**
 * Displays a task for a given user. Sent in a private message.
 *
 * @param task_id id of the task to be displayed
 * @param user_id id of the user
 */
Bot.prototype.displayTaskForUser = function(task_id, user_id) {
	var task = this.getTaskForUser(task_id, user_id);
	if (task) {
		this.webClient.chat.postMessage(user_id,
			Constants.NewTaskForUserTitle, {
				attachments: this.getUserTasksListMessageAttachments([task]),
				as_user: true
			},
			function(err, res) {
				if (err) {
					console.log('Error:', err);
				}
			});
	} else {
		//FIXME: Can this ever happen?
		this.webClient.chat.postMessage(user_id,
			Constants.UserNoTasksTitle, {
				as_user: true
			},
			function(err, res) {
				if (err) {
					console.log('Error:', err);
				}
			});
	}
}

/**
 * Creates a list of message attachments based on a array of tasks
 *
 * @param tasks tasks to be sent in the message
 * @param callback_id callback to listen to the response
 * @param actions actions for this tasks
 */
Bot.prototype.getUserTasksListMessageAttachments = function(tasks) {
	var attachments = [];
	for (var i in tasks) {
		var actions = [new TaskMessageAction(Constants.ActionNameDone, 'Done', 'button', tasks[i].id), new TaskMessageAction(Constants.ActionNameUnpick, 'Unpick', 'button', tasks[i].id)]
		attachments.push(this.getTaskMessageAttachment(tasks[i], Constants.UserTaskListCallBack, actions));
	}
	return attachments;
}

/**
 * Returns the message attachment for a task
 *
 * @param task The task itself
 * @param callback_id callback to listen to the response
 * @param taskActions actions for this task
 */
Bot.prototype.getTaskMessageAttachment = function(task, callback_id, taskActions) {
	var actions = [];
	for (var i in taskActions) {
		actions.push({
			name: taskActions[i].name,
			text: taskActions[i].text,
			type: taskActions[i].type,
			value: taskActions[i].value
		});
	}
	return {
		title: task.title,
		text: task.description,
		fields: [{
			title: Constants.FieldTitleTacos,
			value: task.tacos,
			short: true
		}],
		callback_id: callback_id,
		attachment_type: 'default',
		actions: actions
	};
}

/**
 * Assign a task
 *
 * @param user JSON representing a user returned by slack API
 * @param task_id id of the task to be assigned
 */
Bot.prototype.assignTask = function(user, task_id) {
	var task = this.getTask(task_id, this.util.currentDay());
	task.assignee = new User(user.id, user.name);
	this.displayTaskForUser(task_id, user.id);
}

/**
 * Unassign a task
 *
 * @param msg Slack message
 * @param task_id id of task to unassign
 */
Bot.prototype.unassignTask = function(msg, task_id) {
	var task = this.getTask(task_id, this.util.currentDay());
	if (task.day == this.util.currentDay()) {
		task.assignee = null;
		var field = {
			title: '',
			value: StringFormat(Constants.UserUnpickedTaskPrivateMessage, Constants.BotName),
			short: false
		}
		this.taskMessageUpdate(msg, field);
		this.userUnpickedTask(msg.body.user, task_id);
	} else {
		var field = {
			title: '',
			value: Constants.UserCompletedTaskTooLateMessage,
			short: false
		}
		this.taskMessageUpdate(msg, field);
	}
}

/**
 * Message channel user unpicked task and post a new task message.
 *
 * @param user user who unpicked the task
 * @param task_id id of task to unassign
 */
Bot.prototype.userUnpickedTask = function(user, task_id) {
	var task = this.getTask(task_id, this.util.currentDay());
	var actions = [new TaskMessageAction(Constants.ActionNamePick, 'Pick', 'button', task.id)];
	var attachments = this.getTaskMessageAttachment(task, Constants.TaskReassignCallback, actions);

	this.webClient.chat.postMessage(Constants.OfficeBotChannelID,
		StringFormat(Constants.UserUnpickedTaskPublicMessage, '<@' + user.id + '|' + user.name + '>'), {
			attachments: [attachments],
			as_user: true
		},
		function(err, res) {
			if (err) {
				console.log('Error:', err);
			}
		});
}

/**
 * Complete a task
 *
 * @param msg Slack message
 * @param task_id id of the completed task
 */
Bot.prototype.completeTask = function(msg, task_id) {
	var task = this.getTask(task_id, this.util.currentDay());
	// do not complete the task if its not a task for today
	// it means that the user tries to complete it too late
	if (task.day == this.util.currentDay()) {
		task.done = true;
		var field = {
			title: '',
			value: Constants.UserCompletedTaskMessage,
			short: false
		}
		this.taskMessageUpdate(msg, field);
		this.giveTacosForTask(msg.body.user, task);
	} else {
		var field = {
			title: '',
			value: Constants.UserCompletedTaskTooLateMessage,
			short: false
		}
		this.taskMessageUpdate(msg, field);
	}
}

/**
 * Give tacos to an user for a completed task
 *
 * @param user user to receive the tacos
 * @param task completed task
 */
Bot.prototype.giveTacosForTask = function(user, task) {
	var tacosString = '';
	for (var i = 0; i < task.tacos; i++) {
		tacosString = tacosString + ':taco:';
	}
	var message = '<@' + user.id + '|' + user.name + '> ' + tacosString;
	//Hey taco user ID.
	this.webClient.chat.postMessage(Constants.HeyTacoUID,
		message, {
			attachments: [],
			as_user: true
		},
		function(err, res) {
			if (err) {
				console.log('Error:', err);
			}
		});
}

/**
 * Updates a task message (after an action has been taken)
 *
 * @param msg Slack message
 * @param field field to be added to the message. this should represent the update on the message
 */
Bot.prototype.taskMessageUpdate = function(msg, field) {
	var attachments = msg.body.original_message.attachments;
	var attachmentIndex = msg.body.attachment_id - 1;
	attachments[attachmentIndex].actions = [];
	attachments[attachmentIndex].fields.push(field);

	msg.respond({
		text: msg.body.original_message.text,
		attachments: attachments,
	});
}

/**
 * Get a task by id and day
 *
 * @param task_id id of the task
 * @param day selected day of the task
 * @return Task
 */
Bot.prototype.getTask = function(task_id, day) {
	var tasks = this.tasks[day];
	for (var i in tasks) {
		if (tasks[i].id == task_id) {
			return tasks[i];
		}
	}
	return null;
}

/**
 * Report status of the tasks now.
 *
 * @param day day for the status report.
 */
Bot.prototype.reportTaskStatus = function(day) {
	var taskStatistics = new TaskStatistics(this.tasks[day]);

	this.webClient.chat.postMessage(Constants.OfficeBotChannelID,
		Constants.TasksStatisticsTitle, {
			attachments: taskStatistics.getTasksMessageAttachments(),
			as_user: true
		},
		function(err, res) {
			if (err) {
				console.log('Error:', err);
			}
		});
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
			'Authorization': 'Bearer ' + beepBoopToken
		}
	};

	var self = this;
	this.client.methods.slackTeams(args, function(data, response) {
		self.webClient = new WebClient(data.results[0].slack_bot_access_token);
	});
}

/**
 *  Setup system recurrent tasks.
 *
 */
Bot.prototype.setupRecurrentTasks = function() {
	var scheduler = new Scheduler();
	this.setupTaskReminder(scheduler);
	this.setupTaskGeneration(scheduler);
	this.setupTaskListing(scheduler);
	this.setupUncompletedTasksReminder(scheduler);
	this.setupUnassignedTaskReminder(scheduler);
	this.setupStatusReport(scheduler);
}

/**
 *  Send a message to channel if there are still unassigned tasks
 * 
 * @param channel_id ID of the channel to send the message to
 */
Bot.prototype.checkForUnassignedTasks = function(channel_id) {
	// check if there are unassigned tasks
	for (var i in this.tasks) {
		if (!this.tasks[i].assignee) {
			this.sendSimpleMessage(channel_id, Constants.TasksStillUnassignedMessage);
			break;
		}
	}
}

/**
 *  Send a simple message without a title nor attachments
 * 
 * @param id id of the receiver (user or channel)
 * @para msg message to be sent
 */
Bot.prototype.sendSimpleMessage = function(id, msg) {
	this.webClient.chat.postMessage(id,
		msg, {
			as_user: true
		},
		function(err, res) {
			if (err) {
				console.log('Error:', err);
			}
		});
}

/**
 * Setup status report of previous day tasks at 8:30 am 
 *
 * @param remindScheduler scheduler for task setup.
 */
Bot.prototype.setupStatusReport = function(remindScheduler) {
	var self = this;
	remindScheduler.scheduleCallback([2, 3, 4, 5], [8], [30], function() {
		self.reportTaskStatus(this.util.previousDay());
	})

	//Listing earlier on monday to avoid the tasks getting wiped out by the task generation.
	//Since it's all in memory the array will get deleted and the status would be 0
	remindScheduler.scheduleCallback([1], [8], [28], function() {
		self.reportTaskStatus(this.util.previousDay());
	});;
}

/**
 * Setup a listing of remaining unassigned tasks every day at 11 am and 2pm 
 *
 * @param remindScheduler scheduler for task setup.
 */
Bot.prototype.setupUnassignedTaskReminder = function(remindScheduler) {
	var self = this;
	remindScheduler.scheduleCallback([1, 2, 3, 4, 5], [11, 14], [0], function() {
		self.checkForUnassignedTasks(Constants.OfficeBotChannelID);
	});
}

/**
 * Setup a listing of user's uncompleted tasks every day at 3pm and 8pm 
 *
 * @param remindScheduler scheduler for task setup.
 */
Bot.prototype.setupUncompletedTasksReminder = function(remindScheduler) {
	var self = this;
	remindScheduler.scheduleCallback([1, 2, 3, 4, 5], [15, 20], [0], function() {
		self.remindUserTasks(Constants.NotCompletedTasksMessage);
	});
}

/**
 * Setup a listing of user's own tasks every day at 9pm 
 *
 * @param remindScheduler scheduler for task setup.
 */
Bot.prototype.setupTaskReminder = function(remindScheduler) {
	var self = this;
	remindScheduler.scheduleCallback([1, 2, 3, 4, 5], [21], [0], function() {
		self.remindUserTasks(Constants.ForgotDoneTasksMessage);
	});
}


/**
 * Setup task generation for every monday at 8:20 am
 *
 * @param remindScheduler scheduler for task setup.
 */
Bot.prototype.setupTaskGeneration = function(remindScheduler) {
	var self = this;
	remindScheduler.scheduleCallback([1], [8], [20], function() {
		self.generateTasks();
	});
}

/**
 * Setup system to list tasks on a channel for every monday at 8:30 am
 *
 * @param remindScheduler scheduler for task setup.
 */
Bot.prototype.setupTaskListing = function(remindScheduler) {
	var self = this;
	remindScheduler.scheduleCallback([1, 2, 3, 4, 5], [8], [30], function() {
		self.bot.listTasksOnChannel(Constants.OfficeBotChannelID);
	});
}

/**
 * Reminds all users of their tasks in private message.
 *
 * @param msg message to send to the user if it has uncompleted tasks.
 */
Bot.prototype.remindUserTasks = function(msg) {
	var usersTasks = this.getUsersUncompletedTasks();
	console.log(usersTasks);
	for (var user_id in usersTasks) {
		this.sendSimpleMessage(user_id, msg);
	}
}

/**
 * Returns a dictionary of tasks where keys are user_id
 *
 */
Bot.prototype.getUsersTasks = function() {
	var userTaskDictionary = {};
	this.tasks.forEach(function(taskGroup) {
		taskGroup.forEach(function(task) {
			if (task.assignee) {
				if (!userTaskDictionary[task.assignee.id]) {
					userTaskDictionary[task.assignee.id] = [];
				}
				userTaskDictionary[task.assignee.id].push(task);
			}
		});
	});
	return userTaskDictionary;
}

/**
 * Returns a dictionary of tasks where keys are user_id
 *
 */
Bot.prototype.getUsersUncompletedTasks = function() {
	var userTaskDictionary = {};
	this.tasks.forEach(function(taskGroup) {
		taskGroup.forEach(function(task) {
			if (task.assignee && !task.done) {
				if (!userTaskDictionary[task.assignee.id]) {
					userTaskDictionary[task.assignee.id] = [];
				}
				userTaskDictionary[task.assignee.id].push(task);
			}
		});
	});
	return userTaskDictionary;
}

/**
 * Returns a list of tasks assigned to a user_id
 *
 * @param user_id id of the user.
 */
Bot.prototype.getUserUncompletedTasks = function(user_id) {
	var userTasks = [];
	this.tasks.forEach(function(taskGroup) {
		taskGroup.forEach(function(task) {
			if (!task.done && task.assignee && task.assignee.id == user_id) {
				userTasks.push(task);
			}
		});
	});
	return userTasks;
}

Bot.prototype.bimboom = function() {
	this.reportTaskStatus(this.util.currentDay());
}

/*
 * Returns a task with that ID associated to a user
 *
 * @param user_id id of the user.
 * @param task_id id of the task.
 */
Bot.prototype.getTaskForUser = function(task_id, user_id) {
	var task;
	for (var i in this.tasks) {
		for (var j in this.tasks[i]) {
			task = this.tasks[i][j];
			if (task.id == task_id && task.assignee && task.assignee.id == user_id) {
				return task;
			}
		}
	}
	return null;
}

module.exports = Bot;