dbstream
========

DatabaseStream API for creating abstract, portable and functional Node streams for accessing databases

#### Example

```javascript
var db = require( "dbstream-somedb" );

var connection = db.connect();
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


#### Connection

###### module.connect( settings )

* `settings` a configuration object defined by the concrete implementation
* Returns a Connection object 

High-level constructor of the Connection object. 

