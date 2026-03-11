
function markupLib(list, tree, parse) {

// Elements
	const attribute = (name, value) => {
		return {
			__proto__: null,

			name:  name,
			value: value
		};
	};

	const element = (tag, attributes) => {
		return {
			__proto__: null,

			tag:        tag,
			attributes: attributes
		};
	};


// Rendering Elements as Strings
	const header = e => e.tag + '[' + list.foldr('', (a, s) => `{${a.name}: '${a.value}'}` + s)(e.attributes) + ']';
	
	const attributeString = a => `${a.name}='${a.value}'`;

	const openingTag = e => {
		if (e.tag === 'text:')
			return list.head(e.attributes).value;
		else
			return `<${e.tag}${list.foldl('', (a, str) => str + ' ' + attributeString(a))(e.attributes)}>`;
	};

	const closingTag = e => {
		if (e.tag === 'text:')
			return '';
		else
			return `</${e.tag}>`;
	}

	const renderTree = tree.foldr((e, cs) => `${openingTag(e)}${list.array(cs).join('')}${closingTag(e)}`);


// Parsing Element Trees
	const parseJSString = parse.tryAll(list.from([parse.singleQuote, parse.doubleQuote]));

	const parseAttribute = parse.bind(
		parse.aWord,
		name => parse.seq(
			parse.aChar('='),
			parse.bind(
				parseJSString,
				value => parse.produce(attribute(name, value)))));

	const parseOpeningTag = parse.between(
		parse.aChar('<'),
		parse.bind(
			parse.aWord,
			tag => parse.bind(
				parse.many(parse.seq(parse.aChar(' '), parseAttribute)),
				as => parse.produce(element(tag, as))
			)
		),
		parse.aChar('>')
	);

	const parseClosingTag = parse.between(
		parse.aString('</'),
		parse.aWord,
		parse.aChar('>')
	);

	const parseText = parse.bind(
		parse.many1(parse.satisfy(c => c != '<' && c != '>', parse.anyChar)),
		cs => parse.produce(
			tree.node(
				element(
					'text:', 
					list.build(
						attribute(
							'value', 
							list.array(list.filter(c => c != '\n', cs)).join('')))),
				list.nil))
	);

	const parseTag = children => parse.bind(
		parseOpeningTag,
		e => parse.bind(
			children,
			cs => parse.bind(
				parseClosingTag,
				tag => {
					if (tag === e.tag)
						return parse.produce(tree.node(e, cs));
					else
						return parse.failBecause(`ending tag '${tag}' does not match the opening tag '${e.tag}'`);
				})));

	function fix(f) {
		return parse.tryAll(list.build(
			f(parse.produce(list.nil)),
			parse.bind(
				parse.produce(g => g(parse.many(fix(g)))),
				q => q(f))	
		));
	}

	const parseTree = parseTag(
		parse.many(
			fix(cs => parse.tryAll(list.build(
				parseText, 
				parseTag(cs)))))
	);


	return Object.freeze({
		__proto__:  null,

		attribute:  attribute,
		attr:       attribute,
		element:    element,
		el:         element,

		header:     header,
		openingTag: openingTag,
		open:       openingTag,
		closingTag: closingTag,
		close:      closingTag,
		renderTree: renderTree,

		parseOpen:  parseOpeningTag,
		parseClose: parseClosingTag,
		parseTag:   parseTag,
		parseText:  parseText,
		parseTree:  parseTree,

		fix:        fix
	});
}
