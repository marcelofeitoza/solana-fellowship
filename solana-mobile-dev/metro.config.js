// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const nodeLibs = require("node-libs-react-native");

module.exports = (() => {
	const config = getDefaultConfig(__dirname);

	config.resolver.extraNodeModules = {
		...nodeLibs,
		crypto: require.resolve("react-native-crypto"),
		stream: require.resolve("stream-browserify"),
		// Add other shims as needed
	};

	config.transformer.getTransformOptions = async () => ({
		transform: {
			experimentalImportSupport: false,
			inlineRequires: true,
		},
	});

	return config;
})();
