;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreSentimentConditionModule = factory()
	}(this, (function() {
		var path = require("path"),
			log = require(path.posix.join(process.env.maindir, '/ice/logger')),
			contextStore = require(path.posix.join(process.env.maindir, '/ice/context/store')),
			sentimentModule = require(path.posix.join(process.env.maindir, '/ice/sentiment')),
			_customConfig = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
			_customConditionLoggerLevel = (_customConfig && _customConfig['logger'] && _customConfig['logger']['logLevel'] && _customConfig['logger']['logLevel']['condition']) ? _customConfig['logger']['logLevel']['condition'] : "OFF",
			_get = function(context, condition) {
				var logId = contextStore.conversation.getConversationId(context);
				return log.tracePromise(__filename, _customConditionLoggerLevel, logId, function _getPromise (logOptions, resolve, reject) {
					sentimentModule.sentiment(contextStore.conversation.getMessage(context), contextStore.conversation.getLanguage(context), logId)
						.then(function(sentimentBinaryClassifier) {
							log.debug(logOptions, sentimentBinaryClassifier, 'conditionName=sentiment conditionValue=');
							resolve(sentimentBinaryClassifier);
						})
						.catch(function(e) {
							reject(e);
						});
				});
			};
		return {
			get: _get
		};
	}))
);