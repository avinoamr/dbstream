var stream = require( "stream" );
var util = require( "util" );

// Functional API
util.inherits( Stream, stream.Transform );
function Stream ( connection ) {
    Stream.super_.call( this, { objectMode: true } );
    this.connection = connection;
}

Stream.prototype.toArray = function ( fn, ctx ) {
    var arr = [];
    return this
        .on( "data", function ( obj ) { arr.push( obj ) } )
        .on( "end",  function () { fn.call( ctx || this, arr ) } );
}

Stream.prototype.filter = function ( fn, ctx ) {
    var s = new Stream();
    s._transform = function ( obj, encoding, callback ) {
        if ( fn.call( ctx || this, obj ) ) this.push( obj );
        callback();
    }
    return this.pipe( s );
}

Stream.prototype.map = function ( fn, ctx ) {
    var s = new Stream();
    s._transform = function ( obj, encoding, callback ) {
        this.push( fn.call( ctx || this, obj ) );
        callback();
    }
    return this.pipe( s );
}

Stream.prototype.reduce = function ( fn, memo, ctx ) {
    var s = new Stream();
    s._transform = function ( obj, encoding, callback ) {
        memo = fn.call( ctx || this, memo, obj );
        callback();
    }
    this.on( "end", function() {
        if ( !Array.isArray( memo ) ) { memo = [ memo ] }
        memo.forEach( s.push, s );
    });
    return this.pipe( s );
}

Stream.prototype.each = Stream.prototype.forEach = function ( fn, ctx ) {
    return this.on( "data", function ( obj ) { fn.call( ctx || this, obj ) } );
}

// Database API
util.inherits( DatabaseStream, Stream );
function DatabaseStream ( connection ) {
    DatabaseStream.super_.call( this, connection );
}

DatabaseStream.prototype._save = function ( obj, callback ) {
    throw new Error( "_save is not implemented" );
}

DatabaseStream.prototype._remove = function ( obj, callback ) {
    throw new Error( "_remove is not implemented" );
}

DatabaseStream.prototype._load = function ( size ) {
    throw new Error( "_load is not implemented" );
}

DatabaseStream.prototype.remove = function ( chunk, encoding, callback ) {
    return this.write( { $remove: chunk }, encoding, callback );
}

DatabaseStream.prototype._read = function ( size ) {
    if ( !this._query ) return this.push( null ); // nothing to query
    return this._load( size );
}

DatabaseStream.prototype._write = function ( chunk, encoding, callback ) {
    return ( chunk.$remove )
        ? this._remove( chunk.$remove, callback ) 
        : this._save( chunk, callback );
}

// Query API
DatabaseStream.prototype.find = function ( query ) {
    this._query = query;
    return this;
}

DatabaseStream.prototype.sort = function ( key, direction ) {
    this._sort || ( this._sort = [] );
    this._sort.push( { key: key, direction: direction || 1 });
    return this;
}

DatabaseStream.prototype.skip = function ( n ) {
    this._skip = n;
    return this;
}

DatabaseStream.prototype.limit = function ( n ) {
    this._limit = n;
    return this;
}


module.exports.DatabaseStream = DatabaseStream;