
createLib('monadFail', lib => {

// Monad Fail Instance Creation
	const create = (baseMonad, zero) => {

		const bm = lib.qualify(baseMonad, {
			produce: 'produce',
			bind:    'bind',
			seq:     'seq'
		});

		const guard = b => b ? bm.produce({}) : zero;

		const filter = (condx, mx) => 
			bm.bind(
				mx, 
				x => bm.seq(
					guard(condx), 
					bm.produce(x)));

		const seqF = (...values) => 
			(values.length === 0) ? zero : bm.seq(...values)

		return lib.exports(
			lib.exL(baseMonad),
			lib.exp(zero,		'zero', 'fail'),
			lib.exp(guard,		'guard'),
			lib.exp(filter,		'filter'),
			lib.exp(seqF,		'seq')
		);
	}


// Library
	return lib.exports(
		lib.exp(create,		'create')
	);
});
