;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreConditionModule = factory()
	}(this, (function() {
		var path = require("path"),
			log = require(path.posix.join(process.env.maindir, '/ice/logger')),
			contextStore = require(path.posix.join(process.env.maindir, '/ice/context/store')),
			_customConfig = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
			_customConditionConfig = _customConfig['condition'],
			_customConditionLoggerLevel = (_customConfig && _customConfig['logger'] && _customConfig['logger']['logLevel'] && _customConfig['logger']['logLevel']['condition']) ? _customConfig['logger']['logLevel']['condition'] : "OFF",
			_getCondition = function(context, conditionIndex) {
				return log.tracePromise(__filename, _customConditionLoggerLevel, contextStore.conversation.getConversationId(context), function _getConditionPromise (logOptions, resolve, reject) {
					var _conditionModule = require(path.posix.join(process.env.maindir, _customConditionConfig.conditions[conditionIndex].conditionModule)),
						_conditionModuleName = _customConditionConfig.conditions[conditionIndex].conditionModule,
						_conditionCache = _customConditionConfig.conditions[conditionIndex].conditionCacheTTLsec || 0,
						_conditionLabel = _customConditionConfig.conditions[conditionIndex].conditionName;
					contextStore.conversation.getConditionCache(context, _conditionLabel, _conditionCache)
						.then(function _getConditionCache (condition) {
							if (!condition.expired) {
								log.debug(logOptions, condition.value, 'Returned condition [' + _conditionLabel + '] from valid cache - conditionValue=');
								resolve(condition.value);
							}
							else {
								_conditionModule.get(context, _customConditionConfig.conditions[conditionIndex])
									.then(function _conditionGet (_conditionValue) {
										if (_conditionCache > 0) {
											contextStore.setConditionCache(context, _conditionLabel, _conditionValue);
											log.debug(logOptions, _conditionValue, 'Stored condition [' + _conditionLabel + '] into cache - conditionValue=');
										}
										log.debug(logOptions, _conditionValue, 'Returned condition [' + _conditionLabel + '] from submodule [' + _conditionModuleName + '] - conditionValue=');
										resolve(_conditionValue);
									})
									.catch(function _conditionGetError (e) {
										log.error(logOptions, 'Error while processing condition [' + _conditionLabel + '] on submodule [' + _conditionModuleName + ']');
										reject(e);
									});
							}
						})
						.catch(function _getConditionCacheError (e) {
							log.error(logOptions, 'Error while getting condition [' + _conditionLabel + '] from cache');
							reject(e);
						});
				});
			};
		return {
			getCondition: _getCondition
		};
	}))
);