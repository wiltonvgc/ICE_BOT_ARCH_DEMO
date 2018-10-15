;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreLanguageAzureModule = factory()
	}(this, (function() {
		var path = require("path"),
			requestPromise = require("request-promise"),
			log = require(path.posix.join(process.env.maindir, '/ice/logger')),
			_customConfigBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
			_customConfigDeploy = require(path.posix.join(process.env.maindir, '/bot/config/deploy.config.json')),
			_customLanguageConfigBot = _customConfigBot['language'] || {},
			_customLanguageConfigDeploy = _customConfigDeploy['language'] || {},
			_customLanguageLoggerLevel = (_customConfigBot && _customConfigBot['logger'] && _customConfigBot['logger']['logLevel'] && _customConfigBot['logger']['logLevel']['language']) ? _customConfigBot['logger']['logLevel']['language'] : "OFF",
			_detectLanguage = function(text, logId) {
				return log.tracePromise(__filename, _customLanguageLoggerLevel, logId, function _detectLanguagePromise (logOptions, resolve, reject) {
					requestPromise({
						               method: 'POST',
						               uri: _customLanguageConfigDeploy['providersConfig'][_customLanguageConfigBot.languageProvider].endpoint,
						               headers: {
							               "Ocp-Apim-Subscription-Key": _customLanguageConfigDeploy['providersConfig'][_customLanguageConfigBot.languageProvider].apikey,
							               "Content-Type": "application/json"
						               },
						               body: {
							               "documents": [
								               {
									               "id": logId,
									               "text": text
								               }
							               ]
						               },
						               json: true
					               })
						.then(function _requestResponsePromise (parsedBody) {
							log.debug(logOptions, parsedBody, "detectedLanguages=");
							if (parsedBody.errors.length > 0)
								reject(parsedBody.errors);
							else {
								if (parsedBody.documents[0].detectedLanguages[0].score === 'NaN')
									resolve(_customLanguageConfigBot['fallbackLanguage']);
								else
									resolve(parsedBody.documents[0].detectedLanguages[0].iso6391Name);
							}
						})
						.catch(function(e) {
							reject(e);
						});
				});
			};
		return {
			detectLanguage: _detectLanguage
		};
	}))
);