;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.ENTITYREPLACEMENTPhrasalModule = factory()
	}(this, (function() {
		var path = require("path"),
			moment = require("moment"),
			_re = new RegExp("#actionName#", "gi"),
			log = require(path.posix.join(process.env.maindir, '/ice/logger')),
			contextStore = require(path.posix.join(process.env.maindir, '/ice/context/store')),
			phrasalHelper = require(path.posix.join(process.env.maindir, '/ice/phrasal/helper')),
			language = require(path.posix.join(process.env.maindir, '/ice/language')),
			_customConfigBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
			_customActionsConfig = _customConfigBot['actionDispatcher']['actions'],
			_customPhrasalComposerLoggerLevel = (_customConfigBot && _customConfigBot['logger'] && _customConfigBot['logger']['logLevel'] && _customConfigBot['logger']['logLevel']['phrasalComposer']) ? _customConfigBot['logger']['logLevel']['phrasalComposer'] : "OFF",
			_compose = function(context, actionContextIdx, actionContexts) {
				var logId = contextStore.conversation.getConversationId(context),
					template = _customActionsConfig[actionContexts[actionContextIdx].actionId].phrasalConfig,
					filename = template.replace(_re, _customActionsConfig[actionContexts[actionContextIdx].actionId].actionName),
					_phrasalConfig = require(path.posix.join(process.env.maindir, filename));
				return log.tracePromise(__filename, _customPhrasalComposerLoggerLevel, logId, function(logOptions, resolve, reject) {
					var languageCode = contextStore.conversation.getLanguage(context);
					moment.locale(languageCode);

					// START YOUR CODE HERE
					var VALOR_CONTA_VAR = contextStore.conversation.getProperty(context, "VALOR_CONTA");
					var VALOR_CONTA_FINAL = contextStore.conversation.getProperty(context, "VALOR_CONTA_FINAL");
					var COUNT_NAO_ENTENDIMENTO_VAR = contextStore.conversation.getProperty(context, "COUNT_NAO_ENTENDIMENTO");
					var STRING_SERVIR_BEBIDA_PT = contextStore.conversation.getProperty(context, "STRING_SERVIR_BEBIDA_PT");
					var STRING_SERVIR_BEBIDA_ES = contextStore.conversation.getProperty(context, "STRING_SERVIR_BEBIDA_ES");
					var STRING_SERVIR_BEBIDA_EN = contextStore.conversation.getProperty(context, "STRING_SERVIR_BEBIDA_EN");
					var STRING_SERVIR_BEBIDA_IT = contextStore.conversation.getProperty(context, "STRING_SERVIR_BEBIDA_IT");

					/*var entitiesStr = '',
						features = actionContexts[actionContextIdx].data;
					for (var i = 0; i < features.entities.length; i++) {
						entitiesStr += ((i === 0) ? '' : ' ' + language.localeResourceContext("INT_CONJUNCAO", context) + ' ') + language.localeResourceContext("INT_" + features.entities[i].entity, context); // alteracao bruno ".type"
					}*/

					
					resolve(phrasalHelper.composer(contextStore.user.getStyle(context), _phrasalConfig, languageCode, {entityString: "",VALOR_CONTA:VALOR_CONTA_VAR, COUNT_NAO_ENTENDIMENTO:COUNT_NAO_ENTENDIMENTO_VAR, CONTA_FINAL:VALOR_CONTA_FINAL,
						STR_SERVIR_BEBIDA_PT: STRING_SERVIR_BEBIDA_PT, STR_SERVIR_BEBIDA_ES: STRING_SERVIR_BEBIDA_ES,
						STR_SERVIR_BEBIDA_IT: STRING_SERVIR_BEBIDA_IT, STR_SERVIR_BEBIDA_EN: STRING_SERVIR_BEBIDA_EN
					
					}, logId));
					// FINISH YOUR CODE HERE!
				});
			};
		return {
			compose: _compose
		};
	}))
);