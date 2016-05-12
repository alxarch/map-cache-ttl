'use strict';
const co = require('co');
const assert = require('assert');
const Cache = require('.');
const get = (map, key) => Map.prototype.get.call(map, key);
describe('Cache', () => {
	describe('Cache#clear()', () => {
		it('Clears keys and expires', done => {
			const c = new Cache(10);
			const bar = {};
			const baz = {};
			c.set('foo', bar);
			c.set('bar', baz, 30);
			setTimeout(() => {
				assert.equal(c.size, 1);
				c.clear();
				assert.equal(c.size, 0, 'clears keys');
				assert.equal(c.expires.size, 0, 'clears expires');
				done();
			}, 20);
		});
	});
	describe('Cache#entries()', () => {
		it('Returns non expired keys', done => {
			const c = new Cache(10);
			const bar = {};
			const baz = {};
			c.set('foo', bar);
			c.set('bar', baz, 30);
			setTimeout(() => {
				for (let pair of c.entries()) {
					assert.notEqual(pair[0], 'foo', 'Skips expired keys');
				}
				done();

			}, 20);
		});
	});
	describe('Cache#keys()', () => {
		it('Returns non expired keys', done => {
			const c = new Cache(10);
			const bar = {};
			const baz = {};
			c.set('foo', bar);
			c.set('bar', baz, 30);
			setTimeout(() => {
				for (let key of c.keys()) {
					assert.notEqual(key, 'foo', 'Skips expired keys');
				}
				done();

			}, 20);
		});
	});
	describe('Cache#values()', () => {
		it('Returns non expired values', done => {
			const c = new Cache(10);
			const bar = {};
			const baz = {};
			c.set('foo', bar);
			c.set('bar', baz, 30);
			setTimeout(() => {
				for (let value of c.values()) {
					assert.notEqual(value, bar, 'Skips expired keys');
				}
				done();

			}, 20);
		});
	});
	describe('Cache#forEach()', () => {
		it('Iterates through non expired keys', done => {
			const c = new Cache(10);
			const bar = {};
			const baz = {};
			c.set('foo', bar);
			c.set('bar', baz, 30);
			setTimeout(() => {
				c.forEach((key, value) => {
					assert.notEqual(key, 'foo', 'Skips expired keys');
				});
				done();

			}, 20);
		});
	});
	describe('Cache#@@iterator', () => {
		it('Iterates through non expired keys', done => {
			const c = new Cache(10);
			const bar = {};
			const baz = {};
			c.set('foo', bar);
			c.set('bar', baz, 30);
			setTimeout(() => {
				for (let pair of c) {
					assert.notEqual(pair[0], 'foo', 'Skips expired keys');
				}

				done();

			}, 20);
		});
	});

	describe('new Cache()', () => {
		it('Works with no arguments', () => {
			const c = new Cache();
			assert.strictEqual(c.ttl, Infinity);
			assert.strictEqual(c.interval, null);
		});
		it('Is instance of Map', () => {
			const c = new Cache();
			assert.ok(c instanceof Map, 'Instance of Map');
		});
		it('Sets ttl', () => {
			let c = new Cache(4);
			assert.strictEqual(c.ttl, 4);
			c = new Cache('7');
			assert.strictEqual(c.ttl, 7);
		});
		it('Ignores invalid ttl', () => {
			let c = new Cache(-4);
			assert.equal(c.ttl, Infinity);
			c = new Cache(null);
			assert.equal(c.ttl, Infinity);
			c = new Cache(undefined);
			assert.equal(c.ttl, Infinity);
			c = new Cache('foo');
			assert.equal(c.ttl, Infinity);
			c = new Cache({});
			assert.equal(c.ttl, Infinity);
		});

	});
	describe('Cache#set(key)', () => {
		let c;
		const ttl = 50;
		const now = Date.now();
		beforeEach(() => {
			c = new Cache(ttl);
			// Override now() to test values
			c.now = () => now;
		});
		it('Caches a value', () => {
			const bar = {};
			c.set('foo', bar);
			assert.strictEqual(get(c, 'foo'), bar);
			assert.strictEqual(c.get('foo'), bar, 'Stores the value');
			assert.strictEqual(get(c.expires, 'foo'), now + ttl);
			return co( done => {
				setTimeout(() => {
					assert.strictEqual(c.has('foo'), false, 'Reports not having expired keys');
					assert.strictEqual(c.get('foo'), undefined, 'Returns undefined for expired key');
					assert.strictEqual(get(c, 'foo'), obj);
					done();
				}, ttl + 1)
			});
		});
	});

});
