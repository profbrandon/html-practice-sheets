
createLib('markup', lib => {

	lib.expect('markup', 'pair', 'list', 'tree', 'parse');

	const [ pair, list, tree, parse ] = lib.use('pair', 'list', 'tree', 'parse');


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

	const tag        = e => e.tag;
	const closed     = e => e.closed;
	const attributes = e => e.attributes;

	const rawText = e => list.head(e.attributes).value;

	const text = str => element('text:', true, list.build(attribute('value', str)));

	const isText = e => e.tag === 'text:';


// Rendering Elements as Strings
	const header = e => {
		if (isText(e)) {
			const str = list.head(e.attributes).value;
			const display = str.length > 64 ? str.slice(0, 32) + ' ... ' + str.slice(-16) : str;

			return e.tag + '"' + display + '"';
		}
		else
			return e.tag + '[' + list.foldr('', (a, s) => `{${a.name}: '${a.value}'}` + s)(e.attributes) + ']';
	}
	
	const attributeString = a => `${a.name}='${a.value}'`;

	const openingTag = e => {
		if (isText(e))
			return list.head(e.attributes).value;
		else
			return `<${e.tag}${list.foldl('', (a, str) => str + ' ' + attributeString(a))(e.attributes)}${e.closed ? '/' : ''}>`;
	};

	const closingTag = e => {
		if (isText(e))
			return '';
		else
			return `</${e.tag}>`;
	}

	const renderTree = tree.foldr(
		e => e.closed ? `${openingTag(e)}` : `${openingTag(e)}${closingTag(e)}`, 
		(e, cs) => `${openingTag(e)}${list.array(cs).join('')}${closingTag(e)}`);


// Parsing Element Trees
	const parseJSString = parse.tryAll(list.build(
		parse.str.singleQuote, 
		parse.str.doubleQuote
	));

	const parseAttribute = parse.monad.bind(
		parse.str.aWord,
		name => parse.monad.seq(
			parse.str.ing('='),
			parse.monad.bind(
				parseJSString,
				value => parse.monad.produce(attribute(name, value)))));

	const parseTagAttributes = parse.monad.bind(
		parse.str.aWord,
		tag => parse.monad.bind(
			parse.many(parse.monad.seq(parse.str.ing(' '), parseAttribute)),
			as => parse.monad.produce(pair.build(tag, as))
		)
	);

	const parseOpeningTag = parse.between(parse.str.ing('<'), parseTagAttributes, parse.str.ing('>'));

	const parseClosingTag = parse.between(parse.str.ing('</'), parse.str.aWord, parse.str.ing('>'));

	const parseSelfClosingTag = parse.between(parse.str.ing('<'), parseTagAttributes, parse.str.ing('/>'));

	const parseText = parse.monad.bind(
		// Parse any characters that are not part of an opening or closing tag
		parse.many1(
			parse.monad.bind(
				parse.tryCatch(
					parse.monad.seq(
						parse.tryAll(list.build(parseOpeningTag, parseClosingTag)), 
						parse.monad.produce('')),
					_ => parse.str.anyChar
				),
				s => s.length === 0 ? parse.monad.fail : parse.monad.produce(s))),
		// Wrap those characters in a 'text:' node.
		cs => parse.monad.produce(tree.leaf(text(
			list.array(list.monad.filter(c => c != '\n', cs)).join('')
		)))
	);

	const parseVoidElement = parse.monad.bind(
		parse.tryAll(list.build(
			parseOpeningTag,
			parseSelfClosingTag
		)),
		p => parse.monad.produce(
			pair.match(p)(
				(tag, attributes) => tree.leaf(element(tag, true, attributes))
			)
		)
	);

	const parseNormalElement = children => parse.monad.bind(
		parseOpeningTag,
		p => parse.monad.bind(
			children,
			cs => parse.monad.bind(
				parseClosingTag,
				close => pair.match(p)(
					(open, attributes) => {
						if (open === close)
							return parse.monad.produce(tree.node(element(open, false, attributes), cs));
						else
							return parse.failBecause(`ending tag '${close}' does not match the opening tag '${open}'`);
					})
			)
		)
	);

	const fix = (f) => parse.monad.bind(
		parse.monad.produce(g => g(fix(g))),
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
	return lib.exports(
		lib.exp(lib.exports(
				lib.exp(attribute,	'attribute', 'attr', 'at'),
				lib.exp(element,	'element', 'elem', 'el'),
				lib.exp(text,		'text', 'txt'),
			),
			'build'),

		lib.exp(lib.exports(
				lib.exp(closed,		'closed')
			),
			'is'),

		lib.exp(lib.exports(
				lib.exp(tag,		'tag'),
				lib.exp(attributes,	'attributes', 'attrs', 'ats'),
				lib.exp(rawText,	'rawText')
			),
			'get'),

		lib.exp(lib.exports(
				lib.exp(attribute,	'attribute', 'attr', 'at'),
				lib.exp(openingTag,	'openingTag', 'open'),
				lib.exp(closingTag,	'closingTag', 'close'),
				lib.exp(header,		'header'),
				lib.exp(renderTree,	'tree')
			),
			'render'),

		lib.exp(lib.exports(
				lib.exp(parseTree,		'tree', 'markup'),	

				lib.exp(parseText,		'text'),

				lib.exp(parseOpeningTag,	'open'),
				lib.exp(parseClosingTag,	'close'),	
				lib.exp(parseSelfClosingTag,	'selfClosingTag'),
			
				lib.exp(parseVoidElement,	'voidElement', 'voidEl', 'leaf', 'singleton'),
				lib.exp(parseNormalElement,	'normalElement', 'normEl', 'branch', 'node'),
			),
			'parse')
	);
});
