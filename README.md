dbstream
========

DatabaseStream API for creating abstract, portable and functional Node streams for accessing databases.

> Due to the massive fragmentation of Node libraries for accessing different databases, it's difficult to write elegant code that is fully portable across database systems. This API has been designed to encourage similarity between Node modules that are used to access databases. Inspired by [PEP 249](http://legacy.python.org/dev/peps/pep-0249/)

#### Example

This example shows the effectiveness of using Node streams, and the functional, stream-lined API of the `dbstream` API.

```javascript
var db = require( "dbstream-somedb" );
var es = require( "event-stream" );
var connection = db.connect();

var cursor = new connect.Cursor(); 
cursor.write({ id: 1, name: "Hello", i: 0 }) // upsert where id == 1
cursor.write({ name: "World", i: 0 } // insert
cursor.on( "error", console.error ).end();

new connect.Cursor()
  .find({}) // query for everything
  .limit(10)
  
  // because Cursors are just Streams, they can be piped together to construct a functional data-processing pipeline
  .pipe(es.map(function( obj ) {
    obj.i += 1;
    return obj;
  })
  .pipe( new connect.Cursor() ); // write the changes back to the database with a new cursor
  .on( "finish", function() {
    console.log( "Done. Everything was saved." );
  })
  .end();
```

#### Cursor

The Cursor is a Node Duplex Stream that represents a database cursor or a single database operation

###### .find(query)

* `query` a key-value Object that defines the database query selection
* Returns the Cursor instance itself


###### .sort(key [, direction])

* `key` A String for the field-name to sort by
* `direction` An integer that defines the sort direction: 1 for ascending (default), -1 for decending
* Returns the Cursor instance itself

###### .skip(n)

* `n` Number of rows to skip
* Returns the Cursor instance itself


###### .limit(n)

* `n` Number of maximum rows to return
* Returns Cursor object itself

#### Connection

###### module.connect( settings )

* `settings` a configuration object defined by the concrete implementation
* Returns a Connection object 

High-level constructor of the Connection object. 

