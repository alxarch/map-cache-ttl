'use strict';
const DEFAULT_TTL = Infinity;

class Cache extends Map {

	constructor (ttl, interval) {
		super();
		this.ttl = ttl > 0 ? parseInt(ttl) : DEFAULT_TTL;
		this.expires = new Map();
		this.interval = interval > 0 ?
			setInterval(this.trim.bind(this), interval) :
			null;
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

	set (key, value, ttl) {
		super.set(key, value);
		ttl = ttl > 0 ? ttl : this.ttl;
		this.expires.set(key, this.now() + ttl);
		return this;
	}

	clear () {
		this.expires.clear();
		return super.clear();
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
