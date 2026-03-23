createLib('tree', lib => {

// Imports
	lib.expect('tree', 'pair');
	lib.expect('tree', 'list');
	lib.expect('tree', 'monad');
	
	const pair = lib.importAs('pair', { 
		build: 'build', 
		match: 'match' 
	});

	const list = lib.importAs('list', { 
		nil:     'nil', 
		cons:    'cons', 
		append:  'append',
		isEmpty: 'isEmpty', 
		build:   'build', 
		monad:   'mon'
	});

	const [ monad ] = lib.use('monad');

// Constructors
	const node = (value, children) => {
		return Object.freeze({
			__proto__: null,

			value:    value,
			children: children
		});
	};

	const leaf = value => node(value, list.nil);


// Destructor
	const foldr = (onLeaf, onBranch) => tree => {
		if (isLeaf(tree))
			return onLeaf(tree.value);
		else
			return onBranch(tree.value, list.mon.fmap(foldr(onLeaf, onBranch))(tree.children));
	};


// Accessors
	const value = tree => tree.value;

	const children = tree => tree.children;


// Monad
	const join = tta => foldr(
		ta => ta, 
		(ta, tas) => node(ta.value, list.concat(ta.children, tas))
	)(tta)
	
	const fmap = f => foldr(v => leaf(f(v)), (v, c) => node(f(v), c));

	const treeMonad = monad.create1(fmap, /* produce */ leaf, join);


// Predicates

	const isLeaf = tree => list.isEmpty(tree.children);
	
// Traversal
	const polish = foldr(
		list.build, 
		(v, c) => list.cons(v, list.mon.join(c))
	);

	const reversePolish = foldr(
		list.build, 
		(v, c) => list.append(v, list.mon.join(c))
	);


// Aux
	const buildLabel = (name, value) => Object.freeze({
		__proto__: null,

		name: name,
		value: value
	});

	const labeledTree = fmap(v => pair.build(v, list.nil));

	const addLabelIf = (tag, cond) => fmap(p => pair.match(p)(
		(v, tags) => pair.build(
			v, 
			cond(v) ? list.cons(tag, tags) : tags
		)
	));

	const addLabel = (tag, value) => addLabelIf(tag, v => v === value);

	const removeLabelsIf = (cond) => fmap(p => pair.match(p)(
		(v, tags) => pair.build(
			v, 
			cond(v) ? list.nil : tags
		)
	));

	const removeLabelIf = (tag, cond) => fmap(p => pair.match(p)(
		(v, tags) => pair.build(
			v,
			cond(v) ? list.monad.filter(x => x !== tag, tags) : tags
		)
	));

	const removeLabel  = (tag, value) => removeLabelIf(tag, v => v === value);

	const removeLabels = (tag, value) => removeLabelsIf(tag, v => v === value);

	const getLabels = pair.snd;

	const getValue = pair.fst;

	const stripLabels = fmap(getValue);



// String Diagram
	const markTerminals = foldr(
		v       => leaf(pair.build(v, false)),
		(v, cs) => node(
			pair.build(v, false), 
			list.append(
				node(pair.build(
					pair.fst(list.last(cs).value), true), 
					list.last(cs).children), 
				list.init(cs)))
	);

	const pipeCodes = tree => fmap(b => b ? '\u2514' : '\u251C')(markTerminals(tree));

	const subTreeDiagram = tree => 
		foldr(
			p => list.build((pair.snd(p) ? '\u2514' : '\u251C') + ' ' + pair.fst(p)),
			(p, cs) => {
				if (pair.snd(p))
					return list.cons('\u2514' + ' ' + pair.fst(p), list.monad.fmap(q => '  ' + q)(list.monad.join(cs)));
				else
					return list.cons('\u251C' + ' ' + pair.fst(p), list.monad.fmap(q => '\u2502' + ' ' + q)(list.monad.join(cs)));
			}
		)(markTerminals(tree));

	const treeDiagram = (tree) => {
		const front = '\u2514' + ' ' + tree.value;

		if (isLeaf(tree))
			return list.build(front);
		else
			return list.cons(
				'\u2514' + ' ' + tree.value, 
				list.monad.fmap(q => '  ' + q)(list.monad.join(list.build(
					list.monad.join(list.monad.fmap(subTreeDiagram)(list.init(tree.children))),	
					treeDiagram(list.last(tree.children))
				)))
			);
	};

	
	const print = (tree, acceptor) => {
		acceptor(list.array(treeDiagram(tree)).join('\n'));
	};


// Library
	return lib.exports(
		lib.exp(node,		'node'),
		lib.exp(leaf,		'leaf'),

		lib.exp(value,		'value'),
		lib.exp(children, 	'children'),
		
		lib.exp(isLeaf,		'isLeaf'),

		lib.exp(foldr,		'foldr'),

		lib.exp(polish,		'polish'),
		lib.exp(reversePolish,	'rPolish'),

		lib.exp(treeDiagram,	'diagram'),
		lib.exp(print,		'print'),

		lib.exp(treeMonad,      'monad'),

		lib.exp(lib.exports(
				lib.exp(buildLabel,	'build'),
				lib.exp(labeledTree,	'tree'),

				lib.exp(addLabelIf,	'addIf'),
				lib.exp(addLabel,	'add'),

				lib.exp(removeLabelsIf,	'removeAllIf'),
				lib.exp(removeLabels,	'removeAll'),
				lib.exp(removeLabelIf,	'removeIf'),
				lib.exp(removeLabel,	'remove'),

				lib.exp(stripLabels,	'strip'),
				
				lib.exp(getValue,	'getValue'),
				lib.exp(getLabels,	'getLabels')
			),
			'label')
	);
});

