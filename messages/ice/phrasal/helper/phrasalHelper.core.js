;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.corePhrasalHelperModule = factory()
	}(this, (function() {
		var path = require('path'),
			log = require(path.posix.join(process.env.maindir, '/ice/logger')),
			languageModule = require(path.posix.join(process.env.maindir, '/ice/language')),
			_customConfigBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
			_customPhrasalComposerLoggerLevel = (_customConfigBot && _customConfigBot['logger'] && _customConfigBot['logger']['logLevel'] && _customConfigBot['logger']['logLevel']['phrasalComposer']) ? _customConfigBot['logger']['logLevel']['phrasalComposer'] : "OFF",
			_getPhrase = function(style, phrasalConfig, language) {
				if (phrasalConfig['phrases'] && phrasalConfig['phrases']['styles'] && phrasalConfig['phrases']['styles'][style] && phrasalConfig['phrases']['styles'][style][language]) {
					if (phrasalConfig.phrases.styles[style][language].length === 0) {
						if (phrasalConfig['phrases'] && phrasalConfig['phrases']['styles'] && phrasalConfig['phrases']['styles']['default'] && phrasalConfig['phrases']['styles']['default'][language]) {
							return (phrasalConfig.phrases.styles['default'][language][((Math.random() * phrasalConfig.phrases.styles['default'][language].length) | 0)]);
						}
						else {
							if (phrasalConfig['phrases'] && phrasalConfig['phrases']['styles'] && phrasalConfig['phrases']['styles']['default'] && phrasalConfig['phrases']['styles']['default'][languageModule.defaultLanguage()]) {
								return (phrasalConfig.phrases.styles['default'][languageModule.defaultLanguage()][((Math.random() * phrasalConfig.phrases.styles['default'][languageModule.defaultLanguage()].length) | 0)]);
							}
							else {
								throw new Error('No entry found for (style,language)=(' + style + ',' + language + ') or (default,' + language + ') or (default,' + languageModule.defaultLanguage() + ')');
							}
						}
					}
					else {
						return (phrasalConfig.phrases.styles[style][language][((Math.random() * phrasalConfig.phrases.styles[style][language].length) | 0)]);
					}
				}
				else {
					if (phrasalConfig['phrases'] && phrasalConfig['phrases']['styles'] && phrasalConfig['phrases']['styles']['default'] && phrasalConfig['phrases']['styles']['default'][language]) {
						return (phrasalConfig.phrases.styles['default'][language][((Math.random() * phrasalConfig.phrases.styles['default'][language].length) | 0)]);
					}
					else {
						if (phrasalConfig['phrases'] && phrasalConfig['phrases']['styles'] && phrasalConfig['phrases']['styles']['default'] && phrasalConfig['phrases']['styles']['default'][languageModule.defaultLanguage()]) {
							return (phrasalConfig.phrases.styles['default'][languageModule.defaultLanguage()][((Math.random() * phrasalConfig.phrases.styles['default'][languageModule.defaultLanguage()].length) | 0)]);
						}
						else {
							throw new Error('No entry found for (style,language)=(' + style + ',' + language + ') or (default,' + language + ') or (default,' + languageModule.defaultLanguage() + ')');
						}
					}
				}
			},
			_composer = function(style, phrasalConfig, language, _replacements, logId) {
				return log.traceFunction(__filename, _customPhrasalComposerLoggerLevel, logId, function _composerFunction (logOptions) {
					log.debug(logOptions, style, 'user.style=');
					log.debug(logOptions, phrasalConfig, 'phrasalConfig=');
					log.debug(logOptions, _replacements, 'replacementValues=');
					var _phrase = _getPhrase(style, phrasalConfig, language);
					log.debug(logOptions, _phrase, 'phraseToReplace=');
					for (var key in _replacements) {
						if (_replacements.hasOwnProperty(key)) {
							var re = new RegExp("#" + key + "#", "gi");
							log.debug(logOptions, re, 'regularExpression=');
							log.debug(logOptions, key, 'replacementKey=');
							log.debug(logOptions, _replacements[key], 'replacementValue=');
							_phrase = _phrase.replace(re, _replacements[key]);
							log.debug(logOptions, _phrase, 'phraseReplaced=');
						}
					}
					return _phrase;
				}, function _composeErrorFunction (logOptions, err) {
					log.error(logOptions, err);
					if (phrasalConfig['phrases'] && phrasalConfig['phrases']['styles'] && phrasalConfig['phrases']['styles']['default'] && phrasalConfig['phrases']['styles']['default'][language])
						return (phrasalConfig.phrases.styles['default'][language][((Math.random() * phrasalConfig.phrases.styles['default'][language].length) | 0)]);
					else
						throw new Error('No entry found for (style,language)=(' + style + ',' + language + ') or (default,' + language + ')');
				});
			};
		return {
			composer: _composer
		};
	}))
);