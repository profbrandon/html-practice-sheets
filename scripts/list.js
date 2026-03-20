
function listLib(pair) {

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


// Basics	
	const head = as => as.head;
	const tail = as => as.tail;

	const isEmpty = as => as.head == undefined;

	const foldr_cont = (seed, f) => as => cont => {
		if (isEmpty(as))
			return cont(seed)
		else
			return foldr_cont(seed, f)(tail(as))(x => cont(f(head(as), x)));
	};

	const foldr = (seed, f) => as => foldr_cont(seed, f)(as)(x => x);

	const foldl = (seed, f) => as => foldr(y => y, (x, g) => y => g(f(x, y)))(as)(seed);

	const fmap = f => foldr(empty, (a, bs) => cons(f(a), bs));

	const concat = (xs, ys) => foldr(ys, cons)(xs);

	const append = (a, as) => foldr(cons(a, empty), cons)(as);

	const init = as => foldr(
		x => empty, 
		(x, f) => y => cons(y, f(x))
	)(tail(as))(head(as));

	const last = as => foldl(x => x, (v, f) => x => v)(as)(head(as));

	const reverse = foldl(empty, cons);

	const length = foldr(0, (_, n) => n + 1);

	const generate = (seed, f, n) => {
		switch(n) {
			case 0:
				return empty;
			default:
				return cons(seed, fmap(f)(generate(seed, f, n - 1)));
		}
	};

	const drop = n => xs => n === 0 ? xs : drop(n - 1)(tail(xs));

	const at = (n, xs) => head(drop(n)(xs));

	const take = n => xs => n === 0 ? empty : cons(head(xs), take(n - 1)(tail(xs)));

	const insert = (n, x, xs) => concat(take(n)(xs), cons(x, drop(n)(xs)));


// Conversions
	const from  = arr => arr.reduceRight((as, a) => cons(a, as), empty);
	const array = arr => foldl([], (x, a) => { a.push(x); return a; })(arr).slice();

	function list() {
		return from(Array.from(arguments));
	}


	const fromStr = s => from(s.split(''));


// List Monad
	const fail    = empty;
	const produce = a => cons(a, empty);
	const join    = foldr(empty, concat);

	const bind = (xs, mf) => join(fmap(mf)(xs));

	const sequence = (xs, ys) => bind(xs, _ => ys);

	const filter = (condx, xs) => 
		bind(xs, 
			x => condx(x) ? produce(x) : fail);


// Dictionaries
	function zip(xs, ys) {
		if (isEmpty(xs) || isEmpty(ys))
			return empty;
		else
			return cons(
				pair.build(head(xs), head(ys)), 
				zip(tail(xs), tail(ys))
			);
	};

	const lookup = (field, dict) => 
		foldr(
			undefined, 
			(x, r) => 
				pair.fst(x) === field ? pair.snd(x) : r
		)(dict);

	const index = xs => zip(generate(0, x => x + 1, length(xs)), xs);


// Aux
	const contains = (condx, xs) => !isEmpty(filter(condx, xs));

// Library
	return Object.freeze({
		__proto__: null,

		empty:   empty,
		nil:     empty,

		isEmpty: isEmpty,
		isNil:   isEmpty,

		head:    head,
		tail:    tail,
		last:    last,
		init:    init,

		cons:    cons,
		append:  append,
		insert:  insert,

		length:  length,
		len:     length,

		drop:    drop,
		take:    take,
		at:      at,

		foldr:      foldr,
		foldl:      foldl,
		foldr_cont: foldr_cont,
		fmap:       fmap,
		concat:     concat,
		reverse:    reverse,

		generate:   generate,

		produce:  produce,
		join:     join,
		bind:     bind,
		sequence: sequence,
		seq:      sequence,

		filter:   filter,

		from:    from,
		fromStr: fromStr,
		array:   array,
		build:   list,

		zip:     zip,
		lookup:  lookup,
		index:   index,

		contains: contains
	});
}
