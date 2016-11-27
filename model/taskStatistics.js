const Task = require('./task.js');
const Constants = require("./../constants");


function TaskStatistics(tasks) {
	this.amountOfTasks = tasks.length;
	this.unassignedTasks = 0;
	this.completedTasks = 0;
	this.uncompleteTasks = 0;
	this.uncompleteUsers = [];

	this.getStatistics(tasks);
}

TaskStatistics.prototype.getStatistics = function(tasks) {
	var self = this;
	tasks.forEach(function(task) {
		if (task.assignee) {
			if (task.done) {
				self.completedTasks += 1;
			} else {
				self.uncompleteTasks += 1;
				self.uncompleteUsers.push(task.assignee);
			}
		} else {
			self.unassignedTasks += 1;
		}
	});

}
TaskStatistics.prototype.completePercentage = function() {
	return this.completedTasks / this.amountOfTasks * 100;
}

TaskStatistics.prototype.uncompletePercentage = function() {
	return this.uncompleteTasks / this.amountOfTasks * 100;
}

module.exports = TaskStatistics;