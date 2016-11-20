'use strict'

const express = require('express')
const Slapp = require('slapp')
const ConvoStore = require('slapp-convo-beepboop')
const Context = require('slapp-context-beepboop')
const Bot = require('./bot.js');
const Util = require('./util.js');

// Global variables
var bot = new Bot();
var util = new Util();
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
  // create the attachments
  var attachments = [];
  for (var i in bot.tasks) {
    var tasks = bot.tasks[i];
    var actions = [];
    for (var j in tasks) {
      var task = tasks[j];
      if (!task.done) {
        actions.push({
          name: "pick",
          text: "Pick " + util.dayNames[task.day],
          type: "button",
          value: task.day
        });
      }
    }
    attachments.push({
      title: tasks[0].title,
      text: tasks[0].description,
      fields: [{
        title: "Tacos",
        value: tasks[0].tacos,
        short: true
      }],
      callback_id: "pick_task_callback",
      attachment_type: "default",
      actions: actions
    });
  };

  msg.say({
    text: 'Here are the tasks for the week:',
    attachments: attachments,
  })
})

slapp.action('pick_task_callback', 'pick', (msg, value) => {
  // TODO
})

// attach Slapp to express server
var server = slapp.attachToExpress(express())

// start http server
server.listen(port, (err) => {
  if (err) {
    return console.error(err)
  }
  console.log(`Listening on port ${port}`)
  bot.generateTasks();
})