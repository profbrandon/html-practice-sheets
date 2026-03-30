

createLib('fun', lib => {

// Primitives
	const id = x => x;

	const constant = y => x => y;


// Composition
	const compose2 = (g, f) => x => g(f(x));

	const compose = (...fs) => fs.reduce(compose2, id);

	/* (a -> b) -> (b -> x) -> (a -> x) */
	const pullback = along => f => compose(f, along);

	/* (a -> b) -> (x -> a) -> (x -> b) */
	const pushforward = along => f => compose(along, f);


// Currying
	const curry2 = pf => {
		if (pf.length === 2)
			return x => y => pf(x, y);
		else 
			throw "A function of arity != 2 was given to 'curry2'";
	};

	const uncurry2 = cf => {
		if (cf.length === 1)
			return (x, y) => { 
				const tmp = cf(x);
				if (tmp(x).length === 1)
					return tmp(y);
				else
					throw "A function of arity != 1 was given to 'uncurry2'";
			};
		else
			throw "A function of arity != 1 was given to 'uncurry2'";
	};


// Library
	return lib.exports(
		lib.exp(id,     	'id', 'identity'),
		lib.exp(constant, 	'constant'),

		lib.exp(compose, 	'k', 'compose'),
		lib.exp(pullback,       'pullback', 'contramap'),
		lib.exp(pushforward,    'pushforward', 'fmap'),

		lib.exp(curry2, 	'curry'),
		lib.exp(uncurry2, 	'uncurry'),
	);
});
