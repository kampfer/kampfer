/*global kampfer*/
kampfer.require('data');

kampfer.provide('events');
kampfer.provide('events.Event');
kampfer.provide('events.Listener');


/*
 * 包裹浏览器event对象，提供统一的、跨浏览器的接口。
 * 新的对象将包含以下接口：
 * - type	{string}	事件种类
 * - target		{object}	触发事件的对象
 * - relatedTarget	{object}	鼠标事件mouseover和mouseout的修正
 * - currentTarget	{object}	
 * - stopPropagation	{function}	阻止冒泡
 * - preventDefault	{function}	阻止默认行为
 * - dispose	{function}
 * - which	{number}	
 * - pageX/pageY	{number}
 */
kampfer.events.Event = function(src) {
	this.src = src;
	this.type = src.type;
	this.propagationStopped = false;
	this.isDefaultPrevented = false;
	
	//跨越浏览器
	this.fix();
};

//停止冒泡
kampfer.events.Event.prototype.stopPropagation = function() {
	//使用fireEvent触发事件时，需要读取propagationStopped，判断冒泡是否取消。
	this.propagationStopped = true;

	var e = this.src;
	if(e.stopPropagation) {
		e.stopPropagation();
	} else {
		e.cancelBubble = true;
	}
};

//阻止默认行为
kampfer.events.Event.prototype.preventDefault = function() {
	this.isDefaultPrevented = true;
	
	var e = this.src;
	if (e.preventDefault) {
		e.preventDefault();
	} else {
		e.returnValue = false;
	}
};

//处理兼容性问题
kampfer.events.Event.prototype.fix = function() {
	var src = this.src;
	
	this.target = src.target || src.srcElement;
	//如果target不存在，默认设置为document
	if(!this.target) {
		this.target = kampfer.global.document;
	}
	
	//第一次生成event包裹时，初始化currentTarget为target
	this.currentTarget = this.target;
	
	//修复键盘事件
	if( kampfer.events.Event.isKeyEvent(this.type) ) {
		if ( this.which == null ) {
			this.which = src.charCode != null ? src.charCode : src.keyCode;
		}
	//修复鼠标事件
	} else if( kampfer.events.Event.isMouseEvent(this.type) ) {
		var eventDoc = this.target.ownerDocument || document,
			doc = eventDoc.documentElement,
			body = eventDoc.body;
		
		//修复坐标
		if ( this.pageX == null && src.clientX != null ) {
			this.pageX = src.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
			this.pageY = src.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
		}

		// Add relatedTarget, if necessary
		if ( !this.relatedTarget && src.formElement ) {
			this.relatedTarget = src.fromElement === this.target ? src.toElement : src.formElement;
		}

		// Add which for click: 1 === left; 2 === middle; 3 === right
		// Note: button is not normalized, so don't use it
		var button = src.button;
		if ( !this.which && button !== undefined ) {
			this.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
		}
	}
};

//将event包裹中的对象引用全部清除
kampfer.events.Event.prototype.dispose = function() {
	this.src = null;
	this.target = null;
	this.currentTarget = null;
	this.relatedTarget = null;
};

//判断事件是否为键盘事件
kampfer.events.Event.isKeyEvent = function(type) {
	if( kampfer.type(type) !== 'string' ) {
		type = type.type;
	}
	var reg = /^key/;
	return reg.test(type);
};

//判断事件是否为鼠标事件
kampfer.events.Event.isMouseEvent = function(type) {
	if( kampfer.type(type) !== 'string' ) {
		type = type.type;
	}
	var reg = /^(?:mouse|contextmenu)|click/;
	return reg.test(type);
};


/*
 * 生成handler的一个包裹对象，记录一些额外信息，并且生成一个唯一的key值
 * @param {function}handler
 * @param {string}type
 * @param {object}scope
 */
kampfer.events.Listener = function(listener, eventType, context) {
	this.listener = listener;
	this.eventType = eventType;
	this.context = context;
	this.key = kampfer.events.Listener.key++;
};

//销毁对象中指向其他对象的引用
kampfer.events.Listener.prototype.dispose = function() {
	this.listener = null;
	this.context = null;
};

kampfer.events.Listener.key = 0;


/*
 * 添加事件
 * @param {object}elem
 * @param {string||array}type
 * @param {function}handler
 * @param {object}scope
 * TODO 支持捕获?
 */
kampfer.events.addListener = function(elem, eventType, listener, context) {
	if( !elem || kampfer.type(listener) !== 'function' ) {
		return;
	}

	var type = kampfer.type(eventType);
	if( type === 'array' ) {
		for(var i = 0, e; e = eventType[0]; i++) {
			kampfer.events.addListener(elem, e, listener, context);
		}
		return;
	} else if( type === 'string') {
		var listenerObj = new kampfer.events.Listener(listener, eventType, context);

		var events = kampfer.data.getDataInternal(elem, 'events');
		if(!events) {
			events = {};
			kampfer.data.setDataInternal(elem, 'events', elemData);
		}

		if(!events[eventType]) {
			events[eventType] = [];
		}
		events[eventType].push(listenerObj);
	}
};


/*
 * 删除事件。此方法用于删除绑定在某类事件下的全部操作。
 * @param {object}elem
 * @param {string}type
 * TODO 1.重复调用_data，需要优化
 * 		2.不传递type，就删除所有事件
 */ 
kampfer.events.removeListener = function(elem, eventType, listener) {

};


/*
 * 触发对象的指定事件
 * @param {object}elem
 * @param {type}type
 * @param {object}data
 * TODO 使用fireEvent方法是否支持触发浏览器默认事件，比如点击a标签页面会跳转？
 *		jquery支持，而closure不支持
 */
kampfer.events.dispatchEvent = function(elem, eventType) {

};