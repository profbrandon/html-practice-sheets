function treeLib(pair, list) {

// Trees
	const node = (value, children) => {
		return Object.freeze({
			__proto__: null,

			value:    value,
			children: children
		});
	};

	const leaf = value => node(value, list.nil);

	const isLeaf = tree => list.isEmpty(tree.children);

	const value = tree => tree.value;

	const children = tree => tree.children; 

	const foldr = (onLeaf, onBranch) => tree => {
		if (isLeaf(tree))
			return onLeaf(tree.value);
		else
			return onBranch(tree.value, list.fmap(foldr(onLeaf, onBranch))(tree.children));
	};

	const fmap = f => foldr(v => leaf(f(v)), (v, c) => node(f(v), c));

	
// Traversal
	const depthFirstPolish = foldr(
		list.produce, 
		(v, c) => list.cons(v, list.join(c))
	);

	const depthFirstReversePolish = foldr(
		list.produce, 
		(v, c) => list.append(v, list.join(c))
	);


// Aux
	const labeledTree = fmap(v => pair.build(v, list.nil));

	const addLabelIf = (cond, tag) => fmap(p => pair.match(p)(
		(v, tags) => pair.build(
			v, 
			cond(v) ? list.cons(tag, tags) : tags
		)
	));

	const addLabel = (value, tag) => labelIf(v => v === value);

	const removeLabelsIf = (cond) => fmap(p => pair.match(p)(
		(v, tags) => pair.build(
			v, 
			cond(v) ? list.nil : tags
		)
	));

	const removeLabelIf = (cond, tag) => fmap(p => pair.match(p)(
		(v, tags) => pair.build(
			v,
			cond(v) ? list.filter(x => x !== tag)(tags) : tags
		)
	));

	const removeLabel  = (value, tag) => removeLabelIf(v => v === value, tag);

	const removeLabels = (value, tag) => removeLabelsIf(v => v === value, tag);



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
					return list.cons('\u2514' + ' ' + pair.fst(p), list.fmap(q => '  ' + q)(list.join(cs)));
				else
					return list.cons('\u251C' + ' ' + pair.fst(p), list.fmap(q => '\u2502' + ' ' + q)(list.join(cs)));
			}
		)(markTerminals(tree));

	const treeDiagram = (tree) => {
		const front = '\u2514' + ' ' + tree.value;

		if (isLeaf(tree))
			return list.build(front);
		else
			return list.cons(
				'\u2514' + ' ' + tree.value, 
				list.fmap(q => '  ' + q)(list.join(list.build(
					list.join(list.fmap(subTreeDiagram)(list.init(tree.children))),	
					treeDiagram(list.last(tree.children))
				)))
			);
	};

	
	const print = (tree, acceptor) => {
		acceptor(list.array(treeDiagram(tree)).join('\n'));
	};


// Library
	return Object.freeze({
		__proto__: null,

		node:     node,
		leaf:     leaf,
		value:    value,
		children: children,

		isLeaf:   isLeaf,

		fmap:     fmap,
		foldr:    foldr,

		polish:   depthFirstPolish,
		rPolish:  depthFirstReversePolish,

		labels: Object.freeze({
			__proto__: null,

			create:      labeledTree,

			addIf:       addLabelIf,
			add:         addLabel,
			removeAllIf: removeLabelsIf,
			removeAll:   removeLabels,
			removeIf:    removeLabelIf,
			remove:      removeLabel
		}),

		diagram:  treeDiagram,

		print:    print
	});
}

