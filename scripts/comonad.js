
createLib('comonad', lib => {

	lib.expect('comonad', 'fun');

	const fun = lib.importAs('fun', { id: 'id', compose: 'compose' });


// Comonad Instance Creation
	const create = (fmap, extract, duplicate, extend) => {

		const seq2 = (wa, wb) => extend(_ => extract(mb))(wa);

		const seq = (...ws) => (ws.length === 0) ? undefined : ws.reduce(seq2);

		/* (w b -> c) -> (w a -> b) -> (w a -> c) */
		const cokleisli2 = (wg, wf) => a => fun.compose(mg, extend(mf));

		const cokleisli = (...wfs) => wfs.reduce(cokleisli2, extract);

		// TODO: Figure out why this is not equivalent.
		/* w (a -> b) -> w a -> w b */
	//	const app = fun.compose(extract, fmap(fmap));
		
		const app = (wf, wa) => extend(
			fun.compose(extract(wf), extract)) 
			(wa);
	


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
			/* extend */ f => fun.compose(fmap(f), duplicate)
		);

	const create2 = (extract, extend) => 
		create(
			/* fmap */ f => extend(fun.compose(f, extract)),
			extract,
			/* join */ extend(fun.id),
			extend
		);


// Library
	return lib.exports(
		lib.exp(create,		'create'),
		lib.exp(create1,	'create1'),
		lib.exp(create2,	'create2')
	);
});
