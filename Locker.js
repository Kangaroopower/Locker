(function (w, ns) {
	
	/*** LOCKER STORAGE FUNCTIONS ***/

	/** Storage type creation functions **/
	var store = {};

	ns.store = function(key, val, type) {
		if (typeof type === "undefined") {
			type = fallback();
		}

		var act = {
			store: function () {
				return store[type](key, val);
			},
			get: function () {
				return store[type](key, null, 'get');
			},
			remove: function () {
				return store[type](key, null, 'remove');
			},
			removeAll: function (onlyprefixed) {
				var name;
				if (onlyprefixed === true) {
					for (name in w.localStorage) {
						if (-1 !== name.indexOf(/^__locker__/)) {
							store[type](name , null, 'remove');
						}
					}
				} else {
					for (name in w.localStorage) {
						store[type](name , null, 'remove');
					}
				}
			},
			storeObj: function () {
				if (typeof JSON !== "function" && JSON.stringify) {
					return store[type](key, JSON.stringify(val));
				} else {
					return false;
				}
			},
			getObj: function () {
				if (typeof JSON === "function" && JSON.parse) {
					return JSON.parse(store[type](key, null, 'get'));
				} else {
					return false;
				}
			}
		};
		return act;
	};

	store.addType = function(type, storage, prio) {
		store[type] = storage;
		store.prios[prio] = type;
	};

	//Annoying helper function to see what version IE is
	function IEVersion () {
		var rv = false;
		if (navigator.appName == 'Microsoft Internet Explorer') {
			var ua = navigator.userAgent, re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
			if (re.exec(ua) != null) {
				if(parseFloat( RegExp.$1 ) >= 5 && parseFloat( RegExp.$1 ) < 8) {
					rv = true;
				}
			}
		}
		return rv;
	}

	//Creates the best storage type to use if none can be found
	function fallback () {
		var res;
		for (var x in store.prios) {
			if (store.prios[x] === 2) {
				for (var i in store.prios[2]) {
					if (typeof w[store.prios[2][i]] !== "undefined") {
						res = store.prios[2][i];
					}
				}
			} else if (store.prios[x] === 1) {
				//Has to be hardcoded because userData isn't a global
				if (IEVersion() === true) {
					res = "userData";
				} else if (typeof window["globalStorage"] !== "undefined") {
					res = "globalStorage";
				}
			} else {
				res = "memory";
			}
		}
		return res;
	}

	//Easy interface for creating some storage types
	function createStorageType(storageType, storage, prio) {
		prio = prio ? prio : -1;
		store.addType(storageType, function(key, value, type) {
			var ret = value;

			// protect against name collisions with direct storage
			if (!key.test(/^__locker__/)) {
				key = "__locker__" + key;
			}

			if (type === 'get') {
				return storage.getItem(key);
			} else if (type === 'remove') {
				storage.removeItem(key);
				return true;
			} else {
				storage.setItem(key, value);
			}

			return ret;
		}, prio);
	}

	(function (w, store) {

		// localStorage + sessionStorage- present on all modern browsers
		for (var type in { 'localStorage': 1, 'sessionStorage': 1 }) {
			// try/catch for file protocol in Firefox and Private Browsing in Safari 5
			try {
				// Safari 5 in Private Browsing exposes localStorage but doesn't allow storing data
				// so we attempt storing and removing items
				var randnum = Math.Random();
				w[type].setItem("__locker"+ randnum +"__", "x");
				w[type].removeItem("__locker"+ randnum +"__");
				if (type === "localStorage") {
					createStorageType(type, w[type], 2);
				} else {
					createStorageType(type, w[type]);
				}
			} catch(e) {}
		}

		// globalStorage- non-standard: Firefox 2+
		if (typeof w.localStorage === "undefined" && w.globalStorage) {
			// try/catch for file protocol in Firefox
			try {
				createStorageType("globalStorage", w.globalStorage[w.location.hostname], 1);
				// Default to globalStorage in Firefox 2.0 and 3.0
				if (store.type === "sessionStorage") {
					store.type = "globalStorage";
				}
			} catch(e) {}
		}

		//Don't use if localStorage exists
		if (typeof w.localStorage !== "undefined") {

			//Create an element to store userData with
			var div = document.createElement( "div" ), attrKey = "locker";
			div.style.display = "none";
			document.getElementsByTagName( "head" )[ 0 ].appendChild( div );

			// you can't feature detect userData so you need to load it and see if it breaks
			try {
				div.addBehavior( "#default#userdata" );
				div.load( attrKey );
			} catch( e ) {
				div.parentNode.removeChild( div );
				return;
			}

			//It works, now let's create userdata
			store.addType( "userData", function( key, value, type ) {
				div.load( attrKey );
				var attr, ret = value;

				if ( !key ) {
					var i = 0;
					ret = {};
					while ( attr = div.XMLDocument.documentElement.attributes[ i++ ] ) {
						ret[ attr.name ] = attr.value;
					}
					div.save( attrKey );
					return ret;
				}

				// convert invalid characters to dashes- http://www.w3.org/TR/REC-xml/#NT-Name
				// and remove colon
				key = key.replace( /[^\-._0-9A-Za-z\xb7\xc0-\xd6\xd8-\xf6\xf8-\u037d\u037f-\u1fff\u200c-\u200d\u203f\u2040\u2070-\u218f]/g, "-" );
				key = key.replace( /^-/, "_-" );

				//Create the API for storing, getting and removing data
				if ( type === 'get' ) {
					attr = div.getAttribute( key );
					return attr;
				} else if ( type === 'remove' ) {
					div.removeAttribute( key );
					return true;
				} else {
					div.setAttribute( key, value );
				}

				div.save( attrKey );
				return ret;
			}, 1);
		}

		store.addType( "memory", function( key, value, type ) {
			var ret = value, memory = {};

			if ( type === 'get' ) {
				return memory[key];
			} else if (type === 'remove') {
				delete memory[ key ];
				return true;
			} else {
				memory[key] = value;
			}

			return ret;
		});

	})(window, store);


	/*** LOCKER SORTING FUNCTIONS ***/

	//Compares two numbers to see which one is larger 
	function compare(a, b) {
		if (a > b) {
			return 1;
		} else if (a === b) {
			return 0;
		} else {
			return -1;
		}
	}
	
	//Creates and returns a randomly generated array of integers or strings
	function randomArray(size, range, str) {
		var data = [];
		if (typeof size !== "number" || size < 1) {
			size = 1000;
		}
		if (typeof range !== "number" || range < 1) {
			range = 10000;
		}
		var i = -1;
		while (++i < size) {
			data[i] = Math.floor(Math.random() * range + 1);
		}
		if (str) {
			i = -1;
			while (++i < size) {
				data[i] = "" + data[i];
			}
		}
		return data;
	}
	
	//Core logic behind merge sort
	function merge(left, right){
		var result  = [],
			il = 0,
			ir = 0;

		while (il < left.length && ir < right.length){
			if (left[il] < right[ir]){
				result.push(left[il++]);
			} else {
				result.push(right[ir++]);
			}
		}

		return result.concat(left.slice(il)).concat(right.slice(ir));
	}

	//Sorts an array with merge sort.
	function mergeSort(items){
		if (items.length < 2) {
			return items;
		}

		var middle = Math.floor(items.length / 2),
			left = items.slice(0, middle),
			right = items.slice(middle);

		return merge(mergeSort(left), mergeSort(right));
	}

	//Swap Helper function
	function swap(items, firstIndex, secondIndex){
		var temp = items[firstIndex];
		items[firstIndex] = items[secondIndex];
		items[secondIndex] = temp;
	}
 
	//Sorts an array with bubbleSort
	function bubbleSort(input) {
		for (var i = input.length; i > 0; i--){
			for (var j = input.length-i; j >= 0; j--){
				if (input[j] < input[j-1]){
					swap(input, j, j-1);
				}
			}
		}
		
		return input;
	}

	//Sort an array with quickSort
	function partition (data, left, right) {

		var pivot = data[Math.ceil((right + left) / 2)],  i = left, j = right;

		while (i <= j) {

			while (data[i] < pivot) {
				i++;
			}

			while (data[j] > pivot) {
				j--;
			}

			if (i <= j) {
				swap(data, i, j);

				// change indices to continue loop
				i++;
				j--;
			}
		}

		// this value is necessary for recursion
		return i;
	}

	function quickSort (data) {
		if (data.length > 1) {
			var index, left = 0, right = data.length -1;
			
			index = partition(data, left, right);

			// if the returned index
			if (left < index - 1) {
				quickSort(data, left, index - 1);
			}

			if (index < right) {
				quickSort(data, index + 1, right);
			}

		}

		return data;
	}

	//creates linkedList
	function linkedList () {
		this.list = null;
		this.size = 0;
	}

	//adds something to a linkedList
	linkedList.prototype.add = function (stuff) {
		var obj = {
			data: stuff,
			prev: null,
			next: null
		};
		if (this.list == null) {
			this.list = obj;
		} else {
			var current = this.list;
			while (current.next) {
				current = current.next;
			}
			obj.prev = current;
			current.next = obj;

		}
		this.size++;
	};

	//find an object in a linkedList from an index
	linkedList.prototype.item = function (index) {
		if (index > -1 && index < this.size) {
			var current = this.list, i = 0;
			while (i < index) {
				current = current.next;
				i++;
			}
			return current.data;
		} else {
			return null;
		}
	};

	//remove an object in a linkedList from an index
	linkedList.prototype.remove = function (index) {
		var res;
		if (index > -1 && index < this.size){
				var current = this.list, i = 0;

				if (index === 0){
					this.size = current.next;
				} else {
					while(i < index){
						current = current.next;	
						i++;
					}
					current.prev.next = current.next;
				}
			
				this.size--;

				res = current.data;			
			} else {
				res = null;
			}
		return res;
	};

	//create an array out of a linked list
	linkedList.prototype.toArray = function () {
		var res =  [], current = this.list;

		while(current) {
			res.push(current.data);
			current = current.next;
		}
		return res;
	};

	//a string representation of the array of a linkedList
	linkedList.prototype.toString = function () {
		return this.toArray().toString();
	};

	// expose public members
	ns.compare = compare;
	ns.mergeSort = mergeSort;
	ns.randomArray = randomArray;
	ns.bubbleSort = bubbleSort;
	ns.quickSort = quickSort;
	ns.linkedList = linkedList;

	//Take over Locker namespace as well
	window.Locker = ns;
})(window, window.locker = window.locker || {});