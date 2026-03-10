
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
	const attributeString = a => `${a.name}='${a.value}'`;

	const openingTag = e => `<${e.tag}${list.foldl('', (a, str) => str + ' ' + attributeString(a))(e.attributes)}>`;

	const closingTag = e => `</${e.tag}>`;


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


	return Object.freeze({
		__proto__:  null,

		attribute:  attribute,
		attr:       attribute,
		element:    element,
		el:         element,

		openingTag: openingTag,
		open:       openingTag,
		closingTag: closingTag,
		close:      closingTag,

		parseOpen:  parseOpeningTag,
		parseClose: parseClosingTag,
		parseTag:   parseTag
	});
}
