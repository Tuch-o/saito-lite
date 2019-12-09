const ScheduleAppspaceTemplate 	= require('./schedule-appspace.template.js');
const ScheduleCalendarMain = require('./schedule-calendar.js');
const ScheduleCalendarSidebar = require('./schedule-calendar-sidebar.js');

module.exports = ScheduleAppspace = {

    render(app, data) {

      document.querySelector(".email-appspace").innerHTML = ScheduleAppspaceTemplate();

      ScheduleCalendarMain.render(app, data);
      ScheduleCalendarSidebar.render(app, data);

    },


    attachEvents(app, data) {
      ScheduleCalendarMain.attachEvents(app, data);
      ScheduleCalendarSidebar.attachEvents(app, data);
    },

}




