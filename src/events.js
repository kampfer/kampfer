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
kampfer.events.Event = function(src, props) {
	var srcType = kampfer.type(src);

	if(srcType === 'object' && src.type) {
		this.src = src;
		this.type = src.type;
	} else if(srcType === 'string') {
		this.type = src;
	}

	if(kampfer.type(props) === 'object') {
		kampfer.extend(event, props);
	}

	this.isImmediatePropagationStopped = false;
	this.propagationStopped = false;
	this.isDefaultPrevented = false;

	this[kampfer.expando] = true;
};

kampfer.events.Event.prototype = {
	constructor : kampfer.events.Event,

	//停止冒泡
	stopPropagation : function() {
		//触发事件时，需要读取propagationStopped，判断冒泡是否取消。
		this.propagationStopped = true;

		var e = this.src;
		if(e.stopPropagation) {
			e.stopPropagation();
		} else {
			e.cancelBubble = true;
		}
	},

	//立即停止冒泡
	stopImmediatePropagation : function() {
		this.isImmediatePropagationStopped = true;
	},

	//阻止默认行为
	preventDefault : function() {
		this.isDefaultPrevented = true;
		
		var e = this.src;
		if (e.preventDefault) {
			e.preventDefault();
		} else {
			e.returnValue = false;
		}
	},

	dispose : function() {
		delete this.src;
	}
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
 * 修复event,处理兼容性问题
 * @param {object}event 浏览器生成的原始event对象
 * @return {object} 修复的event对象
 */
kampfer.events.fixEvent = function(event) {
	var oriEvent = event;

	if( event[kampfer.expando] ) {
		return event;
	} else {
		event = new kampfer.events.Event(oriEvent);
	}

	event.target = oriEvent.target || oriEvent.srcElement;

	return event;
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
 * @param {string||array}eventType
 * @param {function}listener
 * @param {object}context
 */
kampfer.events.addListener = function(elem, eventType, listener, context) {
	// filter commet and text node
	// nor undefined eventType or listener
	if( elem.nodeType === 3 || elem.nodeType === 8 || !eventType ||
		kampfer.type(listener) !== 'function' ) {
		return;
	}

	var type = kampfer.type(eventType);

	if( type === 'array' ) {
		for(var i = 0, e; e = eventType[i]; i++) {
			kampfer.events.addListener(elem, e, listener, context);
		}
		return;
	}

	if( type === 'string') {
		var listenerObj = new kampfer.events.Listener(listener, eventType, context || elem);

		var events = kampfer.data.getDataInternal(elem, 'events');
		if(!events) {
			events = {};
			kampfer.data.setDataInternal(elem, 'events', events);
		}

		if(!events.proxy) {
			events.proxy = function(e) {
				if(kampfer.events.triggered !== e.type) {
					return kampfer.events.dispatchEvent.apply(arguments.callee.elem, arguments);
				}
			};
			events.proxy.elem = elem;
		}

		if(elem.addEventListener) {
			elem.addEventListener(eventType, events.proxy, 'false');
		} else if(elem.attachEvent) {
			elem.attachEvent('on' + eventType, events.proxy);
		}

		if(!events.listeners) {
			events.listeners = {};
		}

		if(!events.listeners[eventType]) {
			events.listeners[eventType] = [];
		}
		events.listeners[eventType].push(listenerObj);
	}

	// fix ie memory leak
	elem = null;
};


/*
 * 删除事件。此方法用于删除绑定在某类事件下的全部操作。
 * @param {object}elem
 * @param {string}eventType
 */ 
kampfer.events.removeListener = function(elem, eventType, listener) {
	var events = kampfer.data.getDataInternal(elem, 'events');

	if( !events || !events.listeners || !events.listeners[eventType]  ) {
		return;
	}

	var type = kampfer.type(eventType);

	if(type === 'array') {
		for(var i = 0; type = eventType[0]; i++) {
			kampfer.events.removeListener(elem, type, listener);
		}
		return;
	}

	if(type === 'undefined') {
		for(type in events) {
			kampfer.events.removeListener(elem, type, listener);
		}
		return;
	}

	if(type === 'string') {
		for(var i = 0, l; l = events.listeners[eventType][i]; i++) {
			if( !listener || (l.eventType === eventType && l.listener === listener) ) {
				// 注意splice会改变数组长度以及元素对应的下标
				events.listeners[eventType].splice(i--, 1);
			}
		}

		if(!events.listeners[eventType].length) {
			if(elem.removeEventListener) {
				elem.removeEventListener(eventType, events.proxy, false);
			} else if(elem.detachEvent) {
				elem.detachEvent('on' + eventType, events.proxy);
			}
			delete events.listeners[eventType];
		}

		if( kampfer.isEmptyObject(events.listeners) ) {
			delete events.listeners;
			delete events.proxy;
			kampfer.data.removeDataInternal(elem, 'events');
		}
	}

};


/*
 * 触发对象的指定事件
 * @param {object}elem
 * @param {type}type
 */
kampfer.events.dispatch = function(elem, eventType) {
	if(elem.nodeType === 3 || elem.nodeType === 8 || !eventType) {
		return;
	}

	var type = kampfer.type(eventType),
		args = Array.prototype.slice.call(arguments);

	//一次触发多个事件
	if(type === 'array') {
		for(var i = 0, e; e = eventType[i]; i++) {
			args[1] = e;
			kampfer.events.dispatch.apply(null, args);
		}
		return;
	}

	if(type !== 'string') {
		return;
	}

	var event = new kampfer.events.Event(eventType),
		bubblePath = [],
		onType = 'on' + eventType;

	args = Array.prototype.slice.call(arguments, 2);
	args.unshift(event);

	// event.target始终指向事件的起点对象
	if(!event.target) {
		event.target = elem;
	}

	//建立冒泡的dom树路径
	for(var cur = elem; cur; cur = cur.parentNode) {
		bubblePath.push(cur);
	}
	//冒泡的最后一站始终是window对象
	if( cur === (elem.ownerDocument || document) ) {
		bubblePath.push(elem.defaultView || elem.parentWindow || window);
	}

	for(i = 0; cur = bubblePath[i]; i++) {

		var eventsObj = kampfer.data.getDataInternal(cur, 'events');

		if( !eventsObj || !eventsObj.listeners[eventType] ) {
			continue;
		}

		// 冒泡的每一阶段currentTarget都不同
		event.currentTarget = cur;

		// 执行kampfer绑定的事件处理函数
		var proxy = eventsObj.proxy;
		proxy.apply(cur, args);

		// 执行使用行内方式绑定的事件处理函数
		proxy = cur[onType];
		if(proxy && proxy.apply(cur, args) === false) {
			event.preventDefault();
		}

		// 触发浏览器default action
		if(!event.isDefaultPrevented && !kampfer.isWindow(elem) && elem[eventType]) {
			var old = elem[onType];
			if(old) {
				elem[onType] = null;
			}

			kampfer.events.triggered = eventType;
			try {
				elem[eventType]();
			} catch(e) {}
			delete kampfer.events.triggered;

			if(old) {
				elem[onType] = old;
			}
		}
	}
};


/**
 * 正确的将一个事件派发给所有相关对象
 */
kampfer.events.dispatchEvent = function(event) {
	event = kampfer.events.fixEvent(event);

	// ie6/7/8不支持event.currentTarget 于是无法使用解决this的问题
	var eventsObj = kampfer.data.getDataInternal(this, 'events'),
		listeners = eventsObj && eventsObj.listeners[event.type],
		args = Array.prototype.slice.call(arguments);

	if(!listeners) {
		return;
	}

	event.currentTarget = this;

	for(var i = 0, l; l = listeners[i]; i++) {
		event.result = l.listener.apply(l.context, args);
		if(event.result === false) {
			event.preventDefault();
			event.stopPropagation();
		}
		if(event.isImmediatePropagationStopped) {
			break;
		}
	}

	return event.result;
};