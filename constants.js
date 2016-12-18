function define(name, value) {
	Object.defineProperty(exports, name, {
		value: value,
		enumerable: true
	});
}

/* attachments fields title */
define('FieldTitleTacos', 'Tacos');

/* action names */
define('ActionNamePick', 'pick');
define('ActionNameUnpick', 'unpick');
define('ActionNameDone', 'done');

/* message titles */
define('DayTasksTitle', 'Here are the tasks for the day:');
define('NoTasksTitle', 'There are no tasks left for today! :beers:');
define('NewTaskForUserTitle', 'You have a new task today!');
define('TasksStatisticsTitle', 'Here are the stats for yesterday\'s tasks');
define('CompletedTasksTitle', '{0} of {1} tasks were completed');
define('UncompletedTasksTitle', '{0} of {1} tasks were not completed');
define('UnassignedTasksTitle', '{0} of {1} tasks were left unassigned');

/* message texts */
define('UserUnpickedTaskPrivateMessage', 'Unpicking tasks makes {0} a dull boy :rage3:');
define('UserUnpickedTaskPublicMessage', '{0} cannot complete its task today. Please help out!');
define('UserCompletedTaskMessage', 'Thank you for completing your task. I shall reward you nicely :taco:');
define('NotCompletedTasksMessage', 'Please do not forget to complete your tasks for today :anguished:');
define('UserCompletedTaskTooLateMessage', 'Sorry but this task was supposed to be completed on a previous day :white_frowning_face:');
define('ForgotDoneTasksMessage', 'Did you forget to mark some tasks as done? If you have not completed the tasks, well it\'s too late and I will be very angry :rage3:');
define('TasksStillUnassignedMessage', '<!channel|channel> some tasks are still unassigned! Please help :pray::skin-tone-3:');

define('CompletedTasksUserMessage', '{0} completed \"{1}\"');
define('UncompletedTasksUserMessage', '{0} did not complete \"{1}\"');
define('UnassignedTasksUserMessage', '\"{0}\" was left unassigned');

/* callbacks */
define('UserTaskListCallBack', 'user_tasks_list_callback');
define('TaskListCallBack', 'tasks_list_callback');
define('TaskReassignCallback', 'task_reassign_callback');

/* useful IDs */
define('HeyTacoUID', 'U2SGHBTRD');
//FIXME: Hardcoded officebots channel for the moment. change to proper one when decided.
define('OfficeBotChannelID', 'G3466NZT4');
define('BotName', 'Michael Scott');

/* commands */
define('ListTasksCommand', 'tasks');
define('ListMyTasksCommand', 'my tasks');
define('HelpCommand', 'help');