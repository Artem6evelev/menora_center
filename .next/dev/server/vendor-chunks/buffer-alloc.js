/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/buffer-alloc";
exports.ids = ["vendor-chunks/buffer-alloc"];
exports.modules = {

/***/ "(action-browser)/./node_modules/buffer-alloc/index.js":
/*!********************************************!*\
  !*** ./node_modules/buffer-alloc/index.js ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("var bufferFill = __webpack_require__(/*! buffer-fill */ \"(action-browser)/./node_modules/buffer-fill/index.js\")\nvar allocUnsafe = __webpack_require__(/*! buffer-alloc-unsafe */ \"(action-browser)/./node_modules/buffer-alloc-unsafe/index.js\")\n\nmodule.exports = function alloc (size, fill, encoding) {\n  if (typeof size !== 'number') {\n    throw new TypeError('\"size\" argument must be a number')\n  }\n\n  if (size < 0) {\n    throw new RangeError('\"size\" argument must not be negative')\n  }\n\n  if (Buffer.alloc) {\n    return Buffer.alloc(size, fill, encoding)\n  }\n\n  var buffer = allocUnsafe(size)\n\n  if (size === 0) {\n    return buffer\n  }\n\n  if (fill === undefined) {\n    return bufferFill(buffer, 0)\n  }\n\n  if (typeof encoding !== 'string') {\n    encoding = undefined\n  }\n\n  return bufferFill(buffer, fill, encoding)\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFjdGlvbi1icm93c2VyKS8uL25vZGVfbW9kdWxlcy9idWZmZXItYWxsb2MvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQUEsaUJBQWlCLG1CQUFPLENBQUMseUVBQWE7QUFDdEMsa0JBQWtCLG1CQUFPLENBQUMseUZBQXFCOztBQUUvQztBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EiLCJzb3VyY2VzIjpbIi9Vc2Vycy9hYXJvbnNoYWxldi9EZXNrdG9wL0FydGNvZGVzaCBXZWJTdHVkaW8vTWVub3JhaCBDZW50ZXIgLSBSaXNob24gTGV6aW9uL21lbm9yYS9ub2RlX21vZHVsZXMvYnVmZmVyLWFsbG9jL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbInZhciBidWZmZXJGaWxsID0gcmVxdWlyZSgnYnVmZmVyLWZpbGwnKVxudmFyIGFsbG9jVW5zYWZlID0gcmVxdWlyZSgnYnVmZmVyLWFsbG9jLXVuc2FmZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYWxsb2MgKHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2Ygc2l6ZSAhPT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInNpemVcIiBhcmd1bWVudCBtdXN0IGJlIGEgbnVtYmVyJylcbiAgfVxuXG4gIGlmIChzaXplIDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInNpemVcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBuZWdhdGl2ZScpXG4gIH1cblxuICBpZiAoQnVmZmVyLmFsbG9jKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5hbGxvYyhzaXplLCBmaWxsLCBlbmNvZGluZylcbiAgfVxuXG4gIHZhciBidWZmZXIgPSBhbGxvY1Vuc2FmZShzaXplKVxuXG4gIGlmIChzaXplID09PSAwKSB7XG4gICAgcmV0dXJuIGJ1ZmZlclxuICB9XG5cbiAgaWYgKGZpbGwgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBidWZmZXJGaWxsKGJ1ZmZlciwgMClcbiAgfVxuXG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSB1bmRlZmluZWRcbiAgfVxuXG4gIHJldHVybiBidWZmZXJGaWxsKGJ1ZmZlciwgZmlsbCwgZW5jb2RpbmcpXG59XG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(action-browser)/./node_modules/buffer-alloc/index.js\n");

/***/ })

};
;