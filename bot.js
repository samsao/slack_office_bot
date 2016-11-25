/**
 * This is the main bot file. All bot logic should go here.
 */
'use strict'

// imports
const Fs = require('fs');
const Client = require('node-rest-client').Client;
const Task = require('./model/task.js');
const TaskMessageAction = require('./model/taskMessageAction.js');
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
	this.setupRecurrentTasks();
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
	for (var i = 0; i < 5; i++) {
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
			this.tasks[j].push(task);
		}
	}
}

/**
 * Lists the tasks in the channel
 *
 * @param msg Slack message
 * @param replace boolean to know if the message should be replaced or not
 */
Bot.prototype.listTasks = function(msg, replace) {
	// create the attachments
	var attachments = this.getTodayTaskAttachments();
	var msgTitle = 'Here are the tasks for the day:';
	//If not a valid day in the array should be empty tasks
	if (!attachments) {
		attachments = [];
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

/**
 * Lists the tasks in a specific channel
 *
 * @param channel_id Id of the channel to list
 */
Bot.prototype.listTasksOnChannel = function(channel_id) {
	// create the attachments
	var attachments = this.getTodayTaskAttachments();
	var msgTitle = 'Here are the tasks for the day:';
	//If not a valid day in the array should be empty tasks
	if (!attachments) {
		attachments = [];
		msgTitle = 'There are no tasks for today! :beers:';
	}

	this.webClient.chat.postMessage(channel_id,
		msgTitle, {
			attachments: attachments,
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
			var actions = [new TaskMessageAction('pick', 'Pick', 'button', tasks[i].id)];
			attachments.push(this.getTaskMessageAttachment(task, 'tasks_list_callback', actions));
		}
	}
	return attachments;
}

/**
 * Lists tasks for a given user. Sent in a private message.
 *
 * @param user_id id of the user
 */
Bot.prototype.listUserTasks = function(user_id) {
	// FIXME IMO not very optimal to generate this array when only tasks for one user are required
	var tasksDictionary = this.getUsersTasks();
	var tasks = tasksDictionary[user_id];
	if (tasks) {
		this.webClient.chat.postMessage(user_id,
			'Here are your tasks for today:', {
				attachments: this.getUserTasksListMessageAttachments(tasks),
				as_user: true
			},
			function(err, res) {
				if (err) {
					console.log('Error:', err);
				}
			});
	} else {
		this.webClient.chat.postMessage(user_id,
			'You don\'t have any task today! :beer:', {
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
		//I Think we rather create a new array than mutate it every loop, but not sure in js.
		//change this if wrong or remove comment when validated.
		var actions = [new TaskMessageAction('unpick', 'Unpick', 'button', tasks[i].id), new TaskMessageAction('done', 'Done', 'button', tasks[i].id)]
		attachments.push(this.getTaskMessageAttachment(tasks[i], 'user_tasks_list_callback', actions));
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
			title: "Tacos",
			value: task.tacos,
			short: true
		}],
		callback_id: callback_id,
		attachment_type: "default",
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
}

/**
 * Unassign a task
 *
 * @param task_id id of task to unassign
 */
Bot.prototype.unassignTask = function(task_id) {
	var task = this.getTask(task_id, this.util.currentDay());
	task.assignee = null;
}

/**
 * Complete a task
 *
 * @param task_id id of the completed task
 */
Bot.prototype.completeTask = function(task_id) {
	var task = this.getTask(task_id, this.util.currentDay());
	task.done = true;
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
 *  Setup system recurrent tasks.
 *
 */
Bot.prototype.setupRecurrentTasks = function() {
	var scheduler = new Scheduler();
	this.setupTaskReminder(scheduler);
	this.setupTaskGeneration(scheduler);
	this.setupTaskListing(scheduler);
}

/**
 * Setup a listing of user's own tasks every day at 9pm 
 *
 * @param remindScheduler scheduler for task setup.
 */
Bot.prototype.setupTaskReminder = function(remindScheduler) {
	var self = this;
	remindScheduler.scheduleCallback([1, 2, 3, 4, 5], [21], [0], function() {
		self.remindUserTasks();
	});
}

/**
 * Setup task generation for every monday at 8:29 am
 *
 * @param remindScheduler scheduler for task setup.
 */
Bot.prototype.setupTaskGeneration = function(remindScheduler) {
	var self = this;
	remindScheduler.scheduleCallback([1], [8], [29], function() {
		self.generateTasks();
	});
}

/**
 * Setup system to list tasks on a channel(TBD) for every monday at 8:30 am
 *
 * @param remindScheduler scheduler for task setup.
 */
Bot.prototype.setupTaskListing = function(remindScheduler) {
	var self = this;
	remindScheduler.scheduleCallback([1,2,3,4,5], [8], [30], function() {
		//FIXME: Hardcoded channel id on officebots for the moment, change when decided the proper one.
		self.bot.listTasksOnChannel('G3466NZT4');
	});
}
/**
 * Reminds all users of their tasks in private message.
 *
 */
Bot.prototype.remindUserTasks = function() {
	var usersTasks = this.getUsersTasks();
	for (var user_id in usersTasks) {
		// FIXME
		// var formatedTasks = this.listUserTasksPM([usersTasks[user_id]], user_id);
		// this.listUserTasksPM(formatedTasks, user_id);
	}
}

/**
 * Returns a dictionnary of tasks where keys are user_id
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

module.exports = Bot;