// Generated by CoffeeScript 1.7.1
var DataLock;

DataLock = (function() {
  function DataLock() {
    this.locks = {};
  }

  DataLock.prototype.isLock = function(lock) {
    return (this.locks[lock] != null) && this.locks[lock];
  };

  DataLock.prototype.addLock = function(lock) {
    if (!this.isLock[lock]) {
      this.locks[lock] = true;
      return setTimeout((function(_this) {
        return function() {
          if (_this.isLock(lock)) {
            return delete _this.locks[lock];
          }
        };
      })(this), 2000);
    }
  };

  DataLock.prototype.removeLock = function(lock) {
    return delete this.locks[lock];
  };

  DataLock.prototype.runIfUnlock = function(lock, callback) {
    var handleCallback;
    handleCallback = (function(_this) {
      return function() {
        if (_this.isLock(lock)) {
          return setTimeout(handleCallback, 10);
        } else {
          return callback();
        }
      };
    })(this);
    return handleCallback();
  };

  return DataLock;

})();

module.exports = new DataLock();
