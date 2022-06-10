
var mysql = require("mysql");
var md5 = require('md5');
var axios = require('axios');
var fs = require('fs');
var jsforce = require('jsforce');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var querystring = require('querystring');
var url = require('url');

const db = require("../models");
const AdoveoData = db.crm;

var md5 = require('md5');

// example to connect  to mysql and push data to salesforce
exports.create = (req, res) => {

   // Validate request
  /*if (!req.body.title) {
    res.status(400).send({ message: "Content can not be empty!" });
    return;
  }*/

  /*var connection = mysql.createConnection({
    host: "host.docker.internal",
    port: "33306",
    database:'db_example',
    user: md5("db_example").substring( 0, 16),
    password: "ksjdhfsd4jkhf",
});*/

  // connecting to mysql rds on aws
  var connection = mysql.createConnection({
    host: "rds-prod-test2.c0z9w132qdby.eu-central-1.rds.amazonaws.com",
    port: "3306",
    database:'db_practice',
    user: md5("db_practice").substring( 0, 16),
    password: "1xdOAhYdZ21fQ2BQ",
});


console.log("entered data url request");

var records = null;


connection.connect((err) => {
    if (err) {
      console.log("Error occurred", err);
    } else {
      console.log("Connected to MySQL Server");
    }
});

let sql = `SELECT * FROM participant where id=3393`;
connection.query(sql, (error, results, fields) => {
  if (error) {
    return console.error(error.message);
  }
  console.log(results);
  //records = JSON.stringify(results);

  var data = [];

  for(i=0;i<results.length; i++) {
    if(results[i].name != null)  {
      data.push({Name: results[i].name,
                Amount__c: results[i].amount,
                Sender_Phone__c: results[i].telephone,
                Receiver_Phone__c: results[i].receiver_phone});
    }
  }

  console.log(data);

  var privatekey = fs.readFileSync('cert/server.key');

  var jwtparams = {
      iss: "3MVG9SOw8KERNN0.qPaSJnOzkl3JpCSFM20vK0kcW9l7MzBXPPrqHU8LvDgmlGqsfeVa2G75bawfIlFc0OViU",
      prn: "umapathi@playful-narwhal-1quk2a.com",
      aud: "https://login.salesforce.com",
      exp: parseInt(moment().add(2, 'minutes').format('X'))
  };

  var token = jwt.sign(jwtparams, privatekey, { algorithm: 'RS256' });

  var params = {
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: token
  };

  var token_url = 'https://login.salesforce.com/services/oauth2/token';

  axios.post(token_url, querystring.stringify(params))
    .then(function (res) {
        console.log("data", res.data);
        var conn = new jsforce.Connection({
            instanceUrl: res.data.instance_url,
            accessToken: res.data.access_token
        });

        /*conn.query('select Name, Amount__c from Participant__c', function (err, results) {
            //console.log(JSON.stringify(results.records)); // eslint-disable-line no-console
            console.log(results.records.length); // eslint-disable-line no-console
        });*/

        console.log("after key fetch ", data);

        conn.sobject("Participant__c").create(data,
            function(err, rets) {
            if (err) { return console.log(err); }
              for (var i=0; i < rets.length; i++) {
                if (rets[i].success) {
                    console.log("Created record id : " + rets[i].id);
                }
            }
  
        });
  });
  
});

  /*var privatekey = fs.readFileSync('cert/server.key');

  var jwtparams = {
      iss: "3MVG9SOw8KERNN0.qPaSJnOzkl3JpCSFM20vK0kcW9l7MzBXPPrqHU8LvDgmlGqsfeVa2G75bawfIlFc0OViU",
      prn: "umapathi@playful-narwhal-1quk2a.com",
      aud: "https://login.salesforce.com",
      exp: parseInt(moment().add(2, 'minutes').format('X'))
  };

  var token = jwt.sign(jwtparams, privatekey, { algorithm: 'RS256' });

  var params = {
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: token
  };

  var token_url = 'https://login.salesforce.com/services/oauth2/token';

  axios.post(token_url, querystring.stringify(params))
    .then(function (res) {
        console.log("data", res.data);
        var conn = new jsforce.Connection({
            instanceUrl: res.data.instance_url,
            accessToken: res.data.access_token
        });

        conn.query('select Name, Amount__c from Participant__c limit 1', function (err, results) {
            console.log(JSON.stringify(results.records[0])); // eslint-disable-line no-console
        });
  });*/

  res.json({ message: "Connected to salesforce"});
  
};

// Create a profile save fields needed to push to salesforce and also campaigns to pull from
exports.createProfile = (req, res) => {

  console.log("messge ",  req.body);

  data  = JSON.parse(JSON.stringify(req.body));

  console.log("data", data);
  

  /*var privatekey = fs.readFileSync('cert/server.key');*/

  if(data.id.length > 1) {
    console.log("entered data  ");
    AdoveoData.findByIdAndUpdate(data.id, data, { useFindAndModify: false })
    .then(data => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update with id=${data.id}. Maybe profile was not found!`
        });
      } else res.send({ message: "Profile was updated successfully." });
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating profile with id=" + data.id
      });
    });

  } else {

    // Create a Tutorial
    const adoveo_crm = new AdoveoData({
      profile: data.profile,
      iss: data.iss,
      campaigns: data.campaign_id,
      fields:data.mapping_fields,
      dataCreated: new Date()
    });


    try {
      adoveo_crm
      .save(adoveo_crm)
      .then(data => {
        res.send(data);
     })
      .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the record."
      });
    });
   } catch(err) {

      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the record."
      });
   }
  }
  //res.json({ message: "Profile created"});
  
};

// upload private key and profile
exports.uploadPrivateKey = (req, res) => {

  console.log("messge ",  req.body);

  data  = JSON.parse(JSON.stringify(req.body));

  console.log("data", data);
  

  /*var privatekey = fs.readFileSync('cert/server.key');*/

  if(data.id.length > 1) {
    console.log("entered data  ");
    AdoveoData.findByIdAndUpdate(data.id, data, { useFindAndModify: false })
    .then(data => {
      if (!data) {
        res.status(404).send({
          message: `Cannot update with id=${data.id}. Maybe profile was not found!`
        });
      } else res.send({ message: "Profile was updated successfully." });
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating profile with id=" + data.id
      });
    });

  } else {

    // Create a Tutorial
    const adoveo_crm = new AdoveoData({
      profile: data.profile,
      iss: null,
      private_key : data.data,
      campaigns: null,
      fields:null,
      dataCreated: new Date()
    });


    try {
      adoveo_crm
      .save(adoveo_crm)
      .then(data => {
        res.send(data);
     })
      .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the record."
      });
    });
   } catch(err) {

      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the record."
      });
   }
  }
  //res.json({ message: "Profile created"});
  
};

// get the profile by name
exports.getProfile = (req, res) => {
  
  data  = JSON.parse(JSON.stringify(req.body));

  console.log("profile ", data.profile);

  AdoveoData.find({profile:data.profile})
      .then(data => {
        if (!data)
          res.status(404).send({ message: "Not data found with profile" + data.profile });
        else {
          console.log("profile ", data);
          res.send(data);
        }
      })
      .catch(err => {
        res
          .status(500)
          .send({ message: "Error retrieving data with profile " + err});
      });
};

// Retrieve all Tutorials from the database.
exports.createField = (req, res) => {

  data  = JSON.parse(JSON.stringify(req.body));

  profile_id = data.id;

  console.log("create field ", profile_id)

  AdoveoData.findById(profile_id)
      .then(data => {
        if (!data)
          res.status(404).send({ message: "No profile found with id " + profile_id.id });
        else {
          //profile_data = JSON.parse(data);
          //console.log(profile_data);
          //profile_data = db.collection("adoveo_salesforce_crm").find({profile:"practice"}).toJSON();
          console.log("mapp data  ", data);
          profile_data = JSON.stringify(data);

          console.log("data  ", JSON.parse(profile_data));

          createFieldInSalesforce(JSON.parse(profile_data));

          res.send(data);
        }
      })
      .catch(err => {
        res
          .status(500)
          .send({ message: "Error retrieving Tutorial with id" + err});
      });

  /*var privatekey = fs.readFileSync('cert/server.key');

  var jwtparams = {
      iss: "3MVG9SOw8KERNN0.qPaSJnOzkl3JpCSFM20vK0kcW9l7MzBXPPrqHU8LvDgmlGqsfeVa2G75bawfIlFc0OViU",
      prn: "umapathi@playful-narwhal-1quk2a.com",
      aud: "https://login.salesforce.com",
      exp: parseInt(moment().add(2, 'minutes').format('X'))
  };

  var token = jwt.sign(jwtparams, privatekey, { algorithm: 'RS256' });

  var params = {
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: token
  };

  var token_url = 'https://login.salesforce.com/services/oauth2/token';

  axios.post(token_url, querystring.stringify(params))
    .then(function (result) {
        console.log("data", result.data);
        var conn = new jsforce.Connection({
            instanceUrl: result.data.instance_url,
            accessToken: result.data.access_token
        });

        var metadata = [{
           fullName: "Lead.Amount__c",
           label: "Amount",
           type: "Text",
           length: 255
            
        },
        {fullName: "Lead.Receiver_Email__c",
           label: "Receiver Email",
           type: "Text",
           length: 255
            
        }];

        conn.metadata.create('CustomField', metadata, function(err, results) {
          if (err) { console.log(err); }
              /*for (var i=0; i < results.length; i++) {
                    console.log('res', result);
              }

              console.log('res', results);
              res.json({ message: results});
          });
      });*/
  
};

// Retrieve all Tutorials from the database.
exports.findAll = (req, res) => {

  
  
};
// Find a single Tutorial with an id
exports.findOne = (req, res) => {

  const id = req.params.id;
  if(id) {
    AdoveoData.findById(id)
      .then(data => {
        if (!data)
          res.status(404).send({ message: "Not found Tutorial with id " + id });
        else res.send(data);
      })
      .catch(err => {
        res
          .status(500)
          .send({ message: "Error retrieving Tutorial with id=" + id });
      });
  }
  
};
// Update a Tutorial by the id in the request
exports.update = (req, res) => {
  
};
// Delete a Tutorial with the specified id in the request
exports.delete = (req, res) => {
  
};
// Delete all Tutorials from the database.
exports.deleteAll = (req, res) => {
  
};
// Find all published Tutorials
exports.findAllPublished = (req, res) => {
  
};

function createFieldInSalesforce(data) {

  var jwtparams = {
      iss: data.iss,
      prn: "umapathi@playful-narwhal-1quk2a.com",
      aud: "https://login.salesforce.com",
      exp: parseInt(moment().add(2, 'minutes').format('X'))
  };

  var privatekey = fs.readFileSync('cert/server.key');

  console.log("primary key  ", privatekey);


  var token = jwt.sign(jwtparams, privatekey, { algorithm: 'RS256' });

  var params = {
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: token
  };

  var token_url = 'https://login.salesforce.com/services/oauth2/token';

  fields_data = [];

  console.log("fields ", data.fields);

  for(i=0; i < data.fields.length; i++) {

    if(data.fields[i] == "Receiver_Name__c") {

        fields_data.push({
           fullName: "Lead." + data.fields[i],
           label: "Receiver Name",
           type: "Text",
           length: 255
        });
    }

    if(data.fields[i] == "Receiver_Email__c") {

        fields_data.push({
           fullName: "Lead." + data.fields[i],
           label: "Receiver Email",
           type: "Text",
           length: 255
        });
    }

    if(data.fields[i] == "Receiver_Phone__c") {

        fields_data.push({
           fullName: "Lead." + data.fields[i],
           label: "Receiver Phone",
           type: "Text",
           length: 255
        });
    }

    if(data.fields[i] == "Status__c") {

        fields_data.push({
           fullName: "Lead." + data.fields[i],
           label: "Status",
           type: "Text",
           length: 255
        });
    }

    if(data.fields[i] == "Location__c") {

        fields_data.push({
           fullName: "Lead." + data.fields[i],
           label: "Location",
           type: "Text",
           length: 255
        });
    }


  }



  axios.post(token_url, querystring.stringify(params))
    .then(function (result) {
        console.log("data", result.data);
        var conn = new jsforce.Connection({
            instanceUrl: result.data.instance_url,
            accessToken: result.data.access_token
        });

        var metadata = fields_data;

        conn.metadata.create('CustomField', metadata, function(err, results) {
          if (err) { console.log(err); }
              for (var i=0; i < results.length; i++) {
                    console.log('res', result);
              }

              console.log('res', results);
              //res.json({ message: results});
          });
      });

}