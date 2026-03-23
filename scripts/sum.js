
createLib('sum', lib => {

// Constructors
	const left = a => Object.freeze({
		__proto__: null,
	
		left: a
	});

	const right = b => Object.freeze({
		__proto__: null,

		right: b
	});


// Destructor
	const match = s => (onLeft, onRight) => {
		if (s['left'] != undefined)
			return onLeft(s.left);
		else if (s['right'] != undefined)
			return onRight(s.right);
		else
			return undefined;
	};


// Aux
	const fmapL = f => s => 
		match(s)(
			a => f(a), 
			b => b
		);

	const fmapR = g => s => 
		match(s)(
			a => a, 
			b => g(b)
		);


// Library
	return lib.exports(
		lib.exp(left, 	'left', 'inl'),
		lib.exp(right, 	'right', 'inr'),
		lib.exp(match,	'match', 'destroy'),
		lib.exp(fmapL,  'fmapL'),
		lib.exp(fmapR,  'fmapR')
	);
})
