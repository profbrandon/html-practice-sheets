

function historyLib() {

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


// Actions
	const buildAction = (commit, revert) => {
		return {
			commit: commit,
			revert: revert
		};
	};

	const doNothing = buildAction(x => x, x => x);

	const setValue = (before, after) => {
		return buildAction(
			x => expect('Set', before, x, () => x, () => after),
			x => expect('Set', after,  x, () => x, () => before)
		);
	};

	const productAction = (associations) => {
		if (!(associations instanceof Array)) {
			reportError('Product action expects an array of { field: ..., action: ... } pairs.');
			return;
		}

		const applyAll = direction => prod => {
			let obj = {};

			for (let i = 0; i < associations.length; ++i) {
				const assoc = associations[i];

				if (assoc[field] == undefined || assoc[action] == undefined) {
					reportError(
						`Product action violated: expected the association ${assoc} ` +
						'to have the form { field: ..., action: ... }');
					return prod;
				}

				if (prod[assoc.field] == undefined) {
					reportError(`Product action violated: no field '${assoc.field}'`);
					return prod;
				}
				else
					obj[assoc.field] = assoc.action[direction](prod[assoc.field]);
			}

			return obj;
		};

		return buildAction(
			applyAll('commit'),
			applyAll('revert')
		);
	};


// History
	const createHistory = (maxLength, value) => {
		let queue = [];
		let ptr   = -1;
		let state = value;

		const push = action => {
			if (queue.length === maxLength)
				queue.slice(1);
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

		const reset = () => {
			start();
			ptr   = -1;
			queue = [];
		};


		return Object.freeze({
			current:  () => state,
			push:     push,
			forward:  forward,
			backward: backward,
			start:    start,
			end:      end,
			reset:    reset
		});
	};
	
	return Object.freeze({

		errors: Object.freeze({
			setStream: f => { reportError = f }
		}),

		actions: Object.freeze({
			build:     buildAction,
			product:   productAction,

			doNothing: doNothing,
			set:       setValue
		}),

		create: createHistory
	});
}
