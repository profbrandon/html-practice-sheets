
createLib('lazy', lib => {

	lib.expect('lazy', 'comonad', 'fun');

	const [ comonad, fun ] = lib.use('comonad', 'fun');

	/* Lazy a := () -> a */

	/* a => Lazy a */
	const wrap = a => _ => a

	/* Lazy a -> a */
	const extract = l => l({});

	/* (a -> b) -> (Lazy a -> Lazy b) */
	const fmap = f => l => fun.compose(f, l);

	/* Lazy a -> Lazy (Lazy a) */
	const duplicate = wrap; 

	const lazyComonad = comonad.create1(fmap, extract, duplicate);

	return lib.exports(
		lib.exp(wrap,		'wrap'),
		lib.exL(lazyComonad, 	'comonad', 'com')
	);
});
