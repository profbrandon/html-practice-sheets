
createLib('mathML', lib => {

	lib.expect('mathML', 'pair');
	lib.expect('mathML', 'list');
	lib.expect('mathML', 'tree');
	lib.expect('mathML', 'expr');
	lib.expect('mathML', 'markup');
	lib.expect('mathML', 'parse');

	const [ pair ] = lib.use('pair');

	const list = lib.importAs('list', {
		nil: 'nil',
		head: 'head',
		tail: 'tail',
		build: 'build',
		cons: 'cons',
		append: 'append',
		monad: 'monad'
	});

	const tree = lib.importAs('tree', {
		leaf: 'leaf',
		node: 'node',
		foldr: 'foldr',
		label: 'label'
	});

	const expr = lib.importAs('expr', {
		get: 'get',
		infix: 'infix',
		matchType: 'matchType',
		matchFixity: 'matchFixity'
	});

	const markup = lib.importAs('markup', {
		build: 'build'	
	});

// Markup Generation
	const textContainer = (tag, attributes, txt) => 
		tree.node(
			markup.build.el(tag, false, attributes), 
			list.build(tree.leaf(markup.build.text(txt)))
		);

	const processTags = list.monad.fmap(tag => markup.build.attr(tag.name, tag.value));

	const markupExpr = (ev, tags) => expr.matchType(ev)(
		n   => textContainer('mn', processTags(tags), n), 
		v   => textContainer('mi', processTags(tags), v),
		vop => {
			if (expr.get.symbol(vop) === 'Placeholder')
				return textContainer(
					'div', 
					list.cons(
						markup.build.attr(
							'class',
							'placeholder'
						),
						processTags(tags)
					),
					'&nbsp;');
			else
				return textContainer('mo', processTags(tags), expr.get.symbol(vop))
		},
		uop => textContainer('mo', processTags(tags), expr.get.symbol(uop)),
		bop => textContainer('mo', processTags(tags), expr.get.symbol(bop))
	);

	const markupExprTree = tree.foldr(
		p => pair.match(p)((ev, tags) => markupExpr(ev, tags)),
		(v, cs) => {
			const tags = tree.label.getLabels(v);
			const ev = tree.label.getValue(v);
			const op = ev.value;

			if (expr.get.fixity(op) === expr.infix &&
				(expr.get.symbol(op) === '/') ||
				(expr.get.symbol(op) === '^'))

				return tree.node(
					markup.build.el(expr.get.symbol(op) === '/' ? 'mfrac' : 'msup', false, processTags(tags)),
					cs);
			else
				return tree.node(
					markup.build.el('mrow', false, list.nil),
					expr.matchFixity(op)(
						prefixOp  => list.cons(markupExpr(ev, tags), cs),
						infixOp   => list.cons(list.head(cs), list.cons(markupExpr(ev, tags), list.tail(cs))),
						postfixOp => list.append(markupExpr(ev, tags), cs)
					)
				);
		}
	);


// Library
	return lib.exports(
		lib.exp(markupExprTree, 'markupLabeledExprTree')
	);
});
