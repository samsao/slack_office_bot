const Constants = require("./../constants");
const StringFormat = require('string-format');
const Task = require('./task.js');

/**
 * Constructor
 *
 * @param tasks Bot's tasks
 */
function TaskStatistics(tasks) {
	this.tasksCount = tasks.length;
	this.completedTasks = [];
	this.uncompletedTasks = [];
	this.unassignedTasks = [];

	var self = this;
	tasks.forEach(function(task) {
		if (task.assignee) {
			if (task.done) {
				self.completedTasks.push(task);
			} else {
				self.uncompletedTasks.push(task);
			}
		} else {
			self.unassignedTasks.push(task);
		}
	});
}

/**
 * Returns the statistics message attachments
 *
 */
TaskStatistics.prototype.getAttachments = function() {
	var attachments = [];

	if (this.completedTasks.length > 0) {
		attachments.push(this.getTasksMessageAttachment(Constants.CompletedTasksTitle, Constants.CompletedTasksUserMessage, 'good', this.completedTasks));
	}
	if (this.uncompletedTasks.length > 0) {
		attachments.push(this.getTasksMessageAttachment(Constants.UncompletedTasksTitle, Constants.UncompletedTasksUserMessage, 'danger', this.uncompletedTasks));
	}
	if (this.unassignedTasks.length > 0) {
		attachments.push(this.getTasksMessageAttachment(Constants.UnassignedTasksTitle, Constants.UnassignedTasksUserMessage, 'warning', this.unassignedTasks));
	}

	return attachments;
}

/**
 * Returns the attachment for a given set of tasks (completed, uncompleted, unassigned)
 *
 * @param title Attachment's title
 * @param msg Attachment's message
 * @param color Attachment's color
 * @param tasks Array of tasks to build the attachment upon
 */
TaskStatistics.prototype.getTasksMessageAttachment = function(title, msg, color, tasks) {
	return {
		title: StringFormat(title, tasks.length, this.tasksCount),
		text: this.getTasksMessage(msg, tasks),
		fields: [],
		callback_id: '',
		attachment_type: 'default',
		actions: [],
		color: color
	};
}

/**
 * Returns the attachment message for a set of tasks
 *
 * @param msg Attachment's message
 * @param tasks Array of tasks to build the message upon
 */
TaskStatistics.prototype.getTasksMessage = function(msg, tasks) {
	var message = '';
	for (var i in tasks) {
		if (i != 0) {
			message += '\n';
		}
		message += this.getTaskMessage(msg, tasks[i]);
	}
	console.log(message);
	return message;
}

/**
 * Returns the attachment message for one given task
 *
 * @param msg Attachment's message
 * @param tasks Task to build the message upon
 */
TaskStatistics.prototype.getTaskMessage = function(msg, task) {
	if (task.assignee) {
		return StringFormat(msg, '<@' + task.assignee.id + '|' + task.assignee.name + '>', task.title);
	} else {
		return StringFormat(msg, task.title);
	}
}

module.exports = TaskStatistics;