
createLib('pair', lib => {

// Constructor
	const pair = (a, b) => Object.freeze({
		__proto__: null,

		fst: a,
		snd: b
	});


// Destructor
	const match = p => f => f(p.fst, p.snd);


// Aux
	const fst = p => match(p)((a, b) => a);
	const snd = p => match(p)((a, b) => b);

	const fmap = (f, g) => p => 
		match(p)(
			(a, b) => pair(f(a), g(b))
		);

	const swap = p => match(p)((a, b) => pair.build(b, a));


// Library
	return lib.exports(
		lib.exp(pair,		'pair', 'build'),

		lib.exp(match,		'match', 'destroy'),
		lib.exp(fst,		'fst', 'first'),
		lib.exp(snd,		'snd', 'second'),

		lib.exp(fmap,		'fmap'),
		lib.exp(swap,		'swap')
	);
});
