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

	function foldr(f) {
		return tree => {
			if (isLeaf(tree))
				return f(tree.value, list.nil);
			else
				return f(tree.value, list.fmap(foldr(f))(tree.children));
		};
	}

	const fmap = f => foldr((v, c) => node(f(v), c));

	
// Tree Processing
	const depthFirstPolish        = foldr((v, c) => list.cons(v, list.join(c)));	
	const depthFirstReversePolish = foldr((v, c) => list.append(v, list.join(c)));

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
		rPolish:  depthFirstReversePolish
	});
}

