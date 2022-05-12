const { Schema, model } = require("mongoose");

const guildSchema = Schema({
  guild: {
    type: String,
    required: true,
  },
  prefix: {
    type: String,
    default: "pm!",
  },
  dmUsers: {
    type: Boolean,
    default: false,
  },
  changeNickname: {
    type: Boolean,
    default: false,
  },
});

module.exports = model("guilds", guildSchema);
