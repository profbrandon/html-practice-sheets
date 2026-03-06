
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


// Array Utility
	const head    = list.head;
	const tail    = list.tail;
	const isEmpty = list.isEmpty;	
	const cons    = list.cons;

	
// String Utility
	const toArr = str => str.split('');
	const toStr = a => a.join('');


// Character Utility
	const isDigit = c => ('0' <= c && c <= '9');
	const isAlpha = c => ('a' <= c && c <= 'z') || ('A' <= c && c <= 'Z');


// Parser Utility
	const run = (p, s) => p(toArr(s));

	const produce = x => str => {
		const obj = {
			rest:   str,
			result: x
		};

		return Object.freeze(obj);
	};

	const failWith = (field, value) => str => {
		const obj = {
			rest:   str,
			result: undefined
		};

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
		if (isEmpty(ps))
			return produce([]);
		else 
			return bind(
				head(ps),
				x => bind(
					traverse(tail(ps)),
					xs => produce(cons(x, xs))));
	};


// Failures
	const fail        =            failWith('message', 'nonspecific failure');
	const failBecause = message => failWith('message', message);
	const expected    = x       => failWith('expected', x);

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
		if (isEmpty(ps))
			return failBecause("no parsers provided to 'tryAll'");
		else 
			return str => match(head(ps))(
				success => produce(success.result)(success.rest),
				failure => 
					match(tryAll(tail(ps)))(
						success => produce(success.result)(success.rest),
						failures => {
							if (failure.expected != undefined && failures.expected == undefined)
								return expected([failure.expected].flat())(str);
							
							else if (failure.expected != undefined && failures.expected != undefined)
								return expected(cons(failure.expected, failures.expected).flat())(str);
						
							else
								return failBecause(failure.message)(str);
						}
					)(str) 
			)(str);
	};

	const many = px =>
		onFailureOf(
			bind(px, x => bind(many(px), xs => produce(cons(x, xs)))),
			produce([]));

	const many1 = px =>
		bind(px, x => bind(many(px), xs => produce(cons(x, xs))));


// Characters
	const anyChar = str => {
		if (isEmpty(str))
			return expected('a character')(str);
		else
			return produce(head(str))(tail(str));
	};

	const character = c => exact(c, anyChar);

	const oneOf = s => tryAll(toArr(s).map(character));


// Numbers
	const digit = oneOf('0123456789');

	const positive = fmap(a => parseInt(toStr(a)))(many1(digit));

	const negative = sequence(
		character('-'), 
		fmap(n => -n)(positive));

	const integer = tryAll([positive, negative]);

	const aFloat = fmap(parseFloat)(
		bind(
			tryAll([character('-'), produce('+')]),
			sign => bind(
					fmap(toStr)(many1(digit)),
					whole => tryAll(
						[
							sequence(
								character('.'),
								bind(
									fmap(toStr)(many1(digit)), 
									fractional => produce(sign + whole + '.' + fractional))),
							produce(sign + whole)
						]))));

	const hexDigit = oneOf('0123456789abcdefABCDEF');

	const hexPositive = fmap(a => parseInt('0x' + toStr(a)))(many1(hexDigit));


// String
	const aString = s => fmap(toStr)(traverse(toArr(s).map(character)));


// Produce the module
	return Object.freeze({

		notes: notes,

		util: {
			list:   list,

			string: {
				toArray:  toArr,
				toString: toStr
			},

			character: {
				isDigit: isDigit,
				isAlpha: isAlpha
			}
		},

		run:         run,
		produce:     produce,
		hasFailed:   hasFailed,
		match:       match,
		bind:        bind,
		sequence:    sequence,
		seq:         sequence,
		fmap:        fmap,
		traverse:    traverse,

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
		str:         aString
	});
}


