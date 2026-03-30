
const createLib = (() => {

	let libraries = Object.create(null);

	const expect = (dependentName, ...dependencyNames) => {
	
		let unknowns = [];
		
		dependencyNames.forEach(
			dependencyName => {
				if (libraries[dependencyName] == undefined)
					unknowns.push(dependencyName);
			});

		if (unknowns.length != 0)
			throw `${dependentName} library requires the dependenc${unknowns.length === 1 ? 'y' : 'ies'} ${unknowns.reduce((a, b) => a + ', ' + b)}.`;
	}

	const qualify = (lib, fields) => {
		let obj = Object.create(null);

		Object.getOwnPropertyNames(lib).forEach(
			prop => {
				if (fields[prop] != undefined)
					obj[fields[prop]] = lib[prop]
			});
		
		return Object.freeze(obj);
	}

	const importAs = (libName, fields) => qualify(libraries[libName], fields);

	const importAll = (...libNames) => libNames.map(libName => libraries[libName]);

	const exportAs = (obj, ...aliases) => {
		return Object.freeze({
			__proto__: null,

			obj:     obj,
			aliases: aliases
		});
	}

	const addExports = (libObject, exports) => {
		exports.forEach(
			exp => {
				if (exp instanceof Array)
					addExports(libObject, exp);
				else
					exp.aliases.forEach(
						alias => libObject[alias] = Object.freeze(exp.obj));
			});	
	}

	const createExports = (...exports) => {
		let obj = Object.create(null);
		addExports(obj, exports)
		return Object.freeze(obj);
	}

	const exportLibrary = lib => {
		let exports = [];

		Object.getOwnPropertyNames(lib).forEach(
			prop => exports.push(exportAs(lib[prop], prop)));

		return exports;
	}


// Library
	const exportTools = createExports(
		exportAs(expect, 	'expect'),

		exportAs(qualify,       'qualify',   'rebind'),
		exportAs(importAs, 	'importAs',  'imp'),
		exportAs(importAll,     'importAll', 'use'),
		exportAs(exportAs, 	'exportAs',  'exp'),
		exportAs(exportLibrary, 'exportLib', 'exL'),
		exportAs(createExports, 'exports',   'pack'),
	);

	const createLibrary = (name, libraryFunction) => {
		if (libraryFunction.length != 1)
			throw "The library function callback should accept one parameter.";

		libraries[name] = libraryFunction(exportTools);
	}

	return Object.freeze(createLibrary);
})();
