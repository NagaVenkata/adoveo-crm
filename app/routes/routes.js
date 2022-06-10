module.exports = app => {
  const api = require("../controllers/controllers.js");
  var router = require("express").Router();
  // Create a new Tutorial
  router.get("/create", api.create);
  // Create a profile
  router.post("/createprofile", api.createProfile);
  // get a profile
  router.post("/getprofile", api.getProfile);
  // Create a new mapping fields
  router.post("/createfield", api.createField);
  // Create a new mapping fields
  router.post("/uploadprivatekey", api.uploadPrivateKey);
  // Retrieve all Tutorials
  router.get("/", api.findAll);
  // Retrieve all published Tutorials
  router.get("/published", api.findAllPublished);
  // Retrieve a single Tutorial with id
  router.get("/:id", api.findOne);
  // Update a Tutorial with id
  router.put("/:id", api.update);
  // Delete a Tutorial with id
  router.delete("/:id", api.delete);
  // Create a new Tutorial
  router.delete("/", api.deleteAll);
  app.use('/api/', router);
};