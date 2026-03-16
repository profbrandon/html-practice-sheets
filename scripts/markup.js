
function markupLib(pair, list, tree, parse) {

// Elements
	const attribute = (name, value) => {
		return {
			__proto__: null,

			name:  name,
			value: value
		};
	};

	const element = (tag, closed, attributes) => {
		return {
			__proto__: null,

			tag:        tag,
			closed:     closed,
			attributes: attributes
		};
	};

	const text = str => element('text:', true, list.build(attribute('value', str)));


// Rendering Elements as Strings
	const header = e => {
		if (e.tag === 'text:') {
			const str = list.head(e.attributes).value;
			const display = str.length > 64 ? str.slice(0, 32) + ' ... ' + str.slice(-16) : str;

			return e.tag + '"' + display + '"';
		}
		else
			return e.tag + '[' + list.foldr('', (a, s) => `{${a.name}: '${a.value}'}` + s)(e.attributes) + ']';
	}
	
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

	const renderTree = tree.foldr(
		e => e.closed ? `${openingTag(e)}` : `${openingTag(e)}${closingTag(e)}`, 
		(e, cs) => `${openingTag(e)}${list.array(cs).join('')}${closingTag(e)}`);


// Parsing Element Trees
	const parseJSString = parse.tryAll(
		list.build(
			parse.singleQuote, 
			parse.doubleQuote)
	);

	const parseAttribute = parse.bind(
		parse.aWord,
		name => parse.seq(
			parse.aChar('='),
			parse.bind(
				parseJSString,
				value => parse.produce(attribute(name, value)))));

	const parseTagAttributes = parse.bind(
		parse.aWord,
		tag => parse.bind(
			parse.many(parse.seq(parse.aChar(' '), parseAttribute)),
			as => parse.produce(pair.build(tag, as))
		)
	);

	const parseOpeningTag = parse.between(parse.aChar('<'), parseTagAttributes, parse.aChar('>'));

	const parseClosingTag = parse.between(parse.aString('</'), parse.aWord, parse.aChar('>'));

	const parseSelfClosingTag = parse.between(parse.aChar('<'), parseTagAttributes, parse.aString('/>'));

	const parseText = parse.bind(
		// Parse any characters that are not part of an opening or closing tag
		parse.many1(
			parse.bind(
				parse.tryCatch(
					parse.seq(
						parse.tryAll(list.build(parseOpeningTag, parseClosingTag)), 
						parse.produce('')),
					_ => parse.anyChar
				),
				s => s.length === 0 ? parse.fail : parse.produce(s))),
		// Wrap those characters in a 'text:' node.
		cs => parse.produce(tree.leaf(text(
			list.array(list.filter(c => c != '\n', cs)).join('')
		)))
	);

	const parseVoidElement = parse.bind(
		parse.tryAll(list.build(
			parseOpeningTag,
			parseSelfClosingTag
		)),
		p => parse.produce(
			pair.match(p)(
				(tag, attributes) => tree.leaf(element(tag, true, attributes))
			)
		)
	);

	const parseNormalElement = children => parse.bind(
		parseOpeningTag,
		p => parse.bind(
			children,
			cs => parse.bind(
				parseClosingTag,
				close => pair.match(p)(
					(open, attributes) => {
						if (open === close)
							return parse.produce(tree.node(element(open, false, attributes), cs));
						else
							return parse.failBecause(`ending tag '${close}' does not match the opening tag '${open}'`);
					})
			)
		)
	);

	const fix = (f) => parse.bind(
		parse.produce(g => g(fix(g))),
		q => q(f)		
	);

	const parseTree = parseNormalElement(
		fix(cs => 
			parse.many(
				parse.tryAll(list.build(
					parseText,
					parseNormalElement(cs),
					parseVoidElement
				))
			)
		)
	);


// Library
	return Object.freeze({
		__proto__:  null,

		attribute:  attribute,
		attr:       attribute,
		element:    element,
		el:         element,

		text:       text,

		header:     header,
		openingTag: openingTag,
		open:       openingTag,
		closingTag: closingTag,
		close:      closingTag,
		renderTree: renderTree,

		parse: Object.freeze({
			__proto__: null,

			open:          parseOpeningTag,
			close:         parseClosingTag,
			selfClose:     parseSelfClosingTag,

			voidElement:   parseVoidElement,
			voidEl:        parseVoidElement,
			normalElement: parseNormalElement,
			normEl:        parseNormalElement,

			text:          parseText,
			tree:          parseTree
		}),

		fix:        fix
	});
}
