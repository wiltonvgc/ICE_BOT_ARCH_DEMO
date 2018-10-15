;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreNLPModule = factory()
	}(this, (function() {
		var path = require("path"),
			_customNLPConfigBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json'))['nlp'],
			_coreNLPConfig = require(path.posix.join(process.env.maindir, '/ice/nlp/nlp.config.json')),
			_nlpProvider = _coreNLPConfig.providers[_customNLPConfigBot.nlpProvider],
			_nlpModule = require(path.posix.join(process.env.maindir, _nlpProvider.module));
		return {
			getConfig: _nlpModule.getConfig
		};
	}))
);