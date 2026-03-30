
createLib('list', lib => {

// Imports
	lib.expect('list', 'pair', 'monad', 'monadFail');

	const [ pr, mon, mfail ] = lib.use('pair', 'monad', 'monadFail');

// Constructors
	const empty = Object.freeze({
		__proto__: null,

		head: undefined,
		tail: undefined
	});

	const cons = (a, as) => {
		return Object.freeze({
			__proto__: null,

			head: a,
			tail: as
		});
	};


// Destructors
	const foldr_cont = (seed, f) => as => cont => {
		if (as.head === undefined /* isEmpty */)
			return cont(seed)
		else
			return foldr_cont(seed, f)(as.tail)(x => cont(f(as.head, x)));
	};

	const foldr = (seed, f) => as => foldr_cont(seed, f)(as)(x => x);

	const foldl = (seed, f) => as => foldr(y => y, (x, g) => y => g(f(x, y)))(as)(seed);


// Monad
	const concat = (xs, ys) => foldr(ys, cons)(xs);

	const listMonad = mon.create1(
		/* fmap    */ f => foldr(empty, (a, bs) => cons(f(a), bs)),
		/* produce */ a => cons(a, empty),  
		/* join    */ foldr(empty, concat)
	);

	const listMonadFail = mfail.create(listMonad, /* zero */ empty);


// Accessors
	const head = as => as.head;
	const tail = as => as.tail;

	const last = as => foldl(x => x,     (v, f) => x => v            )(as)      (head(as));
	const init = as => foldr(x => empty, (v, f) => y => cons(y, f(v)))(tail(as))(head(as));

	const drop = n => xs => n === 0 ? xs : drop(n - 1)(tail(xs));
	const take = n => xs => n === 0 ? empty : cons(head(xs), take(n - 1)(tail(xs)));

	const at = (n, xs) => head(drop(n)(xs));


// Properties
	const isEmpty = foldr(true, _ => false);
	const length  = foldr(0,    (_, n) => n + 1);

	const contains = (condx, xs) => !isEmpty(listMonadFail.filter(condx, xs));


// Creation
	const reverse = foldl(empty, cons);

	const generate = (seed, f, n) => 
		n === 0 ? 
			empty : 
			cons(seed, listMonad.fmap(f)(generate(seed, f, n - 1)));


// Adding Eleemnts
	const append = (a, as) => foldr(cons(a, empty), cons)(as);

	const insert = (n, x, xs) => concat(take(n)(xs), cons(x, drop(n)(xs)));


// Conversions
	const fromArray = arr => arr.reduceRight((as, a) => cons(a, as), empty);
	const fromStr   = s => fromArray(s.split(''));

	const array = arr => foldl([], (x, a) => { a.push(x); return a; })(arr).slice();

	const build = (...args) => fromArray(args);


// Dictionaries
	const zip = (xs, ys) => {
		if (isEmpty(xs) || isEmpty(ys))
			return empty;
		else
			return cons(
				pr.build(head(xs), head(ys)), 
				zip(tail(xs), tail(ys))
			);
	};

	const lookup = (field, dict) => foldr(
		undefined, 
		(x, r) => pr.fst(x) === field ? pr.snd(x) : r
	)(dict);

	const index = xs => zip(
		generate(0, x => x + 1, length(xs)), 
		xs);


// Library
	return lib.exports(
		lib.exp(empty, 		'empty', 'nil'),
		
		lib.exp(build,		'build'),
		lib.exp(array,		'array'),
		
		lib.exp(lib.exports(
			lib.exp(fromArray, 	'array'), 
			lib.exp(fromStr, 	'str')), 
			'from'),

		lib.exp(foldr,		'foldr'),
		lib.exp(foldl,		'foldl'),

		lib.exp(head, 		'head'),
		lib.exp(tail,		'tail'),
		lib.exp(last,		'last'),
		lib.exp(init, 		'init'),

		lib.exp(cons,		'cons', 'prepend'),
		lib.exp(append,		'append'),
		lib.exp(insert,		'insert'),

		lib.exp(drop,		'drop'),
		lib.exp(take,		'take'),
		lib.exp(at,		'at'),

		lib.exp(isEmpty,	'isEmpty', 'isNil'),
		lib.exp(contains,	'contains'),	
		lib.exp(length,		'length'),

		lib.exp(concat,		'concat'),
		lib.exp(reverse,	'reverse'),
		lib.exp(generate,	'generate'),

		lib.exp(zip,		'zip'),
		lib.exp(lookup,		'lookup'),
		lib.exp(index,		'index'),

		lib.exp(listMonadFail, 'monad')
	);
});
