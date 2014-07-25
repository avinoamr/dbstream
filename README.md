dbstream
========

DatabaseStream API for creating abstract, portable and functional Node streams for accessing databases

#### Example

```javascript
var db = require( "dbstream-somedb" );

var connection = db.connect();
```

#### Connection Object

The Connection object is the top-level object that contains all of t

###### module.connect( settings )

* `settings` a configuration object defined by the concrete implementation
* Returns a Connection object 

High-level constructor of the Connection object. 

