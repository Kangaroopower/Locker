// mapper should return an array of [{key:'somekey', value:'somevalue'}]
// reducer should return a single {key:'somekey', value:'somevalue'}
function isArray 
function mapReduce(i, mapper, reducer, property) {
	var intermediate = [], output = [], value, groups, values;
 
	if(i &&  Object.prototype.toString.call(i) === "[object Array]")	{
		for(var x = 0; x < i.length; x++) {
			value = i[x][property], key = property;
			intermediate = intermediate.concat(mapper(key, value));
		}
	} else {
		for (var key in i) {
			value = i[key];
			intermediate = intermediate.concat(mapper(key, value));
		}
	}
 
	groups = groupBy(intermediate);
 
	for (var key in groups) {
		values = groups[key];
		output.push(reducer(key, values));
	}
 
	return output;
}
 
// list should be [{key:k, value:v}, ....] where key may be repeated.
// returns [{key, [v1, v2, v3...]}, ...] where key is *not* repeated.
function groupBy(list) {
	var ret = {}, key, value;
	for (var i = 0; i < list.length; i++) {
		key = list[i].key;
		value = list[i].value;
		if (!ret[key]) {
			ret[key] = [];
		}
 
		ret[key].push(value);
	}
	return ret;
}


/*** CUSTOM ***/
// Random data set -- could come from anywhere.
var data = [
	{Country: "US", Type:"B", ProductCode: "001"},
	{Country: "US", Type:"B",  ProductCode: "001.A"},
	{Country: "US", Type:"Z",  ProductCode: "001.B"},
	{Country: "UK", Type:"A",  ProductCode: "002"},
	{Country: "US", Type:"Z",  ProductCode: "003"},
	{Country: "FR", Type:"B",  ProductCode: "003.A"},
	{Country: "DE", Type:"B",  ProductCode: "003.C"},
	{Country: "DE", Type:"T",  ProductCode: "004"},
	{Country: "UK", Type:"R",  ProductCode: "004.R"},
	{Country: "UK", Type:"B",  ProductCode: "005"}
];
 
// Custom mapper
function _map(key, value) {
	var result = [];
 
	result.push({key:value, value:1});
 
	return result;
}
 
// Custom reducer
function _reduce(key, values) {
	var sum = 0;
 
	for(var i = 0; i < values.length; i++) {
		sum += values[i];
	}
 
	return {key: key, value: sum};
}

/*** EXAMPLE ***/

// Basic "group by - count"
var out = mapReduce(data, _map, _reduce, "Country");



/*** RETURNS ***/
[{"key":"US","value":4},
{"key":"UK","value":3},
{"key":"FR","value":1},
{"key":"DE","value":2}]