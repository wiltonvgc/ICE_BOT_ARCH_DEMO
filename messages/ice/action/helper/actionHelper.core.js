;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreActionHelperModule = factory()
	}(this, (function() {
		var _createActionContext = function(actionId, actions) {
				return {
					"actionName": actions[actionId].actionName,
					"actionId": actions[actionId].actionId,
					"actionProbability": actions[actionId].actionProbability,
					"actionMultiple": actions.length > 1,
					"timestamp": Date.now(),
					"data": {},
					"channelData": actions[actionId].actionConfig ? (actions[actionId].actionConfig.channelData || {}) : {},
					"inputHint": actions[actionId].actionConfig ? (actions[actionId].actionConfig.inputHint || 'accepting') : 'accepting'
				}
			},
			_createActionContextWithData = function(actionId, actions, data) {
				var _actionContext = _createActionContext(actionId, actions);
				_actionContext.data = data;
				return _actionContext;
			};
		return {
			createActionContext: _createActionContext,
			createActionContextWithData: _createActionContextWithData
		};
	}))
);