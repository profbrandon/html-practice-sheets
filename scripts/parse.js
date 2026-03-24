
createLib('parse', lib => {

	lib.expect('parse', 'monad', 'monadFail', 'sum', 'sigma', 'pair', 'list');

	const [ monad, mfail, sum, sigma, pair, list ] = 
		lib.use('monad', 'monadFail', 'sum', 'sigma', 'pair', 'list');


// String Utility
	const toStr = a => list.array(a).join('');


// Parser Definitions
	const run = (p, input) => p(input);

	const produce = value => input => 
		Object.freeze({
			__proto__: null,
		
			rest:   input,
			result: sum.left(value)
		});


//Failures
	const failWith = value => input =>
		Object.freeze({
			__proto__: null,

			rest:   input,
			result: sum.right(value)
		});

	const parseError  = sigma.create(list.build('nonspecific', 'message', 'expected'));

	const fail        =            failWith(parseError.inject('nonspecific')(null));
	const failBecause = message => failWith(parseError.inject('message')(message));
	const expected    = x       => failWith(parseError.inject('expected')(list.build(x)));

	const onFailureOf = (p, err) => input => {
		const out = run(p, input);
		return sum.match(out.result)(
			success => out,
			failure => run(err(failure), out.rest)
		);
	}


// Input
	const getInput =          input => run(produce(input), input);	
	const setInput = value => _     => run(produce(Object.create(null)), value);


// Parser Monad
	const bind = (p, mf) => input => {
		const out = run(p, input);
		return sum.match(out.result)(
			success => run(mf(success), out.rest),
			failure => out
		);
	};

	const parseMonad     = monad.create2(produce, bind);
	const parseMonadFail = mfail.create(parseMonad, fail);

	const fmap = parseMonad.fmap;
	const seq  = parseMonad.seq;


// Combinators
	const traverse = ps => {
		if (list.isEmpty(ps))
			return produce(list.nil);
		else 
			return bind(
				list.head(ps),
				x => bind(
					traverse(list.tail(ps)),
					xs => produce(list.cons(x, xs))));
	};

	const satisfy = (condx, px) => 
		bind(px, x => condx(x) ? 
				produce(x) : 
				failBecause(`the value did not satisfy the condition`));

	const exact = (x, px) => 
		onFailureOf(
			satisfy(y => x === y, px),
			_ => expected(x));

	const tryCatch = (p, c) => input => {
		const out = run(p, input);
		return sum.match(out.result)(
			success => out,
			failure => run(c(failure), input)
		);
	}

	const tryAll = ps => {
		if (list.isEmpty(ps))
			return failBecause("no parsers provided to 'tryAll'");
		else 
			return tryCatch(
				list.head(ps),
				failure => tryCatch(
					tryAll(list.tail(ps)),
					failures => parseError.match(failures)(list.build(
						pair.build('nonspecific', _  => failWith(failure)),
						pair.build('message',     _  => failWith(failure)),
						pair.build('expected',    es => parseError.match(failure)(list.build(
							pair.build('nonspecific', _  => failWith(failures)),
							pair.build('message',     _  => failWith(failures)),
							pair.build('expected',    xs => failWith(parseError.inject('expected')(list.concat(xs, es))))
						)))
					))
				)
			);
	};

	const many = px =>
		tryAll(list.build(
			bind(px, x => bind(many(px), xs => produce(list.cons(x, xs)))),
			produce(list.nil)
		));

	const many1 = px =>
		bind(px, x => bind(many(px), xs => produce(list.cons(x, xs))));

	const between = (left, middle, right) => seq(
		left,
		bind(middle, m => seq(right, produce(m)))
	);


// List Parsing
	const nextElement = bind(
		getInput,
		input => {
			const pos = pair.fst(input);
			const xs  = pair.snd(input);

			if (list.isEmpty(xs))
				return expected('an element');
			else
				return seq(
					setInput(pair.build(pos + 1, list.tail(xs))),
					produce(list.head(xs)));
		}
	);
	

// String Parsing	
	const runStr = (p, s) => p(pair.build(0, list.from.str(s)));


// Characters
	const anyChar = onFailureOf(nextElement, _ => expected('a character'));

	const character = c => exact(c, anyChar);

	const oneOf = s => tryAll(list.monad.fmap(character)(list.from.str(s)));


// Numbers
	const digit = oneOf('0123456789');

	const positive = fmap(a => parseInt(toStr(a)))(many1(digit));

	const negative = seq(
		character('-'), 
		fmap(n => -n)(positive));

	const integer = tryAll(list.build(positive, negative));

	const aFloat = fmap(parseFloat)(
		bind(
			tryAll(list.build(character('-'), produce('+'))),
			sign => bind(
					fmap(toStr)(many1(digit)),
					whole => tryAll(list.build(
						seq(
							character('.'),
							bind(
								fmap(toStr)(many1(digit)), 
								fractional => produce(sign + whole + '.' + fractional))),
							
						produce(sign + whole)
					)))));

	const hexDigit = oneOf('0123456789abcdefABCDEF');

	const hexPositive = fmap(a => parseInt('0x' + toStr(a)))(many1(hexDigit));

// Specific Strings
	const aString = s => fmap(toStr)(traverse(list.monad.fmap(character)(list.from.str(s))));

	const singleQuoted = bind(
		between(
			character("'"),
			many(satisfy(c => c != "'", anyChar)),
			character("'")),
		cs => produce(toStr(cs)));

	const doubleQuoted = bind(
		between(
			character('"'),
			many(satisfy(c => c != '"', anyChar)),
			character('"')),
		cs => produce(toStr(cs)));


// Text
	const lowercase = oneOf('abcdefghijklmnopqrstuvwxyz');
	const uppercase = oneOf('ABCDEFGHIJKLMNOPQRSTUVWXYZ');

	const aLetter = tryAll(list.build(lowercase, uppercase));

	const aWord = bind(many1(aLetter), cs => produce(toStr(cs)));


// Trees
	const treeInput = sigma.create(list.build('empty', 'tree'));

	const runTree = (p, t) => p(treeInput.inject('tree')(t));

	const getValue = bind(
		getInput,
		mt => treeInput.match(mt)(list.build(
			pair.build('empty', _ => expected('a tree')),
			pair.build('tree',  t => produce(tree.value(t)))))
	);

	const getChildren = bind(
		getInput,
		mt => treeInput.match(mt)(list.build(
			pair.build('empty', _ => expected('a tree')),
			pair.build('tree',  t => produce(tree.children(t)))))
	);

	const parseLeaf = onFailureOf(
		seq(
			satisfy(list.isEmpty, getChildren),
			getValue
		),
		_ => expected('a leaf')
	);

	const parseNode = onFailureOf(
		bind(
			getValue,
			v => bind(
				getChildren,
				cs => seq(
					list.isEmpty(cs) ? fail : produce({}),
					produce(pair.build(v, cs))))),
		_ => expected('a node')
	);


// Library
	return lib.exports(
		lib.exp(run,		'run'),
		lib.exp(parseError,	'error'),
		
		lib.exp(setInput,	'setInput'),
		lib.exp(getInput,	'getInput'),

		lib.exp(fail,		'fail'),
		lib.exp(failWith,	'failWith'),
		lib.exp(failBecause,	'failBecause'),

		lib.exp(onFailureOf,	'onFailureOf', 'onFail'),

		lib.exp(traverse,	'traverse'),
		lib.exp(between,	'between'),

		lib.exp(satisfy,	'satisfy', 'sat'),
		lib.exp(exact,		'exact'),
		lib.exp(tryCatch,	'tryCatch'),
		lib.exp(tryAll,		'tryAll', 'firstValid', 'option'),
		lib.exp(many,		'many', 'repeat'),
		lib.exp(many1,		'many1', 'repeat1'),

		lib.exp(parseMonadFail,	'monad'),

		lib.exp(lib.pack(
				lib.exp(nextElement, 'next')
			),
			'list'),

		lib.exp(lib.pack(
				lib.exp(runStr,		'run'),
				
				lib.exp(anyChar,	'anyChar', 'consume'),
				lib.exp(oneOf,		'charFrom'),
				
				lib.exp(digit,		'digit', 'aDigit'),
				lib.exp(positive,	'natural', 'posOrZero'),
				lib.exp(negative,	'negOrZero'),

				lib.exp(integer,	'integer', 'anInteger'),
				lib.exp(aFloat,		'aFloat', 'decimal', 'aDecimal'),
				lib.exp(hexPositive,	'hex'),

				lib.exp(aString,	'str', 'aString', 'ing'),
				lib.exp(singleQuoted, 	'singleQuote'),
				lib.exp(doubleQuoted,	'doubleQuote'),

				lib.exp(lowercase,	'lowercase'),
				lib.exp(uppercase,	'uppercase'),
				lib.exp(aLetter,	'letter', 'aLetter'),
				lib.exp(aWord,		'word', 'aWord')
			),
			'str'),

		lib.exp(lib.pack(
				lib.exp(runTree,	'run'),
				lib.exp(treeInput,	'input'),

				lib.exp(getValue,	'value', 'getValue'),
				lib.exp(getChildren,	'children', 'getChildren'),

				lib.exp(parseLeaf,	'leaf'),
				lib.exp(parseNode,	'node')
			),
			'tree')
	);
});

