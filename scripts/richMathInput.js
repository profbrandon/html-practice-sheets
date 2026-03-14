
function richMathInputLib(list, tree, expr, history, markup, mathML, parse, win, doc) {

// Character Utility
	const isDigit = c => ('0' <= c && c <= '9');
	const isAlpha = c => ('a' <= c && c <= 'z') || ('A' <= c && c <= 'Z');


// Abbreviations
	const act = history.actions;


// Build An Input
	const create = () => {
		// Set up the internals
		const container = doc.createElement('div');

		container.classList.add('rich-math-input');
		container.contentEditable = true;

		const math = markup.el(
			"math",
			list.build(
				markup.attr("display", "block")
			)
		);


		const state = history.create(
			100,
			{
				__proto__: null,

				pos:   0,
				exprs: list.nil
			}
		);


		// Event Methods

		const processDigit = c => {
			const exprs = state.current().exprs;

			const action = act.prod(
				list.build(
					act.assoc('pos',   act.doNothing),
					act.assoc('exprs', act.set(exprs, list.cons(expr.num(c), exprs)))
				)
			);

			state.push(action);
		}

		const processAlpha = c => {

		}

		const processNegative = () => {
				
		}

		const processBinaryOp = op => {
			const exprs = state.current().exprs;

			const e = expr.lookupOp(op)(expr.placeholder, expr.placeholder); 

			if (e === undefined) return;

			const action = act.prod(
				list.build(
					act.assoc('pos', act.doNothing),
					act.assoc('exprs', act.set(exprs, list.cons(e, exprs)))
				)
			);

			state.push(action);
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
		
		}

		const processArrowLeft = () => {
		
		}

		const processTab = () => {
		
		}


		// Rendering Methods

		const render = () => {	
			const exprs    = state.current().exprs;

			const htmlTree = tree.node(
				math,
				list.fmap(mathML.markupExprTree)(list.reverse(exprs))
			);

			return markup.renderTree(htmlTree);
		}

		const get = () => container;


		// Initialize Handlers
		
		container.onclick = (event) => {
			event.preventDefault();	
			container.focus();
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

				console.log("pressed: ");
				console.log(key);
				
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
				}
			}

			if (needsToUpdate)
				container.innerHTML = render();
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
