;(function(global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	global.coreNLPAzureModule = factory()
}(this, (function() {
	var path = require("path"),
		builder = require("botbuilder"),
		log = require(path.posix.join(process.env.maindir, '/ice/logger')),
		_customConfigBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
		_customConfigDeploy = require(path.posix.join(process.env.maindir, '/bot/config/deploy.config.json')),
		_nlpConfigLanguages = _customConfigDeploy.nlp.providersConfig[_customConfigBot.nlp.nlpProvider].languages,
		_customNLPLoggerLevel = (_customConfigBot && _customConfigBot['logger'] && _customConfigBot['logger']['logLevel'] && _customConfigBot['logger']['logLevel']['nlp']) ? _customConfigBot['logger']['logLevel']['nlp'] : "OFF",
		_getConfig = function() {
			return log.traceFunction(__filename, _customNLPLoggerLevel, undefined, function _getConfigFunction (logOptions) {
				var LUISRecognizers = {};
				for (var lang in _nlpConfigLanguages) {
					if (_nlpConfigLanguages.hasOwnProperty(lang))
						LUISRecognizers[lang] = _nlpConfigLanguages[lang]['endpoint'] + _nlpConfigLanguages[lang]['appid'] + '?subscription-key=' + _nlpConfigLanguages[lang]['apikey'] + '&verbose=True';
						log.debug(logOptions, LUISRecognizers, 'LUISRecognizer=');
				}
				log.debug(logOptions, LUISRecognizers, 'LUISRecognizer=');
				return [new builder.LuisRecognizer(LUISRecognizers)];
				/*var LUISRecognizers = [];	
				for (var lang in _nlpConfigLanguages) {
				if (_nlpConfigLanguages.hasOwnProperty(lang))
+						LUISRecognizers.push(new builder.LuisRecognizer(_nlpConfigLanguages[lang]['endpoint'] + _nlpConfigLanguages[lang]['appid'] + '?subscription-key=' + _nlpConfigLanguages[lang]['apikey'] + '&verbose=True'));
				}
				return LUISRecognizers;*/
				//var lang = 'es',
				//recognizer = _nlpConfigLanguages[lang]['endpoint'] + _nlpConfigLanguages[lang]['appid'] + '?subscription-key=' + _nlpConfigLanguages[lang]['apikey'] + '&verbose=True';
				//return [new builder.LuisRecognizer(recognizer)];
			}, function(logOptions, err) {
				log.error(logOptions, err);
				throw err;
			});
		};
	return {
		getConfig: _getConfig
	};
}))
);