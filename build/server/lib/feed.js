// Generated by CoffeeScript 1.7.1
var Client, Feed, S, client, data, fs, lines,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

fs = require('fs');

S = require('string');

Client = require('request-json').JsonClient;

client = new Client('http://localhost:5984');

if (process.env.NODE_ENV === 'production') {
  data = fs.readFileSync('/etc/cozy/couchdb.login');
  lines = S(data.toString('utf8')).lines();
  client.setBasicAuth(lines[0], lines[1]);
}

module.exports = Feed = (function() {
  var deleted_ids;

  Feed.prototype.db = void 0;

  Feed.prototype.feed = void 0;

  Feed.prototype.axonSock = void 0;

  deleted_ids = {};

  function Feed() {
    this._onChange = __bind(this._onChange, this);
    this.publish = __bind(this.publish, this);
    this.logger = require('printit')({
      date: true,
      prefix: 'helper/db_feed'
    });
  }

  Feed.prototype.initialize = function(server) {
    this.startPublishingToAxon();
    return server.on('close', (function(_this) {
      return function() {
        _this.stopListening();
        if (_this.axonSock != null) {
          return _this.axonSock.close();
        }
      };
    })(this));
  };

  Feed.prototype.startPublishingToAxon = function() {
    var axon;
    axon = require('axon');
    this.axonSock = axon.socket('pub-emitter');
    this.axonSock.bind(9105);
    this.logger.info('Pub server started');
    return this.axonSock.sock.on('connect', (function(_this) {
      return function() {
        return _this.logger.info("An application connected to the change feeds");
      };
    })(this));
  };

  Feed.prototype.startListening = function(db) {
    this.stopListening();
    this.feed = db.changes({
      since: 'now'
    });
    this.feed.on('change', this._onChange);
    this.feed.on('error', (function(_this) {
      return function(err) {
        _this.logger.error("Error occured with feed : " + err.stack);
        return _this.stopListening();
      };
    })(this));
    return this.db = db;
  };

  Feed.prototype.stopListening = function() {
    if (this.feed != null) {
      this.feed.stop();
      this.feed.removeAllListeners('change');
      this.feed = null;
    }
    if (this.db != null) {
      return this.db = null;
    }
  };

  Feed.prototype.publish = function(event, id) {
    return this._publish(event, id);
  };

  Feed.prototype._publish = function(event, id) {
    this.logger.info("Publishing " + event + " " + id);
    if (this.axonSock != null) {
      return this.axonSock.emit(event, id);
    }
  };

  Feed.prototype._onChange = function(change) {
    var doc, isCreation, operation;
    if (change.deleted) {
      if (!deleted_ids[change.id]) {
        doc = {
          _id: change.id,
          _rev: change.changes[0].rev
        };
        return this.db.post(doc, (function(_this) {
          return function(err, doc) {
            return client.get("/cozy/" + change.id + "?revs_info=true", function(err, res, doc) {
              return _this.db.get(change.id, doc._revs_info[2].rev, function(err, doc) {
                var binary, binary_rev, _ref;
                if (doc.docType === 'File' && (((_ref = doc.binary) != null ? _ref.file : void 0) != null)) {
                  binary = doc.binary.file.id;
                  binary_rev = doc.binary.file.rev;
                  deleted_ids[binary] = 'deleted';
                  _this.db.get(binary, function(err, doc) {
                    if (err) {
                      return;
                    }
                    if (doc) {
                      return _this.db.remove(binary, binary_rev, function(err, doc) {
                        return _this._publish("binary.delete", doc._id);
                      });
                    }
                  });
                }
                return _this.db.get(change.id, function(err, document) {
                  deleted_ids[change.id] = 'deleted';
                  return _this.db.remove(change.id, document.rev, function(err, res) {
                    var doctype, _ref1;
                    doctype = doc != null ? (_ref1 = doc.docType) != null ? _ref1.toLowerCase() : void 0 : void 0;
                    _this.feed.emit("deletion." + doc._id);
                    if (doctype != null) {
                      _this._publish("" + doctype + ".delete", doc._id);
                    }
                  });
                });
              });
            });
          };
        })(this));
      } else {
        return delete deleted_ids[change.id];
      }
    } else {
      isCreation = change.changes[0].rev.split('-')[0] === '1';
      operation = isCreation ? 'create' : 'update';
      return this.db.get(change.id, (function(_this) {
        return function(err, doc) {
          var doctype, _ref;
          if (err != null) {
            _this.logger.error(err);
          }
          doctype = doc != null ? (_ref = doc.docType) != null ? _ref.toLowerCase() : void 0 : void 0;
          if (doctype) {
            return _this._publish("" + doctype + "." + operation, doc._id);
          }
        };
      })(this));
    }
  };

  return Feed;

})();

module.exports = new Feed();
