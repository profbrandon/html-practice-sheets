
createLib('comonad', lib => {

	lib.expect('comonad', 'fun');

	const fun = lib.importAs('fun', { id: 'id', compose: 'compose' });


// Comonad Instance Creation
	const create = (fmap, extract, duplicate, extend) => {

		const seq2 = (wa, wb) => extend(_ => extract(mb), wa);

		const seq = (...ws) => (ws.length === 0) ? undefined : ws.reduce(seq2);

		/* (w b -> c) -> (w a -> b) -> (w a -> c) */
		const cokleisli = (mg, mf) => a => fun.compose(mg, extend(mf));

		/* w (a -> b) -> w a -> w b */
		const app = (wf, wa) => extend(
			fun.compose(extract(wf), extract), 
			wa);


	// Comonad Object
		return lib.exports(
			lib.exp(fmap, 		'fmap'),
			lib.exp(extract,	'extract'),
			lib.exp(duplicate,	'duplicate'),
			lib.exp(extend,		'extend'),
			lib.exp(cokleisli,	'cokleisli', 'cok'),
			lib.exp(seq,		'seq'),
			lib.exp(app,		'app')
		);
	};

	const create1 = (fmap, extract, duplicate) => 
		create(
			fmap, 
			extract, 
			duplicate, 
			/* extend */ (f, wa) => fmap(f)(duplicate(wa))
		);

	const create2 = (extract, extend) => 
		create(
			/* fmap */ f => wa => extend(fun.compose(f, extract), wa)),
			extract,
			/* join */ wa => extend(fun.id, wa),
			extend
		);


// Library
	return lib.exports(
		lib.exp(create,		'create'),
		lib.exp(create1,	'create1'),
		lib.exp(create2,	'create2')
	);
});
