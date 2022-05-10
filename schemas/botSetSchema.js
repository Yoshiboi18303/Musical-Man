const { Schema, model } = require("mongoose");

const botSettingsSchema = Schema({
  guild: {
    type: String,
    required: true,
  },
  prefix: {
    type: String,
    default: "pm!",
  },
});

module.exports = model("bot-settings", botSettingsSchema);
