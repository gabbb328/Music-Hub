import * as Alexa from 'ask-sdk-core';
import fs from 'fs';
import path from 'path';

// Load APL template safely for Vercel
const getMainDashboard = () => {
    const filePath = path.join(process.cwd(), 'alexa/apl/main-dashboard.json');
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = 'Benvenuto su Harmony Hub. Puoi chiedermi di riprodurre musica o visualizzare la tua libreria.';

    // Check if device supports APL
    if (Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL']) {
      return handlerInput.responseBuilder
        .speak(speakOutput)
        .addDirective({
          type: 'Alexa.Presentation.APL.RenderDocument',
          token: 'dashboardToken',
          document: getMainDashboard()
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

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .addDirective({
        type: 'Alexa.Presentation.APL.RenderDocument',
        token: 'playingToken',
        document: getMainDashboard(),
        datasources: {
          body: {
            title: "Bohemian Rhapsody",
            artist: "Queen",
            albumArt: "https://upload.wikimedia.org/wikipedia/en/9/9f/Bohemian_Rhapsody_cover.png",
            backgroundImage: "https://images.unsplash.com/photo-1514525253361-b83a65c0d273?q=80&w=2000"
          }
        }
      })
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
