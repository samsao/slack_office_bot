

var schedule = require('node-schedule');
const Slapp = require('slapp')

function Scheduler () { }

/*
    schedule a recurrent callback for weekdays (array of integers with 0 as sunday to 6 as saturday) and hour (0 to 24)
*/
Scheduler.prototype.scheduleCallback = function (weekdays,hour,callback) {
    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = weekdays
    rule.hour = hour
    rule.minute = 0

    var j = schedule.scheduleJob(rule, function(){
        callback();
    });
}

module.exports = Scheduler;



