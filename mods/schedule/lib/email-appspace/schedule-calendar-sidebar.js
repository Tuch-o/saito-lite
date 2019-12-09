const ScheduleCalendarSidebarTemplate 	= require('./schedule-calendar-sidebar.template.js');


module.exports = ScheduleCalendarSidebar = {

    render(app, data) {
      document.querySelector(".schedule-calendar-sidebar").innerHTML = ScheduleCalendarSidebarTemplate();
    },


    attachEvents(app, data) {

      document.querySelector('.schedule-calendar-sidebar-select').addEventListener('change',(e) =>{
        alert(e.currentTarget.value);
      })

    },


}




