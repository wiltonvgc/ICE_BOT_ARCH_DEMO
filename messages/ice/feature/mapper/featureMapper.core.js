;(function(global, factory) {
		typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
		typeof define === 'function' && define.amd ? define(factory) :
		global.coreFeatureMapperModule = factory()
	}(this, (function() {
		var path = require("path"),
			_customFeatureMapperConfig = require(path.posix.join(process.env.maindir, '/bot/config/bot.config.json'))['featureMapper'],
			_coreFeatureMapperConfig = require(path.posix.join(process.env.maindir, '/ice/feature/mapper/featureMapper.config.json')),
			_featureMapperProvider = _coreFeatureMapperConfig.providers[_customFeatureMapperConfig.featureMapperProvider],
			_featureMapperModule = require(path.posix.join(process.env.maindir, _featureMapperProvider.module));
		return {
			map: _featureMapperModule.map
		};
	}))
);