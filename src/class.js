kampfer.provide('Class');

kampfer.Class = function() {};

kampfer.Class.extend = function(props) {
	var Class = function() {
		if(this.initializer) {
			this.initializer.apply(this, arguments);			
		}
	};

	//var prototype = this.prototype;
	var prototype = new this();

	prototype = kampfer.extend(prototype, props);

	Class.prototype = prototype;

	Class.prototype.constructor = Class;

	Class.superClass = this;

	Class.extend = kampfer.Class.extend;

	return Class;
};