import * as Alexa from 'ask-sdk-core';

// Note: fs and path are no longer needed as we are using native HTML Skill mode.


const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = 'Benvenuto su Music Hub. Puoi chiedermi di riprodurre musica o visualizzare la tua libreria.';

    // Check if device supports HTML (Web API for Games)
    if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.HTML']) {
      return handlerInput.responseBuilder
        .speak(speakOutput)
        .addDirective({
          type: 'Alexa.Presentation.HTML.Start',
          request: {
            uri: 'https://music-hub-three.vercel.app/',
            method: 'GET'
          },
          configuration: {
            timeoutInSeconds: 300
          }
        })
        .getResponse();
    }

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

const PlayMusicIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PlayMusicIntent';
  },
  handle(handlerInput) {
    const speakOutput = 'Sto riproducendo la tua musica su Harmony Hub.';
    
    // In a real scenario, here we would integrate with Spotify API
    // and update the APL datasource with current track info.

    // In HTML Skill mode, we can just acknowledge the command.
    // The website itself should handle the playback logic if it's already open.
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speakOutput = 'Puoi dire apri Harmony Hub o chiedimi di riprodurre una canzone.';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speakOutput = 'Arrivederci!';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    const speakOutput = 'Scusa, c\'è stato un errore. Riprova più tardi.';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

let skill;

export default async function handler(req, res) {
  // Alexa requests are ALWAYS POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'error',
      message: 'Method Not Allowed. This is an Alexa Skill endpoint, use POST with a valid Alexa payload.'
    });
  }

  try {
    if (!skill) {
      skill = Alexa.SkillBuilders.custom()
        .addRequestHandlers(
          LaunchRequestHandler,
          PlayMusicIntentHandler,
          HelpIntentHandler,
          CancelAndStopIntentHandler
        )
        .addErrorHandlers(ErrorHandler)
        .create();
    }

    const response = await skill.invoke(req.body);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Alexa Skill Invoke Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
      details: error.message
    });
  }
}
