module.exports = mongoose => {
  var schema = mongoose.Schema(
      {
        profile: String,
        iss: String,
        private_key: String,
        campaigns: Array,
        fields: Array,
        dataCreated: Date
      },
      { timestamps: true }
    );

  schema.method("toJSON", function() {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const AdoveoData = mongoose.model("adoveo_salesforce_crm", schema);
  return AdoveoData;
};
