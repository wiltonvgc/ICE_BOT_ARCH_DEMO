;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreFeatureMapperHelperModule = factory()
	}(this, (function() {
		var path = require("path"),
			Promise = require("bluebird"),
			log = require(path.posix.join(process.env.maindir, '/ice/logger')),
			contextStore = require(path.posix.join(process.env.maindir, '/ice/context/store')),
			coreCondition = require(path.posix.join(process.env.maindir, '/ice/condition')),
			_customConfigBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
			_customFeatureMapperConfig = _customConfigBot['featureMapper'],
			_customFeatureMapperLoggerLevel = (_customConfigBot && _customConfigBot['logger'] && _customConfigBot['logger']['logLevel'] && _customConfigBot['logger']['logLevel']['featureMapper']) ? _customConfigBot['logger']['logLevel']['featureMapper'] : "OFF",
			_nlp = _customConfigBot['nlp'],
			_condition = _customConfigBot['condition'],
			_getIntentsCount = function() {
				return _nlp.intents.length;
			},
			_getEntitiesCount = function() {
				return _nlp.entities.length;
			},
			_num_intents = _getIntentsCount(),
			_num_entities = _getEntitiesCount(),
			_getConditionsCount = function() {
				return _condition.conditions.length;
			},
			_num_conditions = _getConditionsCount(),
			_getIntentIdx = function(intentLabel) {
				return _nlp.intents.indexOf(intentLabel);
			},
			_getIntentFromList = function(intentIdx) {
				if (intentIdx < 0 || intentIdx >= _num_intents)
					throw new Error('Intent with index [' + intentIdx + '] not listed in nlp section in config file');
				return _nlp.intents[intentIdx];
			},
			_getEntityIdx = function(entityLabel) {
				return _nlp.entities.indexOf(entityLabel);
			},
			_getEntityFromList = function(entityIdx) {
				if (entityIdx < 0 || entityIdx >= _num_entities)
					throw new Error('Entity with index [' + entityIdx + '] not listed in nlp section in config file');
				return _nlp.entities[entityIdx];
			},
			_getConditionNameFromList = function(conditionIdx) {
				if (conditionIdx < 0 || conditionIdx >= _num_conditions)
					throw new Error('Intent with index [' + intentIdx + '] not listed in nlp section in config file');
				return _condition.conditions[conditionIdx].conditionName;
			},
			_array2String = function(arr) {
				return arr.toString().replace(/,/gi, '');
			},
			_isFilledArray = function(arr) {
				return arr && Array.isArray(arr) && (arr.length > 0);
			},
			_booleanArray2String = function(boolarr) {
				return boolarr.toString().replace(/true/gi, '1').replace(/false/gi, '0').replace(/,/gi, '');
			},
			_createFilledArray = function(len, val) {
				var arr = new Array(len);
				arr.fill(val);
				return arr;
			},
			_mountCondition = function(logOptions, conditions, when) {
				var mappedConditions = [], intents, entities, whenStr = when ? 'when' : 'whenNot';
				log.debug(logOptions, conditions, 'conditionRules[' + whenStr + ']=');
				if (_isFilledArray(conditions)) {
					log.debug(logOptions, 'Condition rules array has items');
					for (var i = 0; i < conditions.length; i++) {
						log.debug(logOptions, conditions[i], 'conditionRules[' + whenStr + '][' + i + ']=');
						intents = _createFilledArray(_num_intents, '[01]');
						if (_isFilledArray(conditions[i].intents))
							for (var intentIdx = 0; intentIdx < conditions[i].intents.length; intentIdx++) {
								intents[_getIntentIdx(conditions[i].intents[intentIdx])] = when ? '1' : '0';
							}
						entities = _createFilledArray(_num_entities, '[01]');
						if (_isFilledArray(conditions[i].entities))
							for (var entityIdx = 0; entityIdx < conditions[i].entities.length; entityIdx++) {
								entities[_getEntityIdx(conditions[i].entities[entityIdx])] = when ? '1' : '0';
							}
						mappedConditions.push(new RegExp('^' + _array2String(intents) + _array2String(entities) + '$', 'gi'));
					}
				}
				else {
					log.debug(logOptions, 'Condition rules array is empty');
					intents = _createFilledArray(_num_intents, '[01]');
					entities = _createFilledArray(_num_entities, '[01]');
					mappedConditions.push(new RegExp('^' + _array2String(intents) + _array2String(entities) + '$', 'gi'));
				}
				log.debug(logOptions, mappedConditions, 'mappedConditionRules[' + whenStr + ']=');
				return mappedConditions;
			},
			_checkCondition = function(logOptions, featureMap, conditions, when) {
				var whenStr = when ? 'when' : 'whenNot';
				log.debug(logOptions, conditions, 'featureMap=' + featureMap + ' conditionRules[' + whenStr + ']=');
				var patterns = _mountCondition(logOptions, conditions, when),
					checkRegex = function(pattern) { return pattern.test(featureMap); };
				log.debug(logOptions, patterns, 'regExpPatterns[' + whenStr + ']=');
				var match = when ? patterns.some(checkRegex) : patterns.every(checkRegex);
				log.debug(logOptions, match, 'regExpMatch[' + whenStr + ']=');
				return match;
			},
			_composeConditions = function(context, nlpFeatureMap) {
				return log.tracePromise(__filename, _customFeatureMapperLoggerLevel, contextStore.conversation.getConversationId(context), function _composeConditionsPromise (logOptions, resolve, reject) {
					var conditionsMap = '', _promises = [], conditionsIdArr = [];
					for (var i = 0; i < _num_conditions; i++) {
						var conditionName = _getConditionNameFromList(i);
						log.debug(logOptions, 'Started composition for condition [' + conditionName + ']');
						var cond = _customFeatureMapperConfig.conditionFetchingRules[conditionName];
						if (cond) {
							log.debug(logOptions, cond, 'conditionName=' + conditionName + ' conditionRules=');
							var when = _isFilledArray(cond['when']) ? _checkCondition(logOptions, nlpFeatureMap, cond['when'], true) : true;
							log.debug(logOptions, when, 'conditionName=' + conditionName + ' conditionResult[when]=');
							var when_not = _isFilledArray(cond['whenNot']) ? _checkCondition(logOptions, nlpFeatureMap, cond['whenNot'], false) : true;
							log.debug(logOptions, when_not, 'conditionName=' + conditionName + ' conditionResult[whenNot]=');
							_promises.push((when && when_not) ? coreCondition.getCondition(context, i) : false);
							conditionsIdArr.push({conditionName: conditionName, conditionValue: false});
							log.debug(logOptions, 'Finished composition for condition [' + conditionName + ']');
						}
						else {
							throw new Error('Condition [' + conditionName + '] not listed in featureMapper section in config file');
						}
					}
					Promise.all(_promises)
						.then(function _composeConditionsMapHelperFunction (_conditionResults) {
							conditionsMap = _booleanArray2String(_conditionResults);
							log.debug(logOptions, conditionsMap, 'conditionsMap=');
							for (var i = _conditionResults.length - 1; i >= 0; i--) {
								conditionsIdArr[i].conditionValue = _conditionResults[i];
							}
							resolve([conditionsMap,
							         conditionsIdArr]);
						})
						.catch(function(e) {
							reject(e);
						});
				});
			};
		return {
			getIntentIdx: _getIntentIdx,
			getIntentFromList: _getIntentFromList,
			getEntityIdx: _getEntityIdx,
			getEntityFromList: _getEntityFromList,
			getIntentsCount: _getIntentsCount,
			getEntitiesCount: _getEntitiesCount,
			array2String: _array2String,
			composeConditions: _composeConditions
		};
	}))
);