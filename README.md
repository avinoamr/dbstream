dbstream
========

DatabaseStream API for creating abstract, portable and functional Node streams for accessing databases.

> Due to the massive fragmentation of Node libraries for accessing different databases, it's difficult to write elegant code that is fully portable across database systems. This API has been designed to encourage similarity between Node modules that are used to access databases. Inspired by [PEP 249](http://legacy.python.org/dev/peps/pep-0249/)

### Usage

This example shows the effectiveness of using Node streams, and the functional, stream-lined API of the `dbstream` API.

```javascript
var db = require( "dbstream-somedb" );
var connection = db.connect( /* settings */ );

// write data
var cursor = new connect.Cursor(); 
cursor.write({ name: "Hello" }) // upsert where id == 1
cursor.write({ name: "World" } // insert
cursor.end();

// read data
new connect.Cursor()
  .find({ name: "Hello" })
  .limit(10)
  .on( "data", console.log ) 
```

###### Insert

Inserting objects involves calling the `write` for each object you wish to write to the database. Once done, call the `end()` method to indicate that no more writes are required. Once everything is saved, the `finish` event will be triggered:

```javascript
cursor.write({ name: "Hello" });
cursor.write({ name: "World" });
cursor.on("finish", function() {
  console.log( "Everything was saved" );
})
cursor.end()
```

###### Upsert

Updating objects is exactly the same as inserting, except that the object contains an `id` field which will cause the operation to be an upsert:

```javascript
cursor.write({ id: 1, name: "Hello" });
cursor.write({ id: 1, name: "World" });
cursor.end(); // just one object will be saved, "World" will override "Hello"
```

###### Remove

Similarily, the `remove` command can be used to remove objects:

```javascript
cursor.remove({ id: 1 });
cursor.on( "finish", function() {
  console.log( "ID: 1 was removed" );
});
cursor.end();
```

###### Read

Reading objects from the database involves defining the query parameters, and then reading the results:


```javascript
cursor.find({ name: "Hello" }).sort("id").skip(1).limit(1);
cursor.on("data", console.log);
cursor.on("end", function() {
  console.log("Done reading");
});
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


### Cursor

Cursors provide the core functionality of the API. They are simply [Node Streams](http://nodejs.org/api/stream.html#stream_class_stream_duplex) that expose an API for defining a Database operation in a DB-agnostic manner:

###### .find(query)

* `query` a key-value Object that defines the database query selection
* Returns the Cursor instance itself
* Throws an exception if the Cursor has already started reading

Sets the query object of the cursor

###### .sort(key [, direction])

* `key` A String for the field-name to sort by
* `direction` An integer that defines the sort direction: 1 for ascending (default), -1 for decending
* Returns the Cursor instance itself
* Throws an exception if the Cursor has already started reading

Sets the sort key and direction of the cursor. Can be called multiple times to define multiple sort keys.

###### .skip(n)

* `n` Number of rows to skip
* Returns the Cursor instance itself
* Throws an exception if the Cursor has already started reading

Sets the number of rows that need to be skipped

###### .limit(n)

* `n` Number of maximum rows to return
* Returns Cursor object itself
* Throws an exception if the Cursor has already started reading

Sets the maximum number of rows to return

###### .write(object, encoding, callback)

* `object` an Object to save. If `id` exists, the operation will be an upsert
* Returns a boolean indicating if the object was processed internally

See [Node Stream.write()](http://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback)

###### .remove(object, callback)

* `object` an Object to remove. Only relevant when there's an `id` field
* Returns a boolean indicating if the object was processed internally

Works exactly like `.write`, only removes the object instead of saving it


### Connection

The Connection object is the top-most 

###### module.connect( settings )

* `settings` a configuration object defined by the concrete implementation
* Returns a Connection object 

High-level constructor of the Connection object. 

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

