;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreContextConditionModule = factory()
	}(this, (function() {
		var path = require("path"),
			_contextStores = ["user",
			                  "group",
			                  "conversation",
			                  "dialog"],
			_hadContextStores = ["conversation",
			                     "dialog"],
			_hadTypes = ["intents",
			             "entities",
			             "conditions",
			             "actions"],
			log = require(path.posix.join(process.env.maindir, '/ice/logger')),
			contextStore = require(path.posix.join(process.env.maindir, '/ice/context/store')),
			_customConfig = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
			_customConditionLoggerLevel = (_customConfig && _customConfig['logger'] && _customConfig['logger']['logLevel'] && _customConfig['logger']['logLevel']['condition']) ? _customConfig['logger']['logLevel']['condition'] : "OFF",
			_checkOperand = function(context, conditionName, operand, callback) {
				if (operand.conditionAction !== undefined) {
					_executeConditionAction(context, conditionName, operand, function(result, err) {
						if (err) {
							callback(false, err);
						}
						else {
							callback(result);
						}
					});
				}
				else {
					if (operand.value !== undefined) {
						callback(operand.value);
					}
					else {
						if (operand.contextStore && _contextStores.indexOf(operand.contextStore.toLowerCase()) > 0) {
							if (operand.name)
								callback(contextStore[operand.contextStore.toLowerCase()].getProperty(context, operand.name));
							else
								callback(false, 'Unknown operand property [' + operand.name + '] on conditionParameters on config file for condition [' + conditionName + ']');
						}
						else
							callback(false, 'Nor operand value found neither unknown operand context store [' + operand.contextStore + '] on conditionParameters on config file for condition [' + conditionName + ']');
					}
				}
			},
			_executeConditionAction = function(context, conditionName, conditionParameters, callback) {
				var conditionAction = ((conditionParameters) ? conditionParameters.conditionAction || "none" : "none").toLowerCase();
				switch (conditionAction) {
					case "none":
						callback(false, 'No conditionParameters found on config file for condition [' + conditionName + ']');
						break;
					case "get":
						_checkOperand(context, conditionName, conditionParameters.firstOperand, function(conditionValue, err) {
							if (err)
								callback(false, err);
							else {
								callback(conditionValue);
							}
						});
						break;
					case "not":
						_checkOperand(context, conditionName, conditionParameters.firstOperand, function(conditionValue, err) {
							if (err)
								callback(false, err);
							else {
								callback(!conditionValue);
							}
						});
						break;
					case "eq":
					case "noteq":
					case "lt":
					case "lte":
					case "gt":
					case "gte":
					case "and":
					case "or":
						_checkOperand(context, conditionName, conditionParameters.firstOperand, function(firstOperand, err) {
							if (err) {
								callback(false, err);
							}
							else {
								_checkOperand(context, conditionName, conditionParameters.secondOperand, function(secondOperand, err) {
									if (err) {
										callback(false, err);
									}
									else {
										var condition = (conditionAction === "eq") ? (firstOperand == secondOperand) : (
											(conditionAction === "noteq") ? (firstOperand != secondOperand) : (
												(conditionAction === "lt") ? (firstOperand < secondOperand) : (
													(conditionAction === "lte") ? (firstOperand <= secondOperand) : (
														(conditionAction === "gt") ? (firstOperand > secondOperand) : (
															(conditionAction === "gte") ? (firstOperand >= secondOperand) : (
																(conditionAction === "and") ? (firstOperand && secondOperand) : (firstOperand || secondOperand)
															)
														)
													)
												)
											)
										);
										callback(condition);
									}
								});
							}
						});
						break;
					case "had":
						if (conditionParameters && conditionParameters.hadType && _hadTypes.indexOf(conditionParameters.hadType.toLowerCase()) >= 0) {
							if (conditionParameters.contextStore && _hadContextStores.indexOf(conditionParameters.contextStore.toLowerCase()) >= 0) {
								if (conditionParameters.hadName) {
									if (conditionParameters.hadType === 'conditions' && (conditionParameters.hadValue === undefined)) {
										callback(false, 'Unknown value for specified had condition [' + conditionParameters.hadName + '] on conditionParameters on config file for condition' + conditionName + ']');
									}
									else {
										if (conditionParameters.hadWhen) {
											var historic, existence = false;
											if (conditionParameters.hadWhen.lastInteractions !== undefined) {
												switch (conditionParameters.hadType.toLowerCase()) {
													case "intents":
														historic = contextStore[conditionParameters.contextStore.toLowerCase()].getHistoricIntentsRangeByRelativeIndexFromLast(context, conditionParameters.hadWhen.lastInteractions, conditionParameters.hadWhen.lastInteractions + 1);
														for (var idxInteractionIntent = 0; idxInteractionIntent < historic.length; idxInteractionIntent++) {
															if (historic[idxInteractionIntent].intents.indexOf(conditionParameters.hadName) >= 0) {
																existence = true;
																break;
															}
														}
														break;
													case "entities":
														historic = contextStore[conditionParameters.contextStore.toLowerCase()].getHistoricEntitiesRangeByRelativeIndexFromLast(context, conditionParameters.hadWhen.lastInteractions, conditionParameters.hadWhen.lastInteractions + 1);
														for (var idxInteractionEntity = 0; idxInteractionEntity < historic.length; idxInteractionEntity++) {
															for (var idxInteractionEntities = 0; idxInteractionEntities < historic[idxInteractionEntity].entities.length; idxInteractionEntities++) {
																if (historic[idxInteractionEntity].entities[idxInteractionEntities].entity === conditionParameters.hadName) {
																	existence = true;
																	break;
																}
															}
															if (existence) break;
														}
														break;
													case "conditions":
														historic = contextStore[conditionParameters.contextStore.toLowerCase()].getHistoricConditionsRangeByRelativeIndexFromLast(context, conditionParameters.hadWhen.lastInteractions, conditionParameters.hadWhen.lastInteractions + 1);
														for (var idxInteractionCondition = 0; idxInteractionCondition < historic.length; idxInteractionCondition++) {
															for (var idxInteractionConditions = 0; idxInteractionConditions < historic[idxInteractionCondition].conditions.length; idxInteractionConditions++) {
																if ((historic[idxInteractionCondition].conditions[idxInteractionConditions].conditionName === conditionParameters.hadName) && (historic[idxInteractionCondition].conditions[idxInteractionConditions].conditionValue === conditionParameters.hadValue)) {
																	existence = true;
																	break;
																}
															}
															if (existence) break;
														}
														break;
													case "actions":
														historic = contextStore[conditionParameters.contextStore.toLowerCase()].getHistoricActionsRangeByRelativeIndexFromLast(context, conditionParameters.hadWhen.lastInteractions, conditionParameters.hadWhen.lastInteractions + 1);
														for (var idxInteractionAction = 0; idxInteractionAction < historic.length; idxInteractionAction++) {
															if (historic[idxInteractionAction].actions.indexOf(conditionParameters.hadName) >= 0) {
																existence = true;
																break;
															}
														}
														break;
												}
												callback(result);
											}
											else if (conditionParameters.hadWhen.lastMinutes !== undefined) {
												var lastSeconds = conditionParameters.hadWhen.lastMinutes * 60;
												switch (conditionParameters.hadType.toLowerCase()) {
													case "intents":
														historic = contextStore[conditionParameters.contextStore.toLowerCase()].getHistoricIntentsRangeByRelativeTimeFromLast(context, lastSeconds);
														for (var idxTimeIntent = 0; idxTimeIntent < historic.length; idxTimeIntent++) {
															if (historic[idxTimeIntent].intents.indexOf(conditionParameters.hadName) >= 0) {
																existence = true;
																break;
															}
														}
														break;
													case "entities":
														historic = contextStore[conditionParameters.contextStore.toLowerCase()].getHistoricEntitiesRangeByRelativeTimeFromLast(context, lastSeconds);
														for (var idxTimeEntity = 0; idxTimeEntity < historic.length; idxTimeEntity++) {
															for (var idxTimeEntities = 0; idxTimeEntities < historic[idxTimeEntity].entities.length; idxTimeEntities++) {
																if (historic[idxTimeEntity].entities[idxTimeEntities].entity === conditionParameters.hadName) {
																	existence = true;
																	break;
																}
															}
															if (existence) break;
														}
														break;
													case "conditions":
														historic = contextStore[conditionParameters.contextStore.toLowerCase()].getHistoricConditionsRangeByRelativeTimeFromLast(context, lastSeconds);
														for (var idxTimeCondition = 0; idxTimeCondition < historic.length; idxTimeCondition++) {
															for (var idxTimeConditions = 0; idxTimeConditions < historic[idxTimeCondition].conditions.length; idxTimeConditions++) {
																if ((historic[idxTimeCondition].conditions[idxTimeConditions].conditionName === conditionParameters.hadName) && (historic[idxTimeCondition].conditions[idxTimeConditions].conditionValue === conditionParameters.hadValue)) {
																	existence = true;
																	break;
																}
															}
															if (existence) break;
														}
														break;
													case "actions":
														historic = contextStore[conditionParameters.contextStore.toLowerCase()].getHistoricActionsRangeByRelativeTimeFromLast(context, lastSeconds);
														for (var idxTimeAction = 0; idxTimeAction < historic.length; idxTimeAction++) {
															if (historic[idxTimeAction].actions.indexOf(conditionParameters.hadName) >= 0) {
																existence = true;
																break;
															}
														}
														break;
												}
												callback(result);
											}
											else {
												callback(false, 'No when criteria (lastInteractions or lastMinutes) for specified had condition [' + conditionParameters.hadName + '] on conditionParameters on config file for condition' + conditionName + ']');
											}
										}
										else {
											callback(false, 'Unknown when property for specified had condition [' + conditionParameters.hadName + '] on conditionParameters on config file for condition' + conditionName + ']');
										}
									}
								}
								else {
									callback(false, 'Unknown criteria type name [' + conditionParameters.hadName + '] for specified had condition [' + conditionParameters.hadName + '] on conditionParameters on config file for condition' + conditionName + ']');
								}
							}
							else {
								callback(false, 'Unknown contextStore for had condition on conditionParameters on config file for condition' + conditionName + ']')
							}
						}
						else {
							callback(false, 'Unknown criteria type (intent, entity, condition or action) [' + (conditionParameters ? conditionParameters.hadType : 'undefined') + '] for specified had condition [' + (conditionParameters ? conditionParameters.hadName : 'undefined') + '] on conditionParameters on config file for condition' + conditionName + ']');
						}
						break;
					default:
						callback(false, 'Unknown conditionAction on conditionParameters on config file for condition' + conditionName + ']');
						break;
				}
			},
			_get = function(context, condition) {
				var logId = contextStore.conversation.getConversationId(context);
				return log.tracePromise(__filename, _customConditionLoggerLevel, logId, function _getPromise (logOptions, resolve, reject) {
					_executeConditionAction(context, condition.conditionName, (condition) ? (condition.conditionParameters || {}) : {}, function _executeConditionActionFunction (result, err) {
						if (err)
							reject(new Error(err));
						else {
							log.debug(logOptions, result, 'conditionName=' + condition.conditionName + ' conditionValue=');
							resolve(result);
						}
					});
				});
			};
		return {
			get: _get
		};
	}))
);