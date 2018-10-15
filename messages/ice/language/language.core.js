;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreLanguageModule = factory()
	}(this, (function() {
		var path = require("path"),
			contextStore = require(path.posix.join(process.env.maindir, '/ice/context/store')),
			_customLanguageConfigBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json'))['language'],
			_coreLanguageConfig = require(path.posix.join(process.env.maindir, '/ice/language/language.config.json')),
			_languageProvider = _coreLanguageConfig.providers[_customLanguageConfigBot.languageProvider],
			_languageModule = require(path.posix.join(process.env.maindir, _languageProvider.module)),
			_defaultLanguage = function() {
				return _customLanguageConfigBot.fallbackLanguage || 'pt';
			},
			_locales = {core: {}, custom: {}},
			_localeResource = function(labelCode, language, type) {
				if (_locales && _locales[type] && _locales[type][language]) {
					if (_locales[type][language][labelCode])
						return _locales[type][language][labelCode];
					else
						throw new Error("Label not available for the selected language (" + language + ")");
				}
				else
					throw new Error("Language not available");
			},
			_localeResourceCoreLang = function(labelCode, language) {
				return _localeResource(labelCode, language, 'core');
			},
			_localeResourceCustomLang = function(labelCode, language) {
				return _localeResource(labelCode, language, 'custom');
			},
			_localeResourceCoreContext = function(labelCode, context) {
				return _localeResource(labelCode, contextStore.conversation.getLanguage(context), 'core');
			},
			_localeResourceCustomContext = function(labelCode, context) {
				return _localeResource(labelCode, contextStore.conversation.getLanguage(context), 'custom');
			},
			_localeResourceLang = function(labelCode, language) {
				if (_locales.custom[language].hasOwnProperty(labelCode))
					return _localeResourceCustomLang(labelCode, language);
				else
					return _localeResourceCoreLang(labelCode, language);
			},
			_localeResourceContext = function(labelCode, context) {
				if (_locales.custom[contextStore.conversation.getLanguage(context)].hasOwnProperty(labelCode))
					return _localeResourceCustomContext(labelCode, context);
				else
					return _localeResourceCoreContext(labelCode, context);
			};
		for (var langCore in _coreLanguageConfig.localeResources) {
			if (_coreLanguageConfig.localeResources.hasOwnProperty(langCore)) {
				_locales['core'][langCore] = require(path.posix.join(process.env.maindir, _coreLanguageConfig.localeResources[langCore]));
			}
		}
		for (var langCustom in _customLanguageConfigBot.localeResources) {
			if (_customLanguageConfigBot.localeResources.hasOwnProperty(langCustom)) {
				_locales['custom'][langCustom] = require(path.posix.join(process.env.maindir, _customLanguageConfigBot.localeResources[langCustom]));
			}
		}
		return {
			detectLanguage: _languageModule.detectLanguage,
			defaultLanguage: _defaultLanguage,
			localeResourceLang: _localeResourceLang,
			localeResourceContext: _localeResourceContext
		};
	}))
);