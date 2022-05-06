const { Message, Permissions } = require("discord.js")

/** 
  * Checks if the client has the correct permissions to use Voice Channels (VCs for short).
  * @param {Message} message
*/
function voicePermissionCheck(message) {
  if(!(message instanceof Message)) throw new Error("The provided message is not a DJS Message!")
  return message.guild.me.permissions.has([Permissions.FLAGS.CONNECT, Permissions.FLAGS.SPEAK])
}

/** 
  * Checks if the client has the correct permissions to use the current Text Channel.
  * @param {Message} message
*/
function textPermissionCheck(message) {
  if(!(message instanceof Message)) throw new Error("The provided message is not a DJS Message!")
  return message.guild.me.permissionsIn(message.channel).has([Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES])
}

module.exports = { voicePermissionCheck, textPermissionCheck }