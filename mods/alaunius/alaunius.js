const saito = require('../../lib/saito/saito.js');
const ModTemplate = require('../../lib/templates/modtemplate');
const Header = require('../../lib/ui/header/header');
const AlauniusMain = require('./lib/alaunius-main/alaunius-main');
const AlauniusSidebar = require('./lib/alaunius-sidebar/alaunius-sidebar');

const AddressController = require('../../lib/ui/menu/address-controller');


class Alaunius extends ModTemplate {

  constructor(app) {
    super(app);

    this.name 			= "Alaunius";
    this.chat 			= null;
    this.events			= ['chat-render-request'];

    this.alaunius 		= {};
    this.alaunius.inbox 	= [];
    this.alaunius.sent 		= [];
    this.alaunius.trash 	= [];
    this.alaunius.active  	= "inbox";
					// inbox
					// outbox
					// trash

    this.mods   		= [];

    this.active 		= "alaunius_list";
    this.header_title		= "";

    this.selected_alaunius	= null;

    this.appspace		= 0;	// print alaunius-body with appspace
    this.appspace_mod		= null;
    this.appspace_mod_idx 	= -1; // index in mods of appspace module

    this.uidata			= {};
    this.uidata.mods 		= [];
    this.count = 0;

  }

  render(app, data) {
    this.renderMain(app, data);
    this.renderSidebar(app, data);
  }

  renderMain(app, data) {
    AlauniusMain.render(app, data);
    AlauniusMain.attachEvents(app, data);
  }

  renderSidebar(app, data) {
    AlauniusSidebar.render(app, data);
    AlauniusSidebar.attachEvents(app, data);
  }

  initialize(app) {

    super.initialize(app);

    //
    // add an alaunius
    //
    let tx = app.wallet.createUnsignedTransaction();
        tx.transaction.msg.module 	= "Alaunius";
        tx.transaction.msg.title 	= "Welcome to Saito";
        tx.transaction.msg.message	= "This is a fresh alaunius, added " + new Date().getTime();
    tx = this.app.wallet.signTransaction(tx);
    this.alaunius.inbox.push(tx);

        tx = app.wallet.createUnsignedTransaction();
        tx.transaction.msg.module 	= "Alaunius";
        tx.transaction.msg.title 	= "Welcome to Saito";
        tx.transaction.msg.message	= "This is where your sent messages go...";
    tx = this.app.wallet.signTransaction(tx);
    this.alaunius.sent.push(tx);

  }


  initializeHTML(app) {

console.log("SYNSLK");

    super.initializeHTML(app);

    Header.render(app, this.uidata);
    Header.attachEvents(app, this.uidata);

    let x = [];
    x = this.app.modules.respondTo("alaunius-appspace");
    for (let i = 0; i < x.length; i++) {
      this.mods.push(x[i]);
    }
    x = this.app.modules.respondTo("email-chat");
    for (let i = 0; i < x.length; i++) {
      this.mods.push(x[i]);
    }

    // add our address controller
    this.addrController = new AddressController(app, this.uidata, this.returnMenuItems());

console.log("SENDING WITH MODS LENGH: " + this.mods.length);

    this.uidata.mods	  = this.mods;
    this.uidata.parentmod = this;

    this.render(app, this.uidata);

  }



  deleteTransaction(tx) {

    for (let i = 0; i < this.alaunius[this.alaunius.active].length; i++) {
      let mytx = this.alaunius[this.alaunius.active][i];
      if (mytx.transaction.sig == tx.transaction.sig) {
        this.app.storage.deleteTransaction(tx);
        this.alaunius[this.alaunius.active].splice(i, 1);
        this.alaunius['trash'].unshift(tx);
      }
    }

  }


  //
  // load transactions into interface when the network is up
  //
  onPeerHandshakeComplete(app, peer) {

    if (this.browser_active == 0) { return; }

    //
    // leaving this here for the short term,
    // token manager can be a separate module
    // in the long-term, as the alaunius client
    // should just handle alaunius
    //
    this.getTokens();

    this.app.storage.loadTransactions("Alaunius", 50, (txs) => {

      let keys = [];

      for (let i = 0; i < txs.length; i++) {
        this.alaunius.inbox.unshift(txs[i]);
        keys.push(txs[i].transaction.from[0].add);
      }

      AlauniusList.render(this.app, this.uidata);
      AlauniusList.attachEvents(this.app, this.uidata);

      this.addrController.fetchIdentifiers(keys);

    });


    AlauniusList.render(this.app, this.uidata);
    AlauniusList.attachEvents(this.app, this.uidata);

  }



  onConfirmation(blk, tx, conf, app) {

    let txmsg = tx.returnMessage();
    let alaunius = app.modules.returnModule("Alaunius");

    if (conf == 0) {

      //
      // if transaction is for me
      //
      if (tx.isTo(app.wallet.returnPublicKey())) {

        //
        // great lets save this
        //
        app.storage.saveTransaction(tx);

        //
        // and update our alaunius client
        //
        alaunius.addAlaunius(tx);
      }
    }
  }


  addAlaunius(tx) {
    this.alaunius.inbox.unshift(tx);
    if (this.browser_active) { this.renderMain(this.app, this.uidata); }
  }



  receiveEvent(type, data) {

    console.log("EVENT RECEIVED: ");

    if (type == 'chat-render-request') {
      if (this.browser_active) {
        this.renderSidebar(this.app, this.uidata);
      }
    }

  }

  returnMenuItems() {
    return {
      'send-alaunius': {
        name: 'Send Alaunius',
        callback: (address) => {
          this.previous_state = this.active;
          this.active = "alaunius_form";

          this.main.render(this.app, this.uidata);
          this.main.attachEvents(this.app, this.uidata);

          document.getElementById('alaunius-to-address').value = address;
        }
      }
    }
  }

  getTokens() {

    let msg = {};
    msg.data = {address: this.app.wallet.returnPublicKey()};
    msg.request = 'get tokens';
    setTimeout(() => {
        console.log("sending request for funds...");
        this.app.network.sendRequest(msg.request, msg.data);
    }, 1000);
  }

  updateBalance() {
    if (this.browser_active) {
      let balance = this.app.wallet.returnBalance();
      document.querySelector('.alaunius-balance').innerHTML = balance + " SAITO";
    }
  }

}

module.exports = Alaunius;
