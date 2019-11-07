const ChatBox	= require('./chat-box/chat-box');
const ChatList = require('./chat-list/chat-list');
const ChatManager = require('./chat-manager/chat-manager');
const AddContactModal = require('./modals/add-contact-modal');
const EmailChatTemplate = require('./email-chat.template.js');

module.exports = EmailChat = {
    // add receive event in email
    initialize(app, data) {
      my_listener = (msg) => this.addMessageToDOM(app, data, msg);
      app.connection.removeAllListeners('chat_receive_message');
      app.connection.on('chat_receive_message', my_listener);
***REMOVED***,

    render(app, data) {
      let email_chat = document.querySelector(".email-chat")
      email_chat.innerHTML = EmailChatTemplate();

      AddContactModal.render(app, data);
      ChatManager.render(app, data);
      ChatList.render(app, data);
***REMOVED***,

    attachEvents(app, data) {
      AddContactModal.attachEvents(app, data);
      ChatList.attachEvents(app, data);
***REMOVED***,

    addMessageToDOM(app, data, msg) {
      ChatBox.addMessageToDOM(msg, msg.sig, msg.type);
***REMOVED***,

***REMOVED***
