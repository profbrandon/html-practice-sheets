
createLib('mathInput', lib => {

	lib.expect('mathInput', 
		'pair', 'list', 'tree', 'expr', 
		'history', 'markup', 'mathML', 'treeTraversalInput');
	
	const [ pair, list, tree, expr, history, markup, mathML ] = 
		lib.use('pair', 'list', 'tree', 'expr', 'history', 'markup', 'mathML');

	const [ traversal ] = lib.use('treeTraversalInput');


// Character Utility
	const isDigit = c => ('0' <= c && c <= '9');
	const isAlpha = c => ('a' <= c && c <= 'z') || ('A' <= c && c <= 'Z');


// Abbreviations
	const act = history.actions;

	
	const create = () => {

	// Set up the elements
		const container = document.createElement('div');

		container.classList.add('rich-math-input');
		container.contentEditable = true;


		const startText = document.createElement('span');

		startText.classList.add('rich-math-input-start-text');
		startText.innerHTML = "type here...";


		const math = markup.build.el(
			"math",
			false,
			list.build(
				markup.build.attr("display", "block")
			)
		);

		
		const nontraversable = list.build('^', '/');




		// Event Methods
		const processDigit = (c, get) => get.insertTree(expr.num(c));
		const processAlpha = (c, get) => get.insertTree(expr.ind(c));


		const processNegative = () => {
				
		}

		const processBinaryOp = (op, get) => {
			const e = expr.lookupOp(op)(expr.placeholder(), expr.placeholder()); 

			if (e != undefined)
				get.insertTree(e);
		}

		const processOpenParen = () => {
		
		}

		const processCloseParen = () => {
		
		}

		const processEscape = () => {
		
		}

		const processDelete = () => {
		
		}

		const processBackspace = () => {
		
		}


		// Rendering Methods

		const render = (state) => {
			const exprs = state.trees;

			if (list.isEmpty(exprs))
				return startText.outerHTML;

			const treePosLabeled = list.monad.bind(
				exprs,
				e => list.monad.produce(
					expr.label.pos(tree.label.addIf(	
						expr.label.skip,
						ev => expr.isOp(ev) && 
							list.contains(
								x => x == ev.value.symbol,
								nontraversable
							)
					)(tree.label.tree(e)))
				),
			);

			const exprPosLabeled = list.monad.bind(
				list.index(treePosLabeled),
				p => pair.match(p)(
					(i, e) => list.monad.produce(
						tree.label.addIf(
							tree.label.build('pos1', i), 
							_ => true
						)(
						tree.label.removeIf(
							expr.label.skip,
							_ => true
						)
						(e)))
				)
			);

			const htmlTree = tree.node(
				math,
				list.monad.fmap(mathML.markupLabeledExprTree)(exprPosLabeled)
			);

			return markup.render.tree(htmlTree);
		}


		const processKeystroke = (key, get) => {

			let needsToUpdate = false;
		
			if (key.length === 1) {
				if (isDigit(key)) {
					processDigit(key, get);
					needsToUpdate = true;
				}
				else if (isAlpha(key)) {
					processAlpha(key, get);
					needsToUpdate = true;
				}	
				else {
					switch(key) {
						case '+':
						case '*':
						case '/':
						case '^':
							processBinaryOp(key, get);
							break;
							
						case '-':
							processNegative();
							break;
						
						case '(':
							processOpenParen();
							break;

						case ')':
							processCloseParen();
							break;

						default:
							return;
					}

					needsToUpdate = true;
				}
			}
			else {
				switch(event.key) {
					case 'Escape':
						processEscape();
						break;

					case 'Backspace':
						processBackspace();
						needsToUpdate = true;
						break;

					case 'Delete':
						processDelete();
						needsToUpdate = true;
						break;

					default:
						return;
				}
			}
		};
	
		const treeTraversal = traversal.create(container, processKeystroke, render);


		return lib.exports(
			lib.exp(() => container,	'get')
		);
	};

	return lib.exports(
		lib.exp(create,	'create')
	);
});
