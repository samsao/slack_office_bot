'use strict'

const express = require('express')
const Slapp = require('slapp')
const ConvoStore = require('slapp-convo-beepboop')
const Context = require('slapp-context-beepboop')
const Bot = require('./bot.js');
const Constants = require("./constants");

// Global variables
var bot = new Bot();
// use `PORT` env var on Beep Boop - default to 3000 locally
var port = process.env.PORT || 3000
var slapp = Slapp({
  // Beep Boop sets the SLACK_VERIFY_TOKEN env var
  verify_token: process.env.SLACK_VERIFY_TOKEN,
  convo_store: ConvoStore(),
  context: Context()
});

//*********************************************
// Setup different handlers for messages
//*********************************************

// FIXME temporary to test tasks generation
slapp.message(Constants.ListTasks, ['mention'], (msg) => {
  bot.listTasks(msg, false);
});

slapp.message(Constants.Help, ['mention','direct_message'], (msg) => {
  bot.listHelp(msg);
});

slapp.message(Constants.ListMyTasks, ['direct_message'], (msg) => {
  bot.listUserTasks(msg.meta.user_id);
});

slapp.action(Constants.UserTaskListCB, 'done', (msg, task_id) => {

  bot.completeTask(msg, task_id);
  // TODO give reward
});

slapp.action(Constants.UserTaskListCB, 'unpick', (msg, task_id) => {
  bot.unassignTask(msg, task_id);
  bot.userUnpickedTask(msg.body.user, task_id);
});

slapp.action(Constants.TaskListCB, 'pick', (msg, task_id) => {

  bot.assignTask(msg.body.user, task_id);
  // list the tasks again to remove the task
  bot.listTasks(msg, true);
});

// attach Slapp to express server
var server = slapp.attachToExpress(express());

// start http server
server.listen(port, (err) => {
  if (err) {
    return console.error(err);
  }
  console.log(`Listening on port ${port}`);
  bot.generateTasks();
});