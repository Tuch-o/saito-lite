const saito = require('../../lib/saito/saito');
const ModTemplate = require('../../lib/templates/modtemplate');
const ChatGroup = require('./lib/chatgroup');
const EmailChat = require('./lib/email-chat/email-chat');

const Header = require('../../lib/ui/header/header');
const ChatMain = require('./lib/chat-main/chat-main');

class Chat extends ModTemplate {

  constructor(app) {

    super(app);
    this.name = "Chat";
    this.events = ['encrypt-key-exchange-confirm'];

    //
    // data managed by chat manager
    //
    this.groups = [];

    this.uidata = {};

  }




  respondTo(type) {
    if (type == 'email-chat') {
      let obj = {};
          obj.render = this.renderEmailChat;
          obj.attachEvents = this.attachEventsEmailChat;
          obj.sendMessage = this.sendMessage;
      return obj;
    }
    return null;
  }

  renderEmailChat(app, data) {
    let chat_self = app.modules.returnModule("Chat");

    data.chat = {};
    data.chat.groups = chat_self.groups;
    data.chat.active_groups = [];

    EmailChat.initialize(app, data);
    EmailChat.render(app, data);
  }

  attachEventsEmailChat(app, data) {
    EmailChat.attachEvents(app, data);
  }

  receiveEvent(type, data) {

    //
    // new encryption channel opened
    //
    if (type === "encrypt-key-exchange-confirm") {
      if (data.publickey === undefined) { return; }
      this.createChatGroup(data);
    }

  }

  initialize(app) {

    super.initialize(app);

    //
    // create chatgroups from keychain
    //
    let keys = this.app.keys.returnKeys();
    for (let i = 0; i < keys.length; i++) {

      let chatgroup = {};
      let publickey = keys[i].publickey;

      chatgroup.id = this.app.crypto.hash(publickey);
      chatgroup.name = publickey.substring(0, 16);
      chatgroup.members = [];
      chatgroup.members.push(keys[i].publickey);
      chatgroup.members.push(app.wallet.returnPublicKey());
      chatgroup.identicon = app.keys.returnIdenticon(keys[i].publickey);
      chatgroup.messages = [];
      chatgroup.is_encrypted = 0;

console.log("JUST SET IDENTICON TO: " + chatgroup.identicon);

      if (this.app.options.chat != undefined) {
        if (this.app.options.chat.groups != undefined) {
          for (let z = 0; z < this.app.options.chat.groups.length; z++) {
	    if (this.app.options.chat.groups[z].id == chatgroup.id) {
	      chatgroup.messages = this.app.options.chat.groups[z].messages;
	    }
	  }
	}
      }
console.log("ADDING: " + JSON.stringify(chatgroup));
      this.groups.push(new ChatGroup(this.app, chatgroup));
    }



    //
    // create chatgroups from groups
    //
    let g = this.app.keys.returnGroups();
    for (let i = 0; i < g.length; i++) {

      let chatgroup = {};

      chatgroup.id = g[i].id;
      chatgroup.name = g[i].name;
      chatgroup.members = g[i].members;
      chatgroup.messages = [];
      chatgroup.is_encrypted = 0;
      chatgroup.identicon = app.keys.returnIdenticon(chatgroup.id);

console.log("JUST SET IDENTICON TO: " + chatgroup.identicon);

      if (this.app.options.chat != undefined) {
        if (this.app.options.chat.groups != undefined) {
          for (let z = 0; z < this.app.options.chat.groups.length; z++) {
            if (this.app.options.chat.groups[z].id == chatgroup.id) {
              chatgroup.messages = this.app.options.chat.groups[z].messages;
            }
          }
        }
      }

      this.groups.push(new ChatGroup(this.app, chatgroup));
    }
  

  }



  initializeHTML(app) {
    super.initializeHTML(app);

    Header.render(app, this.uidata);
    Header.attachEvents(app, this.uidata);

    this.uidata.chat = {};
    this.uidata.chat.groups = this.groups;

    this.uidata.chatmod = this;

    this.uidata.chat.active = "chat_list";

    ChatMain.render(app, this.uidata);
  }


  async onPeerHandshakeComplete(app, peer) {

    if (this.groups.length == 0) {

      let { publickey } = peer.peer;

console.log("P: " + JSON.stringify(peer.peer));

      let hash = this.app.crypto.hash(publickey);
      let chatgroup = {};
          chatgroup.id = hash;
	  chatgroup.name = hash.substring(0, 16);
	  chatgroup.members = [];
	  chatgroup.message = [];
	  chatgroup.identicon = this.app.keys.returnIdenticon(publickey);

console.log("JUST SET IDENTICON TO: " + chatgroup.identicon);

      let cg = new ChatGroup(this.app, chatgroup);
      cg.initialize(this.app);
      this.groups.push(cg);
    }

    let group_ids = this.groups.map(group => group.id);

    let txs = new Promise((resolve, reject) => {
      this.app.storage.loadTransactionsByKeys(group_ids, "Chat", 50, (txs) => {
        resolve(txs);
      });
    });

    let tx_messages = {} ;

    txs = await txs;

if (txs.length > 0) {
    txs.forEach(tx => {
      let { group_id } = tx.transaction.msg;
      let txmsg = tx.returnMessage();
      let msg_type = tx.transaction.from[0].add == this.app.wallet.returnPublicKey() ? 'myself' : 'others';
      let msg = Object.assign(txmsg, { sig: tx.transaction.sig, type: msg_type });
      (tx_messages[group_id] = tx_messages[group_id] || []).unshift(msg);
    });

     
    this.groups = this.groups.map(group => {
      group.messages = tx_messages[group.id] || [];
      return group;
    });
}

    this.sendEvent('chat-render-request', {});

    this.saveChat();
  }


  // key can be singular person or group key (TODO group keys?)
  createChatGroup(key=null) {

    if (key.publickey == null) { return; }

    let members = [this.app.wallet.returnPublicKey(), key.publickey];
    members.sort();

    let id = this.app.crypto.hash(`${members.join('_')}`)

    for (let i = 0; i < this.groups.length; i++) {
      if (this.groups[i].id == id) { return; }
    }

    let hash = this.app.crypto.hash(id);
    let chatgroup = {};
        chatgroup.id = hash;
        chatgroup.name = key.publickey.substring(0, 16);
        chatgroup.members = members;
        chatgroup.messages = [];
        chatgroup.identicon = this.app.keys.returnIdenticon(key.publickey);

console.log("JUST SET IDENTICON TO: " + chatgroup.identicon);

    let cg = new ChatGroup(this.app, chatgroup);
    cg.is_encrypted = key.aes_publickey !== '';
    cg.initialize(this.app);

    this.groups.push(cg);
    this.sendEvent('chat-render-request', {});
    this.saveChat();

  }




  //
  // onChain messages received on the blockchain arrive here
  //
  onConfirmation(blk, tx, conf, app) {

    let txmsg = tx.returnMessage();
    let chat_self = app.modules.returnModule("Chat");

    if (conf == 0) {
      if (txmsg.request == "chat message") {
        if (tx.transaction.from[0].add == app.wallet.returnPublicKey()) { return; }
	this.receiveChatMessage(app, tx);
      }
    }

  }


  //
  // messages received peer-to-peer arrive here
  //
  handlePeerRequest(app, req, peer, mycallback) {

    if (req.request == null) { return; }
    if (req.data == null) { return; }

    let tx = req.data //new saito.transaction(JSON.parse(req.data));

    try {

      switch (req.request) {

        case "chat message":
          this.receiveMessage(app, new saito.transaction(tx.transaction));
          if (mycallback) { mycallback({ "payload": "success", "error": {} }); };
          break;

        case "chat broadcast message":

          // save state of message
          let archive = this.app.modules.returnModule("Archive");
          archive.saveTransactionByKey(tx.transaction.msg.group_id, tx);

          this.app.network.peers.forEach(p => {
            if (p.peer.publickey !== peer.peer.publickey) {
              p.sendRequest("chat message", tx);
            }
          });
          if (mycallback) { mycallback({ "payload": "success", "error": {} }); }
          break;

        default:
	        break;
      }

     } catch(err) {
      console.log(err);
    }
  }





  chatLoadMessages(app, tx) {}

  async chatRequestMessages(app, tx) {}

  sendMessage (app, tx) {
    let recipient = app.network.peers[0].peer.publickey;
    let relay_mod = app.modules.returnModule('Relay');
    relay_mod.sendRelayMessage(recipient, 'chat broadcast message', tx);
  }

  receiveMessage(app, tx) {

    let txmsg = tx.returnMessage();

    this.groups.forEach(group => {
      if (group.id == txmsg.group_id) {
        let msg_type = tx.transaction.from[0].add == this.app.wallet.returnPublicKey() ? 'myself' : 'others';
        let msg = Object.assign(txmsg, { sig: tx.transaction.sig, type: msg_type });
        group.messages.push(msg);

        if (this.app.wallet.returnPublicKey() != txmsg.publickey) {
          this.sendEvent('chat_receive_message', msg);
        }

        this.sendEvent('chat-render-request', {});
      }
    });
  }

  saveChat() {
for (let i = 0; i < this.groups.length; i++) {
  console.log("G " + i + " " + this.groups[i].id);
}

    this.app.options.chat = Object.assign({}, this.app.options.chat);
    this.app.options.chat.groups = this.groups.map(group => {
      let {id, name, members, is_encrypted} = group;
      return {id, name, members, is_encrypted};
    });
    this.app.storage.saveOptions();
  }


}


module.exports = Chat;

