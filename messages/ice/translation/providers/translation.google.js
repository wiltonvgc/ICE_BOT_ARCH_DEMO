;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreTranslationGoogleModule = factory()
	}(this, (function() {
		var path = require("path"),
			requestPromise = require("request-promise"),
			log = require(path.posix.join(process.env.maindir, '/ice/logger')),
			_customConfigBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
			_customConfigDeploy = require(path.posix.join(process.env.maindir, '/bot/config/deploy.config.json')),
			_customTranslationConfig = (_customConfigDeploy && _customConfigDeploy['translation'] && _customConfigDeploy['translation']['providersConfig']) ? _customConfigDeploy['translation']['providersConfig'][_customConfigBot['translation']['translationProvider']] : {},
			_customTranslationLoggerLevel = (_customConfigBot && _customConfigBot['logger'] && _customConfigBot['logger']['logLevel'] && _customConfigBot['logger']['logLevel']['translation']) ? _customConfigBot['logger']['logLevel']['translation'] : "OFF",
			_translate = function(text, sourceLanguage, targetLanguage, logId) {
				return log.tracePromise(__filename, _customTranslationLoggerLevel, logId, function _translatePromise (logOptions, resolve, reject) {
					if (sourceLanguage === targetLanguage) {
						log.debug(logOptions, "No translation needed - sourceLanguage is the same as targetLanguage");
						resolve(text);
					}
					else {
						requestPromise({
							               method: 'POST',
							               uri: _customTranslationConfig.endpoint + _customTranslationConfig.apikey,
							               body: {
								               q: text,
								               source: sourceLanguage,
								               target: targetLanguage,
								               format: 'text'
							               },
							               json: true
						               })
							.then(function _responseRequestPromise (parsedBody) {
								log.debug(logOptions, parsedBody, "translationResult=");
								resolve(parsedBody.data.translations[0].translatedText);
							})
							.catch(function(e) {
								reject(e);
							});
					}
				});
			};
		return {
			translate: _translate
		};
	}))
);