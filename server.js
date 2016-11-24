'use strict'

const express = require('express')
const Slapp = require('slapp')
const ConvoStore = require('slapp-convo-beepboop')
const Context = require('slapp-context-beepboop')
const Bot = require('./bot.js');

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
slapp.message('tasks', ['mention'], (msg) => {
  bot.listTasks(msg, false);
});

slapp.message('my tasks', ['direct_message'], (msg) => {
  bot.listUserTasks(msg.meta.user_id);
});

slapp.action('user_tasks_list_callback', 'done', (msg, value) => {
  // the task index is msg.body.attachment_id - 1
  bot.completeTask(msg.body.attachment_id - 1);
  // TODO remove attachment from message
  // TODO give reward
});

slapp.action('user_tasks_list_callback', 'unpick', (msg, value) => {
  // the task indexis msg.body.attachment_id - 1
  bot.unassignTask(msg.body.attachment_id - 1);
  // TODO remove attachment from message
  // TODO try to reassign the task
});

slapp.action('tasks_list_callback', 'pick', (msg, value) => {
  // the task index is msg.body.attachment_id - 1
  bot.assignTask(msg.body.user, msg.body.attachment_id - 1);
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