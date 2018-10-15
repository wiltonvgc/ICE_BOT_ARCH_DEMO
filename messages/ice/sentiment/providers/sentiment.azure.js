;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreSentimentAzureModule = factory()
	}(this, (function() {
		var path = require("path"),
			requestPromise = require("request-promise"),
			log = require(path.posix.join(process.env.maindir, '/ice/logger')),
			_customConfigBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
			_customConfigDeploy = require(path.posix.join(process.env.maindir, '/bot/config/deploy.config.json')),
			_customSentimentConfig = (_customConfigDeploy && _customConfigDeploy['sentiment'] && _customConfigDeploy['sentiment']['providersConfig']) ? _customConfigDeploy['sentiment']['providersConfig'][_customConfigBot['sentiment']['sentimentProvider']] : {},
			_customSentimentLoggerLevel = (_customConfigBot && _customConfigBot['logger'] && _customConfigBot['logger']['logLevel'] && _customConfigBot['logger']['logLevel']['sentiment']) ? _customConfigBot['logger']['logLevel']['sentiment'] : "OFF",
			_sentiment = function(text, sourceLanguage, logId) {
				return log.tracePromise(__filename, _customSentimentLoggerLevel, logId, function _sentimentPromise (logOptions, resolve, reject) {
					requestPromise({
						               method: 'POST',
						               uri: _customSentimentConfig.endpoint,
						               headers: {
							               "Ocp-Apim-Subscription-Key": _customSentimentConfig.apikey,
							               "Content-Type": "application/json"
						               },
						               body: {
							               "documents": [
								               {
									               "language": sourceLanguage,
									               "id": logId,
									               "text": text
								               }
							               ]
						               },
						               json: true
					               })
						.then(function _responseRequestPromise (parsedBody) {
							log.debug(logOptions, parsedBody, "sentimentResult=");
							if (parsedBody.errors.length > 0)
								reject(parsedBody.errors);
							else
								resolve(parsedBody.documents[0].score > 0.5);
						})
						.catch(function(e) {
							reject(e);
						});
				});
			};
		return {
			sentiment: _sentiment
		};
	}))
);