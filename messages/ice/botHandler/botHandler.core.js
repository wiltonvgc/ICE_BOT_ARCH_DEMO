;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreBotHandlerModule = factory()
	}(this, (function() {
		var path = require("path"),
			_customBotHandlerConfig = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json'))['botHandler'],
			_coreBotHandlerConfig = require(path.posix.join(process.env.maindir, '/ice/botHandler/botHandler.config.json')),
			_botHandlerProvider = _coreBotHandlerConfig.providers[_customBotHandlerConfig.botProvider],
			_botHandlerModule = require(path.posix.join(process.env.maindir, _botHandlerProvider.module));
		return {
			sendTyping: _botHandlerModule.sendTyping,
			buildMessage: _botHandlerModule.buildMessage,
			newConversation: _botHandlerModule.newConversation,
			sendIceMessage: _botHandlerModule.sendIceMessage,
			sendTextMessage: _botHandlerModule.sendTextMessage
		};
	}))
);