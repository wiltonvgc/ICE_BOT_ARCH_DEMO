;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreSentimentModule = factory()
	}(this, (function() {
		var path = require("path"),
			_customSentimentConfig = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json'))['sentiment'],
			_coreSentimentConfig = require(path.posix.join(process.env.maindir, '/ice/sentiment/sentiment.config.json')),
			_sentimentProvider = _coreSentimentConfig.providers[_customSentimentConfig.sentimentProvider],
			_sentimentModule = require(path.posix.join(process.env.maindir, _sentimentProvider.module));
		return {
			sentiment: _sentimentModule.sentiment
		};
	}))
);