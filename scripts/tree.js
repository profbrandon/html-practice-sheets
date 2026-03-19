function treeLib(list) {

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

	function foldr(onLeaf, onBranch) {
		return tree => {
			if (isLeaf(tree))
				return onLeaf(tree.value);
			else
				return onBranch(tree.value, list.fmap(foldr(onLeaf, onBranch))(tree.children));
		};
	}

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


// String Diagram
	const pair = (fst, snd) => {
		return {
			__proto__: null,
			
			fst: fst,
			snd: snd
		};
	};

	const markTerminals = foldr(
		v => leaf(pair(v, false)),
		(v, cs) => node(pair(v, false), list.append(node(pair(list.last(cs).value.fst, true), list.last(cs).children), list.init(cs)))
	);

	const pipeCodes = tree => fmap(b => b ? '\u2514' : '\u251C')(markTerminals(tree));

	const subTreeDiagram = tree => 
		foldr(
			p => list.build((p.snd ? '\u2514' : '\u251C') + ' ' + p.fst),
			(p, cs) => {
				if (p.snd)
					return list.cons('\u2514' + ' ' + p.fst, list.fmap(q => '  ' + q)(list.join(cs)));
				else
					return list.cons('\u251C' + ' ' + p.fst, list.fmap(q => '\u2502' + ' ' + q)(list.join(cs)));
			}
		)(markTerminals(tree));

	function treeDiagram(tree) {
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
	}

	
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

		diagram:  treeDiagram,

		print:    print
	});
}

