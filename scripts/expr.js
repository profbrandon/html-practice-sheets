
createLib('expr', lib => {

	lib.expect('expr', 'pair', 'list', 'tree', 'parse');

	const [ pair, list, tree, parse ] = lib.use('pair', 'list', 'tree', 'parse');


// Expression Values
	const exprValue = (type, value) => Object.freeze({
		__proto__: null,

		type:  type,
		value: value
	});

	const operator = (sym, fixity, type) => exprValue(type, Object.freeze({
		__proto__: null,

		symbol: sym,
		fixity: fixity
	}));


// Fixities
	const prefix  = 'Prefix';
	const infix   = 'Infix';
	const postfix = 'Postfix';


// Abstract Expression Trees
	const voidOp   = (sym, fixity)       => tree.leaf(operator(sym, fixity, 'VoidOp'),   list.nil);
	const unaryOp  = (sym, fixity, x)    => tree.node(operator(sym, fixity, 'UnaryOp'),  list.build(x));
	const binaryOp = (sym, fixity, x, y) => tree.node(operator(sym, fixity, 'BinaryOp'), list.build(x, y));


// Concrete Expression Trees
	const number = n => tree.leaf(exprValue('Number', n));

	const variable = name => tree.leaf(exprValue('Variable', name));

	const neg   = x => unaryOp('-', prefix, x);

	const open  = (x, y) => binaryOp('(', prefix, x, y);
	const close = voidOp(')', postfix); 

	const add  = (x, y) => binaryOp('+', infix, x, y);
	const sub  = (x, y) => binaryOp('-', infix, x, y);
	const mult = (x, y) => binaryOp('\u00b7', infix, x, y);
	const div  = (x, y) => binaryOp('/', infix, x, y);
	const exp  = (x, y) => binaryOp('^', infix, x, y);

	const placeholder = () => voidOp('Placeholder', prefix);


// Accessors
	const value = ev => ev.value;
	const type  = ev => ev.type;

	const symbol = op => op.symbol;
	const fixity = op => op.fixity;

	const lookupOp = (op) => {
		switch(op) {
			case '+':
				return add;
			case '-':
				return sub;
			case '*':
			case '\u00b7':
				return mult;
			case '/':
				return div;
			case '^':
				return exp;
			default:
				return undefined;
		}
	}

// Processing
	const matchType = ev => 
		(onNumber, onVariable, onVoidOp, onUnaryOp, onBinaryOp) => {
			const v = value(ev);

			switch(type(ev)) {
				case 'Number':
					return onNumber(v);

				case 'Variable':
					return onVariable(v);

				case 'VoidOp':
					return onVoidOp(v);

				case 'UnaryOp':
					return onUnaryOp(v);

				case 'BinaryOp':
					return onBinaryOp(v);
			}
		};

	const isOperator = ev => matchType(ev)(
		number   => false, 
		variable => false, 
		voidOp   => true, 
		unaryOp  => true,
		binaryOp => true
	);

	const matchFixity = op => (onPrefix, onInfix, onPostfix) => {
		switch(op.fixity) {
			case prefix:
				return onPrefix(op.symbol);

			case infix:
				return onInfix(op.symbol);

			case postfix:
				return onPostFix(op.symbol);
		}
	};


// Rendering
	const header = ev => matchType(ev)(
		number   => 'num: ' + number.toString(),
		variable => 'var: ' + variable,
		voidOp   => fixity(voidOp)   + ' op(0): ' + symbol(voidOp),
		unaryOp  => fixity(unaryOp)  + ' op(1): ' + symbol(unaryOp),
		binaryOp => fixity(binaryOp) + ' op(2): ' + symbol(binaryOp)
	);

	const asString = ev => matchType(ev)(
		number   => number.toString(),
		variable => variable,
		voidOp   => symbol(voidOp),
		unaryOp  => symbol(unaryOp),
		binaryOp => symbol(binaryOp)
	);


// Traversal
	const skipLabel = tree.label.build('skip', null);

	const traversalOrder = tree.foldr(
		taggedEv  => list.build(taggedEv),
		(taggedEv, css) => {
			const cs = list.monad.join(css);

			const dontTraverse = tag => tag === skipLabel;

			const skip = list.contains(dontTraverse, tree.label.getLabels(taggedEv))

			return matchType(tree.label.getValue(taggedEv))(
				// Leaves don't need definitions
				number   => undefined,
				variable => undefined,
				voidOp   => undefined,

				// Branches
				unaryOp  => 
					(skip ? cs :
						matchFixity(unaryOp)(
							prefix  => list.cons(taggedEv, cs), 
							infix   => undefined,
							postfix => list.append(taggedEv, cs) 
						)),
				binaryOp => 
					(skip ? cs :
						matchFixity(binaryOp)(
							prefix  => list.cons(taggedEv, cs),
							infix   => list.concat(list.head(css), list.cons(taggedEv, list.monad.join(list.tail(css)))),
							postfix => list.append(taggedEv, cs)
						))
			);
		}
	);


// Labeling
	const labelPosition = labeledExpr => list.foldr(
		labeledExpr, 
		(itemPair, result) => 
			pair.match(itemPair)(
				(pos, taggedEv) => 
					tree.label.add(
						tree.label.build('pos2', pos), 
						tree.label.getValue(taggedEv)
					)(result)
		)
	)(list.index(traversalOrder(labeledExpr)));


// Library
	return lib.exports(
		lib.exp(lib.exports(
				lib.exp(type,		'type'),
				lib.exp(value,		'value'),
				lib.exp(symbol,		'symbol'),
				lib.exp(fixity,		'fixity'),

				lib.exp(traversalOrder,	'traversal')
			),
			'get'),

		lib.exp(lib.exports(
				lib.exp(header,		'header'),
				lib.exp(asString,	'asString', 'str')
			),
			'render'),

		lib.exp(lib.exports(
				lib.exp(skipLabel, 	'skip'),
				lib.exp(labelPosition,	'pos')
			),
			'label'),

		lib.exp(prefix,		'prefix'),
		lib.exp(infix,		'infix'),
		lib.exp(postfix,	'postfix'),

		lib.exp(voidOp,		'voidOp', 'op0'),
		lib.exp(unaryOp,	'unaryOp', 'op1'),
		lib.exp(binaryOp,	'binaryOp', 'op2'),

		lib.exp(isOperator,	'isOperator', 'isOp'),

		lib.exp(lookupOp,	'lookupOp'),

		lib.exp(matchType,	'matchType'),
		lib.exp(matchFixity,	'matchFixity'),

		lib.exp(placeholder,	'placeholder'),
		lib.exp(number,		'number', 'num'),
		lib.exp(variable,	'variable', 'ind'),
		
		lib.exp(neg,		'negative', 'neg'),
		lib.exp(open,		'openParen', 'open'),
		lib.exp(close,		'closeParen', 'close'),
		lib.exp(add,		'add', 'sum'),
		lib.exp(sub,		'sub', 'subtract'),
		lib.exp(mult,		'mult', 'multiply'),
		lib.exp(div,		'div', 'divide'),
		lib.exp(exp,		'exp', 'pow', 'raise')
	);
});
