const fs = require('fs');
const Module = require('module');

function fix(p) {
  if (typeof p === 'string') {
    return p.replace(/IT-ONLY!/gi, 'IT-ONLY-LINK');
  }
  return p;
}

const origRealpathSync = fs.realpathSync;
const origNative = fs.realpathSync.native;
fs.realpathSync = function(...args) {
  return fix(origRealpathSync.apply(this, args));
};
fs.realpathSync.native = function(...args) {
  return fix(origNative.apply(this, args));
};

const origRealpath = fs.realpath;
fs.realpath = function(path, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = undefined;
  }
  return origRealpath(path, options, (err, resolvedPath) => {
    callback(err, fix(resolvedPath));
  });
};
if ( origRealpath.native ) {
  const origRealpathNative = origRealpath.native;
  fs.realpath.native = function(path, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = undefined;
    }
    return origRealpathNative(path, options, (err, resolvedPath) => {
      callback(err, fix(resolvedPath));
    });
  };
}

if (fs.promises && fs.promises.realpath) {
  const origPromisesRealpath = fs.promises.realpath;
  fs.promises.realpath = async function(...args) {
    const res = await origPromisesRealpath.apply(this, args);
    return fix(res);
  };
}

const origResolveFilename = Module._resolveFilename;
Module._resolveFilename = function(...args) {
  return fix(origResolveFilename.apply(this, args));
};

const origCwd = process.cwd;
process.cwd = function() {
  return fix(origCwd.apply(this, arguments));
};
