var Swagger = require('swagger-client'),
	util = require("util"),
	fs = require("fs"),
	Promise = require("bluebird"),
	rp = require('request-promise'),
	config = require('./config.json'),
	directLineSecret = config.directLineSecret,
	threads = config.threads || 1,
	timeoutSecs = (config.timeoutSecs || 10) * 1000,
	directLineClientName = 'DirectLineClientBatchWS-' + process.pid,
	directLineSpecUrl = 'https://docs.botframework.com/en-us/restapi/directline3/swagger.json',
	_ts_start,
	directLineClient = rp(directLineSpecUrl)
		.then(function(spec) { return new Swagger({spec: JSON.parse(spec.trim()), usePromise: true}); })
		.then(function(client) {
			client.clientAuthorizations.add('AuthorizationBotConnector', new Swagger.ApiKeyAuthorization('Authorization', 'Bearer ' + directLineSecret, 'header'));
			return client;
		})
		.catch(function(err) { console.error('Error initializing DirectLine client', err); }),
	_start = function() {
		_ts_start = Date.now();
	},
	_stop = function() {
		var delta = new Date(Date.now() - _ts_start),
			m = delta.getMinutes(),
			s = delta.getSeconds(),
			ms = delta.getMilliseconds(),
			tot = ms + (s * 1000) + (m * 60000);
		count++;
		if (tot < minRT) minRT = tot;
		if (tot > maxRT) maxRT = tot;
		avgRT = ((avgRT * (count - 1)) + tot) / count;
		return util.format('%s:%s.%s', (m < 10 ? '0' : '') + m, (s < 10 ? '0' : '') + s, (ms < 100 ? '0' : '') + (ms < 10 ? '0' : '') + ms);
	},
	minRT = 999999, maxRT = 0, avgRT = 0, count = 0, passedT = 0, errorsT = 0;

function sendMessage (client, conversationId, message) {
	return new Promise(function(resolve, reject) {
		client.Conversations.Conversations_PostActivity({
			                                                conversationId: conversationId,
			                                                activity: {
				                                                textFormat: 'plain',
				                                                text: message,
				                                                type: 'message',
				                                                from: {
					                                                id: directLineClientName,
					                                                name: directLineClientName
				                                                }
			                                                }
		                                                })
			.then(function() {
				resolve();
			})
			.catch(function(err) {
				console.error('\nError sending message:', err);
				reject(err);
			});
	});
}

function startReceivingWebSocketClientJSON (streamUrl, conversationId, client, threadId, phraseSet, phrases) {
	var ws = new (require('websocket').client)(),
		output = './' + directLineClientName + '-T' + (threadId + 1) + '-' + phraseSet + '.log',
		messageLoop = -1,
		fws = fs.createWriteStream(output, {
			flags: 'w',
			encoding: 'utf8',
			autoClose: true,
			fd: null
		});
	ws.on('connectFailed', function(error) {
		console.error('Connect Error: ' + error.toString());
	});
	ws.on('connect', function(connection) {
		var th;
		console.error('Starting WebSocket Client for message streaming on conversationId ' + conversationId + ' and client ' + directLineClientName + ' - Thread #' + (threadId + 1) + ' - PhraseSet: ' + phraseSet);
		connection.on('error', function(error) {
			console.error("Connection Error: " + error.toString());
		});
		connection.on('close', function() {
			console.error('WebSocket Client Disconnected for conversationId ' + conversationId + ' and client ' + directLineClientName + ' - Thread #' + (threadId + 1) + ' - PhraseSet: ' + phraseSet);
		});
		connection.on('message', function(message) {
			if (message.type === 'utf8' && message.utf8Data.length > 0) {
				var activities = JSON.parse(message.utf8Data).activities;
				if (activities && activities.length) {
					activities = activities.filter(function(m) { return m.from.id !== directLineClientName && m.type === 'message' });
					if (activities.length) {
						if (th) clearTimeout(th);
						for (var i = 0; i < activities.length; i++) {
							if (activities[i].text) {
								// console.error(activities[i]);
								var testOk = 'ERROR';
								if (phrases.output) {
									if (phrases.output.length === (phrases.input.length + 1)) {
										for (var j = 0; j < phrases.output[messageLoop + 1].length; j++) {
											if (activities[i].text === phrases.output[messageLoop + 1][j]) {
												testOk = 'PASSED';
												passedT++;
											}
										}
										if (testOk === 'ERROR') {
											errorsT++;
										}
									}
								}
								else {
									testOk = 'NOTCHECKED';
									passedT++;
								}
								fws.write('|' + activities[i].text + '|' + activities[i].inputHint + '|' + (activities[i].channelData ? JSON.stringify(activities[i].channelData) : '{}') + '|' + _stop() + '|' + testOk + '\n');
							}
						}
						if (++messageLoop < phrases.input.length) {
							fws.write(directLineClientName + '|' + conversationId + '|' + messageLoop + '|' + phrases.input[messageLoop]);
							_start();
							var prm = sendMessage(client, conversationId, phrases.input[messageLoop]);
							th = setTimeout(function() {
								console.error('Timeout for conversationId ' + conversationId + ' and client ' + directLineClientName + ' - Thread #' + (threadId + 1) + ' - PhraseSet: ' + phraseSet);
								fws.end();
								connection.close();
							}, timeoutSecs);
							prm.then(function() {
								console.error('Question & Answer processed for conversationId ' + conversationId + ' and client ' + directLineClientName + ' - Thread #' + (threadId + 1) + ' - PhraseSet: ' + phraseSet);
							}).catch(function(err) {
								fws.end();
								connection.close();
							});
						}
						else {
							fws.end();
							connection.close();
						}
					}
				}
			}
		});
		fws.write(directLineClientName + '|' + conversationId + '|I|{StartConversation}');
		_start();
		sendMessage(client, conversationId, 'Olá');
	});
	ws.connect(streamUrl);
}

function initConversationJSON (threadId, phraseSet, phrases) {
	directLineClient.then(function(client) {
		client.Conversations.Conversations_StartConversation()
			.then(function(response) {
				startReceivingWebSocketClientJSON(response.obj.streamUrl, response.obj.conversationId, client, threadId, phraseSet, phrases);
			});
	});
}

process.on('exit', function(code) {
	console.error("\nAverage Response Time: " + (avgRT | 0) + " msecs\nMax Response Time: " + maxRT + " msecs\nMin Response Time: " + minRT + " msecs\nTotal test messages sent: " + count + "\nTests Passed: " + passedT + "\nTests Not Passed: " + errorsT);
});

for (var thr = 0; thr < threads; thr++) {
	for (var phrases in config.testset) {
		if (config.testset.hasOwnProperty(phrases)) initConversationJSON(thr, phrases, config.testset[phrases]);
	}
}