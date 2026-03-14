
function parseLib(list) {

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
	const toList = str => list.from(str.split(''));
	const toStr  = a => list.array(a).join('');


// Character Utility
	const isDigit = c => ('0' <= c && c <= '9');
	const isAlpha = c => ('a' <= c && c <= 'z') || ('A' <= c && c <= 'Z');


// Parser Utility
	const run = (p, s) => p(toList(s));

	const produce = x => str => {
		return Object.freeze({
			__proto__: null,
		
			rest:   str,
			result: x
		});
	};

	const failWith = (field, value) => str => {
		const obj = Object.create(null);
		obj.rest   = str;
		obj.result = undefined;
		obj[field] = value;
		return Object.freeze(obj);
	};

	const hasFailed = output => output.result === undefined;

	const match = p => (onSuccess, onFailure) => str => {
		const temp = p(str);

		if (hasFailed(temp))
			return onFailure(temp);
		else
			return onSuccess(temp);
	};

	const bind = (p, mf) => 
		match(p)(
			output => mf(output.result)(output.rest),
			output => output
		);

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
	const fail        =            failWith('message', 'nonspecific failure');
	const failBecause = message => failWith('message', message);
	const expected    = x       => failWith('expected', list.produce(x));

	const onFailureOf = (p, err) =>
		match(p)(
			output => output,
			output => err(output.rest)
		);


// Generic Combinators
	const satisfy = (condx, px) => 
		bind(px, x => condx(x) ? 
				produce(x) : 
				failBecause(`the value '${x}' did not satisfy the condition '${condx.name}'`));

	const exact = (x, px) => 
		onFailureOf(
			satisfy(y => x === y, px),
			expected(x));

	const tryAll = ps => {
		if (list.isEmpty(ps))
			return failBecause("no parsers provided to 'tryAll'");
		else 
			return str => match(list.head(ps))(
				success => produce(success.result)(success.rest),
				failure => 
					match(tryAll(list.tail(ps)))(
						success  => produce(success.result)(success.rest),
						failures => {
							if (failure.expected != undefined && failures.expected == undefined)
								return failWith('expected', failure.expected)(str);
							
							else if (failure.expected != undefined && failures.expected != undefined)
								return failWith('expected', list.concat(failure.expected, failures.expected))(str);
						
							else
								return failBecause(failure.message)(str);
						}
					)(str) 
			)(str);
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


// Characters
	const anyChar = str => {
		if (list.isEmpty(str))
			return expected('a character')(str);
		else
			return produce(list.head(str))(list.tail(str));
	};

	const character = c => exact(c, anyChar);

	const oneOf = s => tryAll(list.fmap(character)(toList(s)));


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
	const aString = s => fmap(toStr)(traverse(list.fmap(character)(toList(s))));

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

// Produce the module
	return Object.freeze({
		__proto__: null,

		notes:       notes,

		run:         run,
		produce:     produce,
		hasFailed:   hasFailed,
		match:       match,
		bind:        bind,
		sequence:    sequence,
		seq:         sequence,
		fmap:        fmap,
		traverse:    traverse,
		between:     between,

		fail:        fail,
		failBecause: failBecause,
		error:       failBecause,
		onFailureOf: onFailureOf,
		onFail:      onFailureOf,

		satisfy:     satisfy,
		ifSatisfies: satisfy,
		exact:       exact,
		an:          exact,
		tryAll:      tryAll,
		firstValid:  tryAll,
		many:        many,
		repeat:      many,
		many1:       many1,
		repeat1:     many1,

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


