'use strict';

const hashobj = require('object-hash');
const ms = require('ms');

class Cache extends Map {
	constructor (max_age, interval) {
		super();
		this.max_age = this.ms(max_age) || Infinity;
		this.expires = new Map();
		interval = this.ms(interval);
		this.interval = interval > 0 && interval < Infinity ?
			setInterval(this.trim.bind(this), interval) :
			null;
	}

	ms (ttl) {
		switch (typeof ttl) {
			case 'string':
				ttl = ms(ttl);

				break;
			case 'number':
				ttl = Math.floor(ttl);
				break;
			default:
				break;
		}
		return ttl > 0 ? ttl : this.max_age;
	}

	now () {
		return Date.now();
	}

	has (key) {
		return super.has(key) && this.expires.get(key) > this.now();
	}

	delete (key) {
		this.expires.delete(key);
		return this.delete(key);
	}

	trim () {
		const now = this.now();
		let keys = new Set();
		for (let pair of this.expires) {
			if (pair[1] < now) {
				keys.add(pair[0]);
			}
		}
		for (let key of keys) {
			super.delete(key);
			this.expires.delete(key);
		}
		return keys;
	}

	check (key) {
		return this.expires.get(key) > this.now();
	}

	get (key) {
		return this.check(key) ? super.get(key) : void 0;
	}

	set (key, value, max_age) {
		super.set(key, value);
		this.expires.set(key, this.now() + this.ms(max_age));
		return this;
	}

	clear () {
		this.expires.clear();
		return super.clear();
	}

	get size () {
		this.trim();
		return super.size;
	}

	proxy (fn, max_age) {
		const cache = this;
		const fnkey = hashobj(fn);
		return function () {
			const args = Array.prototype.slice.apply(arguments);
			let key = `${fnkey}:${hashobj(args)}`;
			if (cache.has(key)) {
				return Promise.resolve(cache.get(key));
			}
			else {
				return new Promise((resolve, reject) => {
					try {
						resolve(fn.apply(null, args));
					}
					catch (err) {
						reject(err);
					}
				}).then( results => {
					return cache.set(key, results, max_age).get(key);
				});
			}
		}
	}

}

const mapiter = Map.prototype[Symbol.iterator];
Cache.prototype.entries = function *cacheEntries() {
	for (let pair of this) {
		yield pair;
	}
	return;
};
Cache.prototype.keys = function *cacheKeys() {
	for (let pair of this) {
		yield pair[0];
	}
	return;
};
Cache.prototype.values = function *cacheValues() {
	for (let pair of this) {
		yield pair[1];
	}
	return;
};
Cache.prototype[Symbol.iterator] = function *cacheIterator() {
	const now = this.now();
	for (let pair of mapiter.apply(this)) {
		if (this.expires.get(pair[0]) > now) {
			yield pair;
		}
	}
};


module.exports = Cache;
