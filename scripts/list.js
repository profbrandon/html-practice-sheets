
function listLib(monad, monadFail, pair) {

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

	const listMonad = monad.create(
		/* fmap    */ f => foldr(empty, (a, bs) => cons(f(a), bs)),
		/* produce */ a => cons(a, empty),  
		/* join    */ foldr(empty, concat)
	);

	const listMonadFail = monadFail.create(monad, /* zero */ empty);


// Accessors
	const head = as => as.head;
	const tail = as => as.tail;

	const last = as => foldl(x => x,     (v, f) => x => v            )(as)      (head(as));
	const init = as => foldr(x => empty, (v, f) => y => cons(y, f(v)))(tail(as))(head(as));

	const drop = n => xs => n === 0 ? xs : drop(n - 1)(tail(xs));
	const take = n => xs => n === 0 ? empty : cons(head(xs), take(n - 1)(tail(xs)));

	const at = (n, xs) => head(drop(n)(xs));


// Properties
	const isEmpty = foldr(true, (_, _) => false);
	const length  = foldr(0,    (_, n) => n + 1);

	const contains = (condx, xs) => !isEmpty(listMonad.filter(condx, xs));


// Creation
	const reverse = foldl(empty, cons);

	const generate = (seed, f, n) => 
		n === 0 ? 
			empty : 
			cons(seed, fmap(f)(generate(seed, f, n - 1)));


// Adding Eleemnts
	const append = (a, as) => foldr(cons(a, empty), cons)(as);

	const insert = (n, x, xs) => concat(take(n)(xs), cons(x, drop(n)(xs)));


// Conversions
	const fromArray = arr => arr.reduceRight((as, a) => cons(a, as), empty);
	const fromStr   = s => fromArray(s.split(''));

	const array = arr => foldl([], (x, a) => { a.push(x); return a; })(arr).slice();

	function list() {
		return fromArray(Array.from(arguments));
	}


// Dictionaries
	const zip(xs, ys) => {
		if (isEmpty(xs) || isEmpty(ys))
			return empty;
		else
			return cons(
				pair.build(head(xs), head(ys)), 
				zip(tail(xs), tail(ys))
			);
	};

	const lookup = (field, dict) => foldr(
		undefined, 
		(x, r) => pair.fst(x) === field ? pair.snd(x) : r
	)(dict);

	const index = xs => zip(
		generate(0, x => x + 1, length(xs)), 
		xs);


// Library
	return Object.freeze({
		__proto__: null,

		empty:    empty,
		nil:      empty,

		build:    list,
		array:    array,

		head:     head,
		tail:     tail,
		last:     last,
		init:     init,

		cons:     cons,
		append:   append,
		insert:   insert,

		length:   length,

		drop:     drop,
		take:     take,
		at:       at,

		contains: contains,
		isEmpty:  isEmpty,

		foldr:    foldr,
		foldl:    foldl,
		
		concat:   concat,
		reverse:  reverse,
		generate: generate,

		zip:      zip,
		lookup:   lookup,
		index:    index,

		monad:    listMonad,
		mFail:    listMonadFail,

		from: Object.freeze({
			__proto__: null,

			array: fromArray,
			str:   fromStr
		})
	});
}
