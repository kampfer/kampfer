/*global kampfer*/

/**
 * 为对象管理数据
 * @module data
 * https://github.com/jquery/jquery/blob/master/src/data.js
 */

kampfer.require('browser.support');

kampfer.provide('data');

//kampfer的数据缓存
kampfer.data.cache = {};

//用于标记缓存的id
kampfer.data.cacheId = 0;

//不能设置自定义属性的HTML tag名单
kampfer.data.noData = {
	"embed": true,
	//object标签的clsid为以下值时可以设置自定义属性,
	//其他情况object也不能设置自定义属性
	"object": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
	"applet": true
};

/*
 * 判断对象是否能够设置自定义属性。所有plain object都能设置自定义属性，
 * 而html dom中：embed/applet无法设置，obeject只有当clsid为特定值时可以设置。
 * @param {object||html dom}obj
 * @return {boolean}
 */
kampfer.data.acceptData = function(obj) {
	if( elem.nodeName ) {
		var match = kampfer.data.noData[ elem.nodeName.toLowerCase() ];
		if( match ) {
			return !(match === true || elem.getAttribute('classid') !== match);
		}
	}
	return true;
};

/*
 * 判断数据对象是否为空。必须区分两种情况：
 * 1。用户的数据对象 所有用户的数据都储存在数据对象的data属性中。
 * 2。kampfer的数据对象 kampfer的数据会被直接储存在数据对象中。
 * @param {plain object}obj 这个对象一般取自kampfer.data.cache[expando]
 *	或者elem[expando]
 * @return {boolean}
 */
kampfer.data.isEmptyDataObj = function(obj) {
	for(var name in obj) {
		//检查用户定义的data（即cache.data）
		if( name === 'data' && kampfer.isEmptyObject(obj[name]) ) {
			continue;
		}
		if( name !== 'toJSON' ) {
			return false;
		}
	}
	return true;
};

//判断对象是否储存了数据。此方法先取到elem的数据对象，
//再调用kampfer.data.isEmptyDataObj判断对象是否为空
kampfer.data.hasData = function(elem) {
	elem = elem.nodeType ? 
		kampfer.data.cache[ elem[kampfer.expando] ] :
		elem[kampfer.expando];
	return !!elem && !kampfer.data.isEmptyDataObj(elem);
};

kampfer.data.setData = function(elem, name, value, inInternal) {
	if( !kampfer.data.acceptData(elem) || !kampfer.type(name) !== 'string' ||
		value === undefined ) {
		return;
	}

	var expando = kampfer.expando,
		isNode = !!elem.nodeType,
		cache = isNode ? kampfer.data.cache : elem,
		cacheId = isNode ? elem[expando] : elem[expando] && expando;
};

kampfer.data.getData = function() {

};

kampfer.data.removeData = function() {

};

(function(kampfer) {
	
	function _isEmptyDataObj(obj) {
		for(var name in obj) {
			//检查用户定义的data（即cache.data）
			if( name === 'data' && kampfer.isEmptyObject(obj[name]) ) {
				continue;
			}
			if( name !== 'toJSON' ) {
				return false;
			}
		}
		return true;
	}

	kampfer.dataManager = {
		
		cache : {},
			
		cacheId  : 0,
		
		// The following elements throw uncatchable exceptions if you
		// attempt to add expando properties to them.
		noData : {
			"embed": true,
			// Ban all objects except for Flash (which handle expandos)
			"object": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
			"applet": true
		},
		
		isEmptyDataObj : function(obj) {
			for(var name in obj) {
				//检查用户定义的data（即cache.data）
				if( name === 'data' && kampfer.isEmptyObject(obj[name]) ) {
					continue;
				}
				if( name !== 'toJSON' ) {
					return false;
				}
			}
			return true;
		},
		
		//判断是否已经有储存数据
		hasData : function( elem ) {
			elem = elem.nodeType ? 
				kampfer.dataManager.cache[ elem[kampfer.expando] ] :
				elem[kampfer.expando];
			return !!elem && !_isEmptyDataObj(elem);
		},
		
		//判断是否能够储存数据
		acceptData : function( elem ) {
			// 判断DOM元素
			if( elem.nodeName ) {
				var match = kampfer.dataManager.noData[ elem.nodeName.toLowerCase() ];
				if( match ) {
					return !(match === true || elem.getAttribute('classid') !== match);
				}
			}
			return true;
		},
		
		//读取、储存数据
		//当对象还没有缓存过数据时，会创建并返回新的缓存对象。
		data : function( elem, name, value, inInternal ) {
			
			if( !kampfer.dataManager.acceptData( elem ) ) {
				return;
			}
			
			var expando = kampfer.expando,
				isNode = !!elem.nodeType,
				getByName = typeof name === 'string',
				cache = isNode ? kampfer.dataManager.cache : elem,
				cacheId = isNode ? elem[expando] : elem[expando] && expando,
				ret, thisCache;
			
			// 尝试读取未储存数据的DOM对象
			if( (!cacheId || !cache[cacheId]) && getByName && value === undefined ) {
				return;
			}
			
			if( !cacheId ) {
				if(isNode) {
					elem[expando] = cacheId = ++kampfer.dataManager.cacheId;
				}else{
					cacheId = kampfer.expando;
				}
			}
			
			if( !cache[cacheId] ) {
				cache[cacheId] = {};
				// Avoids exposing metadata on plain JS objects when the object
				// is serialized using JSON.stringify
				if ( !isNode ) {
					cache[cacheId].toJSON = kampfer.emptyFn;
				}
			}
			
			thisCache = cache[cacheId];
			
			if( typeof name === 'object' ) {
				if( !inInternal ) {
					thisCache.data = kampfer.extend( thisCache.data, name );
				} else {
					thisCache = kampfer.extend( thisCache, name );
				}
			}
			
			// 用户调用data方法时，数据存储在thisCache.data中
			// 避免用户定义的数据与kampfer内部定义的数据冲突
			if( !inInternal ) {
				if( !thisCache.data ) {
					thisCache.data = {};
				}
				thisCache = thisCache.data;
			}
			
			//@TODO 对name进行处理（camelCase）
			if( value !== undefined ) {
				thisCache[name] = value;
			}
			
			//@TODO 对name进行处理（camelCase）
			if( getByName ) {
				ret = thisCache[name];
			} else {
				ret = thisCache;
			}
			
			return ret;
			
		},
		
		removeData : function( elem, name, inInternal ) {
			
			if( !kampfer.dataManager.acceptData( elem ) ) {
				return;
			}
			
			var expando = kampfer.expando,
				isNode = !!elem.nodeType,
				cacheId = isNode ? elem[expando] : elem[expando] && expando,
				cache = isNode ? kampfer.dataManager.cache : elem,
				thisCache;
				
			if( !cache[cacheId] ) {
				return;
			}
			
			if( name ) {
				thisCache = inInternal ? cache[cacheId] : cache[cacheId].data;
				if( thisCache ) {
					if( !kampfer.isArray(name) ) {
						if( name in thisCache ) {
							name = [name];
						}
					}
					for( var i = 0, l = name.length; i < l; i++ ) {
						delete thisCache[name[i]];
					}
					if( !_isEmptyDataObj( thisCache ) ) {
						return;
					}
				}
			}
			
			if( !inInternal ) {
				delete cache[cacheId].data;
				if( !_isEmptyDataObj( cache[cacheId] ) ) {
					return;
				}
			}
			
			// Browsers that fail expando deletion also refuse to delete expandos on
			// the window, but it will allow it on all other JS objects; other browsers
			// don't care
			if ( kampfer.browser.support.deleteExpando || !cache.setInterval ) {
				delete cache[cacheId];
			} else {
				cache[cacheId] = null;
			}
			
			if(isNode) {
				// IE does not allow us to delete expando properties from nodes,
				// nor does it have a removeAttribute function on Document nodes;
				// we must handle all of these cases
				if ( kampfer.browser.support.deleteExpando ) {
					delete elem[ expando ];
				} else if ( elem.removeAttribute ) {
					elem.removeAttribute( expando );
				} else {
					elem[ expando ] = null;
				}
			}
			
		},
		
		_data : function( elem, name, value ) {
			return kampfer.dataManager.data( elem, name, value, true );
		},
		
		_removeData : function( elem, name ) {
			return kampfer.dataManager.removeData( elem, name, true );
		}
		
	};

})(kampfer);