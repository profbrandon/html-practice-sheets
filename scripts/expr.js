
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
	const number = n => tree.leaf(
		exprValue('Number', Object.freeze({
			__proto__: null,

			constant: n
		}))
	);

	const variable = name => tree.leaf(
		exprValue('Variable', Object.freeze({
			__proto__: null,

			name: name
		}))
	);

	const neg   = x => unaryOp('-', prefix, x);

	const open  = (x, y) => binaryOp('(', prefix, x, y);
	const close = voidOp(')', postfix); 

	const add  = (x, y) => binaryOp('+', infix, x, y);
	const sub  = (x, y) => binaryOp('-', infix, x, y);
	const mult = (x, y) => binaryOp('*', infix, x, y);
	const div  = (x, y) => binaryOp('/', infix, x, y);
	const exp  = (x, y) => binaryOp('^', infix, x, y);


// Accessors
	const type  = e => e.type;
	const value = e => e.value;
	const nodeValue = node => value(tree.value(node));
	const nodeType  = node => type(tree.value(node));

	return Object.freeze({
		__proto__: null,

		type:       type,
		value:      value,
		nodeType:   nodeType,
		nodeValue:  nodeValue,

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
		pow:        exp
	});
}
