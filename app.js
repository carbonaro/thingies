var express = require('express')
  , redis = require('redis')
  , _ = require('underscore')
  , crypto = require('crypto');

// Globals
//
var env = process.env.NODE_ENV || 'development';
var port = (env == 'development' ? 3000 : 40080);
var db = redis.createClient();
var app = express();

// DB Schema
//
// [HASH] authorized_keys
// -> set containing keys of registered things
//    * key -> stores the authorized app id
//
// [HASH] thing:<id>
// -> hash with thing properties
//    * last_seen
//    * private_ip
//    * public_ip
//

// Configuration
//
app.configure(function(){
  app.set('title', 'thingies - simple device manager');
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger());
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
})

// Models
//
function Thing(attributes) {
  var keys = _.intersection(this.keys,Object.keys(attributes));
  for (var i=0; i < keys.length ; i++) {
    this[keys[i]] = attributes[keys[i]];
  }
}

Thing.prototype.keys = ['last_seen', 'private_ip', 'public_ip'];

Thing.prototype.stringify = function() {
  var result = {};
  var key = "";
  for (var i in this.keys) {
    key = this.keys[i];
    if ('undefined' != typeof(this[key])) result[key] = this[key].toString();
  }
  return result;
}

// Utility functions
//
function isValidKey(key, id, callback) {
  db.hget('authorized_keys', key, function(err, result) {
    var isValid = ( (result == id) ? true : false );
    callback(err, isValid);
  });
}

function createHash(s) {
  var shasum = crypto.createHash('sha1');
  shasum.update(s.toString());
  return shasum.digest('hex');
}

// Middleware
//
function validateKey(req, res, next) {
  isValidKey(req.query.key, req.params.id, function(err, isValid) {
    if (err) {
      next(err);
    } else {
      if (isValid)
        next();
      else
        res.send(401, 'Invalid key');
    }
  });
}

// Takes the thing name as sent in the url
// and returns its SHA1 hash
function redisId(req, res, next) {
  if ('undefined' != typeof(req.params.id)) {
    req.redis_id = 'thing:' + createHash(req.params.id);
  }
  next();
}

// Routes
//

// home
app.get('/', function(req, res){
  db.hgetall("authorized_keys", function(err, keys) {
    var id = "";
    var ids = [];
    var multi = db.multi();
    if (err || keys.length == 0) res.send("No things found");
    for (var k in keys) {
      ids.push(keys[k]);
      id = createHash(keys[k]);
      multi.hgetall("thing:" + id);
    }
    multi.exec(function(err, replies) {
      for (var i=0 ; i < replies.length ; i++) {
        replies[i]['id'] = ids[i];
      }
      res.render('home', {things: replies});
    });
  });
});

app.get('/:id', redisId, function(req, res) {
  var redirect_port = req.query.redirect_port;
  db.hget(req.redis_id, 'private_ip', function(err, result) {
    if (err) {
      res.send(500, err);
    } else {
      if (/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/.test(result)) {
        var redirect_uri = req.protocol + '://' + result;
        if ('undefined' != typeof(redirect_port)) redirect_uri = redirect_uri + ":" + redirect_port;
        res.redirect(302, redirect_uri);
      } else {
        res.send(404);
      }
    }
  });
});

// thing page - returns last seen ip address
app.get('/:id/private_ip', [validateKey, redisId], function(req, res){
  db.hget(req.redis_id, 'private_ip', function(err, result) {
    if (err) {
      res.send(500, err);
    } else {
      res.send(200, result);
    }
  });
});

// thing upate
app.post('/:id', [validateKey, redisId], function(req, res){
  var thing = new Thing(req.body);
  thing.last_seen = new Date();  
  db.hmset(req.redis_id, thing.stringify(), function(err, result) {
    if (err) {
      res.send(500, err);
    }
    else
      res.send(200);
  });
});

console.log("Started thingies on port " + port);
app.listen(port);