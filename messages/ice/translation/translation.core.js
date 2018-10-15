;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreTranslationModule = factory()
	}(this, (function() {
		var path = require("path"),
			_customTranslationConfig = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json'))['translation'],
			_coreTranslationConfig = require(path.posix.join(process.env.maindir, '/ice/translation/translation.config.json')),
			_translateProvider = _coreTranslationConfig.providers[_customTranslationConfig.translationProvider],
			_translateModule = require(path.posix.join(process.env.maindir, _translateProvider.module));
		return {
			translate: _translateModule.translate
		};
	}))
);