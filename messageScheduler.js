

var schedule = require('node-schedule');
const Slapp = require('slapp')

function Scheduler () { }

/*
    schedule a recurrent callback for weekdays (array of integers with 0 as sunday to 6 as saturday) and hour (0 to 24)
*/
/**
 * schedule a recurrent callback for weekdays
 *
 * @param weekdays array of integers with 0 as sunday to 6 as saturday
 * @param hours array with hours to trigger. 0 to 24
 * @param minutes array with minutes to trigger. 0 to 24
 * @param callback callback to trigger at event time
 * @return Task
 */
Scheduler.prototype.scheduleCallback = function (weekdays,hours, minutes,callback) {
    var rule = new schedule.RecurrenceRule();
    rule.dayOfWeek = weekdays
    rule.hour = hours
    rule.minute = minutes

    var j = schedule.scheduleJob(rule, function(){
        callback();
    });
}

module.exports = Scheduler;



