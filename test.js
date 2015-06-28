var dbstream = require( "./dbstream" );
var stream = require( "stream" );
var assert = require( "assert" );
var util = require( "util" );

module.exports = function ( connection ) {
    util.inherits( Map, stream.Transform );
    function Map ( fn ) {
        Map.super_.call( this, { objectMode: true } );
        this._fn = fn;
    }
    Map.prototype._transform = function ( obj, encoding, callback ) {
        this.push( this._fn( obj ) );
        callback();
    }

    return function ( done ) {
        var out = [], results = [];
        var cursor = new connection.Cursor();
        [
            { name: "Hello", age: 5, id: 1 },
            { name: "World", age: 8, id: 2 },
            { name: "Foo", age: 10, id: 3 },
            { name: "Alice", age: 14 },
            { name: "Bob", age: 17 },
            { name: "Charlie", age: 21 },
            { name: "David", age: 10 }
        ].forEach( cursor.write, cursor );

        cursor.on( "finish", function () {
            new connection.Cursor()
                .find({ age: { $gt: 6, $lt: 20 } })
                .skip( 1 )
                .limit( 2 )
                .sort( "name" )
                .on( "data", out.push.bind( out ) )
                .pipe(new Map(function ( obj ) {
                    return { id: obj.id, name: obj.name, age: obj.age * 2 }
                }))
                .pipe( new connection.Cursor() )
                .on( "finish", function () {
                    this.find({})
                        .sort( "age", -1 )
                        .on( "data", results.push.bind( results) )
                        .on( "end", function () {
                            assert.deepEqual( out, [
                                { name: "Bob", age: 17, id: out[ 0 ].id },
                                { name: "David", age: 10, id: out[ 1 ].id },
                            ]);
                            assert.deepEqual( results, [
                                { name: "Bob", age: 34, id: results[ 0 ].id },
                                { name: "Charlie", age: 21, id: results[ 1 ].id },
                                { name: "David", age: 20, id: results[ 2 ].id },
                                { name: "Alice", age: 14, id: results[ 3 ].id },
                                { name: "Foo", age: 10, id: 3 },
                                { name: "World", age: 8, id: 2 },
                                { name: "Hello", age: 5, id: 1 },
                            ])
                            done();
                        })
                })
        })
        .end();
    }

}


describe( "DatabaseStream", function () {

    it( "Writes objects", function ( done ) {
        var cursor = new dbstream.Cursor()
        var saved = [];
        cursor._save = function( object, callback ) {
            saved.push( object );
            callback();
        }

        cursor.on( "finish", function () {
            assert.equal( saved.length, 2 );
            assert.equal( saved[ 0 ].name, "Hello" );
            assert.equal( saved[ 1 ].name, "World" );
            done();
        });
        cursor.write( { name: "Hello" } );
        cursor.write( { name: "World" } );
        cursor.end();
    });

    it( "Reads objects", function ( done ) {
        var cursor = new dbstream.Cursor();
        var data = [
            { name: "Hello" },
            { name: "World" }
        ];
        cursor._load = function ( size ) {
            this.push( data.shift() || null );
        }

        var read = [];
        cursor.find({})
        cursor.on( "data", function ( object ) {
            read.push( object );
        });
        cursor.on( "end", function () {
            assert.equal( read.length, 2 );
            assert.equal( read[ 0 ].name, "Hello" );
            assert.equal( read[ 1 ].name, "World" );
            done();
        });
    });

    it( "Removes objects", function ( done ) {
        var cursor = new dbstream.Cursor();
        var removed = [];
        cursor._remove = function( chunk, callback ) {
            removed.push( chunk );
            callback();
        }
        cursor.on( "finish", function() {
            assert.equal( removed.length, 2 );
            assert.equal( removed[ 0 ].name, "Hello" );
            assert.equal( removed[ 1 ].name, "World" );
            done();
        })
        cursor.remove({ name: "Hello" });
        cursor.remove({ name: "World" });
        cursor.end();
    });

    // Query API
    it( "Provides the Query API to _load", function ( done ) {
        var cursor = new dbstream.Cursor();
        var query, sort, skip, limit;
        cursor._load = function() {
            query = this._query;
            sort = this._sort;
            skip = this._skip;
            limit = this._limit;

            this.push( { name: "Hello" } );
            this.push( { name: "World" } );
            this.push( null );
        }
        var arr = [];
        cursor
            .find( { id: 15 } )
            .sort( "name" )
            .sort( "age", -1 )
            .skip( 5 )
            .limit( 3 )
            .on( "data", function ( obj ) { arr.push( obj ) })
            .on( "end", function () {
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

    it( "Requires implementation of _save", function() {
        var cursor = new dbstream.Cursor();
        assert.throws( function() { cursor.write( {} ) } );
    });

    it( "Requires implementation of _load", function() {
        var cursor = new dbstream.Cursor();
        cursor.find({});
        assert.throws( function() { cursor.read() } );
    });

    it( "Requires implementation of _remove", function() {
        var cursor = new dbstream.Cursor();
        assert.throws( function() { cursor.remove({}) } );
    });

});


