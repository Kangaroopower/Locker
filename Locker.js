(function (w) {
	/*** BASIC STORAGE ***/
	var rPrefix = /^__locker__/;
	var store = Locker = function(key) {
		var type = store.type.name;
		if (w[type] == undefined) {
			checkNext(key, value, type.prio)
		}

		var act {
			store: function (value) {
				return store.types[type].value(key, value);
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
						if (-1 !== name.indexOf(rPrefix))
							store.types[type].value(name , null, 'remove');
						}
					}
				} else {
					for (name in w.localStorage) {
						store.types[type].value(name , null, 'remove');
					}
				}
			},
			storeObj: function (value) {
				if (typeof JSON != undefined && JSON.stringify) {
					return store.types[type].value(key, JSON.stringify(value));
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
		return store.types[type].value(key, value);
	};

	store.types = {};
	store.type = {
		name: null,
		prio: -1
	}
	store.addType = function(type, storage, priority) {
		if (!store.type.name || priority > store.type.prio) {
			store.type = {
				type: type,
				prio: priority
			}
		}

		store.types[type] = {
			value: storage,
			prio: priority
		} 
		store[type] = function(key, value) {
			return store(key, value, type);
		};
	};

	function checkNext (key, value, prio) {
		for (var i in store.types) {
			var down = prio--;
			if (store.types[i].prio === down) {
				store(key, value, store.types[i].name);
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
					} catch(error) {
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
			createStorageType(webStorageType, w[webStorageType], 1);
		} catch(e) {}
	}

	// globalStorage- non-standard: Firefox 2+
	if (!store.types.localStorage && w.globalStorage) {
		// try/catch for file protocol in Firefox
		try {
			createStorageType("globalStorage", w.globalStorage[w.location.hostname], 1);
			// Default to globalStorage in Firefox 2.0 and 3.0
			if (store.type === "sessionStorage") {
				store.type = "globalStorage";
			}
		} catch(e) {}
	}

	w.Locker = Locker
})(window);