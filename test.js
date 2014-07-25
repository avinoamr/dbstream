var assert = require( "assert" );
var dbstream = require( "./dbstream" );

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
            this.push( data.shift() );
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