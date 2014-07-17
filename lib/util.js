exports.connectionId = function(source, target) {
	return (source < target 
			? source + ':' + target 
			: target + ':' + source);
}