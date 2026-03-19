
function mathMLLib(list, tree, expr, markup, parse) {

// Markup Generation
	const textContainer = (tag, attributes, txt) => 
		tree.node(
			markup.el(tag, false, attributes), 
			list.build(tree.leaf(markup.text(txt)))
		);

	const markupExpr = ev => expr.matchType(ev)(
		n   => textContainer('mn', list.nil, n), 
		v   => textContainer('mi', list.nil, v),
		vop => {
			if (expr.get.symbol(vop) === 'Placeholder')
				return textContainer(
					'span', 
					list.build(
						markup.attr(
							'class',
							'placeholder'
						)
					),
					'&nbsp;');
			else
				return textContainer('mo', list.nil, expr.get.symbol(vop))
		},
		uop => textContainer('mo', list.nil, expr.get.symbol(uop)),
		bop => textContainer('mo', list.nil, expr.get.symbol(bop))
	);

	const markupExprTree = tree.foldr(
		markupExpr,
		(v, cs) => {
			const op = v.value;

			if (expr.get.fixity(op) === expr.infix &&
				(expr.get.symbol(op) === '/') ||
				(expr.get.symbol(op) === '^'))

				return tree.node(
					markup.el(expr.get.symbol(op) === '/' ? 'mfrac' : 'msup', false, list.nil),
					cs);
			else
				return tree.node(
					markup.el('mrow', false, list.nil),
					expr.matchFixity(v.value)(
						prefixOp  => list.cons(markupExpr(v), cs),
						infixOp   => list.cons(list.head(cs), list.cons(markupExpr(v), list.tail(cs))),
						postfixOp => list.append(markupExpr(v), cs)
					)
				);
		}
	);


// Library
	return Object.freeze({
		__proto__: null,

		markupExprTree: markupExprTree
	})
}
