;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreActionDispatcherModule = factory()
	}(this, (function() {
		var path = require("path"),
			Promise = require("bluebird"),
			log = require(path.posix.join(process.env.maindir, '/ice/logger')),
			contextStore = require(path.posix.join(process.env.maindir, '/ice/context/store')),
			phrasalComposer = require(path.posix.join(process.env.maindir, '/ice/phrasal/composer')),
			_re = new RegExp("#actionName#", "gi"),
			_customConfig = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
			_customActionDispatcherConfig = _customConfig['actionDispatcher'],
			_customActionDispatcherLoggerLevel = (_customConfig && _customConfig['logger'] && _customConfig['logger']['logLevel'] && _customConfig['logger']['logLevel']['actionDispatcher']) ? _customConfig['logger']['logLevel']['actionDispatcher'] : "OFF",
			_dispatch = function(context, conversationResponse, threshold, features) {
				return log.tracePromise(__filename, _customActionDispatcherLoggerLevel, contextStore.conversation.getConversationId(context), function _dispatchPromise (logOptions, resolve, reject) {
					var _actions = [], _promises = [];
					if (threshold) {
						for (var classifierIdx = 0; classifierIdx < conversationResponse.classifiers.length; classifierIdx++) {
							if (conversationResponse.classifiers[classifierIdx] >= threshold)
								_actions.push({
									              actionProbability: conversationResponse.classifiers[classifierIdx],
									              actionId: classifierIdx,
									              actionName: _customActionDispatcherConfig.actions[classifierIdx].actionName,
									              actionConfig: (_customActionDispatcherConfig.actions[classifierIdx].actionConfig || {})
								              });
						}
					}
					else {
						for (var actionIdx = 0; actionIdx < conversationResponse.actionsCount; actionIdx++) {
							_actions.push({
								              actionProbability: conversationResponse.classifiers[conversationResponse.actions[actionIdx]],
								              actionId: conversationResponse.actions[actionIdx],
								              actionName: _customActionDispatcherConfig.actions[conversationResponse.actions[actionIdx]].actionName,
								              actionConfig: (_customActionDispatcherConfig.actions[conversationResponse.actions[actionIdx]].actionConfig || {})
							              });
						}
					}
					log.debug(logOptions, _actions, 'actionsToDispatch=');
					if (_actions.length > 0) {
						_actions.sort(function(a, b) { return a.actionProbability - b.actionProbability; });
						for (var i = 0; i < _actions.length; i++) {
							var template = _customActionDispatcherConfig.actions[_actions[i].actionId].actionModule,
								filename = template.replace(_re, _customActionDispatcherConfig.actions[_actions[i].actionId].actionName);
							_promises.push(require(path.posix.join(process.env.maindir, filename)).execute(context, i, _actions, features));
						}
						Promise.all(_promises)
							.then(function _dispatchPromiseAll (_actionContexts) {
								log.debug(logOptions, _actionContexts, 'actionContextsReturned=');
								phrasalComposer.compose(context, _actionContexts)
									.then(function _phrasalCompose (phrasesArray) {
										log.info(logOptions, 'Phrasal composers dispatched successfully');
										var messagesArray = [];
										for (var msgIdx = 0; msgIdx < phrasesArray.length; msgIdx++) {
											messagesArray.push({
												                   message: phrasesArray[msgIdx],
												                   channelData: _actionContexts[msgIdx].channelData,
												                   inputHint: _actionContexts[msgIdx].inputHint
											                   });
										}
										resolve(messagesArray);
									})
									.catch(function _phrasalComposeError (e) {
										log.error(logOptions, 'Error while requesting phrasal composer modules');
										reject(e);
									});
							})
							.catch(function _dispatchPromiseAllError (e) {
								log.error(logOptions, 'Error while processing action submodules');
								reject(e);
							});
					}
					else {
						log.warn(logOptions, 'No actions identified for this featureMap');
						resolve([]);
					}
				});
			};
		return {
			dispatch: _dispatch
		};
	}))
);