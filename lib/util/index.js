const _ = require('lodash');

function classCase( str ) {
  return str && typeof str === 'string' ?
    _.upperFirst(_.camelCase(str)) :
    '';
}

function nop( x ) {
  return x;
}

function type( obj ) {
  return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
}

function extend( target, value, path ) {
  _.set(target, path, _.extend({}, _.get(target, path), value));
}

function scalar( obj ) {
  if ( Array.isArray(obj) && obj.length === 1 ) {
    return obj[0];
  }
  return obj;
}

function sortByKeys( obj ) {
  if ( !obj ) return obj;
  const o = {};
  Object.keys(obj).sort().forEach(( key ) => {
    o[key] = obj[key];
  });
  return o;
}

module.exports = {
  classCase,
  type,
  extend,
  scalar,
  sortByKeys,
  nop,
};
