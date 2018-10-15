;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreBotHandlerAzureModule = factory()
	}(this, (function() {
		var path = require("path"),
			builder = require("botbuilder"),
			log = require(path.posix.join(process.env.maindir, '/ice/logger')),
			contextStore = require(path.posix.join(process.env.maindir, '/ice/context/store')),
			_customConfigBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
			_customBotHandlerLoggerLevel = (_customConfigBot && _customConfigBot['logger'] && _customConfigBot['logger']['logLevel'] && _customConfigBot['logger']['logLevel']['botHandler']) ? _customConfigBot['logger']['logLevel']['botHandler'] : "OFF",
			_sendTyping = function(context) {
				var logId = contextStore.conversation.getConversationId(context);
				return log.tracePromise(__filename, _customBotHandlerLoggerLevel, logId, function _sendTypingPromise (logOptions, resolve, reject) {
					try {
						context.sendTyping();
						resolve();
					}
					catch (err) {
						reject(err);
					}
				});
			},
			_buildMessage = function(context, iceMessageObj) {
				var message = new builder.Message(context).text(iceMessageObj.message),
					channel = context.message.address.channelId;
				switch (iceMessageObj.inputHint) {
					case "accepting":
						message.inputHint(builder.InputHint.acceptingInput);
						break;
					case "expecting":
						message.inputHint(builder.InputHint.expectingInput);
						break;
					case "ignoring":
						message.inputHint(builder.InputHint.ignoringInput);
						break;
					default:
						message.inputHint(builder.InputHint.acceptingInput);
				}
				if (channel) {
					if (iceMessageObj.channelData[channel]) {
						var channelData = {};
						channelData[channel] = iceMessageObj.channelData[channel];
						message.sourceEvent(channelData);
					}
				}
				return message;
			},
			_newConversation = function(context, nlpOutput) {
				var logId = contextStore.conversation.getConversationId(context);
				return log.tracePromise(__filename, _customBotHandlerLoggerLevel, logId, function _newConversationPromise (logOptions, resolve, reject) {
				});
			},
			_sendIceMessage = function(context, iceMessageObj, endDialog) {
				var logId = contextStore.conversation.getConversationId(context);
				return log.tracePromise(__filename, _customBotHandlerLoggerLevel, logId, function _sendMessagePromise (logOptions, resolve, reject) {
					try {
						if (endDialog) {
							context.send(_buildMessage(context, iceMessageObj)).endDialog();
						}
						else {
							context.send(_buildMessage(context, iceMessageObj));
						}
						resolve();
					}
					catch (err) {
						reject(err);
					}
				});
			},
			_sendTextMessage = function(context, text, endDialog) {
				var logId = contextStore.conversation.getConversationId(context);
				return log.tracePromise(__filename, _customBotHandlerLoggerLevel, logId, function _sendMessagePromise (logOptions, resolve, reject) {
					try {
						if (endDialog) {
							context.send(text).endDialog();
						}
						else {
							context.send(text);
						}
						resolve();
					}
					catch (err) {
						reject(err);
					}
				});
			};
		return {
			sendTyping: _sendTyping,
			buildMessage: _buildMessage,
			newConversation: _newConversation,
			sendIceMessage: _sendIceMessage,
			sendTextMessage: _sendTextMessage
		};
	}))
);