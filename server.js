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
})

//*********************************************
// Setup different handlers for messages
//*********************************************

// FIXME temporary to test tasks generation
slapp.message('tasks', ['mention'], (msg) => {
  bot.listTasks(msg, false);
})

slapp.action('pick_task_callback', 'pick', (msg, value) => {
  console.log(msg);
  // the task group id is msg.body.attachment_id - 1
  bot.assignTask(msg.body.user, msg.body.attachment_id - 1, value);
  // list the tasks again to remove the button
  bot.listTasks(msg, true);
})

// attach Slapp to express server
var server = slapp.attachToExpress(express())

// start http server
server.listen(port, (err) => {
  if (err) {
    return console.error(err);
  }
  console.log(`Listening on port ${port}`);
  bot.generateTasks();
})