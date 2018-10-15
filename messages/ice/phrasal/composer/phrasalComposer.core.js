;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.corePhrasalComposerModule = factory()
	}(this, (function() {
		var path = require("path"),
			log = require(path.posix.join(process.env.maindir, '/ice/logger')),
			contextStore = require(path.posix.join(process.env.maindir, '/ice/context/store')),
			_re = new RegExp("#actionName#", "gi"),
			_customConfigBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
			_configActions = _customConfigBot['actionDispatcher'] || {},
			_customPhrasalComposerLoggerLevel = (_customConfigBot && _customConfigBot['logger'] && _customConfigBot['logger']['logLevel'] && _customConfigBot['logger']['logLevel']['phrasalComposer']) ? _customConfigBot['logger']['logLevel']['phrasalComposer'] : "OFF",
			_compose = function(context, actionContexts) {
				return log.tracePromise(__filename, _customPhrasalComposerLoggerLevel, contextStore.conversation.getConversationId(context), function _composePromise (logOptions, resolve, reject) {
					var _promises = [];
					for (var actionContextIdx = 0; actionContextIdx < actionContexts.length; actionContextIdx++) {
						var template = _configActions.actions[actionContexts[actionContextIdx].actionId].phrasalModule,
							filename = template.replace(_re, _configActions.actions[actionContexts[actionContextIdx].actionId].actionName);
						_promises.push(require(path.posix.join(process.env.maindir, filename)).compose(context, actionContextIdx, actionContexts));
					}
					Promise.all(_promises)
						.then(function _composePromiseAll (_answersArr) {
							for (var i = 0; i < _answersArr.length; i++) {
								log.info(logOptions, _answersArr[i], 'answer[' + i + ']=');
							}
							resolve(_answersArr);
						})
						.catch(function _composePromiseAllError (e) {
							log.error(logOptions, 'Error while processing phrasal composers');
							reject(e);
						});
				});
			};
		return {
			compose: _compose
		};
	}))
);
