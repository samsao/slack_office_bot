function define(name, value) {
	Object.defineProperty(exports, name, {
		value: value,
		enumerable: true
	});
}

define("DayTasksTitle", 'Here are the tasks for the day:');
define("NoTasksTitle", 'There are no tasks for today! :beers:');
define("UserTasksTitle", 'Here are your tasks for today:');
define("UserNoTasksTitle", 'You don\'t have any task for today! :beer:');
//Do we need both or should they be the same? Validate and remove the comment.
define("UserTaskListCB", 'user_tasks_list_callback');
define("TaskListCB", 'tasks_list_callback');