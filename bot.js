'use strict';

// Weather Example
// See https://wit.ai/sungkim/weather/stories and https://wit.ai/docs/quickstart
const Wit = require('node-wit').Wit;
const FB = require('./facebook.js');
const Config = require('./const.js');

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

const messageFromResponse = (response) => {
  let {text, quickreplies: titles} = response;
  let quick_replies = [];

  if (titles) {
    quick_replies = titles.map((title) => {
      return {title, payload: null, content_type: 'text'}
    });
  }

  return {text, quick_replies}
}

const respond = (context, message) => {
  return new Promise((resolve, reject) => {
    // Bot testing mode, return
    if (require.main === module) {
      return resolve();
    }

    // Our bot has something to say!
    // Let's retrieve the Facebook user whose session belongs to from context
    // TODO: need to get Facebook user name
    const recipientId = context._fbid_;
    if (recipientId) {
      // Yay, we found our recipient!
      // Let's forward our bot response to her.
      FB.fbMessage(recipientId, message, (err, data) => {
        if (err) {
          console.log(
            'Oops! An error occurred while forwarding the response to',
            recipientId,
            ':',
            err
          );
        }

        // Let's give the wheel back to our bot
        resolve();
      });
    } else {
      console.log('Oops! Couldn\'t find user in context:', context);
      // Giving the wheel back to our bot
      resolve();
    }
  });
}

const logRequest = (request, response) => {
  let {context, entities} = request;
  let {quickreplies} = response;
  quickreplies || (quickreplies = []);

  let log = "";
  log += `=> ${request.text} | ${JSON.stringify(context)} \n`
  log += `   {${Object.keys(entities || {}).join(',')}} \n`

  log += `<= ${response.text} \n`
  log += `   [${quickreplies.join('] [')}] \n`

  console.log(log);
};

// Bot actions
const actions = {
  send(request, response) {
    let {context} = request;
    let message = messageFromResponse(response);
    logRequest(request, response);

    return respond(context, message);
  },

  ['assess-sleep-quality-based-on-duration'](request) {
    let {context, entities} = request;
    let message, sends = [], duration = firstEntityValue(entities, 'duration');


    console.log('assess-sleep-quality-based-on-duration | ', JSON.stringify(context));
    console.log(`   {${Object.keys(entities || {}).join(',')}} \n`);

    console.log('<=', `${duration} horas...`);
    sends.push(respond(context, {text: `${duration} horas...`}));

    if (duration < 7.5) {
      message = "Parece que você dormiu pouco";
    } else if (duration == 8) {
      message = "Parece uma quantidade boa";
    } else if (duration > 8.5) {
      message = "Acho que você dormiu demais";
    }

    console.log('<=', message);
    sends.push(respond(context, {text: message}));
    return Promise.all(sends);
  }
};


const getWit = () => {
  return Wit({accessToken: Config.WIT_TOKEN, actions});
};

exports.getWit = getWit;

// bot testing mode
// http://stackoverflow.com/questions/6398196
if (require.main === module) {
  console.log("Bot testing mode.");
  const interactive = require('node-wit').interactive;
  interactive(getWit());
}
