;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreConversationModule = factory()
	}(this, (function() {
		var path = require("path"),
			_customConfigBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
			_customConversationConfig = _customConfigBot['conversation'],
			_coreConversationConfig = require(path.posix.join(process.env.maindir, '/ice/conversation/conversation.config.json')),
			_conversationProvider = _coreConversationConfig.providers[_customConversationConfig.conversationProvider],
			_conversationModule = require(path.posix.join(process.env.maindir, _conversationProvider.module)),
			_customConversationLoggerLevel = (_customConfigBot && _customConfigBot['logger'] && _customConfigBot['logger']['logLevel'] && _customConfigBot['logger']['logLevel']['conversation']) ? _customConfigBot['logger']['logLevel']['conversation'] : "OFF",
			_customActionDispatcherConfig = _customConfigBot['actionDispatcher'],
			log = require(path.posix.join(process.env.maindir, '/ice/logger')),
			contextStore = require(path.posix.join(process.env.maindir, '/ice/context/store')),
			featureMapper = require(path.posix.join(process.env.maindir, '/ice/feature/mapper')),
			actionDispatcher = require(path.posix.join(process.env.maindir, '/ice/action/dispatcher')),
			_storeFeatures = function(context, features, timestamp, conversationId) {
				contextStore.dialog.setLastIntents(context, features.intents, timestamp, conversationId);
				contextStore.dialog.setLastEntities(context, features.entities, timestamp, conversationId);
				contextStore.dialog.setLastConditions(context, features.conditions, timestamp, conversationId);
				contextStore.conversation.setLastIntents(context, features.intents, timestamp, conversationId);
				contextStore.conversation.setLastEntities(context, features.entities, timestamp, conversationId);
				contextStore.conversation.setLastConditions(context, features.conditions, timestamp, conversationId);
			},
			_storeActions = function(context, actions, timestamp, conversationId) {
				var actionsNames = [];
				for (var i = 0; i < actions.length; i++) {
					actionsNames.push(_customActionDispatcherConfig.actions[actions[i]].actionName);
				}
				contextStore.dialog.setLastActions(context, actionsNames, timestamp, conversationId);
				contextStore.conversation.setLastActions(context, actionsNames, timestamp, conversationId);
			},
			_invoke = function(context, nlpOutput) {
				var logId = contextStore.conversation.getConversationId(context);
				return log.tracePromise(__filename, _customConversationLoggerLevel, logId, function _invokePromise (logOptions, resolve, reject) {
					featureMapper.map(context, nlpOutput)
						.then(function _featureMapperMap (featureMapArr) {
							log.debug(logOptions, _customConversationConfig.conversationProvider, 'conversationModule=');
							var timestamp_id_request = log.traceStart(),
								current_hr = process.hrtime(),
								historic_timestamp = current_hr[0] * 1e9 + current_hr[1];
							_storeFeatures(context, featureMapArr[1], historic_timestamp, logId);
							_conversationModule.invoke(context, featureMapArr[0])
								.then(function _conversationInvoke (parsedBody) {
									log.traceStop(logOptions, timestamp_id_request, 'conversationModule.invoke');
									log.debug(logOptions, parsedBody, 'conversationResponse=');
									_storeActions(context, parsedBody.actions, historic_timestamp, logId);
									actionDispatcher.dispatch(context, parsedBody, _customActionDispatcherConfig.thresholdActions, featureMapArr[1])
										.then(function _actionDispatch (messagesArray) {
											log.info(logOptions, 'Actions dispatched successfully');
											resolve(messagesArray);
										})
										.catch(function _actionDispatchError (e) {
											log.error(logOptions, 'Errors while dispatching actions');
											reject(e);
										});
								})
								.catch(function _conversationInvokeError (e) {
									log.traceStop(logOptions, timestamp_id_request, 'conversationModule.invoke');
									log.error(logOptions, 'Errors while fetching actions from conversation engine module');
									reject(e);
								});
						})
						.catch(function _featureMapperError (e) {
							log.error(logOptions, 'Errors while creating featureMap');
							reject(e);
						});
				});
			};
		return {
			invoke: _invoke
		};
	}))
);