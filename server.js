var express = require("express");
var app = express();
var cfenv = require("cfenv");
var bodyParser = require('body-parser')
var cors = require('cors')

var firebase = require("firebase-admin")

var serviceAccount = require("./serviceAccountKey.json")

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://teamrio-backend.firebaseio.com"
});

// enable loclhost requests
app.use(cors({
  origin: '*'
}))

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

let mydb, cloudant;
var vendor; // Because the MongoDB and Cloudant use different API commands, we
            // have to check which command should be used based on the database
            // vendor.
var dbName = 'mydb';

// Separate functions are provided for inserting/retrieving content from
// MongoDB and Cloudant databases. These functions must be prefixed by a
// value that may be assigned to the 'vendor' variable, such as 'mongodb' or
// 'cloudant' (i.e., 'cloudantInsertOne' and 'mongodbInsertOne')

var insertOne = {};
var getAll = {};

insertOne.cloudant = function(doc, response) {
  mydb.insert(doc, function(err, body, header) {
    if (err) {
      console.log('[mydb.insert] ', err.message);
      response.send("Error");
      return;
    }
    doc._id = body.id;
    response.send(doc);
  });
}

getAll.cloudant = function(response) {
  var names = [];  
  mydb.list({ include_docs: true }, function(err, body) {
    if (!err) {
      body.rows.forEach(function(row) {
        if(row.doc.name)
          names.push(row.doc.name);
      });
      response.json(names);
    }
  });
  //return names;
}

let collectionName = 'mycollection'; // MongoDB requires a collection name.

insertOne.mongodb = function(doc, response) {
  mydb.collection(collectionName).insertOne(doc, function(err, body, header) {
    if (err) {
      console.log('[mydb.insertOne] ', err.message);
      response.send("Error");
      return;
    }
    doc._id = body.id;
    response.send(doc);
  });
}

getAll.mongodb = function(response) {
  var names = [];
  mydb.collection(collectionName).find({}, {fields:{_id: 0, count: 0}}).toArray(function(err, result) {
    if (!err) {
      result.forEach(function(row) {
        names.push(row.name);
      });
      response.json(names);
    }
  });
}

/* Endpoint to greet and add a new visitor to database.
* Send a POST request to localhost:3000/api/visitors with body
* {
*   "name": "Bob"
* }
*/
app.post("/api/visitors", function (request, response) {
  var userName = request.body.name;
  var doc = { "name" : userName };
  if(!mydb) {
    console.log("No database.");
    response.send(doc);
    return;
  }
  insertOne[vendor](doc, response);
});

/**
 * Endpoint to get a JSON array of all the visitors in the database
 * REST API example:
 * <code>
 * GET http://localhost:3000/api/visitors
 * </code>
 *
 * Response:
 * [ "Bob", "Jane" ]
 * @return An array of all the visitor names
 */
app.get("/api/visitors", function (request, response) {
  var names = [];
  if(!mydb) {
    response.json(names);
    return;
  }
  getAll[vendor](response);
});



var sse = require('server-sent-events')


var uid = '/80655ec-04f2-11eb-adc1-0242ac120002130911'

app.get(`/:patientId/stream`, sse, function (request, response) {
  var uuid = request.params.patientId
  var data = firebase.database().ref(uuid)
  data.on('value', function(snap){
    var temperature = snap.val().Temperature
    var pulse = snap.val().Data
    response.sse(`data: ${JSON.stringify({ 
      temperature : temperature,
      pulse: pulse
    })} \n\n`)
  })
})

// biodata -------------------------------------------------

app.get(`/:patientId/biodata`, function (request, response) {
  var data = firebase.database().ref(uid)
  data.once('value').then(function(snap){
    response.json({ 
      name: snap.val().name,
      age: snap.val().age,
      sex: snap.val().sex,
      blood: snap.val().blood,
      weight: snap.val().weight,
      height: snap.val().height,
      race: snap.val().race,
      address: snap.val().address,
      admission: snap.val().admission,
      examination: snap.val().examination,
    })
  })
})

app.post(`/:patientId/biodata`, function (request, response) {
  var data = firebase.database().ref(uid).update({ 
    name: request.body.name,
    age: request.body.age,
    sex: request.body.sex,
    blood: request.body.blood,
    weight: request.body.weight,
    height: request.body.height,
    race: request.body.race,
    address: request.body.address,
    admission: request.body.admission,
    examination: request.body.examination
  })
  response.json(data)
})

// history -------------------------------------------------

app.post(`/:patientId/history`, function (request, response) {
  var data = firebase.database().ref(uid).update({ 
    complaints: request.body.complaints,
    treatment_history: request.body.treatment_history,
    family_history: request.body.family_history
  })
  response.json(data)
})

// name -------------------------------------------------

app.get(`/:patientId/name`, function (request, response) {
  var data = firebase.database().ref(uid)
  data.once('value').then(function(snap){
    var name = snap.val().name
    response.json({ name: name })
  })
})

// age -------------------------------------------------

app.get(`/:patientId/age`, function (request, response) {
  var data = firebase.database().ref(uid)
  data.once('value').then(function(snap){
    var age = snap.val().age
    response.json({ age: age })
  })
})

// sex -------------------------------------------------

app.get(`/:patientId/sex`, function (request, response) {
  var data = firebase.database().ref(uid)
  data.once('value').then(function(snap){
    var sex = snap.val().sex
    response.json({ sex: sex })
  })
})

// blood -------------------------------------------------

app.get(`/:patientId/blood`, function (request, response) {
  var data = firebase.database().ref(uid)
  data.once('value').then(function(snap){
    var blood = snap.val().blood
    response.json({ blood: blood })
  })
})

// weight -------------------------------------------------

app.get(`/:patientId/weight`, function (request, response) {
  var data = firebase.database().ref(uid)
  data.once('value').then(function(snap){
    var weight = snap.val().weight
    response.json({ weight: weight })
  })
})

// height -------------------------------------------------

app.get(`/:patientId/height`, function (request, response) {
  var data = firebase.database().ref(uid)
  data.once('value').then(function(snap){
    var height = snap.val().height
    response.json({ height: height })
  })
})

// race -------------------------------------------------

app.get(`/:patientId/race`, function (request, response) {
  var data = firebase.database().ref(uid)
  data.once('value').then(function(snap){
    var race = snap.val().race
    response.json({ race: race })
  })
})

// address -------------------------------------------------

app.get(`${uid}/address`, function (request, response) {
  var data = firebase.database().ref(uid)
  data.once('value').then(function(snap){
    var address = snap.val().address
    response.json({ address: address })
  })
})

// admission -------------------------------------------------

app.get(`${uid}/admission`, function (request, response) {
  var data = firebase.database().ref(uid)
  data.once('value').then(function(snap){
    var admission = snap.val().admission
    response.json({ admission: admission })
  })
})

// examination -------------------------------------------------

app.get(`${uid}/examination`, function (request, response) {
  var data = firebase.database().ref(uid)
  data.once('value').then(function(snap){
    var examination = snap.val().examination
    response.json({ examination: examination })
  })
})

// complaints -------------------------------------------------

app.get(`${uid}/complaints`, function (request, response) {
  var data = firebase.database().ref(uid)
  data.once('value').then(function(snap){
    var complaints = snap.val().complaints
    response.json({ complaints: complaints })
  })
})

// treatment_history -------------------------------------------------

app.get(`${uid}/treatment_history`, function (request, response) {
  var data = firebase.database().ref(uid)
  data.once('value').then(function(snap){
    var treatment_history = snap.val().treatment_history
    response.json({ treatment_history: treatment_history })
  })
})

// family_history -------------------------------------------------

app.get(`${uid}/family_history`, function (request, response) {
  var data = firebase.database().ref(uid)
  data.once('value').then(function(snap){
    var family_history = snap.val().family_history
    response.json({ family_history: family_history })
  })
})

// ----------------------------------------------------------------

// load local VCAP configuration  and service credentials
var vcapLocal;
try {
  vcapLocal = require('./vcap-local.json');
  console.log("Loaded local VCAP", vcapLocal);
} catch (e) { }

const appEnvOpts = vcapLocal ? { vcap: vcapLocal} : {}

const appEnv = cfenv.getAppEnv(appEnvOpts);

if (appEnv.services['compose-for-mongodb'] || appEnv.getService(/.*[Mm][Oo][Nn][Gg][Oo].*/)) {
  // Load the MongoDB library.
  var MongoClient = require('mongodb').MongoClient;

  dbName = 'mydb';

  // Initialize database with credentials
  if (appEnv.services['compose-for-mongodb']) {
    MongoClient.connect(appEnv.services['compose-for-mongodb'][0].credentials.uri, null, function(err, db) {
      if (err) {
        console.log(err);
      } else {
        mydb = db.db(dbName);
        console.log("Created database: " + dbName);
      }
    });
  } else {
    // user-provided service with 'mongodb' in its name
    MongoClient.connect(appEnv.getService(/.*[Mm][Oo][Nn][Gg][Oo].*/).credentials.uri, null,
      function(err, db) {
        if (err) {
          console.log(err);
        } else {
          mydb = db.db(dbName);
          console.log("Created database: " + dbName);
        }
      }
    );
  }

  vendor = 'mongodb';
} else if (appEnv.services['cloudantNoSQLDB'] || appEnv.getService(/[Cc][Ll][Oo][Uu][Dd][Aa][Nn][Tt]/)) {
  // Load the Cloudant library.
  var Cloudant = require('@cloudant/cloudant');

  // Initialize database with credentials
  if (appEnv.services['cloudantNoSQLDB']) {
    // CF service named 'cloudantNoSQLDB'
    cloudant = Cloudant(appEnv.services['cloudantNoSQLDB'][0].credentials);
  } else {
     // user-provided service with 'cloudant' in its name
     cloudant = Cloudant(appEnv.getService(/cloudant/).credentials);
  }
} else if (process.env.CLOUDANT_URL){
  cloudant = Cloudant(process.env.CLOUDANT_URL);
}
if(cloudant) {
  //database name
  dbName = 'mydb';

  // Create a new "mydb" database.
  cloudant.db.create(dbName, function(err, data) {
    if(!err) //err if database doesn't already exists
      console.log("Created database: " + dbName);
  });

  // Specify the database we are going to use (mydb)...
  mydb = cloudant.db.use(dbName);

  vendor = 'cloudant';
}

//serve static file (index.html, images, css)
app.use(express.static(__dirname + '/views'));



var port = process.env.PORT || 3000
app.listen(port, function() {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});
