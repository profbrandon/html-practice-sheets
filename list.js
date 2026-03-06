
function listLib() {

	const isEmpty = as => as.length === 0;

	const head = as => as[0];
	const tail = as => as.slice(1);
	const cons = (a, as) => {
		let temp = as.slice();
		temp.unshift(a);
		return temp;
	};

	const append = (a, as) => {
		let temp = as.slice();
		temp.push(a);
		return temp;
	};

	const foldr = (seed, f) => as => {
		if (isEmpty(as))
			return seed;
		else
			return f(foldr(seed, f)(tail(as)), head(as));
	};



	return Object.freeze({
		isEmpty: isEmpty,

		head:    head,
		tail:    tail,

		cons:    cons,
		append:  append,

		foldr:   foldr
	});
}
