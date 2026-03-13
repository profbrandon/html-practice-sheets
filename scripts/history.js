

function historyLib(list) {

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

			let out = list.bind(
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

		return Object.freeze({
			__proto__: null,

			current:  () => state,
			size:     () => queue.length,

			clear:    clear,

			push:     push,

			forward:  forward,
			backward: backward,

			start:    start,
			end:      end
		});
	};
	
	return Object.freeze({
		__proto__: null,

		errors: Object.freeze({
			__proto__: null,

			setStream: f => { reportError = f }
		}),

		actions: Object.freeze({
			__proto__: null,

			build:     buildAction,

			reverse:   reverseAction,
			sequence:  sequenceActions,
			seq:       sequenceActions,
			product:   productAction,
			prod:      productAction,

			assoc:     buildAssoc,

			doNothing: doNothing,
			setValue:  setValue,
			set:       setValue
		}),

		create: createHistory
	});
}
