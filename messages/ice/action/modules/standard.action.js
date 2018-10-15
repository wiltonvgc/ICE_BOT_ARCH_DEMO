;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreStandardActionModule = factory()
	}(this, (function() {
		var path = require("path"),
			log = require(path.posix.join(process.env.maindir, '/ice/logger')),
			contextStore = require(path.posix.join(process.env.maindir, '/ice/context/store')),
			actionHelper = require(path.posix.join(process.env.maindir, '/ice/action/helper')),
			_customConfig = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
			_customActionDispatcherLoggerLevel = (_customConfig && _customConfig['logger'] && _customConfig['logger']['logLevel'] && _customConfig['logger']['logLevel']['actionDispatcher']) ? _customConfig['logger']['logLevel']['actionDispatcher'] : "OFF",
			_possibleActionContexts = ["withoutData",
			                           "withFeatures"],
			_possibleCommands = ["noop",
			                     "set",
			                     "setIfNotExistent",
			                     "add",
			                     "plus",
			                     "increment",
			                     "subtract",
			                     "minus",
								 "decrement",
								 "addConta",
								 "addBebida",
								 "setContaFinal"],
			_possibleContextStores = ["user",
			                          "group",
			                          "conversation",
			                          "dialog"],
			_checkCommandTarget = function(_actionName, _actionCommands, _commandIdx, callback) {
				if (_actionCommands[_commandIdx].commandTarget) {
					if (_actionCommands[_commandIdx].commandTarget.contextStore && _possibleContextStores.indexOf(_actionCommands[_commandIdx].commandTarget.contextStore) >= 0) {
						if (_actionCommands[_commandIdx].commandTarget.name && _actionCommands[_commandIdx].commandTarget.name.length > 0) {
							return callback(_commandIdx);
						}
						else {
							return new Error('Not defined or invalid standard action target name [' + (_actionCommands[_commandIdx].commandTarget.name || 'undefined') + '] on action [' + _actionName + ']');
						}
					}
					else {
						return new Error('Not defined or invalid standard action target context store [' + (_actionCommands[_commandIdx].commandTarget.contextStore || 'undefined') + '] on action [' + _actionName + ']');
					}
				}
				else {
					return new Error('Not defined standard action target on action [' + _actionName + ']'); 
				}
			},
			_checkCommandValue = function(_actionName, _actionCommands, _commandIdx, callback) {
				if (_actionCommands[_commandIdx].commandValue !== undefined) {
					return callback(_commandIdx);
				}
				else {
					return new Error('Not defined standard action command value on action [' + _actionName + ']');
				}
			},
			_execute = function(context, actionId, actions, features) {
				return log.tracePromise(__filename, _customActionDispatcherLoggerLevel, contextStore.conversation.getConversationId(context), function _executePromise (logOptions, resolve, reject) {
					var _standardActionConfig = actions[actionId].actionConfig,
						_real_actionContext = _standardActionConfig.actionContext || 'withoutData',
						_real_actionCommands = _standardActionConfig.actionCommands || [],
						actionContext,
						result;
					if (_possibleActionContexts.indexOf(_real_actionContext) >= 0) {
						switch (_real_actionContext) {
							case "withoutData":
								actionContext = actionHelper.createActionContext(actionId, actions);
								break;
							case "withFeatures":
								actionContext = actionHelper.createActionContextWithData(actionId, actions, features);
								break;
						}
						for (var commandIdx = 0; commandIdx < _real_actionCommands.length; commandIdx++) {
							if (_real_actionCommands[commandIdx].command && _possibleCommands.indexOf(_real_actionCommands[commandIdx].command) >= 0) {
								switch (_real_actionCommands[commandIdx].command) {
									case "noop":
										break;
									case "set":
										result = _checkCommandValue(actions[actionId].actionName, _real_actionCommands, commandIdx, function(commandIdx) {
											return _checkCommandTarget(actions[actionId].actionName, _real_actionCommands, commandIdx, function(commandIdx) {
												contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setProperty(context, _real_actionCommands[commandIdx].commandTarget.name, _real_actionCommands[commandIdx].commandValue);
												return;
											});
										});
										break;
									case "setIfNotExistent":
										result = _checkCommandValue(actions[actionId].actionName, _real_actionCommands, commandIdx, function(commandIdx) {
											return _checkCommandTarget(actions[actionId].actionName, _real_actionCommands, commandIdx, function(commandIdx) {
												contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setPropertyIfNotExistent(context, _real_actionCommands[commandIdx].commandTarget.name, _real_actionCommands[commandIdx].commandValue);
												return;
											});
										});
										break;
									case "add":
									case "plus":
									case "increment":
									case "subtract":
									case "minus":
									case "decrement":
										result = _checkCommandValue(actions[actionId].actionName, _real_actionCommands, commandIdx, function(commandIdx) {
											return _checkCommandTarget(actions[actionId].actionName, _real_actionCommands, commandIdx, function(commandIdx) {
												var to_add = contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].getProperty(context, _real_actionCommands[commandIdx].commandTarget.name);
												if (_real_actionCommands[commandIdx].command === "add" || _real_actionCommands[commandIdx].command === "plus" || _real_actionCommands[commandIdx].command === "increment")
													contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setProperty(context, _real_actionCommands[commandIdx].commandTarget.name, to_add + _real_actionCommands[commandIdx].commandValue);
												else
													contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setProperty(context, _real_actionCommands[commandIdx].commandTarget.name, to_add - _real_actionCommands[commandIdx].commandValue);
												return;
											});
										});
										break;
									
									case "addConta":
										result = _checkCommandValue(actions[actionId].actionName, _real_actionCommands, commandIdx, function(commandIdx) {
											return _checkCommandTarget(actions[actionId].actionName, _real_actionCommands, commandIdx, function(commandIdx) {
											
												var lastEntitiesDialog = contextStore["dialog"].getLastEntities(context);
												var to_add;
												var count_bebidas = contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].getProperty(context, "COUNT_BEBIDAS_CONSUMIDAS");
												var str_entities_pt="Aqui está sua ";
												var str_entities_en = "Your ";
												var str_entities_es = "¡Su ";
												var str_entities_it = "La tua ";
												
												
													
													//Check if exist number entity
													var existNumber = false;
													for(var j=0;j<lastEntitiesDialog.length;j++){
														if(lastEntitiesDialog[j]["type"]=="builtin.number"){
															existNumber=true;
															break;
														}
													}

													
													//if(existNumber){
														//contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setProperty(context,"STRING_SERVIR_BEBIDA_PT", "Existe numero! PT");
													//}
													
													//else{
														if(count_bebidas + lastEntitiesDialog.length <=3 ){
															for(var k=0;k<lastEntitiesDialog.length;k++){
																to_add = contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].getProperty(context, _real_actionCommands[commandIdx].commandTarget.name);
																if(lastEntitiesDialog[k]["resolution"]["values"][0] === "caipirinha"){
																	contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setProperty(context, _real_actionCommands[commandIdx].commandTarget.name, to_add + 4);
																}else if(lastEntitiesDialog[k]["resolution"]["values"][0] === "dry martini"){
																	contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setProperty(context, _real_actionCommands[commandIdx].commandTarget.name, to_add + 8);
																}else if(lastEntitiesDialog[k]["resolution"]["values"][0] === "cuba livre"){
																	contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setProperty(context, _real_actionCommands[commandIdx].commandTarget.name, to_add + 5);
																}else if(lastEntitiesDialog[k]["resolution"]["values"][0] === "aperol spritz"){
																	contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setProperty(context, _real_actionCommands[commandIdx].commandTarget.name, to_add + 6);
																}

																if(k==0){
																	str_entities_pt = str_entities_pt + lastEntitiesDialog[k]["resolution"]["values"][0];
																	str_entities_en = str_entities_en + lastEntitiesDialog[k]["resolution"]["values"][0];
																	str_entities_es = str_entities_es + lastEntitiesDialog[k]["resolution"]["values"][0];
																	str_entities_it = str_entities_it + lastEntitiesDialog[k]["resolution"]["values"][0];

																}else{
																	str_entities_pt = str_entities_pt + " e " + lastEntitiesDialog[k]["resolution"]["values"][0];
																	str_entities_en = str_entities_en + " and " + lastEntitiesDialog[k]["resolution"]["values"][0];
																	str_entities_es = str_entities_es + " y " + lastEntitiesDialog[k]["resolution"]["values"][0];
																	str_entities_it = str_entities_it + " e " + lastEntitiesDialog[k]["resolution"]["values"][0];
																}
														
															}//end for
															contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setProperty(context,"STRING_SERVIR_BEBIDA_PT", str_entities_pt);
															contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setProperty(context,"STRING_SERVIR_BEBIDA_EN", str_entities_en  + " is ready!");
															contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setProperty(context,"STRING_SERVIR_BEBIDA_ES" , str_entities_es +  " está aquí!");
															contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setProperty(context,"STRING_SERVIR_BEBIDA_IT", str_entities_it + " sono qui!");
														}//end if count_bebidas > 3
														else{
															contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setProperty(context,"STRING_SERVIR_BEBIDA_PT", "Limite de bebidas extrapolado! Bebidas pedidas e bebidas consumidas ultrapassam 3!");
															contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setProperty(context,"STRING_SERVIR_BEBIDA_EN", "Request above 3 drinks not allowed!");
															contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setProperty(context,"STRING_SERVIR_BEBIDA_ES", "No se permiten pedidos de más de 3 bebidas.");
															contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setProperty(context,"STRING_SERVIR_BEBIDA_IT", "Non sono ammessi ordini superiori a 3 drink!");
														}
													//}//fim else check if exist number
												return;
										});
									});
									break;

									case "addBebida":
									result = _checkCommandValue(actions[actionId].actionName, _real_actionCommands, commandIdx, function(commandIdx) {
										return _checkCommandTarget(actions[actionId].actionName, _real_actionCommands, commandIdx, function(commandIdx) {
											
											//var count_bebidas = contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].getProperty(context, "COUNT_BEBIDAS_CONSUMIDAS");
											
											//Quantity entities in dialog
											var lastEntitiesDialog = contextStore["dialog"].getLastEntities(context);

											//Current value of COUNT_BEBIDAS_CONSUMIDAS
											var count_bebidas_current = contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].getProperty(context, _real_actionCommands[commandIdx].commandTarget.name);
											
											//Set COUNT_BEBIDAS_CONSUMIDAS if quantity <= 3
											if(count_bebidas_current + lastEntitiesDialog.length <=3){
												contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setProperty(context, _real_actionCommands[commandIdx].commandTarget.name, count_bebidas_current + lastEntitiesDialog.length);
											}
											
										

											return;
										});
									});
									break;

									case "setContaFinal":
									result = _checkCommandValue(actions[actionId].actionName, _real_actionCommands, commandIdx, function(commandIdx) {
										return _checkCommandTarget(actions[actionId].actionName, _real_actionCommands, commandIdx, function(commandIdx) {
											
											var to_add = contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].getProperty(context, "VALOR_CONTA");
											contextStore[_real_actionCommands[commandIdx].commandTarget.contextStore].setProperty(context, _real_actionCommands[commandIdx].commandTarget.name, to_add);
											
											

											return;
										});
									});
									break;

								
										
										
								}
							}
							else {
								result = new Error('Invalid standard action command [' + (_real_actionCommands[commandIdx].command || 'undefined') + '] on action [' + actions[actionId].actionName + ']');
							}
							if (result) break;
						}
						if (result)
							reject(result);
						else
							resolve(actionContext);
					}
					else {
						reject(new Error('Invalid standard action context [' + _real_actionContext + '] on action [' + actions[actionId].actionName + ']'));
					}
				});
			};
		return {
			execute: _execute
		};
	}))
);