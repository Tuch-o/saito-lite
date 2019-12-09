const ScheduleAddSlotTemplate	= require('./schedule-addslot-main.template.js');
const ScheduleAddSlotSidebar 	= require('./schedule-addslot-sidebar.js');


module.exports = ScheduleAddSlot = {

    render(app, data) {
      document.querySelector(".schedule-calendar-main").innerHTML = ScheduleAddSlotTemplate();
    },


    attachEvents(app, data) {
    },


}




