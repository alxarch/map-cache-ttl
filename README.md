# map-cache-ttl

Map subclass for use as simple cache *with* expiration

## Usage

```js

const Cache = require('map-cache-ttl');

let cache = new Cache('5s', '1m');
// Will cache for 5seconds by default
// and trim() expired pairs every minute

cache.set('foo', {bar: 'baz'}, '30s');
// will cache in 'foo' key for 30 seconds
cache.has('foo'); // true
//... 30 seconds later
cache.has('foo'); // false


const getRawBody = require('raw-body');
let requests = 0;
const proxy = cache.proxy((url) => new Promise((resolve, reject) => {
	requests += 1;
	http
		.get(url, res => res.statusCode == 200 ?
			resolve(getRawBody(res)) :
			reject(new Error(`${res.statusCode} ${res.statusMessage}`))
		)
		.on('error', reject);
}), '30s');

// requests is 1
proxy('https://github.com')
	.then( github => console.log(github) ) // requests is 1
	.then( () => proxy('https://github.com') ) // requests is 1, cache hit
	.then( () => ... ) // 1 min later
	.then( () => proxy('https://github.com') )
	.then( github => console.log(github) ); // requests is 2, github page fresh
```


### `new Cache(max_age, interval)`

*max_age* sets the default max age for keys. If not set or is less then 1ms
it will default to `Infinity` and keys will *never* expire unless a per-key
`max_age` is passed during `cache.set(key, value, max_age)` or `cache.proxy(fn, max_age)`.  

*interval* sets a `setInterval` for `cache.trim()` to automatically
trim expired keys. Default is to set no interval and use `cache.trim()`
manually to free up expired objects.

### `cache.get(key)`

Will return the stored value for the specified key if the expiration time is in
the future.

### `cache.has(key)`

Will return `true` if a value is stored the specified key and it has not expired.

### `cache.set(key, value, max_age)`

Cache a value into a specific key.

The *key* can be any type other then `string` as `Cache` extends `Map` objects.
The *value* will be cached for `max_age` ms *but* it's contents are _not_ protected
from modifications in any way. It's the value's user's responsibility to ensure
that the values will not be modified if this is desired.

If no *max_age* is provided or it is less then 1ms it will default to the cache's
default to `cache.max_age`.

### `cache.proxy(fn, max_age)`

Will return a wrapper `function` that will cache the results of the first
function invocation for every set of arguments. This works by hashing arguments
using [object-hash](https://www.npmjs.com/package/object-hash). The proxy `function`
always returns a `Promise`

### `cache.trim()`

Clean up __expired__ key/value pairs.

### `cache.clear()`

Clear __all__ key/value pairs.

### `cache.size`

Will return the number of *not expired* items.

 > __Caution__ This will also trigger a `cache.trim()` to calculate the correct size.
