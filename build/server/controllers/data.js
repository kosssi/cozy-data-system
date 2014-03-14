// Generated by CoffeeScript 1.7.1
var client, db, encryption, feed, git, updatePermissions;

git = require('git-rev');

db = require('../helpers/db_connect_helper').db_connect();

feed = require('../lib/feed');

encryption = require('../lib/encryption');

client = require('../lib/indexer');

updatePermissions = require('../lib/token').updatePermissions;

module.exports.encryptPassword = function(req, res, next) {
  var doctype, error, password;
  doctype = req.body.docType;
  if ((doctype == null) || doctype.toLowerCase() !== "application") {
    try {
      password = encryption.encrypt(req.body.password);
    } catch (_error) {
      error = _error;
    }
    if (password != null) {
      req.body.password = password;
    }
    return next();
  } else {
    return next();
  }
};

module.exports.encryptPassword2 = function(req, res, next) {
  var doctypeBody, doctypeDoc, error, password;
  doctypeBody = req.body.docType;
  doctypeDoc = req.doc.docType;
  if ((doctypeBody == null) || doctypeBody.toLowerCase() !== "application") {
    if ((doctypeDoc == null) || doctypeDoc.toLowerCase() !== "application") {
      try {
        password = encryption.encrypt(req.body.password);
      } catch (_error) {
        error = _error;
      }
      if (password != null) {
        req.body.password = password;
      }
      return next();
    } else {
      return next();
    }
  } else {
    return next();
  }
};

module.exports.decryptPassword = function(req, res, next) {
  var doctype, error, password;
  doctype = req.doc.docType;
  if ((doctype == null) || doctype.toLowerCase() !== "application") {
    try {
      password = encryption.decrypt(req.doc.password);
    } catch (_error) {
      error = _error;
    }
    if (password != null) {
      req.doc.password = password;
    }
    return next();
  } else {
    return next();
  }
};

module.exports.index = function(req, res) {
  return git.long(function(commit) {
    return git.branch(function(branch) {
      return git.tag(function(tag) {
        return res.send(200, "<strong>Cozy Data System</strong><br />\nrevision: " + commit + "  <br />\ntag: " + tag + " <br />\nbranch: " + branch + " <br />");
      });
    });
  });
};

module.exports.exist = function(req, res, next) {
  return db.head(req.params.id, function(err, response, status) {
    if (status === 200) {
      return res.send(200, {
        exist: true
      });
    } else if (status === 404) {
      return res.send(200, {
        exist: false
      });
    } else {
      return next(new Error(err));
    }
  });
};

module.exports.find = function(req, res) {
  delete req.doc._rev;
  return res.send(200, req.doc);
};

module.exports.create = function(req, res, next) {
  var doctype;
  delete req.body._attachments;
  doctype = req.body.docType;
  if ((doctype != null) && doctype.toLowerCase() === "application") {
    updatePermissions(req.body);
  }
  if (req.params.id != null) {
    return db.get(req.params.id, function(err, doc) {
      if (doc != null) {
        err = new Error("The document already exists.");
        err.status = 409;
        return next(err);
      } else {
        return db.save(req.params.id, req.body, function(err, doc) {
          if (err != null) {
            err = new Error("The document already exists.");
            err.status = 409;
            return next(err);
          } else {
            return res.send(201, {
              _id: doc.id
            });
          }
        });
      }
    });
  } else {
    return db.save(req.body, function(err, doc) {
      if (err != null) {
        return next(new Error(err.error));
      } else {
        return res.send(201, {
          _id: doc.id
        });
      }
    });
  }
};

module.exports.update = function(req, res, next) {
  var doctype;
  delete req.body._attachments;
  doctype = req.body.docType;
  if ((doctype != null) && doctype.toLowerCase() === "application") {
    updatePermissions(req.body);
  }
  return db.save(req.params.id, req.body, function(err, response) {
    if (err != null) {
      return next(new Error(err.error));
    } else {
      res.send(200, {
        success: true
      });
      return next();
    }
  });
};

module.exports.upsert = function(req, res, next) {
  delete req.body._attachments;
  return db.get(req.params.id, function(err, doc) {
    return db.save(req.params.id, req.body, function(err, savedDoc) {
      if (err != null) {
        return next(new Error(err.error));
      } else if (doc != null) {
        res.send(200, {
          success: true
        });
        return next();
      } else {
        res.send(201, {
          _id: savedDoc.id
        });
        return next();
      }
    });
  });
};

module.exports["delete"] = function(req, res, next) {
  var id, send_success;
  id = req.params.id;
  send_success = function() {
    feed.feed.removeListener("deletion." + id, send_success);
    res.send(204, {
      success: true
    });
    return next();
  };
  return db.remove(id, req.doc.rev, function(err, res) {
    if (err != null) {
      return next(new Error(err.error));
    } else {
      return client.del("index/" + id + "/", function(err, response, resbody) {
        return feed.feed.on("deletion." + id, send_success);
      });
    }
  });
};

module.exports.merge = function(req, res, next) {
  delete req.body._attachments;
  return db.merge(req.params.id, req.body, function(err, doc) {
    if (err != null) {
      return next(new Error(err.error));
    } else {
      res.send(200, {
        success: true
      });
      return next();
    }
  });
};
