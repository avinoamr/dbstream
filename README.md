Database Stream API Specification for Node.js
========

A Database Stream (or Cursor) is an abstract interface for creating portable and generic modules for accessing databases  using Node Streams. The API specification is Database-agnostic which makes it easy to switch databases, configurations and implementations seamlessly. Write your code once - and it will run against any database.

> Due to the massive fragmentation of Node libraries for accessing different databases, it's difficult to write elegant code that is fully portable across database systems. This API has been designed to encourage similarity between Node modules that are used to access databases. Inspired by Python's [PEP 249](http://legacy.python.org/dev/peps/pep-0249/)

### Available Implementations

* [dbstream-memory](https://github.com/avinoamr/dbstream-memory) Memory-based database API
* [dbstream-fs](https://github.com/avinoamr/dbstream-fs) File-based database API
* [dbstream-mongo](https://github.com/avinoamr/dbstream-mongo) MongoDB-based database API

### Usage

This example shows the effectiveness of using Node streams, and the functional, stream-lined API of the `dbstream` API.

```javascript
var db = require( "dbstream-somedb" );
var connection = db.connect( /* settings */ );

// write data
var cursor = new connect.Cursor(); 
cursor.write({ name: "Hello", id: 1 }); // upsert where id == 1
cursor.write({ name: "World" }); // insert
cursor.end();

// read data
new connect.Cursor()
  .find({ name: "Hello" })
  .limit(10)
  .on( "data", console.log ) 
```

Because cursors are just Node Streams, you can pipe them together to construct functional data-processing pipelines:

```javascript
var es = require("event-stream");
cursor.find({ name: "Hello" })
  .pipe(es.map(function(obj, callback){
    obj.name += "!";
    callback(obj);
  })
  .pipe(new Cursor()) // write the modifications back to the database
  .pipe(process.stdout) // write the saved object to stdout
```


### Class: dbstream.Cursor

Cursors provide the core functionality of the API. They are simply [Node Streams](http://nodejs.org/api/stream.html#stream_class_stream_duplex) that expose an API for defining a Database operation in a DB-agnostic manner:

Cursors represent a single database operation, and are executed lazily when the `cursor.read()` method is executed (or in [flowing mode](http://nodejs.org/api/stream.html#stream_class_stream_readable), when a listener is attached to the `'data'` event)

###### cursor.find(query)

* `query` a key-value Object that defines the database query selection
* Returns the Cursor instance itself

Sets the query object of the cursor

```javascript
cursor.find({ name: "Hello" });
cursor.on("data", console.log);
cursor.on("end", function() {
  console.log("Done reading");
});
```

###### cursor.sort(key [, direction])

* `key` A String for the field-name to sort by
* `direction` An integer that defines the sort direction: 1 for ascending (default), -1 for decending
* Returns the Cursor instance itself

Sets the sort key and direction of the cursor. Can be called multiple times to define multiple sort keys.

###### cursor.skip(n)

* `n` Number of rows to skip
* Returns the Cursor instance itself

Sets the number of rows that need to be skipped

###### cursor.limit(n)

* `n` Number of maximum rows to return
* Returns Cursor object itself

Sets the maximum number of rows to return

###### cursor.write(object, encoding, callback)

* `object` an Object to save. If `id` exists, the operation will be an upsert
* Returns a boolean indicating if the object was processed internally

See [Node Stream.write()](http://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback)

```javascript
cursor.write({ name: "Hello" });
cursor.write({ name: "World", id: 1 }); // upsert
cursor.on("finish", function() {
  console.log( "Everything was saved" );
})
cursor.end()
```

###### cursor.remove(object, callback)

* `object` an Object to remove. Only relevant when there's an `id` field
* Returns a boolean indicating if the object was processed internally

Works exactly like `.write`, only removes the object instead of saving it

```javascript
cursor.remove({ id: 1 });
cursor.on( "finish", function() {
  console.log( "ID: 1 was removed" );
});
cursor.end();
```

### Implementation

Any module that implements this API, is dbstreams-compatible, which will make it fully portable across database systems. However, this module provides a skeleton Cursor that you can extend which will make the construction of libraries easier. Your module just needs to implement the `_save`, `_load`, `_remove` and the `connect` method on the module:

```javascript
var db = require("dbstream");
var util = require("util");

util.inherits(MyCursor, db.Cursor);
function MyCursor () {
  MyCursor.super_.call( this );
}

MyCursor.prototype._load = function (size) {
  // read objects from the database, and call this.push( object ) for each one
  // when you're done reading, call this.push( null )
  // Use this._query, this._sort, this._skip and this._limit
}

MyCursor.prototype._save = function (object, callback) {
  // insert (or upsert, if there's an id)  the object, and call callback() when done
}

MyCursor.prototype._remove = function (object, callback) {
  // remove object (preferrably by id) and call callback() when done
}

module.exports.connect = function( settings ) {
  return {
    Cursor: MyCursor // expose the Cursor constructor
  }
}

```

