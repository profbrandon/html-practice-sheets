
function monadLib() {

	const create = (fmap, produce, join, bind) => {

		const seq2 = (ma, mb) => bind(ma, _ => mb);

		function seq() {
			const arr = Array.from(arguments);

			if (arr.length === 0) 
				return undefined;

			let result = arr[0];

			for (let i = 1; i < arr.length; ++i)
				result = seq2(result, arr[i]);

			return result;
		}

		const kleisli = (mg, mf) => a => bind(mf(a), mg);

		return Object.freeze({
			__proto__: null,
			
			fmap:    fmap,
			produce: produce,
			join:    join,
			bind:    bind,
			kleisli: kleisli,
			seq:     seq
		})
	}

	const create1 = (fmap, produce, join) => {

		const bind = (ma, mf) => join(fmap(mf)(ma));

		return create(fmap, produce, join, bind);
	}

	const create2 = (produce, bind) => {

		const fmap = f => ma => bind(ma, a => produce(f(a)));

		const join = mma => bind(mma, ma => ma);

		return create(fmap, produce, join, bind);
	}

	return Object.freeze({
		__proto__: null,

		create:  create,
		create1: create1,
		create2: create2
	})
}
