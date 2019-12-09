const ScheduleListSidebarTemplate 	= require('./schedule-list-sidebar.template.js');
const ScheduleAddSlot = require('./schedule-addslot-main.js');
const ScheduleAddSlotSidebar = require('./schedule-addslot-sidebar.js');


module.exports = ScheduleListSidebar = {

    render(app, data) {
      document.querySelector(".schedule-calendar-sidebar").innerHTML = ScheduleListSidebarTemplate();
    },


    attachEvents(app, data) {

      document.getElementById('add_slot').addEventListener('click', (e) => {

        ScheduleAddSlot.render(app, data);
        ScheduleAddSlotSidebar.render(app, data);
        ScheduleAddSlot.attachEvents(app, data);
        ScheduleAddSlotSidebar.attachEvents(app, data);

      });

    },


}




