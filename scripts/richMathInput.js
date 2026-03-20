
function richMathInputLib(pair, list, tree, expr, history, markup, mathML, parse, win, doc) {

// Character Utility
	const isDigit = c => ('0' <= c && c <= '9');
	const isAlpha = c => ('a' <= c && c <= 'z') || ('A' <= c && c <= 'Z');


// Abbreviations
	const act = history.actions;


// Cursor Position
	const createPos = (exprPos, treePos, offsetPos) => {
		return Object.freeze({
			__proto__: null,

			exprPos:   exprPos,
			treePos:   treePos,
			offsetPos: offsetPos
		});
	};


// Build An Input
	const create = () => {
		// Set up the elements
		const container = doc.createElement('div');

		container.classList.add('rich-math-input');
		container.contentEditable = true;


		const startText = doc.createElement('span');

		startText.classList.add('rich-math-input-start-text');
		startText.innerHTML = "type here...";


		const math = markup.el(
			"math",
			false,
			list.build(
				markup.attr("display", "block")
			)
		);


		// Initialize the state
		const state = history.create(
			100,
			{
				__proto__: null,

				pos:   createPos(0, 0, 0),
				exprs: list.nil
			}
		);


		
		const nontraversable = list.build('^', '/');


		// Lengths
		const getExprLengths = () => {
			return list.fmap(
				t => list.length(
					expr.get.traversal(tree.labels.addIf(
						expr.label.skip,
						ev => expr.isOp(ev) && 
							list.contains(
								x => x === ev.value.symbol,
								nontraversable
							)
					)(tree.labels.create(t)))
				)
			)(state.current().exprs);
		}


		// Cursor Position
		const updateCursorPos = () => {
			const pos   = state.current().pos;
			const exprs = state.current().exprs;
			const len   = list.length(exprs);
			const exprLengths = getExprLengths();

			// Prepare the nodes
			const allNodes = doc.querySelectorAll(`[pos]`);
			const lastNode = allNodes[allNodes.length - 1];

			if (allNodes.length === 0) return;

			const targetNode = doc.querySelector(`[expos="${pos.exprPos}"][pos="${pos.treePos}"]`);

			const atEnd = pos.exprPos >= len;
			const node  = atEnd ? lastNode : targetNode;

			// Select the node
			const range     = doc.createRange();
			const selection = win.getSelection();

			range.setStart(node, pos.offsetPos);
			range.setEnd(node, pos.offsetPos);
			selection.removeAllRanges();
			selection.addRange(range);

			if (atEnd)
				selection.collapseToEnd();
			else	
				selection.collapseToStart();
		};


		// Event Methods
		const insertExpr = e => {
			const pos   = state.current().pos;
			const exprs = state.current().exprs;

			const newPos = list.length(exprs) === 0 ? 0 : pos.exprPos + 1;

			const action = act.prod(
				list.build(
					act.assoc('pos', act.set(pos, createPos(newPos, 0, 0))),
					act.assoc('exprs', act.set(exprs, list.insert(pos.exprPos, e, exprs)))
				)
			);

			state.push(action);
		}

		const setPosition = (exprPos, treePos, offsetPos) => {
			const pos    = state.current().pos;
			const newPos = createPos(exprPos, treePos, offsetPos);

			const action = act.prod(
				list.build(
					act.assoc('pos',   act.set(pos, newPos)),
					act.assoc('exprs', act.doNothing)
				)
			);

			state.push(action);
		}

		const processDigit = c => insertExpr(expr.num(c));

		const processAlpha = c => insertExpr(expr.ind(c));


		const processNegative = () => {
				
		}

		const processBinaryOp = op => {
			const e = expr.lookupOp(op)(expr.placeholder(), expr.placeholder()); 

			if (e != undefined)
				insertExpr(e);
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

		const processArrowRight = () => {
			const pos   = state.current().pos;
			const exprs = state.current().exprs;
			const len   = list.length(exprs);
			const exprLengths = getExprLengths();

			if (pos.treePos < list.at(pos.exprPos, exprLengths) - 1) {
				setPosition(
					pos.exprPos, 
					pos.treePos + 1, 
					pos.offsetPos
				);
			}
			else if (pos.exprPos < len - 1) {
				setPosition(
					pos.exprPos + 1,
					0,
					0
				);
			}
		}

		const processArrowLeft = () => {
			const pos   = state.current().pos;
			const exprs = state.current().exprs;
			const len   = list.length(exprs);
			const exprLengths = getExprLengths();

			if (pos.treePos > 0) {
				setPosition(
					pos.exprPos,
					pos.treePos - 1,
					pos.offsetPos
				);
			}
			else if (pos.exprPos > 0) {
				setPosition(
					pos.exprPos - 1,
					list.at(pos.exprPos - 1, exprLengths) - 1,
					pos.offsetPos
				);		
			}

		}

		const processTab = () => {
		
		}


		// Rendering Methods

		const render = () => {
			const exprs = state.current().exprs;

			if (list.isEmpty(exprs))
				return startText.outerHTML;


			const treePosLabeled = list.bind(
				exprs,
				e => list.produce(
					expr.label.pos(tree.labels.addIf(	
						expr.label.skip,
						ev => expr.isOp(ev) && 
							list.contains(
								x => x == ev.value.symbol,
								nontraversable
							)
					)(tree.labels.create(e)))
				),
			);

			const exprPosLabeled = list.bind(
				list.index(treePosLabeled),
				p => pair.match(p)(
					(i, e) => list.produce(
						tree.labels.addIf(
							tree.labels.build('expos', i), 
							_ => true
						)(
						tree.labels.removeIf(
							expr.label.skip,
							_ => true
						)
						(e)))
				)
			);

			const htmlTree = tree.node(
				math,
				list.fmap(mathML.markupLabeledExprTree)(exprPosLabeled)
			);

			return markup.renderTree(htmlTree);
		}

		const get = () => {
			container.innerHTML = render();
			return container;
		}


		// Initialize Handlers
		
		container.onclick = (event) => {
			event.preventDefault();	
			container.focus();

			const selection = win.getSelection();
			const node      = selection.focusNode.parentNode;
			const posAttr   = node.getAttribute('pos');
			const exposAttr = node.getAttribute('expos');

			container.innerHTML = render();

			if (posAttr != null && exposAttr != null) {
				const pos   = parseInt(posAttr);
				const expos = parseInt(exposAttr);

				if (selection.focusOffset === node.textContent.length)
					setPosition(expos, pos + 1, 0);
				else
					setPosition(expos, pos, selection.focusOffset);

				updateCursorPos();
			}
		}

		container.onkeydown = (event) => {
			event.preventDefault();

			let needsToUpdate = false;

			if (event.ctrlKey) {
				switch(event.key) {
					case 'z':
						state.backward();
						break;

					case 'y':
						state.forward();
						break;
				}

				needsToUpdate = true;
			}
			else if (event.key.length === 1) {
				const key = event.key;

				if (isDigit(key)) {
					processDigit(key);
					needsToUpdate = true;
				}
				else if (isAlpha(key)) {
					processAlpha(key);
					needsToUpdate = true;
				}	
				else {
					switch(key) {
						case '+':
						case '*':
						case '/':
						case '^':
							processBinaryOp(key);
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

					case 'Tab':
						processTab();
						break;

					case 'ArrowLeft':
						processArrowLeft();
						break;

					case 'ArrowRight':
						processArrowRight();
						break;

					default:
						return;
				}
			}

			if (needsToUpdate)
				container.innerHTML = render();

			updateCursorPos();
		};


		// Produce Object

		return Object.freeze({
			__proto__: null,
			
			get: get
		});
	};


	return Object.freeze({
		__proto__: null,

		create: create
	});
}
