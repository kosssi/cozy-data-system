// Generated by CoffeeScript 1.7.1
var checkToken, db, fs, initApplication, initHomeProxy, permissions, productionOrTest, tokens;

db = require('../helpers/db_connect_helper').db_connect();

fs = require('fs');

permissions = {};

tokens = {};

productionOrTest = process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test";

checkToken = function(auth, callback) {
  var password, username;
  if (auth !== "undefined" && (auth != null)) {
    auth = auth.substr(5, auth.length - 1);
    auth = new Buffer(auth, 'base64').toString('ascii');
    username = auth.split(':')[0];
    password = auth.split(':')[1];
    if (password !== void 0 && tokens[username] === password) {
      return callback(null, true, username);
    } else {
      return callback(null, false, username);
    }
  } else {
    return callback(null, false, null);
  }
};

module.exports.checkDocType = function(auth, docType, callback) {
  if (productionOrTest) {
    return checkToken(auth, (function(_this) {
      return function(err, isAuthenticated, name) {
        if (isAuthenticated) {
          if (docType != null) {
            docType = docType.toLowerCase();
            if (permissions[name][docType] != null) {
              return callback(null, name, true);
            } else if (permissions[name]["all"] != null) {
              return callback(null, name, true);
            } else {
              return callback(null, name, false);
            }
          } else {
            return callback(null, name, true);
          }
        } else {
          return callback(null, false, false);
        }
      };
    })(this));
  } else {
    return callback(null, true, true);
  }
};

module.exports.checkProxyHome = function(auth, callback) {
  var password, username;
  if (productionOrTest) {
    if (auth !== "undefined" && (auth != null)) {
      auth = auth.substr(5, auth.length - 1);
      auth = new Buffer(auth, 'base64').toString('ascii');
      username = auth.split(':')[0];
      password = auth.split(':')[1];
      if (password !== void 0 && tokens[username] === password) {
        if (username === "proxy" || username === "home") {
          return callback(null, true);
        } else {
          return callback(null, false);
        }
      } else {
        return callback(null, false);
      }
    } else {
      return callback(null, false);
    }
  } else {
    return callback(null, true);
  }
};

module.exports.updatePermissions = function(body, callback) {
  var description, docType, name, _ref, _results;
  name = body.slug;
  if (productionOrTest) {
    if (body.password != null) {
      tokens[name] = body.password;
    }
    permissions[name] = {};
    if (body.permissions != null) {
      _ref = body.permissions;
      _results = [];
      for (docType in _ref) {
        description = _ref[docType];
        _results.push(permissions[name][docType.toLowerCase()] = description);
      }
      return _results;
    }
  }
};

initHomeProxy = function(callback) {
  var token;
  token = process.env.TOKEN;
  token = token.split('\n')[0];
  tokens['home'] = token;
  permissions.home = {
    "application": "authorized",
    "notification": "authorized",
    "user": "authorized",
    "device": "authorized",
    "alarm": "authorized",
    "cozyinstance": "authorized",
    "encryptedkeys": "authorized",
    "send mail to user": "authorized"
  };
  tokens['proxy'] = token;
  permissions.proxy = {
    "user": "authorized",
    "cozyinstance": "authorized",
    "device": "authorized",
    "usetracker": "authorized"
  };
  return callback(null);
};

initApplication = function(appli, callback) {
  var description, docType, name, _ref;
  name = appli.slug;
  if (appli.state === "installed") {
    tokens[name] = appli.password;
    if ((appli.permissions != null) && appli.permissions !== null) {
      permissions[name] = {};
      _ref = appli.permissions;
      for (docType in _ref) {
        description = _ref[docType];
        docType = docType.toLowerCase();
        permissions[name][docType] = description;
      }
    }
  }
  return callback(null);
};

module.exports.init = function(callback) {
  if (productionOrTest) {
    return initHomeProxy(function() {
      return db.view('application/all', function(err, res) {
        if (err) {
          return callback(new Error("Error in view"));
        } else {
          res.forEach(function(appli) {
            return initApplication(appli, function() {});
          });
          return callback(tokens, permissions);
        }
      });
    });
  } else {
    return callback(tokens, permissions);
  }
};