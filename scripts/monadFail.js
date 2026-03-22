
function monadFailLib(monad) {

	const create = (monad, zero) => {

		const guard = b => b ? monad.produce({}) : zero;

		const filter = (condx, mx) => 
			monad.bind(
				mx, 
				x => monad.seq(
					guard(condx), 
					monad.produce(x)));

		let output = {
			__proto__: null,

			zero:   Object.freeze(zero),
			fail:   Object.freeze(zero),

			guard:  Object.freeze(guard),
			filter: Object.freeze(filter)
		};

		for (const field in monad)
			output[field] = monad[field];

		return Object.freeze(output);
	}

	return Object.freeze({
		__proto__: null,

		monad:  monad,

		create: create
	})
}
