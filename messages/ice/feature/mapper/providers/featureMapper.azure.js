;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreFeatureMapperAzureModule = factory()
	}(this, (function() {
		var path = require("path"),
			log = require(path.posix.join(process.env.maindir, '/ice/logger')),
			contextStore = require(path.posix.join(process.env.maindir, '/ice/context/store')),
			featureHelper = require(path.posix.join(process.env.maindir, '/ice/feature/helper')),
			_customConfigBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
			_customFeatureMapperConfig = _customConfigBot['featureMapper'],
			_customFeatureMapperLoggerLevel = (_customConfigBot && _customConfigBot['logger'] && _customConfigBot['logger']['logLevel'] && _customConfigBot['logger']['logLevel']['featureMapper']) ? _customConfigBot['logger']['logLevel']['featureMapper'] : "OFF",
			_defaultThreshold = 0.2,
			_num_intents = featureHelper.getIntentsCount(),
			_num_entities = featureHelper.getEntitiesCount(),
			_map = function(context, nlpOutput) {
				var logId = contextStore.conversation.getConversationId(context);
				return log.tracePromise(__filename, _customFeatureMapperLoggerLevel, logId, function _mapPromise (logOptions, resolve, reject) {
					var _composeIntents = function(_nlpOutput, _threshold) {
							return log.traceFunction(__filename, _customFeatureMapperLoggerLevel, logId, function _composeIntentsFunction (logOptions) {
								if (_nlpOutput.intents) {
									var intentsMap = '', intentsIdArr = [];
									if (_threshold) {
										var intentsArr = new Array(_num_intents);
										intentsArr.fill('0');
										for (var nlpConfigIntentIdx = 0; nlpConfigIntentIdx < _num_intents; nlpConfigIntentIdx++) {
											var intent_idx = featureHelper.getIntentIdx(_nlpOutput.intents[nlpConfigIntentIdx].intent);
											if (intent_idx >= 0) {
												intentsArr[intent_idx] = (_nlpOutput.intents[nlpConfigIntentIdx].score >= _threshold) ? '1' : '0';
												if (_nlpOutput.intents[nlpConfigIntentIdx].score >= _threshold) {
													intentsArr[intent_idx] = '1';
													intentsIdArr.push(featureHelper.getIntentFromList(intent_idx));
												}
												else {
													intentsArr[intent_idx] = '0';
												}
											}
										}
										intentsMap = featureHelper.array2String(intentsArr);
									}
									else {
										var idx = featureHelper.getIntentIdx(_nlpOutput.intent);
										for (var i = 0; i < _num_intents; i++) {
											intentsMap += (i === idx) ? '1' : '0';
										}
										intentsIdArr.push(featureHelper.getIntentFromList(idx));
									}
									log.debug(logOptions, intentsMap, 'intentsMap=');
									log.debug(logOptions, intentsIdArr, 'intentsIdArr=');
									return [intentsMap,
									        intentsIdArr];
								}
								else {
									throw new Error('NLP output with wrong content - no intents');
								}
							}, function(logOptions, err) {
								throw err;
							});
						},
						_composeEntities = function(_nlpOutput) {
							return log.traceFunction(__filename, _customFeatureMapperLoggerLevel, logId, function _composeEntitiesFunction (logOptions) {
								if (_nlpOutput.entities) {
									var entitiesMap = '', nlpOutputEntities = [];
									for (var nlpEntitiesIdx = 0; nlpEntitiesIdx < _nlpOutput.entities.length; nlpEntitiesIdx++) {
										nlpOutputEntities.push(_nlpOutput.entities[nlpEntitiesIdx].type.toLowerCase()); 
										log.debug(logOptions, nlpOutputEntities, 'nlpOutputEntities=');
									}
									for (var nlpConfigEntitiesIdx = 0; nlpConfigEntitiesIdx < _num_entities; nlpConfigEntitiesIdx++) {
										entitiesMap += nlpOutputEntities.indexOf((featureHelper.getEntityFromList(nlpConfigEntitiesIdx)).toLowerCase()) < 0 ? '0' : '1';
										var type_ajuda = featureHelper.getEntityFromList(nlpConfigEntitiesIdx).toLowerCase();
										log.debug(logOptions, type_ajuda, 'type=');
										log.debug(logOptions, entitiesMap, 'entitiesMap=' );
									}
									log.debug(logOptions, entitiesMap, 'entitiesMap=');
									log.debug(logOptions, _nlpOutput.entities, 'entitiesIdArr=');
									return [entitiesMap,
									        _nlpOutput.entities];
								}
								else {
									throw new Error('NLP output with wrong content - no entities');
								}
							}, function(logOptions, err) {
								throw err;
							});
						},
						_intentsArr = _composeIntents(nlpOutput, _customFeatureMapperConfig.thresholdIntents || _defaultThreshold),
						_entitiesArr = _composeEntities(nlpOutput),
						nlpFeatureMap = _intentsArr[0] + _entitiesArr[0],
						nlpFeatures = {intents: _intentsArr[1], entities: _entitiesArr[1], conditions: []};
					featureHelper.composeConditions(context, nlpFeatureMap)
						.then(function _composeConditionsMapFunction (conditionsMapArr) {
							var featureMap = nlpFeatureMap + conditionsMapArr[0];
							nlpFeatures.conditions = conditionsMapArr[1];
							log.info(logOptions, featureMap, 'featureMap=');
							log.info(logOptions, nlpFeatures, 'nlpFeatures=');
							resolve([featureMap,
							         nlpFeatures]);
						})
						.catch(function(e) {
							log.error(logOptions, 'Error while requesting conditions through condition core module');
							reject(e);
						});
				});
			};
		return {
			map: _map
		};
	}))
);