const RegisterUsernameTemplate = require('./register-username.template.js');

module.exports = RegisterUsername = {
  render(app, data) {
    if (document.querySelector('.document-modal-content')) {
      document.querySelector('.document-modal-content').innerHTML = RegisterUsernameTemplate();
    }
  },

  attachEvents(app, data) {

    document.querySelector('.tutorial-skip').onclick = () => {
      data.modal.destroy();
    }

    document.querySelector('#registry-modal-button').onclick = () => {

      //check identifier taken
      var identifier = document.querySelector('#registry-input').value;
      var hp = document.querySelector('#name').value;

      if (hp == "") {
        app.modules.returnActiveModule().sendPeerDatabaseRequest("registry", "records", "*", "identifier = '" + identifier + "@saito'", null, (res) => {
          if (res.rows.length > 0) {
            salert("Identifier already in use. Please select another");
            return;
          } else {
            //salert("Registration Submitted");
            let register_success = app.modules.returnModule('Registry').registerIdentifier(identifier);
            if (register_success) {
              salert("Success! You are now: " + identifier + "@saito");

              data.modal.destroy();

            } else {
              salert("That's a bug, Jim.")
            }
          }
        });
      }
    }
  }
}



