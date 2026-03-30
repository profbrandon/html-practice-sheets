
createLib('sigma', lib => {

	lib.expect('sigma', 'pair', 'sum', 'list');

	const [ pair, sum, list ] = lib.use('pair', 'sum', 'list');


// Finite Sums
	const sigma = props => {

	// Constructor
		const inject = prop => value => {
			let obj = Object.create(null);
			obj[prop] = value;
			return Object.freeze(obj);
		};

	
	// Destructor
		const match = s => dict => {
			const prop = Object.keys(s)[0];
			const func = list.lookup(prop, dict);
			
			if (func == undefined) 
				return s;
			else
				return func(s[prop]);
		};

	
	// Converts to a nested sum
		const asSum = s => {
			const bs = list.foldr(
				list.nil,
				(prop, xs) => {
					if (list.isEmpty(xs)) {
						if (s[prop] != undefined)
							return list.build(true);
						else
							return xs;
					}
					else
						return list.cons(false, xs);	
				}
			)(props);

			return list.foldr(
				Object.values(s)[0], 
				(f, x) => f(x)
			)(list.monad.fmap(b => b ? sum.left : sum.right)(bs));
		};
	
	
	// Aux
		const fmap = (prop, f) => s => match(s)(
			list.monad.fmap(p => pair.build(p, p === prop ? f : x => x))(props)
		);


	// Datatype
		return lib.exports(
			lib.exp(props,	'props'),

			lib.exp(inject,	'inject'),
			lib.exp(match,	'match', 'destroy'),
			lib.exp(fmap,	'fmap'),

			lib.exp(asSum,	'asSum')
		);
	}


// Library
	return lib.exports(
		lib.exp(sigma, 'create')
	);
});
