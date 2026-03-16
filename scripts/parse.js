
function parseLib(sum, sigma, list) {

	if (list == undefined) {
		console.log("Error: cannot initialize 'parseLib' without the 'listLib' dependency.");
		return {};
	}

	const notes =
		"To use the module, insert this code as well as a\n" +
		"declaration 'const parse = parseLib()' to create\n" +
		"an instance.\n\n" +

		"All parsers accept arrays of characters as input.\n" +
		"To feed a string to a parser, use 'parse.run(p, s)'.";


// String Utility
	const toStr  = a => list.array(a).join('');


// Parser Utility
	const run = (p, input) => p(input);

	const produce = value => input => 
		Object.freeze({
			__proto__: null,
		
			rest:   input,
			result: sum.left(value)
		});

	const failWith = value => input =>
		Object.freeze({
			__proto__: null,

			rest:   input,
			result: sum.right(value)
		});

	const getInput = input => produce(input)(input);
	
	const setInput = value => _ => produce(Object.create(null))(value);

	const bind = (p, mf) => input => {
		const out = run(p, input);
		return sum.match(out.result)(
			success => run(mf(success), out.rest),
			failure => out
		);
	};	

	const sequence = (p, q) => bind(p, _ => q);

	const fmap = f => px => bind(px, x => produce(f(x)));

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


// Failures
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


// Generic Combinators
	const satisfy = (condx, px) => 
		bind(px, x => condx(x) ? 
				produce(x) : 
				failBecause(`the value '${x}' did not satisfy the condition '${condx.name}'`));

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

	const between = (left, middle, right) => sequence(
		left,
		bind(middle, m => sequence(right, produce(m)))
	);


// String Parsing	
	const runStr = (p, s) => p(list.fromStr(s));


// Characters
	const anyChar = str => {
		if (list.isEmpty(str))
			return expected('a character')(str);
		else
			return produce(list.head(str))(list.tail(str));
	};

	const character = c => exact(c, anyChar);

	const oneOf = s => tryAll(list.fmap(character)(list.fromStr(s)));


// Numbers
	const digit = oneOf('0123456789');

	const positive = fmap(a => parseInt(toStr(a)))(many1(digit));

	const negative = sequence(
		character('-'), 
		fmap(n => -n)(positive));

	const integer = tryAll(list.build(positive, negative));

	const aFloat = fmap(parseFloat)(
		bind(
			tryAll(list.build(character('-'), produce('+'))),
			sign => bind(
					fmap(toStr)(many1(digit)),
					whole => tryAll(list.build(
						sequence(
							character('.'),
							bind(
								fmap(toStr)(many1(digit)), 
								fractional => produce(sign + whole + '.' + fractional))),
							
						produce(sign + whole)
					)))));

	const hexDigit = oneOf('0123456789abcdefABCDEF');

	const hexPositive = fmap(a => parseInt('0x' + toStr(a)))(many1(hexDigit));


// Strings
	const aString = s => fmap(toStr)(traverse(list.fmap(character)(list.fromStr(s))));

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


// Library
	return Object.freeze({
		__proto__: null,

		notes:       notes,

		run:         run,
		produce:     produce,
		bind:        bind,
		sequence:    sequence,
		seq:         sequence,
		fmap:        fmap,
		traverse:    traverse,
		between:     between,

		failWith:    failWith,
		fail:        fail,
		failBecause: failBecause,
		error:       parseError,
		onFailureOf: onFailureOf,
		onFail:      onFailureOf,

		satisfy:     satisfy,
		ifSatisfies: satisfy,
		exact:       exact,
		an:          exact,
		tryCatch:    tryCatch,
		tryAll:      tryAll,
		firstValid:  tryAll,
		many:        many,
		repeat:      many,
		many1:       many1,
		repeat1:     many1,

		runStr:      runStr,
		
		anyChar:     anyChar,
		consume:     anyChar,
		character:   character,
		chr:         character,
		aChar:       character,
		oneOf:       oneOf,

		digit:       digit,
		aDigit:      digit,
		positive:    positive,
		aPositive:   positive,
		natural:     positive,
		aNatural:    positive,
		negative:    negative,
		aNegative:   negative,
		integer:     integer,
		anInteger:   integer,
		aFloat:      aFloat,
		decimal:     aFloat,

		hexDigit:    hexDigit,
		aHexDigit:   hexDigit,
		hexPositive: hexPositive,
		aHexPositive: hexPositive,

		aString:     aString,
		str:         aString,
		singleQuote: singleQuoted,
		doubleQuote: doubleQuoted,

		lowercase:   lowercase,
		uppercase:   uppercase,
		letter:      aLetter,
		aLetter:     aLetter,
		aWord:       aWord,
		word:        aWord
	});
}


