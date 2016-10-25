'use strict';

// See the Send API reference
// https://developers.facebook.com/docs/messenger-platform/send-api-reference
const requester = require('request');
const Config = require('./const.js');
const _ = require('lodash');

const request = requester.defaults({
  uri: 'https://graph.facebook.com/v2.6/me/messages',
  method: 'POST',
  json: true,
  qs: {
    access_token: Config.FB_PAGE_TOKEN
  },
  headers: {
    'Content-Type': 'application/json'
  },
});


const typedMessage = (recipientId, message, cb) => {
  const typingTime = message.typingTime || _.sample([2, 3.5, 4]) * 1000;
  delete message.typingTime;

  senderAction(recipientId, 'typing_on', (error, data) => {
    error = error || (data && data.error && data.error.message)
    cb && error && cb(error, data);

    setTimeout(() => {
      fbMessage(recipientId, message, (error, data) => {
        error = error || (data && data.error && data.error.message)
        cb && cb(error, data);
      })
    }, typingTime);

  });
};

// https://developers.facebook.com/docs/messenger-platform/send-api-reference/sender-actions
const senderAction = (recipientId, action, cb) => {
  const options = {
    form: {
      recipient: {
      	id: recipientId
      },
      sender_action: action
    }
  };

  return request(options, (err, resp, data) => {
    cb && cb(err || data.error && data.error.message, data);
  });
};

const fbMessage = (recipientId, message, cb) => {
  const options = {
    form: {
      recipient: {
        id: recipientId,
      },
      message: message
    },
  };

  return request(options, (err, resp, data) => {
    cb && cb(err || data.error && data.error.message, data);
  });
};


// See the Webhook reference
// https://developers.facebook.com/docs/messenger-platform/webhook-reference
const getFirstMessagingEntry = (body) => {
  const val = body.object === 'page' &&
    body.entry &&
    Array.isArray(body.entry) &&
    body.entry.length > 0 &&
    body.entry[0] &&
    body.entry[0].messaging &&
    Array.isArray(body.entry[0].messaging) &&
    body.entry[0].messaging.length > 0 &&
    body.entry[0].messaging[0];

  return val || null;
};

module.exports = {
  getFirstMessagingEntry: getFirstMessagingEntry,
  typedMessage: typedMessage,
  fbMessage: fbMessage,
  fbReq: request
};
