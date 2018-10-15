;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreConversationMatrixModule = factory()
	}(this, (function() {
		var path = require("path"),
			fs = require("fs"),
			csv = require("csv-parse"),
			_customConfigBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json')),
			_customConfigDeploy = require(path.posix.join(process.env.maindir, '/bot/config/deploy.config.json')),
			_customConversationProviderConfig = (_customConfigDeploy && _customConfigDeploy['conversation'] && _customConfigDeploy['conversation']['providersConfig']) ? _customConfigDeploy['conversation']['providersConfig'][_customConfigBot['conversation']['conversationProvider']] : {},
			_customConversationLoggerLevel = (_customConfigBot && _customConfigBot['logger'] && _customConfigBot['logger']['logLevel'] && _customConfigBot['logger']['logLevel']['conversation']) ? _customConfigBot['logger']['logLevel']['conversation'] : "OFF",
			log = require(path.posix.join(process.env.maindir, '/ice/logger')),
			contextStore = require(path.posix.join(process.env.maindir, '/ice/context/store')),
			feature_map,
			last_col = 0,
			action_count = 0,
			_maxAction = function() {
				var maxAction = 0;
				for (var r = 0; r < feature_map.length; r++) {
					if (feature_map[r][last_col] > maxAction) maxAction = feature_map[r][last_col];
				}
				return maxAction;
			},
			_getActions = function(input) {
				var _actions = [];
				for (var r = 0; r < feature_map.length; r++) {
					if ((input.every(function(currentValue, index) {return (feature_map[r][index] === -1) ? true : (currentValue == feature_map[r][index])})) && (_actions.indexOf(feature_map[r][last_col]) < 0))
						_actions.push(feature_map[r][last_col]);
				}
				return _actions.sort();
			},
			_getClassifiers = function(actions) {
				var _classifiers = new Array(action_count);
				_classifiers.fill(0);
				for (var i = 0; i < actions.length; i++) {
					_classifiers[actions[i]] = 1;
				}
				return _classifiers;
			},
			_invoke = function(context, featureMap) {
				return log.tracePromise(__filename, _customConversationLoggerLevel, contextStore.conversation.getConversationId(context), function _invokePromise (logOptions, resolve, reject) {
					var input_features = featureMap.split(''),
						actions = [],
						classifiers = [],
						resp = {};
					if (input_features.length !== last_col) {
						resp = {
							"error": 1,
							"errorDescription": "Invalid feature map",
							"threshold": 1.0,
							"actionsCount": 0,
							"actions": [],
							"classifiers": []
						}
					}
					else {
						actions = _getActions(input_features);
						classifiers = _getClassifiers(actions);
						if (actions.length === 0) {
							resp = {
								"error": 3,
								"errorDescription": "Request returned no selected actions",
								"threshold": 1.0,
								"actionsCount": 0,
								"actions": [],
								"classifiers": classifiers
							}
						}
						else {
							resp = {
								"error": 0,
								"errorDescription": "",
								"threshold": 1.0,
								"actionsCount": actions.length,
								"actions": actions,
								"classifiers": classifiers
							}
						}
					}
					log.debug(logOptions, resp, 'conversationMatrixResponse=');
					resolve(resp);
				});
			};
		csv(fs.readFileSync(path.posix.join(process.env.maindir, _customConversationProviderConfig.endpoint)), {
			auto_parse: true,
			from: 2,
			delimiter: ";"
		}, function(err, data) {
			if (err) {
				throw new Error("Error reading matrix file");
			}
			else {
				feature_map = data;
				last_col = feature_map[0].length - 1;
				action_count = _maxAction();
			}
		});
		return {
			invoke: _invoke
		};
	}))
);