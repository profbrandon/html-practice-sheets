
createLib('monad', lib => {

// Imports
	lib.expect('monad', 'fun');

	const fun = lib.importAs('fun', { id: 'id' });


// Monad Instance Creation
	const create = (fmap, produce, join, bind) => {

		const seq2 = (ma, mb) => bind(ma, _ => mb);

		const seq = (...ms) => (ms.length === 0) ? undefined : ms.reduce(seq2);

		const kleisli = (mg, mf) => a => bind(mf(a), mg);

		/* m (a -> b) -> m a -> m b */
		const app = (mf, ma) => bind(
			mf, 
			f => bind(
				ma, 
				a => produce(f(a))));

	// Monad Object
		return lib.exports(
			lib.exp(fmap, 		'fmap'),
			lib.exp(produce,	'produce'),
			lib.exp(join,		'join'),
			lib.exp(bind,		'bind'),
			lib.exp(kleisli,	'kleisli', 'k'),
			lib.exp(seq,		'seq'),
			lib.exp(app,		'app')
		);
	};

	const create1 = (fmap, produce, join) => 
		create(
			fmap, 
			produce, 
			join, 
			/* bind */ (ma, mf) => join(fmap(mf)(ma))
		);

	const create2 = (produce, bind) => 
		create(
			/* fmap */ f => ma => bind(ma, a => produce(f(a))),
			produce,
			/* join */ mma => bind(mma, fun.id),
			bind
		);


// Library
	return lib.exports(
		lib.exp(create,		'create'),
		lib.exp(create1,	'create1'),
		lib.exp(create2,	'create2')
	);
});
