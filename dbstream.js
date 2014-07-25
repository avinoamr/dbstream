var stream = require( "stream" );
var util = require( "util" );

// Functional API
util.inherits( Cursor, stream.Duplex );
function Cursor () {
    Cursor.super_.call( this, { objectMode: true } );
}

Cursor.prototype._save = function ( obj, callback ) {
    throw new Error( "_save is not implemented" );
}

Cursor.prototype._remove = function ( obj, callback ) {
    throw new Error( "_remove is not implemented" );
}

Cursor.prototype._load = function ( size ) {
    throw new Error( "_load is not implemented" );
}

Cursor.prototype.remove = function ( chunk, encoding, callback ) {
    return this.write( { $remove: chunk }, encoding, callback );
}

Cursor.prototype._read = function ( size ) {
    if ( !this._query ) return this.push( null ); // nothing to query
    return this._load( size );
}

Cursor.prototype._write = function ( chunk, encoding, callback ) {
    return ( chunk.$remove )
        ? this._remove( chunk.$remove, callback ) 
        : this._save( chunk, callback );
}

// Query API
Cursor.prototype.find = function ( query ) {
    this._query = query;
    return this;
}

Cursor.prototype.sort = function ( key, direction ) {
    this._sort || ( this._sort = [] );
    this._sort.push( { key: key, direction: direction || 1 });
    return this;
}

Cursor.prototype.skip = function ( n ) {
    this._skip = n;
    return this;
}

Cursor.prototype.limit = function ( n ) {
    this._limit = n;
    return this;
}


module.exports.Cursor = Cursor;
