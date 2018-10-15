;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreContextHelperModule = factory()
	}(this, (function() {
		var util = require("util"),
			path = require("path"),
			Promise = require("bluebird"),
			logNotValidProperty = 'propertyName is not a valid label',
			logNotValidContext = 'context is not a valid object',
			logNotValidCondition = 'conditionLabel is not a valid label',
			_customLanguageConfig = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json'))['language'],
			_customLanguageFallback = _customLanguageConfig['fallbackLanguage'] || 'pt',
			_inspect = function(obj) {
				return util.inspect(obj, {depth: null, colors: false, maxArrayLength: null});
			},
			_setEmptyObjectIfNotExist = function(context, contextPropertyName, dataType) {
				if (!context[contextPropertyName]) context[contextPropertyName] = {};
				if (!context[contextPropertyName][dataType]) context[contextPropertyName][dataType] = {};
			},
			_setEmptyArrayIfNotExist = function(context, contextPropertyName, dataType) {
				if (!context[contextPropertyName]) context[contextPropertyName] = {};
				if (!context[contextPropertyName][dataType]) context[contextPropertyName][dataType] = [];
			},
			_newError = function(moduleName, contextPropertyName, functionName, errorText, obj) {
				throw new Error(util.format('[%s] {%s.%s} %s: %s', moduleName, contextPropertyName, functionName, errorText, _inspect(obj)));
			},
			_exists = function(context, contextPropertyName) {
				return context && context[contextPropertyName];
			},
			_existsAndNotEmpty = function(obj) {
				return obj && (obj.length > 0);
			},
			_constructSetProperty = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, propertyName, propertyValue) {
					if (_exists(context, contextPropertyName)) {
						_setEmptyObjectIfNotExist(context, contextPropertyName, dataType);
						if (_existsAndNotEmpty(propertyName))
							context[contextPropertyName][dataType][propertyName] = propertyValue;
						else
							throw _newError(moduleName, contextPropertyName, functionName, logNotValidProperty, propertyName);
					}
					else
						throw _newError(moduleName, contextPropertyName, functionName, logNotValidContext, context);
				};
			},
			_constructSetPropertyIfNotExistent = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, propertyName, propertyValue) {
					if (!_constructHasProperty(contextPropertyName, dataType, functionName, moduleName)(context, propertyName))
						_constructSetProperty(contextPropertyName, dataType, functionName, moduleName)(context, propertyName, propertyValue);
				};
			},
			_constructMergeProperty = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, parentPropertyName, propertyName, propertyValue) {
					if (_exists(context, contextPropertyName)) {
						_setEmptyObjectIfNotExist(context, contextPropertyName, dataType);
						if (_existsAndNotEmpty(parentPropertyName)) {
							_setEmptyObjectIfNotExist(context[contextPropertyName], dataType, parentPropertyName);
							if (_existsAndNotEmpty(propertyName))
								context[contextPropertyName][dataType][parentPropertyName][propertyName] = propertyValue;
							else
								throw _newError(moduleName, contextPropertyName, functionName, logNotValidProperty, propertyName);
						}
						else
							throw _newError(moduleName, contextPropertyName, functionName, logNotValidProperty, parentPropertyName);
					}
					else
						throw _newError(moduleName, contextPropertyName, functionName, logNotValidContext, context);
				};
			},
			_constructHasProperty = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, propertyName) {
					return (_exists(context, contextPropertyName) && context[contextPropertyName][dataType] && (context[contextPropertyName][dataType][propertyName] !== undefined));
				};
			},
			_constructGetProperty = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, propertyName, errorIfNotExist) {
					if (_exists(context, contextPropertyName)) {
						_setEmptyObjectIfNotExist(context, contextPropertyName, dataType);
						if (context[contextPropertyName][dataType][propertyName] !== undefined)
							return context[contextPropertyName][dataType][propertyName];
						else if (errorIfNotExist)
							throw _newError(moduleName, contextPropertyName, functionName, logNotValidProperty, propertyName);
						else
							return undefined;
					}
					else
						throw _newError(moduleName, contextPropertyName, functionName, logNotValidContext, context);
				};
			},
			_constructGetObj = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context) {
					if (_exists(context, contextPropertyName)) {
						_setEmptyObjectIfNotExist(context, contextPropertyName, dataType);
						return context[contextPropertyName][dataType];
					}
					else
						throw _newError(moduleName, contextPropertyName, functionName, logNotValidContext, context);
				};
			},
			_constructSetLanguage = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, languageCode) {
					_constructSetProperty(contextPropertyName, dataType, functionName, moduleName)(context, 'languageCode', languageCode);
				};
			},
			_constructGetLanguage = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context) {
					try {
						return _constructGetProperty(contextPropertyName, dataType, functionName, moduleName)(context, 'languageCode') || _customLanguageFallback;
					}
					catch (err) {
						return _customLanguageFallback;
					}
				};
			},
			_constructSetStyle = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, style) {
					_constructSetProperty(contextPropertyName, dataType, functionName, moduleName)(context, 'userStyle', style);
				};
			},
			_constructGetStyle = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context) {
					try {
						return _constructGetProperty(contextPropertyName, dataType, functionName, moduleName)(context, 'userStyle') || 'default';
					}
					catch (err) {
						return 'default';
					}
				};
			},
			_constructSetConditionCache = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, conditionLabel, conditionValue) {
					if (_exists(context, contextPropertyName)) {
						_setEmptyObjectIfNotExist(context, contextPropertyName, dataType);
						_setEmptyObjectIfNotExist(context[contextPropertyName], dataType, 'condition');
						if (_existsAndNotEmpty(conditionLabel))
							context[contextPropertyName][dataType]['condition'][conditionLabel] = {
								ts: Date.now(),
								value: conditionValue
							};
						else
							throw _newError(moduleName, contextPropertyName, functionName, logNotValidCondition, conditionLabel);
					}
					else
						throw _newError(moduleName, contextPropertyName, functionName, logNotValidContext, context);
				};
			},
			_constructGetConditionCache = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, conditionLabel, conditionCache) {
					return new Promise(function(resolve, reject) {
						try {
							if (_exists(context, contextPropertyName)) {
								_setEmptyObjectIfNotExist(context, contextPropertyName, dataType);
								_setEmptyObjectIfNotExist(context[contextPropertyName], dataType, 'condition');
								if (_existsAndNotEmpty(conditionLabel)) {
									if (context[contextPropertyName][dataType]['condition'][conditionLabel]) {
										if ((conditionCache > 0) && ((Date.now() - context[contextPropertyName][dataType]['condition'][conditionLabel]['ts']) / 1000 < conditionCache))
											resolve({
												        expired: false,
												        value: context[contextPropertyName][dataType]['condition'][conditionLabel]['value']
											        });
										else
											resolve({expired: true});
									}
									else
										resolve({expired: true});
								}
								else
									reject(_newError(moduleName, contextPropertyName, functionName, logNotValidCondition, conditionLabel));
							}
							else
								reject(_newError(moduleName, contextPropertyName, functionName, logNotValidContext, context));
						}
						catch (err) {
							reject(err);
						}
					});
				};
			},
			_constructSetLast = function(contextPropertyName, dataType, functionName, moduleName, itemType) {
				return function(context, items, timestamp, conversationId) {
					_setEmptyObjectIfNotExist(context[contextPropertyName], dataType, 'last');
					_constructMergeProperty(contextPropertyName, dataType, functionName, moduleName)(context, 'last', itemType, items);
					if (_exists(context, contextPropertyName)) {
						_setEmptyObjectIfNotExist(context[contextPropertyName], dataType, 'historic');
						_setEmptyArrayIfNotExist(context[contextPropertyName][dataType], 'historic', itemType);
						var current_time = timestamp;
						if (!timestamp) {
							var current_hr = process.hrtime();
							current_time = current_hr[0] * 1e9 + current_hr[1];
						}
						var json = {conversationId: conversationId || 'noId', timestamp: current_time};
						json[itemType] = items || [];
						context[contextPropertyName][dataType]['historic'][itemType].push(json);
					}
					else
						throw _newError(moduleName, contextPropertyName, functionName, logNotValidContext, context);
				};
			},
			_constructGetLast = function(contextPropertyName, dataType, functionName, moduleName, itemType) {
				return function(context) {
					try {
						return _constructGetProperty(contextPropertyName, dataType, functionName, moduleName)(context, 'last')[itemType];
					}
					catch (err) {
						return [];
					}
				};
			},
			_constructGetHistoric = function(contextPropertyName, dataType, functionName, moduleName, itemType) {
				return function(context) {
					try {
						return _constructGetProperty(contextPropertyName, dataType, functionName, moduleName)(context, 'historic')[itemType];
					}
					catch (err) {
						return [];
					}
				};
			},
			_constructGetHistoricByIndex = function(contextPropertyName, dataType, functionName, moduleName, itemType) {
				return function(context, index) {
					var historic = _constructGetHistoric(contextPropertyName, dataType, functionName, moduleName, itemType)(context);
					return historic[((index < 0) ? 0 : ((index >= historic.length) ? (historic.length - 1) : index))];
				};
			},
			_constructGetHistoricByRelativeIndexFromLast = function(contextPropertyName, dataType, functionName, moduleName, itemType) {
				return function(context, relativeIndexFromLast) {
					var items = _constructGetHistoric(contextPropertyName, dataType, functionName, moduleName, itemType)(context),
						real_relativeIndexFromLast = (relativeIndexFromLast < 0) ? -relativeIndexFromLast : relativeIndexFromLast,
						real_start_index = (real_relativeIndexFromLast > (items.length - 1)) ? 0 : (items.length - 1 - real_relativeIndexFromLast);
					return items[real_start_index];
				};
			},
			_constructGetHistoricRangeByRelativeIndexFromLast = function(contextPropertyName, dataType, functionName, moduleName, itemType) {
				return function(context, relativeIndexFromLast, quantity) {
					var items = _constructGetHistoric(contextPropertyName, dataType, functionName, moduleName, itemType)(context),
						range = [],
						real_relativeIndexFromLast = (relativeIndexFromLast < 0) ? -relativeIndexFromLast : relativeIndexFromLast,
						real_start_index = (real_relativeIndexFromLast > (items.length - 1)) ? 0 : (items.length - 1 - real_relativeIndexFromLast),
						real_quantity = (quantity > (items.length - real_start_index)) ? (items.length - real_start_index) : quantity;
					for (var index = real_start_index; index < real_quantity; index++) {
						range.push(items[index]);
					}
					return range;
				};
			},
			_hrTimeDiffInSecs = function(after, before) {
				return ((after - before) / 1e9) | 0;
			},
			_constructGetHistoricByRelativeTimeFromLast = function(contextPropertyName, dataType, functionName, moduleName, itemType) {
				return function(context, relativeTimeFromLastInSecs) {
					var items = _constructGetHistoric(contextPropertyName, dataType, functionName, moduleName, itemType)(context),
						real_relativeTimeFromLastInSecs = (relativeTimeFromLastInSecs < 0) ? -relativeTimeFromLastInSecs : relativeTimeFromLastInSecs,
						index = items.length - 1,
						after = (index >= 0) ? items[index].timestamp : 0;
					while ((index > 0) && (_hrTimeDiffInSecs(after, items[index].timestamp) <= real_relativeTimeFromLastInSecs)) {
						index--;
					}
					return after > 0 ? items[index] : undefined;
				};
			},
			_constructGetHistoricRangeByRelativeTimeFromLast = function(contextPropertyName, dataType, functionName, moduleName, itemType) {
				return function(context, relativeTimeFromLastInSecs) {
					var items = _constructGetHistoric(contextPropertyName, dataType, functionName, moduleName, itemType)(context),
						real_relativeTimeFromLastInSecs = (relativeTimeFromLastInSecs < 0) ? -relativeTimeFromLastInSecs : relativeTimeFromLastInSecs,
						range = [],
						index = items.length - 1,
						after = index >= 0 ? items[items.length - 1].timestamp : 0;
					while (index > 0 && _hrTimeDiffInSecs(after, items[index].timestamp) <= real_relativeTimeFromLastInSecs) {
						range.push(items[index--]);
					}
					return range;
				};
			},
			_constructSetLastActions = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, actions, timestamp, conversationId) {
					_constructSetLast(contextPropertyName, dataType, functionName, moduleName, 'actions')(context, actions, timestamp, conversationId);
				};
			},
			_constructGetLastActions = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context) {
					return _constructGetLast(contextPropertyName, dataType, functionName, moduleName, 'actions')(context);
				};
			},
			_constructGetHistoricActions = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context) {
					return _constructGetHistoric(contextPropertyName, dataType, functionName, moduleName, 'actions')(context);
				};
			},
			_constructGetHistoricActionsByIndex = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, index) {
					return _constructGetHistoricByIndex(contextPropertyName, dataType, functionName, moduleName, 'actions')(context, index);
				};
			},
			_constructGetHistoricActionsByRelativeIndexFromLast = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, relativeIndexFromLast) {
					return _constructGetHistoricByRelativeIndexFromLast(contextPropertyName, dataType, functionName, moduleName, 'actions')(context, relativeIndexFromLast);
				};
			},
			_constructGetHistoricActionsRangeByRelativeIndexFromLast = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, relativeIndexFromLast, quantity) {
					return _constructGetHistoricRangeByRelativeIndexFromLast(contextPropertyName, dataType, functionName, moduleName, 'actions')(context, relativeIndexFromLast, quantity);
				};
			},
			_constructGetHistoricActionsByRelativeTimeFromLast = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, relativeTimeFromLastInSecs) {
					return _constructGetHistoricByRelativeTimeFromLast(contextPropertyName, dataType, functionName, moduleName, 'actions')(context, relativeTimeFromLastInSecs);
				};
			},
			_constructGetHistoricActionsRangeByRelativeTimeFromLast = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, relativeTimeFromLastInSecs) {
					return _constructGetHistoricRangeByRelativeTimeFromLast(contextPropertyName, dataType, functionName, moduleName, 'actions')(context, relativeTimeFromLastInSecs);
				};
			},
			_constructSetLastIntents = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, intents, timestamp, conversationId) {
					_constructSetLast(contextPropertyName, dataType, functionName, moduleName, 'intents')(context, intents, timestamp, conversationId);
				};
			},
			_constructGetLastIntents = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context) {
					return _constructGetLast(contextPropertyName, dataType, functionName, moduleName, 'intents')(context);
				};
			},
			_constructGetHistoricIntents = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context) {
					return _constructGetHistoric(contextPropertyName, dataType, functionName, moduleName, 'intents')(context);
				};
			},
			_constructGetHistoricIntentsByIndex = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, index) {
					return _constructGetHistoricByIndex(contextPropertyName, dataType, functionName, moduleName, 'intents')(context, index);
				};
			},
			_constructGetHistoricIntentsByRelativeIndexFromLast = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, relativeIndexFromLast) {
					return _constructGetHistoricByRelativeIndexFromLast(contextPropertyName, dataType, functionName, moduleName, 'intents')(context, relativeIndexFromLast);
				};
			},
			_constructGetHistoricIntentsRangeByRelativeIndexFromLast = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, relativeIndexFromLast, quantity) {
					return _constructGetHistoricRangeByRelativeIndexFromLast(contextPropertyName, dataType, functionName, moduleName, 'intents')(context, relativeIndexFromLast, quantity);
				};
			},
			_constructGetHistoricIntentsByRelativeTimeFromLast = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, relativeTimeFromLastInSecs) {
					return _constructGetHistoricByRelativeTimeFromLast(contextPropertyName, dataType, functionName, moduleName, 'intents')(context, relativeTimeFromLastInSecs);
				};
			},
			_constructGetHistoricIntentsRangeByRelativeTimeFromLast = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, relativeTimeFromLastInSecs) {
					return _constructGetHistoricRangeByRelativeTimeFromLast(contextPropertyName, dataType, functionName, moduleName, 'intents')(context, relativeTimeFromLastInSecs);
				};
			},
			_constructSetLastEntities = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, entities, timestamp, conversationId) {
					_constructSetLast(contextPropertyName, dataType, functionName, moduleName, 'entities')(context, entities, timestamp, conversationId);
				};
			},
			_constructGetLastEntities = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context) {
					return _constructGetLast(contextPropertyName, dataType, functionName, moduleName, 'entities')(context);
				};
			},
			_constructGetHistoricEntities = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context) {
					return _constructGetHistoric(contextPropertyName, dataType, functionName, moduleName, 'entities')(context);
				};
			},
			_constructGetHistoricEntitiesByIndex = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, index) {
					return _constructGetHistoricByIndex(contextPropertyName, dataType, functionName, moduleName, 'entities')(context, index);
				};
			},
			_constructGetHistoricEntitiesByRelativeIndexFromLast = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, relativeIndexFromLast) {
					return _constructGetHistoricByRelativeIndexFromLast(contextPropertyName, dataType, functionName, moduleName, 'entities')(context, relativeIndexFromLast);
				};
			},
			_constructGetHistoricEntitiesRangeByRelativeIndexFromLast = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, relativeIndexFromLast, quantity) {
					return _constructGetHistoricRangeByRelativeIndexFromLast(contextPropertyName, dataType, functionName, moduleName, 'entities')(context, relativeIndexFromLast, quantity);
				};
			},
			_constructGetHistoricEntitiesByRelativeTimeFromLast = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, relativeTimeFromLastInSecs) {
					return _constructGetHistoricByRelativeTimeFromLast(contextPropertyName, dataType, functionName, moduleName, 'entities')(context, relativeTimeFromLastInSecs);
				};
			},
			_constructGetHistoricEntitiesRangeByRelativeTimeFromLast = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, relativeTimeFromLastInSecs) {
					return _constructGetHistoricRangeByRelativeTimeFromLast(contextPropertyName, dataType, functionName, moduleName, 'entities')(context, relativeTimeFromLastInSecs);
				};
			},
			_constructSetLastConditions = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, conditions, timestamp, conversationId) {
					_constructSetLast(contextPropertyName, dataType, functionName, moduleName, 'conditions')(context, conditions, timestamp, conversationId);
				};
			},
			_constructGetLastConditions = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context) {
					return _constructGetLast(contextPropertyName, dataType, functionName, moduleName, 'conditions')(context);
				};
			},
			_constructGetHistoricConditions = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context) {
					return _constructGetHistoric(contextPropertyName, dataType, functionName, moduleName, 'conditions')(context);
				};
			},
			_constructGetHistoricConditionsByIndex = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, index) {
					return _constructGetHistoricByIndex(contextPropertyName, dataType, functionName, moduleName, 'conditions')(context, index);
				};
			},
			_constructGetHistoricConditionsByRelativeIndexFromLast = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, relativeIndexFromLast) {
					return _constructGetHistoricByRelativeIndexFromLast(contextPropertyName, dataType, functionName, moduleName, 'conditions')(context, relativeIndexFromLast);
				};
			},
			_constructGetHistoricConditionsRangeByRelativeIndexFromLast = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, relativeIndexFromLast, quantity) {
					return _constructGetHistoricRangeByRelativeIndexFromLast(contextPropertyName, dataType, functionName, moduleName, 'conditions')(context, relativeIndexFromLast, quantity);
				};
			},
			_constructGetHistoricConditionsByRelativeTimeFromLast = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, relativeTimeFromLastInSecs) {
					return _constructGetHistoricByRelativeTimeFromLast(contextPropertyName, dataType, functionName, moduleName, 'conditions')(context, relativeTimeFromLastInSecs);
				};
			},
			_constructGetHistoricConditionsRangeByRelativeTimeFromLast = function(contextPropertyName, dataType, functionName, moduleName) {
				return function(context, relativeTimeFromLastInSecs) {
					return _constructGetHistoricRangeByRelativeTimeFromLast(contextPropertyName, dataType, functionName, moduleName, 'conditions')(context, relativeTimeFromLastInSecs);
				};
			};
		return {
			constructSetProperty: _constructSetProperty,
			constructSetPropertyIfNotExistent: _constructSetPropertyIfNotExistent,
			constructMergeProperty: _constructMergeProperty,
			constructHasProperty: _constructHasProperty,
			constructGetProperty: _constructGetProperty,
			constructGetObj: _constructGetObj,
			constructSetLanguage: _constructSetLanguage,
			constructGetLanguage: _constructGetLanguage,
			constructSetStyle: _constructSetStyle,
			constructGetStyle: _constructGetStyle,
			constructSetConditionCache: _constructSetConditionCache,
			constructGetConditionCache: _constructGetConditionCache,
			constructSetLastActions: _constructSetLastActions,
			constructGetLastActions: _constructGetLastActions,
			constructGetHistoricActions: _constructGetHistoricActions,
			constructGetHistoricActionsByIndex: _constructGetHistoricActionsByIndex,
			constructGetHistoricActionsByRelativeIndexFromLast: _constructGetHistoricActionsByRelativeIndexFromLast,
			constructGetHistoricActionsRangeByRelativeIndexFromLast: _constructGetHistoricActionsRangeByRelativeIndexFromLast,
			constructGetHistoricActionsByRelativeTimeFromLast: _constructGetHistoricActionsByRelativeTimeFromLast,
			constructGetHistoricActionsRangeByRelativeTimeFromLast: _constructGetHistoricActionsRangeByRelativeTimeFromLast,
			constructSetLastIntents: _constructSetLastIntents,
			constructGetLastIntents: _constructGetLastIntents,
			constructGetHistoricIntents: _constructGetHistoricIntents,
			constructGetHistoricIntentsByIndex: _constructGetHistoricIntentsByIndex,
			constructGetHistoricIntentsByRelativeIndexFromLast: _constructGetHistoricIntentsByRelativeIndexFromLast,
			constructGetHistoricIntentsRangeByRelativeIndexFromLast: _constructGetHistoricIntentsRangeByRelativeIndexFromLast,
			constructGetHistoricIntentsByRelativeTimeFromLast: _constructGetHistoricIntentsByRelativeTimeFromLast,
			constructGetHistoricIntentsRangeByRelativeTimeFromLast: _constructGetHistoricIntentsRangeByRelativeTimeFromLast,
			constructSetLastEntities: _constructSetLastEntities,
			constructGetLastEntities: _constructGetLastEntities,
			constructGetHistoricEntities: _constructGetHistoricEntities,
			constructGetHistoricEntitiesByIndex: _constructGetHistoricEntitiesByIndex,
			constructGetHistoricEntitiesByRelativeIndexFromLast: _constructGetHistoricEntitiesByRelativeIndexFromLast,
			constructGetHistoricEntitiesRangeByRelativeIndexFromLast: _constructGetHistoricEntitiesRangeByRelativeIndexFromLast,
			constructGetHistoricEntitiesByRelativeTimeFromLast: _constructGetHistoricEntitiesByRelativeTimeFromLast,
			constructGetHistoricEntitiesRangeByRelativeTimeFromLast: _constructGetHistoricEntitiesRangeByRelativeTimeFromLast,
			constructSetLastConditions: _constructSetLastConditions,
			constructGetLastConditions: _constructGetLastConditions,
			constructGetHistoricConditions: _constructGetHistoricConditions,
			constructGetHistoricConditionsByIndex: _constructGetHistoricConditionsByIndex,
			constructGetHistoricConditionsByRelativeIndexFromLast: _constructGetHistoricConditionsByRelativeIndexFromLast,
			constructGetHistoricConditionsRangeByRelativeIndexFromLast: _constructGetHistoricConditionsRangeByRelativeIndexFromLast,
			constructGetHistoricConditionsByRelativeTimeFromLast: _constructGetHistoricConditionsByRelativeTimeFromLast,
			constructGetHistoricConditionsRangeByRelativeTimeFromLast: _constructGetHistoricConditionsRangeByRelativeTimeFromLast
		};
	}))
);