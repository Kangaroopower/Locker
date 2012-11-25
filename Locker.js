(function (w, ns) {
	
	/*** LOCKER STORAGE FUNCTIONS ***/

	/** Storage type creation functions **/
	var rPrefix = /^__locker__/, store = {};
	ns.store = function(key, info) {
		var type = store.type.name;
		if (type == null) {
			checkNext(key, info, type.prio);
		}

		var act = {
			store: function () {
				return store.types[type].value(key, info);
			},
			get: function () {
				return store.types[type].value(key, null, 'get');
			},
			remove: function () {
				return store.types[type].value(key, null, 'remove');
			},
			removeAll: function (onlyprefixed) {
				var name;
				if (onlyprefixed === true) {
					for (name in w.localStorage) {
						if (-1 !== name.indexOf(rPrefix)) {
							store.types[type].value(name , null, 'remove');
						}
					}
				} else {
					for (name in w.localStorage) {
						store.types[type].value(name , null, 'remove');
					}
				}
			},
			storeObj: function () {
				if (typeof JSON != undefined && JSON.stringify) {
					return store.types[type].value(key, JSON.stringify(info));
				} else {
					return false;
				}
			},
			getObj: function () {
				if (typeof JSON != undefined && JSON.parse) {
					return JSON.parse(store.types[type].value(key, null, 'get'));
				} else {
					return false;
				}
			}
		};
		return act;
	};

	store.types = {};
	store.type = {
		name: null,
		prio: -1
	};
	store.addType = function(type, storage, priority) {
		if (!store.type.name || (priority && priority > store.type.prio)) {
			store.type = {
				type: type,
				prio: priority
			};
		}

		store.types[type] = {
			value: storage,
			prio: priority
		};
		store[type] = function(key, value) {
			return ns.store(key, value, type);
		};
	};

	function checkNext (key, value, prio) {
		for (var i in store.types) {
			if (store.types[i].prio === --prio) {
				ns.store(key, value, store.types[i].name);
			}
		}
	}

	function createStorageType(storageType, storage, prio) {
		store.addType(storageType, function(key, value, type) {
			var ret = value;

			// protect against name collisions with direct storage
			key = "__locker__" + key;

			if (type === 'get') {
				return storage.getItem(key);
			} else if (type === 'remove') {
				storage.removeItem(key);
			} else {
				try {
					storage.setItem(key, value);
					// quota exceeded
				} catch(error) {
					// expire old data and try again
					store[storageType]();
					try {
						storage.setItem(key, value);
					} catch(err) {
						throw "locker store quota exceeded";
					}
				}
			}

			return ret;
		}, prio);
	}

	// localStorage + sessionStorage- present on all modern browsers
	for (var type in { 'localStorage': 1, 'sessionStorage': 1 }) {
		// try/catch for file protocol in Firefox and Private Browsing in Safari 5
		try {
			// Safari 5 in Private Browsing exposes localStorage but doesn't allow storing data
			// so we attempt storing and removing items
			var randnum = Math.Random();
			w[type].setItem("__locker"+ randnum +"__", "x");
			w[type].removeItem("__locker"+ randnum +"__");
			createStorageType(type, w[type], 1);
		} catch(e) {}
	}

	// globalStorage- non-standard: Firefox 2+
	if (!store.types.localStorage && w.globalStorage) {
		// try/catch for file protocol in Firefox
		try {
			createStorageType("globalStorage", w.globalStorage[w.location.hostname], 0);
			// Default to globalStorage in Firefox 2.0 and 3.0
			if (store.type === "sessionStorage") {
				store.type = "globalStorage";
			}
		} catch(e) {}
	}


	/*** LOCKER SORTING FUNCTIONS ***/

	//Compares two numbers to see which one's larger 
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

	// expose public members
	ns.compare = comparator;
	ns.sort = mergeSort;
	ns.randomArray = randomArray;
})(window, window.Locker = window.Locker || {version: '1.0 Alpha'});