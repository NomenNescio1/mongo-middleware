const mongoose = require("mongoose");
mongoose.set('useCreateIndex', true)

const PageviewSchema = new mongoose.Schema({
  path: { type: String },
  date: { type: Date, default: Date.now() },
  userAgent:  String,
  views: Number
});
module.exports = mongoose.model("Pageview", PageviewSchema);
