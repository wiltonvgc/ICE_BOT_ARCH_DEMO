;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreContextStoreAzureModule = factory()
	}(this, (function() {
		var path = require("path"),
			azure = require('botbuilder-azure'),
			contextHelper = require(path.posix.join(process.env.maindir, '/ice/context/helper')),
			_customContextStoreConfigDeploy = require(path.posix.join(process.env.maindir, '/bot/config/deploy.config.json'))['contextStore'],
			_customContextStoreConfigBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json'))['contextStore'],
			_contextStoreProviderConfig = _customContextStoreConfigDeploy.providersConfig[_customContextStoreConfigBot.contextStoreProvider],
			moduleName = 'context.azure',
			AZUD = 'userData',
			AZCD = 'conversationData',
			AZPCD = 'privateConversationData',
			AZDD = 'dialogData',
			ICUD = 'iceCustomData',
			ICOD = 'iceCoreData',
			_getConversationId = function(context) {
				return (context && context.message && context.message.address && context.message.address.conversation && context.message.address.conversation.id) ? context.message.address.conversation.id : 'noId';
			},
			_getMessage = function(context) {
				return (context && context.message && context.message.text) ? context.message.text : '';
			},
			_initializeStorage = function(universalBot) {
				universalBot.set('storage', new azure.AzureBotStorage({gzipData: false}, new azure.AzureTableClient(_contextStoreProviderConfig.table, _contextStoreProviderConfig.account, _contextStoreProviderConfig.key)));
			},
			_initializeContext = function(context) {
				if (_customContextStoreConfigBot.initialize && Array.isArray(_customContextStoreConfigBot.initialize)) {
					for (var i = 0; i < _customContextStoreConfigBot.initialize.length; i++) {
						_cs[_customContextStoreConfigBot.initialize[i].initTarget.contextStore].setPropertyIfNotExistent(context, _customContextStoreConfigBot.initialize[i].initTarget.name, _customContextStoreConfigBot.initialize[i].initValue);
					}
				}
			},
			_cs = {
				initializeStorage: _initializeStorage,
				initializeContext: _initializeContext,
				user: {
					setProperty: contextHelper.constructSetProperty(AZUD, ICUD, 'user.setProperty', moduleName),
					setPropertyIfNotExistent: contextHelper.constructSetPropertyIfNotExistent(AZUD, ICUD, 'user.setPropertyIfNotExistent', moduleName),
					hasProperty: contextHelper.constructHasProperty(AZUD, ICUD, 'user.hasProperty', moduleName),
					getProperty: contextHelper.constructGetProperty(AZUD, ICUD, 'user.getProperty', moduleName),
					getCustomObj: contextHelper.constructGetObj(AZUD, ICUD, 'user.getCustomObj', moduleName),
					getCoreObj: contextHelper.constructGetObj(AZUD, ICOD, 'user.getCoreObj', moduleName),
					setLanguage: contextHelper.constructSetLanguage(AZUD, ICOD, 'user.setLanguage', moduleName),
					getLanguage: contextHelper.constructGetLanguage(AZUD, ICOD, 'user.getLanguage', moduleName),
					setStyle: contextHelper.constructSetStyle(AZUD, ICOD, 'user.setStyle', moduleName),
					getStyle: contextHelper.constructGetStyle(AZUD, ICOD, 'user.getStyle', moduleName)
				},
				group: {
					setProperty: contextHelper.constructSetProperty(AZCD, ICUD, 'group.setProperty', moduleName),
					setPropertyIfNotExistent: contextHelper.constructSetPropertyIfNotExistent(AZCD, ICUD, 'group.setPropertyIfNotExistent', moduleName),
					hasProperty: contextHelper.constructHasProperty(AZCD, ICUD, 'group.hasProperty', moduleName),
					getProperty: contextHelper.constructGetProperty(AZCD, ICUD, 'group.getProperty', moduleName),
					getCustomObj: contextHelper.constructGetObj(AZCD, ICUD, 'group.getCustomObj', moduleName),
					getCoreObj: contextHelper.constructGetObj(AZCD, ICOD, 'group.getCoreObj', moduleName)
				},
				dialog: {
					setProperty: contextHelper.constructSetProperty(AZDD, ICUD, 'dialog.setProperty', moduleName),
					setPropertyIfNotExistent: contextHelper.constructSetPropertyIfNotExistent(AZDD, ICUD, 'dialog.setPropertyIfNotExistent', moduleName),
					hasProperty: contextHelper.constructHasProperty(AZDD, ICUD, 'dialog.hasProperty', moduleName),
					getProperty: contextHelper.constructGetProperty(AZDD, ICUD, 'dialog.getProperty', moduleName),
					getCustomObj: contextHelper.constructGetObj(AZDD, ICUD, 'dialog.getCustomObj', moduleName),
					getCoreObj: contextHelper.constructGetObj(AZDD, ICOD, 'dialog.getCoreObj', moduleName),
					setLastActions: contextHelper.constructSetLastActions(AZDD, ICOD, 'dialog.setLastActions', moduleName),
					getLastActions: contextHelper.constructGetLastActions(AZDD, ICOD, 'dialog.getLastActions', moduleName),
					getHistoricActions: contextHelper.constructGetHistoricActions(AZDD, ICOD, 'dialog.getHistoricActions', moduleName),
					getHistoricActionsByIndex: contextHelper.constructGetHistoricActionsByIndex(AZDD, ICOD, 'dialog.getHistoricActionsByIndex', moduleName),
					getHistoricActionsByRelativeIndexFromLast: contextHelper.constructGetHistoricActionsByRelativeIndexFromLast(AZDD, ICOD, 'dialog.getHistoricActionsByRelativeIndexFromLast', moduleName),
					getHistoricActionsRangeByRelativeIndexFromLast: contextHelper.constructGetHistoricActionsRangeByRelativeIndexFromLast(AZDD, ICOD, 'dialog.getHistoricActionsRangeByRelativeIndexFromLast', moduleName),
					getHistoricActionsByRelativeTimeFromLast: contextHelper.constructGetHistoricActionsByRelativeTimeFromLast(AZDD, ICOD, 'dialog.getHistoricActionsByRelativeTimeFromLast', moduleName),
					getHistoricActionsRangeByRelativeTimeFromLast: contextHelper.constructGetHistoricActionsRangeByRelativeTimeFromLast(AZDD, ICOD, 'dialog.getHistoricActionsRangeByRelativeTimeFromLast', moduleName),
					setLastIntents: contextHelper.constructSetLastIntents(AZDD, ICOD, 'dialog.setLastIntents', moduleName),
					getLastIntents: contextHelper.constructGetLastIntents(AZDD, ICOD, 'dialog.getLastIntents', moduleName),
					getHistoricIntents: contextHelper.constructGetHistoricIntents(AZDD, ICOD, 'dialog.getHistoricIntents', moduleName),
					getHistoricIntentsByIndex: contextHelper.constructGetHistoricIntentsByIndex(AZDD, ICOD, 'dialog.getHistoricIntentsByIndex', moduleName),
					getHistoricIntentsByRelativeIndexFromLast: contextHelper.constructGetHistoricIntentsByRelativeIndexFromLast(AZDD, ICOD, 'dialog.getHistoricIntentsByRelativeIndexFromLast', moduleName),
					getHistoricIntentsRangeByRelativeIndexFromLast: contextHelper.constructGetHistoricIntentsRangeByRelativeIndexFromLast(AZDD, ICOD, 'dialog.getHistoricIntentsRangeByRelativeIndexFromLast', moduleName),
					getHistoricIntentsByRelativeTimeFromLast: contextHelper.constructGetHistoricIntentsByRelativeTimeFromLast(AZDD, ICOD, 'dialog.getHistoricIntentsByRelativeTimeFromLast', moduleName),
					getHistoricIntentsRangeByRelativeTimeFromLast: contextHelper.constructGetHistoricIntentsRangeByRelativeTimeFromLast(AZDD, ICOD, 'dialog.getHistoricIntentsRangeByRelativeTimeFromLast', moduleName),
					setLastEntities: contextHelper.constructSetLastEntities(AZDD, ICOD, 'dialog.setLastEntities', moduleName),
					getLastEntities: contextHelper.constructGetLastEntities(AZDD, ICOD, 'dialog.getLastEntities', moduleName),
					getHistoricEntities: contextHelper.constructGetHistoricEntities(AZDD, ICOD, 'dialog.getHistoricEntities', moduleName),
					getHistoricEntitiesByIndex: contextHelper.constructGetHistoricEntitiesByIndex(AZDD, ICOD, 'dialog.getHistoricEntitiesByIndex', moduleName),
					getHistoricEntitiesByRelativeIndexFromLast: contextHelper.constructGetHistoricEntitiesByRelativeIndexFromLast(AZDD, ICOD, 'dialog.getHistoricEntitiesByRelativeIndexFromLast', moduleName),
					getHistoricEntitiesRangeByRelativeIndexFromLast: contextHelper.constructGetHistoricEntitiesRangeByRelativeIndexFromLast(AZDD, ICOD, 'dialog.getHistoricEntitiesRangeByRelativeIndexFromLast', moduleName),
					getHistoricEntitiesByRelativeTimeFromLast: contextHelper.constructGetHistoricEntitiesByRelativeTimeFromLast(AZDD, ICOD, 'dialog.getHistoricEntitiesByRelativeTimeFromLast', moduleName),
					getHistoricEntitiesRangeByRelativeTimeFromLast: contextHelper.constructGetHistoricEntitiesRangeByRelativeTimeFromLast(AZDD, ICOD, 'dialog.getHistoricEntitiesRangeByRelativeTimeFromLast', moduleName),
					setLastConditions: contextHelper.constructSetLastConditions(AZDD, ICOD, 'dialog.setLastConditions', moduleName),
					getLastConditions: contextHelper.constructGetLastConditions(AZDD, ICOD, 'dialog.getLastConditions', moduleName),
					getHistoricConditions: contextHelper.constructGetHistoricConditions(AZDD, ICOD, 'dialog.getHistoricConditions', moduleName),
					getHistoricConditionsByIndex: contextHelper.constructGetHistoricConditionsByIndex(AZDD, ICOD, 'dialog.getHistoricConditionsByIndex', moduleName),
					getHistoricConditionsByRelativeIndexFromLast: contextHelper.constructGetHistoricConditionsByRelativeIndexFromLast(AZDD, ICOD, 'dialog.getHistoricConditionsByRelativeIndexFromLast', moduleName),
					getHistoricConditionsRangeByRelativeIndexFromLast: contextHelper.constructGetHistoricConditionsRangeByRelativeIndexFromLast(AZDD, ICOD, 'dialog.getHistoricConditionsRangeByRelativeIndexFromLast', moduleName),
					getHistoricConditionsByRelativeTimeFromLast: contextHelper.constructGetHistoricConditionsByRelativeTimeFromLast(AZDD, ICOD, 'dialog.getHistoricConditionsByRelativeTimeFromLast', moduleName),
					getHistoricConditionsRangeByRelativeTimeFromLast: contextHelper.constructGetHistoricConditionsRangeByRelativeTimeFromLast(AZDD, ICOD, 'dialog.getHistoricConditionsRangeByRelativeTimeFromLast', moduleName)
				},
				conversation: {
					setProperty: contextHelper.constructSetProperty(AZPCD, ICUD, 'conversation.setProperty', moduleName),
					setPropertyIfNotExistent: contextHelper.constructSetPropertyIfNotExistent(AZPCD, ICUD, 'conversation.setPropertyIfNotExistent', moduleName),
					hasProperty: contextHelper.constructHasProperty(AZPCD, ICUD, 'conversation.hasProperty', moduleName),
					getProperty: contextHelper.constructGetProperty(AZPCD, ICUD, 'conversation.getProperty', moduleName),
					getCustomObj: contextHelper.constructGetObj(AZPCD, ICUD, 'conversation.getCustomObj', moduleName),
					getCoreObj: contextHelper.constructGetObj(AZPCD, ICOD, 'conversation.getCoreObj', moduleName),
					setLanguage: contextHelper.constructSetLanguage(AZPCD, ICOD, 'conversation.setLanguage', moduleName),
					getLanguage: contextHelper.constructGetLanguage(AZPCD, ICOD, 'conversation.getLanguage', moduleName),
					setConditionCache: contextHelper.constructSetConditionCache(AZPCD, ICOD, 'conversation.setConditionCache', moduleName),
					getConditionCache: contextHelper.constructGetConditionCache(AZPCD, ICOD, 'conversation.getConditionCache', moduleName),
					getConversationId: _getConversationId,
					getMessage: _getMessage,
					setLastActions: contextHelper.constructSetLastActions(AZPCD, ICOD, 'conversation.setLastActions', moduleName),
					getLastActions: contextHelper.constructGetLastActions(AZPCD, ICOD, 'conversation.getLastActions', moduleName),
					getHistoricActions: contextHelper.constructGetHistoricActions(AZPCD, ICOD, 'conversation.getHistoricActions', moduleName),
					getHistoricActionsByIndex: contextHelper.constructGetHistoricActionsByIndex(AZPCD, ICOD, 'conversation.getHistoricActionsByIndex', moduleName),
					getHistoricActionsByRelativeIndexFromLast: contextHelper.constructGetHistoricActionsByRelativeIndexFromLast(AZPCD, ICOD, 'conversation.getHistoricActionsByRelativeIndexFromLast', moduleName),
					getHistoricActionsRangeByRelativeIndexFromLast: contextHelper.constructGetHistoricActionsRangeByRelativeIndexFromLast(AZPCD, ICOD, 'conversation.getHistoricActionsRangeByRelativeIndexFromLast', moduleName),
					getHistoricActionsByRelativeTimeFromLast: contextHelper.constructGetHistoricActionsByRelativeTimeFromLast(AZPCD, ICOD, 'conversation.getHistoricActionsByRelativeTimeFromLast', moduleName),
					getHistoricActionsRangeByRelativeTimeFromLast: contextHelper.constructGetHistoricActionsRangeByRelativeTimeFromLast(AZPCD, ICOD, 'conversation.getHistoricActionsRangeByRelativeTimeFromLast', moduleName),
					setLastIntents: contextHelper.constructSetLastIntents(AZPCD, ICOD, 'conversation.setLastIntents', moduleName),
					getLastIntents: contextHelper.constructGetLastIntents(AZPCD, ICOD, 'conversation.getLastIntents', moduleName),
					getHistoricIntents: contextHelper.constructGetHistoricIntents(AZPCD, ICOD, 'conversation.getHistoricIntents', moduleName),
					getHistoricIntentsByIndex: contextHelper.constructGetHistoricIntentsByIndex(AZPCD, ICOD, 'conversation.getHistoricIntentsByIndex', moduleName),
					getHistoricIntentsByRelativeIndexFromLast: contextHelper.constructGetHistoricIntentsByRelativeIndexFromLast(AZPCD, ICOD, 'conversation.getHistoricIntentsByRelativeIndexFromLast', moduleName),
					getHistoricIntentsRangeByRelativeIndexFromLast: contextHelper.constructGetHistoricIntentsRangeByRelativeIndexFromLast(AZPCD, ICOD, 'conversation.getHistoricIntentsRangeByRelativeIndexFromLast', moduleName),
					getHistoricIntentsByRelativeTimeFromLast: contextHelper.constructGetHistoricIntentsByRelativeTimeFromLast(AZPCD, ICOD, 'conversation.getHistoricIntentsByRelativeTimeFromLast', moduleName),
					getHistoricIntentsRangeByRelativeTimeFromLast: contextHelper.constructGetHistoricIntentsRangeByRelativeTimeFromLast(AZPCD, ICOD, 'conversation.getHistoricIntentsRangeByRelativeTimeFromLast', moduleName),
					setLastEntities: contextHelper.constructSetLastEntities(AZPCD, ICOD, 'conversation.setLastEntities', moduleName),
					getLastEntities: contextHelper.constructGetLastEntities(AZPCD, ICOD, 'conversation.getLastEntities', moduleName),
					getHistoricEntities: contextHelper.constructGetHistoricEntities(AZPCD, ICOD, 'conversation.getHistoricEntities', moduleName),
					getHistoricEntitiesByIndex: contextHelper.constructGetHistoricEntitiesByIndex(AZPCD, ICOD, 'conversation.getHistoricEntitiesByIndex', moduleName),
					getHistoricEntitiesByRelativeIndexFromLast: contextHelper.constructGetHistoricEntitiesByRelativeIndexFromLast(AZPCD, ICOD, 'conversation.getHistoricEntitiesByRelativeIndexFromLast', moduleName),
					getHistoricEntitiesRangeByRelativeIndexFromLast: contextHelper.constructGetHistoricEntitiesRangeByRelativeIndexFromLast(AZPCD, ICOD, 'conversation.getHistoricEntitiesRangeByRelativeIndexFromLast', moduleName),
					getHistoricEntitiesByRelativeTimeFromLast: contextHelper.constructGetHistoricEntitiesByRelativeTimeFromLast(AZPCD, ICOD, 'conversation.getHistoricEntitiesByRelativeTimeFromLast', moduleName),
					getHistoricEntitiesRangeByRelativeTimeFromLast: contextHelper.constructGetHistoricEntitiesRangeByRelativeTimeFromLast(AZPCD, ICOD, 'conversation.getHistoricEntitiesRangeByRelativeTimeFromLast', moduleName),
					setLastConditions: contextHelper.constructSetLastConditions(AZPCD, ICOD, 'conversation.setLastConditions', moduleName),
					getLastConditions: contextHelper.constructGetLastConditions(AZPCD, ICOD, 'conversation.getLastConditions', moduleName),
					getHistoricConditions: contextHelper.constructGetHistoricConditions(AZPCD, ICOD, 'conversation.getHistoricConditions', moduleName),
					getHistoricConditionsByIndex: contextHelper.constructGetHistoricConditionsByIndex(AZPCD, ICOD, 'conversation.getHistoricConditionsByIndex', moduleName),
					getHistoricConditionsByRelativeIndexFromLast: contextHelper.constructGetHistoricConditionsByRelativeIndexFromLast(AZPCD, ICOD, 'conversation.getHistoricConditionsByRelativeIndexFromLast', moduleName),
					getHistoricConditionsRangeByRelativeIndexFromLast: contextHelper.constructGetHistoricConditionsRangeByRelativeIndexFromLast(AZPCD, ICOD, 'conversation.getHistoricConditionsRangeByRelativeIndexFromLast', moduleName),
					getHistoricConditionsByRelativeTimeFromLast: contextHelper.constructGetHistoricConditionsByRelativeTimeFromLast(AZPCD, ICOD, 'conversation.getHistoricConditionsByRelativeTimeFromLast', moduleName),
					getHistoricConditionsRangeByRelativeTimeFromLast: contextHelper.constructGetHistoricConditionsRangeByRelativeTimeFromLast(AZPCD, ICOD, 'conversation.getHistoricConditionsRangeByRelativeTimeFromLast', moduleName)
				}
			};
		return _cs;
	}))
);