
createLib('treeTraversalInput', lib => {

	lib.expect('treeTraversalInput', 'pair', 'list', 'tree', 'history', 'markup');

	const [ pair, list, tree ] = lib.use('pair', 'list', 'tree');
	const [ history, markup ]  = lib.use('history', 'markup');


// Abbreviations
	const act = history.actions;


// Cursor Position
	const createPos = (listPos, treePos, offsetPos) => {
		return Object.freeze({
			__proto__: null,

			listPos:   listPos,
			treePos:   treePos,
			offsetPos: offsetPos
		});
	};


// Build An Input
	const create = (container, processKeystroke, render) => {
		// Initialize the state
		const state = history.create(
			100,
			{
				__proto__: null,

				pos:   createPos(0, 0, 0),
				trees: list.nil
			}
		);

		// Lengths (find all 'pos1' elements and filter by 'pos2' traversability)
		const getTreeLengths = () => 
			list.monad.fmap(p => pair.match(p)(
				(i, _) => 
					Array.from(document.querySelectorAll(`[pos1="${i}"]`))
						.filter(x => x.attributes.pos2 !== undefined)
						.length
			))(
				list.index(state.current().trees)
			);


		// Cursor Position
		const updateCursorPos = () => {
			const pos   = state.current().pos;
			const trees = state.current().trees;
			const len   = list.length(trees);

			// Prepare the nodes
			const allNodes = document.querySelectorAll(`[pos2]`);
			const lastNode = allNodes[allNodes.length - 1];

			if (allNodes.length === 0) return;

			const targetNode = document.querySelector(
				`[pos1="${pos.listPos}"][pos2="${pos.treePos}"]`);

			const atEnd = pos.listPos >= len;
			const node  = atEnd ? lastNode : targetNode;

			// Select the node
			const range     = document.createRange();
			const selection = window.getSelection();

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
		const insertTree = tree => {
			const pos   = state.current().pos;
			const trees = state.current().trees;

			const newPos = list.length(trees) === 0 ? 0 : pos.treePos + 1;

			const action = act.prod(
				list.build(
					act.assoc('pos', act.set(pos, createPos(newPos, 0, 0))),
					act.assoc('trees', act.set(trees, list.insert(pos.listPos, tree, trees)))
				)
			);

			state.push(action);
		}

		const setPosition = (listPos, treePos, offsetPos) => {
			const pos    = state.current().pos;
			const newPos = createPos(listPos, treePos, offsetPos);

			const action = act.prod(
				list.build(
					act.assoc('pos',   act.set(pos, newPos)),
					act.assoc('trees', act.doNothing)
				)
			);

			state.push(action);
		}

		const processArrowRight = () => {
			const pos         = state.current().pos;
			const treeLengths = getTreeLengths();
			const len         = list.length(treeLengths);

			if (pos.treePos < list.at(pos.listPos, treeLengths) - 1) {
				setPosition(
					pos.listPos, 
					pos.treePos + 1, 
					pos.offsetPos
				);
			}
			else if (pos.listPos < len - 1) {
				setPosition(
					pos.listPos + 1,
					0,
					0
				);
			}
		}

		const processArrowLeft = () => {
			const pos         = state.current().pos;
			const treeLengths = getTreeLengths();	
			const len         = list.length(treeLengths);

			if (pos.treePos > 0) {
				setPosition(
					pos.listPos,
					pos.treePos - 1,
					pos.offsetPos
				);
			}
			else if (pos.listPos > 0) {
				setPosition(
					pos.listPos - 1,
					list.at(pos.listPos - 1, treeLengths) - 1,
					pos.offsetPos
				);		
			}

		}

		const processTab = () => {
		
		}


		// Initialize Handlers
		
		container.onclick = (event) => {
			event.preventDefault();	
			container.focus();

			const selection = window.getSelection();
			const node      = selection.focusNode.parentNode;
			const pos1Attr  = node.getAttribute('pos1');
			const pos2Attr  = node.getAttribute('pos2');

			container.innerHTML = render(state.current());

			if (pos2Attr != null && pos1Attr != null) {
				const pos2 = parseInt(pos2Attr);
				const pos1 = parseInt(pos1Attr);

				if (selection.focusOffset === node.textContent.length)
					setPosition(pos1, pos2 + 1, 0);
				else
					setPosition(pos1, pos2, selection.focusOffset);
			}

			updateCursorPos();
		}



		const accessors = lib.exports(
			lib.exp(() => state.current(),	'state'),
			lib.exp(insertTree,		'insertTree')
		);

		container.onkeydown = (event) => {
			event.preventDefault();

			switch(event.key) {
				case 'z':
					if (event.ctrlKey) 
						state.backward();
					else 
						processKeystroke('z', accessors);
					break;
				
				case 'y':
					if (event.ctrlKey) 
						state.forward();
					else
						processKeystroke('y', accessors);
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
					processKeystroke(event.key, accessors);
					break;
			}

			container.innerHTML = render(state.current());
			updateCursorPos();
		};


		// Produce Object

		return lib.exports(
			lib.exp(insertTree, 'insertTree')	
		);
	};

	return lib.exports(
		lib.exp(create, 'create')
	);
});
