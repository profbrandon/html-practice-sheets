

createLib('history', lib => {

	lib.expect('history', 'list');

	const [ list ] = lib.use('list');


// Errors
	let reportError = console.log;

	const expect = (actionName, desired, given, onFail, onSuccess) => {
		if (desired !== given) {
			reportError(`${actionName} action violated: expected '${desired}' but received '${given}'`);
			return onFail();
		}
		else
			return onSuccess();
	};


// Action Utilities
	const buildAction = (commit, revert) => {
		return Object.freeze({
			__proto__: null,

			commit: commit,
			revert: revert
		});
	};

	const doNothing = buildAction(x => x, x => x);

	const reverseAction = action => buildAction(action.revert, action.commit);

	function sequenceActions(actions) {
		if (list.isEmpty(actions))
			return doNothing;
		else {
			const head = list.head(actions);
			const tail = sequenceActions(list.tail(actions));

			return buildAction(
				x => tail.commit(head.commit(x)),
				x => head.revert(tail.revert(x))
			);
		}
	}

	const buildAssoc = (field, action) => {
		return {
			__proto__: null,

			field:  field,
			action: action
		};
	}

	const productAction = (associations) => {
		const applyAll = direction => prod => {
			let obj = Object.create(null);

			let out = list.monad.bind(
				associations,
				assoc => {
					if (assoc['field'] == undefined || assoc['action'] == undefined) {
						reportError(
							`Product action violated: expected the association ${assoc} ` +
							'to have the form { field: ..., action: ... }');
						return list.produce(prod);
					}

					if (prod[assoc.field] == undefined) {
						reportError(`Product action violated: no field '${assoc.field}'`);
						return list.produce(prod);
					}
					else {
						obj[assoc.field] = assoc.action[direction](prod[assoc.field]);
						return list.nil;
					}
				}
			);
		
			if (list.isEmpty(out))
				return Object.freeze(obj);
			else
				return prod;
		};

		return buildAction(
			applyAll('commit'),
			applyAll('revert')
		);
	};

	const setValue = (before, after) => {
		return buildAction(
			x => expect('Set', before, x, () => x, () => after),
			x => expect('Set', after,  x, () => x, () => before)
		);
	};


// History
	const createHistory = (maxLength, value) => {
		let queue = [];
		let ptr   = -1;
		let state = value;

		const push = action => {
			if (queue.length === maxLength && ptr === queue.length)
				queue = queue.slice(1);
			else
				++ptr;

			queue = queue.slice(0, ptr);
			queue.push(action);
			state = action.commit(state);
		};

		const forward = () => {
			if (ptr < queue.length - 1) {
				++ptr;
				state = queue[ptr].commit(state);
			}
		};

		const backward = () => {
			if (ptr >= 0) {
				state = queue[ptr].revert(state);
				--ptr;
			}
		};

		const start = () => {
			while (ptr >= 0) backward();
		};

		const end = () => {
			while (ptr < queue.length - 1) forward();
		};

		const clear = () => {	
			ptr   = -1;
			queue = [];
		};

		const current = () => state;
		const size    = () => queue.length;

		return lib.exports(
			lib.exp(current,	'current'),
			lib.exp(size,		'size'),

			lib.exp(clear,		'clear'),

			lib.exp(push,		'push'),

			lib.exp(forward,	'forward'),
			lib.exp(backward,	'backward'),

			lib.exp(start,		'start'),
			lib.exp(end,		'end')
		);
	};

	return lib.exports(
		lib.exp(createHistory,	'create'),

		lib.exp(lib.exports(
				lib.exp(f => { reportError = f },	'setStream')
			),
			'errors'),

		lib.exp(lib.exports(
				lib.exp(buildAction,		'build'),

				lib.exp(doNothing,		'doNothing', 'nothing'),
				lib.exp(setValue,		'setValue', 'set'),
				
				lib.exp(reverseAction,		'reverse'),
				lib.exp(sequenceActions,	'sequenceActions', 'seq'),

				lib.exp(productAction,		'produce', 'prod'),

				lib.exp(buildAssoc,		'assoc')
			),
			'actions')
	);
});
