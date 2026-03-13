
function exprLib(list, tree, parse) {

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

	const placeholder = voidOp('Placeholder', prefix);


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

	return Object.freeze({
		__proto__: null,

		type:       type,
		value:      value,
		symbol:     symbol,
		fixity:     fixity,

		prefix:     prefix,
		infix:      infix,
		postfix:    postfix,

		voidOp:     voidOp,
		unaryOp:    unaryOp,
		binaryOp:   binaryOp,

		lookupOp:   lookupOp,

		matchType:   matchType,
		matchFixity: matchFixity,

		number:     number,
		num:        number,
		
		variable:   variable,
		ind:        variable,
		
		negative:   neg,
		neg:        neg,

		openParen:  open,
		open:       open,

		closeParen: close,
		close:      close,

		add:        add,
		
		subtract:   sub,
		sub:        sub,

		multiply:   mult,
		mult:       mult,

		divide:     div,
		div:        div,

		raise:      exp,
		exp:        exp,
		pow:        exp,

		placeholder: placeholder
	});
}
