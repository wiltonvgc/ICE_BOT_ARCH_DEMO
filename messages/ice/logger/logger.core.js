;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreLoggerModule = factory()
	}(this, (function() {
		var path = require('path'),
			util = require('util'),
			Promise = require('bluebird'),
			winston = require('winston'),
			_Loggly = require('winston-loggly-bulk').Loggly,
			_Logstash = require('winston-logstash').Logstash,
			_Elasticsearch = require('winston-elasticsearch').Elasticsearch,
			_AzureAppInsight = require('winston-azure-application-insights').AzureApplicationInsightsLogger,
			_AzureTable = require('winston-azure-sw').WinstonAzure,
			_loggerLevels = ["OFF",
			                 "ERROR",
			                 "WARN",
			                 "INFO",
			                 "DEBUG",
			                 "PERF"],
			_logTSIdLength = 100000,
			_highTimerPaddingLength = 9,
			_possibleIndexChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
			_timestamps = {},
			_customLoggerConfigBot = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json'))['logger'],
			_customLoggerConfigDeploy = require(path.posix.join(process.env.maindir, '/bot/config/deploy.config.json'))['logger'],
			_loggerProviders = _customLoggerConfigBot['loggerProviders'],
			_console_silent = _customLoggerConfigDeploy['providersConfig'] && _customLoggerConfigDeploy['providersConfig']['console'] && (_customLoggerConfigDeploy['providersConfig']['console']['silent'] || false),
			_paddy = function(n, p, c) {
				var pad_char = typeof c !== 'undefined' ? c : '0';
				var pad = new Array(1 + p).join(pad_char);
				return (pad + n).slice(-pad.length);
			},
			_shouldLog = function(msgLevel, logLevel) {
				return (_loggerLevels.indexOf(logLevel || "OFF") !== 0) && _loggerLevels.indexOf(msgLevel || "OFF") <= _loggerLevels.indexOf(logLevel || "OFF");
			},
			_deep = function(obj) {
				if ((typeof obj === "object") && ((obj.constructor === Object) || (obj.constructor === Array)))
					return util.inspect(obj, {depth: null, colors: false, maxArrayLength: null});
				else
					return obj;
			},
			_hrtime = function() {
				var ht = process.hrtime();
				return ht[0] + _paddy(ht[1], _highTimerPaddingLength)
			},
			_log = function(level, options, data, preText, caller) {
				try {
					if (_shouldLog(level, options.logLevel)) {
						var logData;
						switch (typeof data) {
							case "string":
								logData = data;
								break;
							case "undefined":
								logData = "[undefined object]";
								break;
							case "object":
								switch (data.constructor) {
									case Date:
										logData = data.toISOString();
										break;
									case Error:
										logData = data.stack || data.toString();
										break;
									case RegExp:
										logData = data.toString();
										break;
									default:
										logData = util.inspect(data, {
											depth: null,
											colors: false,
											maxArrayLength: null
										});
								}
								break;
							case "number":
							case "boolean":
								logData = data.toString();
								break;
							case "function":
								logData = "[function object]";
								break;
							default:
								logData = "[undefined]";
						}
						var baseMessage = '@' + _hrtime() + '@ $' + options.id + '$ [' + options.moduleName + (caller ? '.' + caller : '') + '] ' + (preText || '') + logData;
						if (!_console_silent) console.log('[' + level + '] ' + baseMessage);
						switch (level) {
							case "ERROR":
								winston.error(baseMessage);
								break;
							case "WARN":
								winston.warn(baseMessage);
								break;
							case "INFO":
								winston.info(baseMessage);
								break;
							case "DEBUG":
								winston.debug(baseMessage);
								break;
							case "PERF":
								winston.silly(baseMessage);
								break;
						}
					}
				}
				catch (err) {
					console.error(err.stack);
				}
			},
			_error = function(options, error, preText) {
				var functionName = (_error.caller && (_error.caller !== null)) ? (_error.caller.name || 'main') : 'main';
				_log("ERROR", options, error, preText, functionName);
			},
			_warn = function(options, data, preText) {
				var functionName = (_warn.caller && (_warn.caller !== null)) ? (_warn.caller.name || 'main') : 'main';
				_log("WARN", options, data, preText, functionName);
			},
			_info = function(options, data, preText) {
				var functionName = (_info.caller && (_info.caller !== null)) ? (_info.caller.name || 'main') : 'main';
				_log("INFO", options, data, preText, functionName);
			},
			_debug = function(options, data, preText) {
				var functionName = (_debug.caller && (_debug.caller !== null)) ? (_debug.caller.name || 'main') : 'main';
				_log("DEBUG", options, data, preText, functionName);
			},
			_perf = function(options, data, preText) {
				var functionName = (_perf.caller && (_perf.caller !== null)) ? (_perf.caller.name || 'main') : 'main';
				_log("PERF", options, data, preText, functionName);
			},
			_options = function(moduleName, logLevel, id) {
				return {
					moduleName: moduleName || "ice",
					logLevel: logLevel || "OFF",
					id: id || 'noId'
				};
			},
			_create_timestamp_id = function() {
				return Date.now().toString() + ((Math.random() * _logTSIdLength) | 0).toString();
			},
			_start = function() {
				var _timestamp_id = _create_timestamp_id();
				_timestamps[_timestamp_id] = Date.now();
				return _timestamp_id;
			},
			_stop = function(_timestamp_id) {
				var _delta = Date.now() - _timestamps[_timestamp_id];
				delete _timestamps[_timestamp_id];
				return _delta;
			},
			_strDelta = function(_delta) {
				var delta = new Date(_delta), h = delta.getHours(), m = delta.getMinutes(), s = delta.getSeconds(),
					ms = delta.getMilliseconds();
				return util.format('%s:%s:%s.%s', (h < 10 ? '0' : '') + h, (m < 10 ? '0' : '') + m, (s < 10 ? '0' : '') + s, (ms < 100 ? '0' : '') + (ms < 10 ? '0' : '') + ms);
			},
			_stop_performance = function(logOptions, timestamp_id, caller) {
				var functionName = (_stop_performance.caller && (_stop_performance.caller !== null)) ? (_stop_performance.caller.name || 'main') : 'main';
				_log("PERF", logOptions, _strDelta(_stop(timestamp_id)), 'duration=', caller || functionName);
			},
			_tracePromise = function(filename, logLevel, logId, traceableFunction) {
				var _functionName = (_tracePromise.caller && _tracePromise.caller !== null) ? _tracePromise.caller.name : 'main';
				return new Promise(function(resolve, reject) {
					try {
						var _logOptions = _options(path.basename(filename, '.js'), logLevel, logId),
							_resolve = function(obj) {
								_stop_performance(_logOptions, _timestamp_id, _functionName);
								resolve(obj);
							},
							_reject = function(obj) {
								_stop_performance(_logOptions, _timestamp_id, _functionName);
								reject(obj);
							},
							_timestamp_id = _start();
						traceableFunction(_logOptions, _resolve, _reject);
					}
					catch (err) {
						_stop_performance(_logOptions, _timestamp_id, _functionName);
						_error(_logOptions, _functionName, "Error while processing function ");
						reject(err);
					}
				});
			},
			_traceFunction = function(filename, logLevel, logId, traceableFunctionTry, traceableFunctionCatch) {
				var _functionName = (_traceFunction.caller && _traceFunction.caller !== null) ? _traceFunction.caller.name : 'main';
				try {
					var _logOptions = _options(path.basename(filename, '.js'), logLevel, logId),
						_timestamp_id = _start(),
						_resultOk = traceableFunctionTry(_logOptions);
					_stop_performance(_logOptions, _timestamp_id, _functionName);
					return _resultOk;
				}
				catch (err) {
					try {
						var _resultNok = traceableFunctionCatch(_logOptions, err);
						_stop_performance(_logOptions, _timestamp_id, _functionName);
						return _resultNok;
					}
					catch (errInternal) {
						_stop_performance(_logOptions, _timestamp_id, _functionName);
						_error(_logOptions, _functionName, "Error while processing function ");
						throw errInternal;
					}
				}
			},
			_azureRowKey = function() {
				var rtext = '';
				for (var i = 0; i < 5; i++) {
					rtext += _possibleIndexChars.charAt(Math.floor(Math.random() * _possibleIndexChars.length));
				}
				return _hrtime() + rtext;
			};
		util.inspect.defaultOptions.maxArrayLength = null;
		util.inspect.defaultOptions.depth = null;
		winston.level = 'silly';
		var wTransp = {
			"loggly": _Loggly,
			"logstash": _Logstash,
			"elasticsearch": _Elasticsearch,
			"azureApplicationInsight": _AzureAppInsight,
			"azureTable": _AzureTable
		};
		if (_loggerProviders && Array.isArray(_loggerProviders))
			for (var i = 0; i < _loggerProviders.length; i++) {
				if (!_console_silent) console.log('Configuring log provider [' + i + ']: ' + _loggerProviders[i]);
				var config = _customLoggerConfigDeploy.providersConfig[_loggerProviders[i]];
				switch (_loggerProviders[i]) {
					case "azureTable":
						config.partition = process.env.NODE_ENV;
						config.rowKeyBuilder = _azureRowKey;
						break;
				}
				winston.add(wTransp[_loggerProviders[i]], config);
			}
		winston.remove(winston.transports.Console);
		return {
			deep: _deep,
			error: _error,
			warn: _warn,
			info: _info,
			debug: _debug,
			perf: _perf,
			options: _options,
			tracePromise: _tracePromise,
			traceFunction: _traceFunction,
			traceStart: _start,
			traceStop: _stop_performance
		};
	}))
);