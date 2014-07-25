var assert = require( "assert" );
var dbstream = require( "./dbstream" );

describe( "DatabaseStream", function () {

    it( "Writes objects", function ( done ) {
        var stream = new dbstream.DatabaseStream();
        var saved = [];
        stream._save = function( object, callback ) {
            saved.push( object );
            callback();
        }

        stream.on( "finish", function () {
            assert.equal( saved.length, 2 );
            assert.equal( saved[ 0 ].name, "Hello" );
            assert.equal( saved[ 1 ].name, "World" );
            done();
        });
        stream.write( { name: "Hello" } );
        stream.write( { name: "World" } );
        stream.end();
    });

    it( "Reads objects", function ( done ) {
        var stream = new dbstream.DatabaseStream();
        var data = [
            { name: "Hello" },
            { name: "World" }
        ];
        stream._load = function ( size ) {
            this.push( data.shift() );
        }

        var read = [];
        stream.find({})
        stream.on( "data", function ( object ) {
            read.push( object );
        });
        stream.on( "end", function () {
            assert.equal( read.length, 2 );
            assert.equal( read[ 0 ].name, "Hello" );
            assert.equal( read[ 1 ].name, "World" );
            done();
        });
    });

    it( "Removes objects", function ( done ) {
        var stream = new dbstream.DatabaseStream();
        var removed = [];
        stream._remove = function( chunk, callback ) {
            removed.push( chunk );
            callback();
        }
        stream.on( "finish", function() {
            assert.equal( removed.length, 2 );
            assert.equal( removed[ 0 ].name, "Hello" );
            assert.equal( removed[ 1 ].name, "World" );
            done();
        })
        stream.remove({ name: "Hello" });
        stream.remove({ name: "World" });
        stream.end();
    });

    // Query API
    it( "Provides the Query API to _load", function ( done ) {
        var stream = new dbstream.DatabaseStream();
        var query, sort, skip, limit;
        stream._load = function() {
            query = this._query;
            sort = this._sort;
            skip = this._skip;
            limit = this._limit;

            this.push( { name: "Hello" } );
            this.push( { name: "World" } );
            this.push( null );
        }
        stream
            .find( { id: 15 } )
            .sort( "name" )
            .sort( "age", -1 )
            .skip( 5 )
            .limit( 3 )
            .toArray(function ( arr ) {
                assert.deepEqual( query, { id: 15 } );
                assert.deepEqual( sort, [
                    { key: "name", direction: 1 },
                    { key: "age", direction: -1 }
                ]);
                assert.equal( skip, 5 );
                assert.equal( limit, 3 );
                assert.equal( arr.length, 2 );
                assert.equal( arr[ 0 ].name, "Hello" );
                assert.equal( arr[ 1 ].name, "World" );
                done();
            });
    });


    // Functional API
    it( "Converts to Array", function ( done ) {
        var stream = new dbstream.DatabaseStream()
        stream._load = function() { this.push( null ) }
        stream.push({ name: "Hello" });
        stream.push({ name: "World" });
        stream.toArray( function ( arr ) {
            assert.equal( arr.length, 2 );
            assert.equal( arr[ 0 ].name, "Hello" );
            assert.equal( arr[ 1 ].name, "World" );
            done();
        })
    });

    it( "Implements filter", function ( done ) {
        var stream = new dbstream.DatabaseStream();
        stream.push( { name: "Hello" });
        stream.push( { name: "World" });
        stream.push( { name: "Foo" });

        stream.filter(function ( obj ) {
            return obj.name != "Foo";
        })
        .toArray(function ( arr ) {
            assert.deepEqual( arr, [ { name: "Hello" }, { name: "World" } ]);
            done();
        })
    });

    it( "Implements each", function ( done ) {
        var stream = new dbstream.DatabaseStream();
        stream.push( { name: "Hello" } );
        stream.push( { name: "World" } );

        var arr = [];
        stream.each( function ( obj ) { arr.push( obj ) })
        .on( "end", function () {
            assert.deepEqual( arr, [ { name: "Hello" }, { name: "World" } ]);
            done();
        })
    });

    it( "Implements map", function ( done ) {
        var stream = new dbstream.DatabaseStream();
        stream.push( { name: "Hello" } );
        stream.push( { name: "World" } );
        var c = 0;
        stream.map( function ( obj ) {
            obj.c = ++c;
            return obj;
        }).toArray( function ( arr ) {
            assert.deepEqual( arr, [ 
                { name: "Hello", c: 1 }, 
                { name: "World", c: 2 } 
            ]);
            done();
        })
    });

    it( "Implements reduce", function ( done ) {
        var stream = new dbstream.DatabaseStream();
        stream.push( { name: "Hello" } );
        stream.push( { name: "World" } );
        stream.reduce(function ( memo, obj ) {
            memo.push( obj );
            memo.push( obj );
            return memo;
        }, [])
        .toArray( function ( arr ) {
            assert.deepEqual( arr, [
                { name: "Hello" },
                { name: "Hello" },
                { name: "World" },
                { name: "World" }
            ]);
            done();
        })
    });

    it( "Requires implementation of _save", function() {
        var s = new dbstream.DatabaseStream();
        assert.throws( function() { s.write( {} ) } );
    });

    it( "Requires implementation of _load", function() {
        var s = new dbstream.DatabaseStream();
        s.find({});
        assert.throws( function() { s.read() } );
    });

    it( "Requires implementation of _remove", function() {
        var s = new dbstream.DatabaseStream();
        assert.throws( function() { s.remove({}) } );
    });

});