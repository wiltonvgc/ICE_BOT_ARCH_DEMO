;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreConversationNeuralEngineModule = factory()
	}(this, (function() {
		var path = require("path"),
			requestPromise = require("request-promise"),
			_customConfigBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
			_customConfigDeploy = require(path.posix.join(process.env.maindir, '/bot/config/deploy.config.json')),
			_customConversationProviderConfig = (_customConfigDeploy && _customConfigDeploy['conversation'] && _customConfigDeploy['conversation']['providersConfig']) ? _customConfigDeploy['conversation']['providersConfig'][_customConfigBot['conversation']['conversationProvider']] : {},
			_customConversationLoggerLevel = (_customConfigBot && _customConfigBot['logger'] && _customConfigBot['logger']['logLevel'] && _customConfigBot['logger']['logLevel']['conversation']) ? _customConfigBot['logger']['logLevel']['conversation'] : "OFF",
			_customActionDispatcherConfig = _customConfigBot['actionDispatcher'],
			log = require(path.posix.join(process.env.maindir, '/ice/logger')),
			contextStore = require(path.posix.join(process.env.maindir, '/ice/context/store')),
			_invoke = function(context, featureMap) {
				return log.tracePromise(__filename, _customConversationLoggerLevel, contextStore.conversation.getConversationId(context), function _invokePromise (logOptions, resolve, reject) {
					var requestOptions = {
						method: 'GET',
						uri: _customConversationProviderConfig['endpoint'] + '?t=' + _customActionDispatcherConfig.thresholdActions + '&f=' + featureMap,
						json: true
					};
					log.debug(logOptions, requestOptions, 'externalNeuralNetworkRequest=');
					requestPromise(requestOptions)
						.then(function(parsedBody) {
							log.debug(logOptions, parsedBody, 'externalNeuralNetworkResponse=');
							resolve(parsedBody);
						})
						.catch(function(e) {
							log.error(logOptions, 'Errors while fetching actions from ConversationEngineNeuralNetwork ML webservice');
							reject(e);
						});
				});
			};
		return {
			invoke: _invoke
		};
	}))
);