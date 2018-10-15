;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreStandardPhrasalModule = factory()
	}(this, (function() {
		var path = require("path"),
			moment = require("moment"),
			_re = new RegExp("#actionName#", "gi"),
			log = require(path.posix.join(process.env.maindir, '/ice/logger')),
			contextStore = require(path.posix.join(process.env.maindir, '/ice/context/store')),
			phrasalHelper = require(path.posix.join(process.env.maindir, '/ice/phrasal/helper')),
			language = require(path.posix.join(process.env.maindir, '/ice/language')),
			_customConfigBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
			_customActionsConfig = _customConfigBot['actionDispatcher']['actions'],
			_customPhrasalComposerLoggerLevel = (_customConfigBot && _customConfigBot['logger'] && _customConfigBot['logger']['logLevel'] && _customConfigBot['logger']['logLevel']['phrasalComposer']) ? _customConfigBot['logger']['logLevel']['phrasalComposer'] : "OFF",
			_compose = function(context, actionContextIdx, actionContexts) {
				var logId = contextStore.conversation.getConversationId(context),
					template = _customActionsConfig[actionContexts[actionContextIdx].actionId].phrasalConfig,
					filename = template.replace(_re, _customActionsConfig[actionContexts[actionContextIdx].actionId].actionName),
					_phrasalConfig = require(path.posix.join(process.env.maindir, filename));
				return log.tracePromise(__filename, _customPhrasalComposerLoggerLevel, logId, function _composePromise (logOptions, resolve, reject) {
					var languageCode = contextStore.conversation.getLanguage(context);
					moment.locale(languageCode);
					resolve(phrasalHelper.composer(contextStore.user.getStyle(context), _phrasalConfig, languageCode, {}, logId));
				});
			};
		return {
			compose: _compose
		};
	}))
);