
function sumLib() {

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
	return Object.freeze({
		__proto__: null,

		left:  left,
		right: right,

		match: match,

		fmapL: fmapL,
		fmapR: fmapR
	});
}
