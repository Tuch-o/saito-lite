const ScheduleAddSlotSidebarTemplate 	= require('./schedule-addslot-sidebar.template.js');


module.exports = ScheduleAddSlotSidebar = {

    render(app, data) {
      document.querySelector(".schedule-calendar-sidebar").innerHTML = ScheduleAddSlotSidebarTemplate();    },


    attachEvents(app, data) {
    },


}




