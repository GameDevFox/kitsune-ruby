import _ from "lodash";

export function whereClause(obj) {
	let sql = "";
	let args = [];

	_.each(obj, function(value, name) {
		if(sql.length === 0)
			sql += " WHERE ";
		else
			sql += "AND ";

		if(_.isArray(value)) {
			sql += `${name} IN (${qMarks(value)}) `;
			args = args.concat(value);
		} else {
			sql += `${name} = ? `;
			args.push(value);
		}
	});

	return { sql, args };
}

export function qMarks(count) {
	if(_.isArray(count))
		count = count.length;

	var result = "";
	for(var i=0; i<count; i++) {
		result += "?";
		if(i<count-1)
			result += ", ";
	}
	return result;
}

export function buildQuery({ query, args }) {
	var otherArgs = [];
	var parsedArgs = _.mapValues(args, (value) => {
		if(_.isPlainObject(value)) {
			// Some recursive treatment here
			var finalQuery = buildQuery(value);
			otherArgs.push(finalQuery.args);
			return finalQuery.query;
		} else if(_.isArray(value)) {
			otherArgs.push(value);
			return qMarks(value);
		} else {
			// Oops...
			throw new Error(`Expected Object or Array, got [${typeof value}]: ` + value);
		}
	});

	let finalQuery = _.template(query)(parsedArgs);
	var finalArgs = _.flatten(otherArgs);

	var queryAndArgs = {
		query: finalQuery,
		args: finalArgs
	};

	return queryAndArgs;
}

export function queryBuilder(initial) {
	let op = function(query) {
		let finalArgs = { nodes: {
			query: this.query,
			args: this.args
		}};
		var result = {
			op,
			query: query,
			args: this.init ? { nodes: this.init } : finalArgs
		};
		return result;
	};

	var result = {
		op,
		init: _.isArray(initial) ? initial : { query: initial }
	};

	return result;
}