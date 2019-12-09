module.exports = ScheduleAddSlotTemplate = () => {
  return `

  Start Time: <input type="text" style="width:100px"/>

  <p></p>

  Stop Time: <input type="text" style="width:100px"/>

  <p></p>

  <label for="">Schedule Slot</label>   
  <select name="slot_type">
    <option type="once" select>Monday, January 7, 2019 (once only)</option>
    <option type="weekly">every Monday</option>
    <option type="daily">everyday</option>
  </select>

  <p></p>

  Advanced Options Here:
  
  `;
}
