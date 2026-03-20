
function pairLib() {

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
	return Object.freeze({
		__proto__: null,

		pair:   pair,
		build:  pair,

		match:  match,
		first:  fst,
		fst:    fst,
		second: snd,
		snd:    snd,

		fmap:   fmap,

		swap:   swap
	});
}
