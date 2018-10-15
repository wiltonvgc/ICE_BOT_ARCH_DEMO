var builder = require("botbuilder"),
	botbuilder_azure = require("botbuilder-azure"),
	path = require("path"),
	log = require(path.posix.join(process.env.maindir, '/ice/logger')), //concatena diretorio main do Azure com o caminho do componente
	conversation = require(path.posix.join(process.env.maindir, '/ice/conversation')),
	contextStore = require(path.posix.join(process.env.maindir, '/ice/context/store')),
	language = require(path.posix.join(process.env.maindir, '/ice/language')),
	nlp = require(path.posix.join(process.env.maindir, '/ice/nlp')),
	botHandler = require(path.posix.join(process.env.maindir, '/ice/botHandler')),
	_configBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
	_configDeploy = require(path.posix.join(process.env.maindir, '/bot/config/deploy.config.json')),
	botParameters = _configDeploy['botHandler'].providersConfig[_configBot['botHandler'].botProvider],
	botLoggerLevel = (_configBot && _configBot['logger'] && _configBot['logger']['logLevel'] && _configBot['logger']['logLevel']['botHandler']) ? _configBot['logger']['logLevel']['botHandler'] : "OFF",
	connector = new botbuilder_azure.BotServiceConnector({
		                                                     appId: botParameters['MicrosoftAppId'],
		                                                     appPassword: botParameters['MicrosoftAppPassword'],
		                                                     stateEndpoint: botParameters['BotStateEndpoint'],
		                                                     openIdMetadata: botParameters['BotOpenIdMetadata']
	                                                     }),
	//listener = connector.listen(),
	defaultLogOptions = log.options(path.basename(__filename, '.js'), botLoggerLevel),
	defaultErrorIceMessage = function(context, err) {
		return {
			message: err.stack, // mensagem de erro generica em caso de falhas
			inputHint: 'ignoring', // ignorar qualqer outra ação
			channelData: { // comandos especificos de canais
				directline: {
					ivrCommand: "transfer"
				}
			}
		};
	},
	/*withLogging = function(context, req) {
		console.log = context.log;
		listener(context, req);
	},*/
	logIceContextStore = function(logOptions, context) {
		log.debug(logOptions, contextStore.conversation.getCustomObj(context), 'context.iceCustom.conversation=');
		log.debug(logOptions, contextStore.conversation.getCoreObj(context), 'context.iceCore.conversation=');
		log.debug(logOptions, contextStore.user.getCustomObj(context), 'context.iceCustom.user=');
		log.debug(logOptions, contextStore.user.getCoreObj(context), 'context.iceCore.user=');
	};
try {
	
		//teste
		var defaultIntentDialog = new builder.IntentDialog();

		defaultIntentDialog.onDefault(function _intentDialog (context, nlpOutput, next) {
			try {
				var logOptions = log.options(path.basename(__filename, '.js'), botLoggerLevel, contextStore.conversation.getConversationId(context)),
					timestamp_id = log.traceStart(),
					messageLanguage = contextStore.conversation.getLanguage(context);
				botHandler.sendTyping(context);
				log.info(logOptions, '===== NEW MESSAGE ========================================================================================================================');
				language.detectLanguage(contextStore.conversation.getMessage(context), contextStore.conversation.getConversationId(context))
					.then(function _languageDetection (lang) {
						messageLanguage = lang;
						contextStore.conversation.setLanguage(context, messageLanguage);

						context.preferredLocale(lang, function(err) {
							if (err) log.error(logOptions, err, 'Error setting preferred locale:');
						});

						//Set LUIS recognizer
						if(messageLanguage=="en"){
							var recognizer = new builder.LuisRecognizer("https://eastus.api.cognitive.microsoft.com/luis/v2.0/apps/99b51512-aa68-4ee2-a71b-b68c9e9db02b?subscription-key=83c7c207df364ae4a642f24084ce4673&verbose=true&timezoneOffset=0&q=");
							defaultIntentDialog.recognizer(recognizer);
						}else if(messageLanguage=="pt"){
							var recognizer = new builder.LuisRecognizer("https://eastus.api.cognitive.microsoft.com/luis/v2.0/apps/d2fd7b1b-36c3-45c5-83bb-edd601a579c8?subscription-key=1ece24608bc74fbc9bb6b7429d03f2e1&verbose=true&timezoneOffset=0&q=");
							defaultIntentDialog.recognizer(recognizer);
						}else if(messageLanguage=="it"){
							var recognizer = new builder.LuisRecognizer("https://eastus.api.cognitive.microsoft.com/luis/v2.0/apps/bab6ef75-2aef-4592-92b3-9963b22fcfbc?subscription-key=4d26e35da9ce4e1f8c40ff8ad3c329e4&verbose=true&timezoneOffset=0&q=");
							defaultIntentDialog.recognizer(recognizer);							

						}else if(messageLanguage=="es"){
							var recognizer = new builder.LuisRecognizer("https://eastus.api.cognitive.microsoft.com/luis/v2.0/apps/c81555e8-88cf-4e89-9fc0-d8bce29e24cd?subscription-key=8d2004e67cdb41e197fee03aa9864da2&verbose=true&timezoneOffset=0&q=");
							defaultIntentDialog.recognizer(recognizer);
						}
					
						

						
						
					})
					.catch(function _languageDetectionError (e) {
						log.error(logOptions, e);
					})
					.finally(function _conversationInvoke () {
						
						//Get intents/entities of dialog
						defaultIntentDialog.recognize(context, function _getNLPOutPut(error,nlpOutput) {
							log.info(logOptions, contextStore.conversation.getMessage(context), 'clientMessage=');
							log.info(logOptions, messageLanguage, 'clientMessageDetectedLanguage=');
							log.debug(logOptions, nlpOutput, 'nlpOutput=');
							conversation.invoke(context, nlpOutput)
								.then(function _conversationResponse (messagesArray) {
									for (var i = 0; i < messagesArray.length; i++) {
										botHandler.sendIceMessage(context, messagesArray[i], false);
									}
									logIceContextStore(logOptions, context);
									log.traceStop(logOptions, timestamp_id);
									log.info(logOptions, 'Interaction terminated successfully');
								})
								.catch(function(err) {
									botHandler.sendIceMessage(context, defaultErrorIceMessage(context, err), true);
									logIceContextStore(logOptions, context);
									log.traceStop(logOptions, timestamp_id);
									log.error(logOptions, err, 'Interaction terminated with ');
								});
						});
					});
			}
			catch (err) {
				botHandler.sendIceMessage(context, defaultErrorIceMessage(context, err), true);
				log.traceStop(logOptions, timestamp_id);
				log.error(logOptions, err, 'Interaction terminated with ');
			}
		});
	var bot = new builder.UniversalBot(connector);
	contextStore.initializeStorage(bot);
	bot.dialog('/', defaultIntentDialog);
	bot.dialog('firstRunDialog', function _firstRunDialog (context) {
			try {
				var logOptions = log.options(path.basename(__filename, '.js'), botLoggerLevel, contextStore.conversation.getConversationId(context)),
					timestamp_id = log.traceStart(),
					userStyles = ["default"],
					messageLanguage = language.defaultLanguage();
				language.detectLanguage(contextStore.conversation.getMessage(context), contextStore.conversation.getConversationId(context))
				.then(function _languageDetection (lang) {
					messageLanguage = lang;
					contextStore.conversation.setLanguage(context, messageLanguage);
					context.preferredLocale(lang, function(err) {
						if (err) log.error(logOptions, err, 'Error setting preferred locale:');
					});
				})
				.catch(function _languageDetectionError (e) {
					log.error(logOptions, e);
				})
				.finally(function _conversationInvoke () {
				botHandler.sendTyping(context);
				log.info(logOptions, '===== NEW CONVERSATION ==========================================================================================================================');
				contextStore.conversation.setPropertyIfNotExistent(context, 'FLG_GREETED', true);
				contextStore.initializeContext(context);
				contextStore.conversation.setLanguage(context, messageLanguage);
				contextStore.user.setStyle(context, userStyles[((Math.random() * userStyles.length) | 0)]);
				log.debug(logOptions, contextStore.user.getStyle(context), 'clientStyle=');
				botHandler.sendIceMessage(context, {
					message: language.localeResourceContext("MSG_FIRST_GREETING", context),
					inputHint: 'expecting',
					channelData: {
						directline: {
							ivrCommand: "keep"
						}
					}
				}, true);
				log.traceStop(logOptions, timestamp_id);});
			}
			catch (err) {
				botHandler.sendIceMessage(context, defaultErrorIceMessage(context, err), true);
				log.traceStop(logOptions, timestamp_id);
				log.error(logOptions, err, 'Greeting terminated with ');
			}
		})
		.triggerAction({
			               onFindAction: function _checkIfGreeted (context, callback) {
				               var logOptions = log.options(path.basename(__filename, '.js'), botLoggerLevel, contextStore.conversation.getConversationId(context));
				               if (!contextStore.conversation.getProperty(context, 'FLG_GREETED')) {
					               log.debug(logOptions, 'Greeting not sent yet - send greeting');
					               callback(null, 1.1);
				               }
				               else {
					               log.debug(logOptions, 'Greeting already sent - bypass');
					               callback(null, 0.0);
				               }
			               }
		               });
	log.debug(defaultLogOptions, 'Bot initialized');
}
catch (err) {
	log.error(defaultLogOptions, err.stack, 'Error in bot initialization stage: ');
}
module.exports = connector.listen();
