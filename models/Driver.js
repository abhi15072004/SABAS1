const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  licenseNo: { type: String, required: true },
  mobileNo: { type: String, required: true },
  assignedBus: { type: String, required: true },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
}, { timestamps: true });

module.exports = mongoose.model("Driver", driverSchema);
