console.clear();
require("colors");
const {
  Client,
  Intents,
  MessageEmbed,
  Permissions,
  MessageAttachment,
} = require("discord.js");
const client = new Client({
  intents: Object.values(Intents.FLAGS),
  allowedMentions: {
    parse: ["users", "roles"],
    repliedUser: true,
  },
});
const token = process.env.TOKEN;
const { DisTube } = require("distube");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const { SpotifyPlugin } = require("@distube/spotify");
const { YtDlpPlugin } = require("@distube/yt-dlp");
const distube = new DisTube(client, {
  plugins: [
    new SoundCloudPlugin(),
    new SpotifyPlugin({
      api: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      },
    }),
    new YtDlpPlugin(),
  ],
  searchSongs: 15,
  youtubeDL: false,
});
// const { prefix } = require("./config.json");
const colors = require("./colors.json");
const {
  voicePermissionCheck: vcCheck,
  textPermissionCheck: textCheck,
} = require("./permissionCheck");
const Fetch = require("./classes/Fetch");
const mongoose = require("mongoose");
const BotSettings = require("./schemas/botSetSchema");
const shell = require("shelljs");
const Fetcher = new Fetch();
const wait = require("util").promisify(setTimeout)

global.path = require("path");
global.client = client;
global.Fetcher = Fetcher;
global.util = require("util");

/**
 * Returns an object for a Discord.js MessageEmbed field
 * @param {String} name
 * @param {String} value
 * @param {Boolean} inline
 */
function addField(name, value, inline) {
  if (!name) name = "Unknown Name";
  if (!value) value = "Unknown Value";
  if (!inline) inline = false;

  return {
    name,
    value,
    inline,
  };
}

client.on("ready", async () => {
  console.log("The client is ready!".green);
  require("./app");
  client.user.setActivity({
    name: `music! - pm!help`,
    type: "LISTENING",
  });
  mongoose
    .connect(process.env.MONGO_CS)
    .then(() => console.log("Connected to MongoDB!".green))
    .catch((e) => console.error(`${e}`.red));
  var body = {
    servers: client.guilds.cache.size,
    shards: 1,
  };
  console.log(
    Fetcher.post(
      "https://api.infinitybotlist.com/bots/stats",
      {
        "Content-Type": "application/json",
        Authorization: process.env.INFINITY_TOKEN,
      },
      body
    )
  );
});

client.on("guildCreate", async (guild) => {
  const logChannel = client.channels.cache.get("927333175582158959");
  if (!guild.available)
    return await logChannel.send({
      content: `The client joined a new guild, but the info on that guild is unavailable!\n\n**The new guild count for the client is ${client.guilds.cache.size}.**`,
    });
  const new_guild_embed = new MessageEmbed()
    .setColor(colors.green)
    .setTitle("New Guild!")
    .setDescription(`${client.user.username} was added to a new guild!`)
    .addFields([
      addField("Guild Name", `**\`${guild.name}\`**`, true),
      addField("Member Count", `**\`${guild.memberCount}\`**`, true),
      addField("Guild Count", `**\`${client.guilds.cache.size}\`**`, true),
    ]);
  await logChannel.send({
    embeds: [new_guild_embed],
  });
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  var Guild = await BotSettings.findOne({
    guild: message.guild.id,
  });
  if (!Guild) {
    Guild = new BotSettings({
      guild: message.guild.id,
    });
    Guild.save();
  }
  const prefix = Guild.prefix;
  if (!message.content.startsWith(prefix)) return;

  if (!textCheck(message)) {
    try {
      return await message.author.send({
        content:
          "I can't send messages in your guild, please check my permissions!",
      });
    } catch (e) {
      return;
    }
  }

  // console.log(textCheck(message), vcCheck(message))

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift();

  if (command == "play") {
    const vc = message.member.voice.channel;
    if (!vc) {
      const no_vc_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ You need to join a Voice Channel first! ❌");
      return await message.reply({
        embeds: [no_vc_embed],
      });
    } else {
      var song = args.join(" ");
      if (!song && message.attachments.size <= 0) {
        const no_song_embed = new MessageEmbed()
          .setColor(colors.red)
          .setDescription("❌ Please provide a song/url/file! ❌");
        return await message.reply({
          embeds: [no_song_embed],
        });
      } else {
        if (!vcCheck(message)) {
          const cant_speak_embed = new MessageEmbed()
            .setColor(colors.red)
            .setDescription(
              "❌ I require the `CONNECT` and `SPEAK` permissions! ❌"
            );
          return await message.reply({
            embeds: [cant_speak_embed],
          });
        }
        if(message.attachments.size > 0 && !song) {
          var file = message.attachments.first();
          // console.log(file.contentType)
          if(!file.contentType.includes("audio") && !file.contentType.includes("video")) {
            const invalid_file_embed = new MessageEmbed()
              .setColor(colors.red)
              .setDescription("❌ Please provide an audio file to read! ❌")
            return await message.reply({
              embeds: [invalid_file_embed]
            })
          }
          song = file.url;
        }
        await distube.play(vc, song, {
          message,
          textChannel: message.channel,
          member: message.member,
        });
      }
    }
  } else if (["repeat", "loop"].includes(command)) {
    const vc = message.member.voice.channel;
    if (!vc) {
      const no_vc_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ You need to join a Voice Channel first! ❌");
      return await message.reply({
        embeds: [no_vc_embed],
      });
    }
    const queue = distube.getQueue(message);
    if (!queue) {
      const no_music_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ Nothing is playing right now! ❌");
      return await message.reply({
        embeds: [no_music_embed],
      });
    }
    var rmode = args[0] != undefined ? parseInt(args[0]) : undefined;
    // console.log(rmode)
    if (rmode != undefined && isNaN(rmode)) {
      const nan_repeatMode_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ Please provide a valid number! ❌");
      return await message.reply({
        embeds: [nan_repeatMode_embed],
      });
    }
    if (rmode != undefined && (rmode < 0 || rmode > 2)) {
      const invalid_repeatMode_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ Please provide a number between 0 and 2! ❌");
      return await message.reply({
        embeds: [invalid_repeatMode_embed],
      });
    }
    const mode = distube.setRepeatMode(message, rmode);
    const done_embed = new MessageEmbed()
      .setColor(colors.green)
      .setDescription(
        `✅ Set repeat mode to \`${
          mode ? (mode === 2 ? "Queue" : "Current Song") : "Off"
        }\` ✅`
      );
    await message.reply({
      embeds: [done_embed],
    });
  } else if (["stop", "end"].includes(command)) {
    const vc = message.member.voice.channel;
    if (!vc) {
      const no_vc_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ You need to join a Voice Channel first! ❌");
      return await message.reply({
        embeds: [no_vc_embed],
      });
    }
    const queue = distube.getQueue(message);
    if (!queue) {
      const no_music_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ Nothing is playing right now! ❌");
      return await message.reply({
        embeds: [no_music_embed],
      });
    }
    distube.stop(message);
    const done_embed = new MessageEmbed()
      .setColor(colors.green)
      .setDescription(`✅ Music stopped! ✅`);
    await message.reply({
      embeds: [done_embed],
    });
  } else if (command == "pause") {
    const vc = message.member.voice.channel;
    if (!vc) {
      const no_vc_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ You need to join a Voice Channel first! ❌");
      return await message.reply({
        embeds: [no_vc_embed],
      });
    }
    const queue = distube.getQueue(message);
    if (!queue) {
      const no_music_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ Nothing is playing right now! ❌");
      return await message.reply({
        embeds: [no_music_embed],
      });
    }
    if (queue.paused) {
      const already_paused_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ The queue is already paused! ❌");
      return await message.reply({
        embeds: [already_paused_embed],
      });
    }
    distube.pause(message);
    const done_embed = new MessageEmbed()
      .setColor(colors.green)
      .setDescription("✅ Paused the music! ✅");
    await message.reply({
      embeds: [done_embed],
    });
  } else if (command == "resume") {
    const vc = message.member.voice.channel;
    if (!vc) {
      const no_vc_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ You need to join a Voice Channel first! ❌");
      return await message.reply({
        embeds: [no_vc_embed],
      });
    }
    const queue = distube.getQueue(message);
    if (!queue) {
      const no_music_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ Nothing is playing right now! ❌");
      return await message.reply({
        embeds: [no_music_embed],
      });
    }
    if (!queue.paused) {
      const not_paused_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ The queue is not paused! ❌");
      return await message.reply({
        embeds: [not_paused_embed],
      });
    }
    distube.resume(message);
    const done_embed = new MessageEmbed()
      .setColor(colors.green)
      .setDescription("✅ Music resumed! ✅");
    await message.reply({
      embeds: [done_embed],
    });
  } else if (command == "skip") {
    const vc = message.member.voice.channel;
    if (!vc) {
      const no_vc_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ You need to join a Voice Channel first! ❌");
      return await message.reply({
        embeds: [no_vc_embed],
      });
    }
    const queue = distube.getQueue(message);
    if (!queue) {
      const no_music_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ Nothing is playing right now! ❌");
      return await message.reply({
        embeds: [no_music_embed],
      });
    }
    distube.skip(message);
    const done_embed = new MessageEmbed()
      .setColor(colors.green)
      .setDescription("✅ Current song skipped! ✅");
    await message.reply({
      embeds: [done_embed],
    });
  } else if (command == "queue") {
    const queue = distube.getQueue(message);
    if (!queue) {
      const no_music_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ Nothing is playing right now! ❌");
      return await message.reply({
        embeds: [no_music_embed],
      });
    }
    const queue_embed = new MessageEmbed()
      .setAuthor({
        name: `${message.author.tag}`,
        iconURL: message.author.displayAvatarURL({ dynamic: false, size: 256 }),
      })
      .setColor(colors.yellow)
      .setDescription(
        `Current queue:\n\`\`\`\n${queue.songs
          .map(
            (song, id) =>
              `${id ? id : "Playing"}. ${song.name} - ${song.formattedDuration}`
          )
          .slice(0, 10)
          .join("\n")}\n\`\`\``
      );
    await message.reply({
      embeds: [queue_embed],
    });
  } else if (command == "filters") {
    const queue = distube.getQueue(message);
    if (!queue) {
      const no_music_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ Nothing is playing right now! ❌");
      return await message.reply({
        embeds: [no_music_embed],
      });
    }
    const filters_embed = new MessageEmbed()
      .setColor(colors.green)
      .setDescription(
        `Current Queue Filters:\n\n\`\`\`\n${
          queue.filters.join(",\n") || "None"
        }\n\`\`\``
      );
    await message.reply({
      embeds: [filters_embed],
    });
  } else if (["setfilter", "filter"].includes(command)) {
    const vc = message.member.voice.channel;
    if (!vc) {
      const no_vc_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ You need to join a Voice Channel first! ❌");
      return await message.reply({
        embeds: [no_vc_embed],
      });
    }
    const queue = distube.getQueue(message);
    if (!queue) {
      const no_music_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ Nothing is playing right now! ❌");
      return await message.reply({
        embeds: [no_music_embed],
      });
    }
    var filter = args[0];
    if (
      ![
        "3d",
        "bassboost",
        "echo",
        "karaoke",
        "nightcore",
        "vaporwave",
        "surround",
        "off",
      ].includes(filter)
    ) {
      const invalid_filter_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription(
          "❌ That's an invalid filter! ❌\n\n❌ Please type one of these: `3d`, `bassboost`, `echo`, `karaoke`, `nightcore`, `vaporwave`, `surround`, `off` ❌"
        );
      return await message.reply({
        embeds: [invalid_filter_embed],
      });
    }
    if (filter == "off") filter = false;
    const filters = distube.setFilter(message, filter);
    const done_embed = new MessageEmbed()
      .setColor(colors.green)
      .setDescription(`Current Filter(s): ${filters.join(", ") || "None"}`);
    await message.reply({
      embeds: [done_embed],
    });
  } else if (command == "previous") {
    const vc = message.member.voice.channel;
    if (!vc) {
      const no_vc_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ You need to join a Voice Channel first! ❌");
      return await message.reply({
        embeds: [no_vc_embed],
      });
    }
    const queue = distube.getQueue(message);
    if (!queue) {
      const no_music_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ Nothing is playing right now! ❌");
      return await message.reply({
        embeds: [no_music_embed],
      });
    }
    if (queue.previousSongs.length == 0) {
      const no_previousSongs_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ There are no previous songs in the queue! ❌");
      return await message.reply({
        embeds: [no_previousSongs_embed],
      });
    }
    distube.previous(message);
    const done_embed = new MessageEmbed()
      .setColor(colors.green)
      .setDescription("✅ Previous song playing now! ✅");
    await message.reply({
      embeds: [done_embed],
    });
  } else if (command == "leave") {
    const vc = message.member.voice.channel;
    if (!vc) {
      const no_vc_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ You need to join a Voice Channel first! ❌");
      return await message.reply({
        embeds: [no_vc_embed],
      });
    }
    var voice = distube.voices.get(message);
    if (!voice) {
      const no_voice_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ I'm not connected to a Voice Channel! ❌");
      return await message.reply({
        embeds: [no_voice_embed],
      });
    }
    if (vc.id != voice.voiceState.channel.id) {
      const not_same_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ You are not in the same VC that I am in! ❌");
      return await message.reply({
        embeds: [not_same_embed],
      });
    }
    voice.leave();
    const done_embed = new MessageEmbed()
      .setColor(colors.green)
      .setDescription("✅ Left the Voice Channel! ✅");
    await message.reply({
      embeds: [done_embed],
    });
  } else if (command == "volume") {
    const vc = message.member.voice.channel;
    if (!vc) {
      const no_vc_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ You need to join a Voice Channel first! ❌");
      return await message.reply({
        embeds: [no_vc_embed],
      });
    }
    const queue = distube.getQueue(message);
    if (!queue) {
      const no_music_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ Nothing is playing right now! ❌");
      return await message.reply({
        embeds: [no_music_embed],
      });
    }
    var volume = parseInt(args[0]);
    if (isNaN(volume)) {
      const nan_volume_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ Please provide a valid number! ❌");
      return await message.reply({
        embeds: [nan_volume_embed],
      });
    }
    if (volume < 0 || volume > 100) {
      const invalid_volume_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ Please provide a volume between 0 and 100! ❌");
      return await message.reply({
        embeds: [invalid_volume_embed],
      });
    }
    distube.setVolume(message, volume);
    const done_embed = new MessageEmbed()
      .setColor(colors.green)
      .setDescription(`✅ Queue volume set to **\`${volume}%\`**! ✅`);
    await message.reply({
      embeds: [done_embed],
    });
  } else if (["nowplaying", "np"].includes(command)) {
    const queue = distube.getQueue(message);
    if (!queue) {
      const no_music_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ Nothing is playing right now! ❌");
      return await message.reply({
        embeds: [no_music_embed],
      });
    }
    var currentSong = queue.songs[0];
    const np_embed = new MessageEmbed()
      .setColor(message.member.displayHexColor)
      .setTitle("Now Playing")
      .setThumbnail(currentSong.thumbnail)
      .addFields([
        addField("Title", currentSong.name, true),
        addField("Requester", currentSong.user.username, true),
        addField("Duration", currentSong.formattedDuration, true),
        addField("Song Link", `[Click me!](${currentSong.url})`, true),
        addField("Playing In", `<#${queue.voiceChannel.id}>`, true),
      ]);
    await message.reply({
      embeds: [np_embed],
    });
  } else if (command == "help") {
    const help_embed = new MessageEmbed()
      .setColor(message.member.displayHexColor)
      .setTitle("Help Command")
      .setDescription(`Here are all my commands!`)
      .addFields([
        addField(
          "Play",
          `**Usage:** \`${prefix}play\` \`<song/url/file>\`,\n**Aliases:** None`,
          true
        ),
        addField(
          "Repeat",
          `**Usage:** \`${prefix}repeat\` \`[mode (0, 1, 2)]\`,\n**Aliases:** loop`,
          true
        ),
        addField(
          "Stop",
          `**Usage:** \`${prefix}stop\`,\n**Aliases:** end`,
          true
        ),
        addField(
          "Leave",
          `**Usage:** \`${prefix}leave\`,\n**Aliases:** None`,
          true
        ),
        addField(
          "Volume",
          `**Usage:** \`${prefix}volume\` \`<volume>\`,\n**Aliases:** None`,
          true
        ),
        addField(
          "Previous",
          `**Usage:** \`${prefix}previous\`,\n**Aliases:** None`,
          true
        ),
        addField(
          "Pause",
          `**Usage:** \`${prefix}pause\`,\n**Aliases:** None`,
          true
        ),
        addField(
          "Filter",
          `**Usage:** \`${prefix}setfilter\` \`<filter>\`,\n**Aliases:** filter`,
          true
        ),
        addField(
          "Filters",
          `**Usage:** \`${prefix}filters\`,\n**Aliases:** None`,
          true
        ),
        addField(
          "Now Playing",
          `**Usage:** \`${prefix}nowplaying\`,\n**Aliases:** np`,
          true
        ),
        addField(
          "Skip",
          `**Usage:** \`${prefix}skip\`,\n**Aliases:** None`,
          true
        ),
        addField(
          "Queue",
          `**Usage:** \`${prefix}queue\`,\n**Aliases:** None`,
          true
        ),
        addField(
          "Resume",
          `**Usage:** \`${prefix}resume\`,\n**Aliases:** None`,
          true
        ),
        addField(
          "Vote",
          `**Usage:** \`${prefix}vote\`,\n**Aliases:** None`,
          true
        ),
        addField(
          "Prefix",
          `**Usage:** \`${prefix}prefix [new prefix]\`,\n**Aliases:** None`,
          true
        ),
      ])
      .setFooter({
        text: "Syntax: <> = required, [] = optional",
      });
    await message.reply({
      embeds: [help_embed],
    });
  } else if (command == "vote") {
    const vote_embed = new MessageEmbed()
      .setColor(colors.green)
      .setTitle(`Vote for ${client.user.username}!`)
      .setDescription(`Vote for me to earn some stuff when that comes out!`)
      .addFields([
        addField(
          "Infinity Bot List",
          "[Click me!](https://infinitybots.gg/bots/971841942998638603/vote)",
          true
        ),
      ]);
    await message.reply({
      embeds: [vote_embed],
    });
  } else if (command == "prefix") {
    /*
    if (message.guild.id != "833671287381032970")
      return await message.reply({
        content: "This command is being tested currently!",
      });
    */
    var npre = args[0];
    if (!npre) {
      const current_prefix_embed = new MessageEmbed()
        .setColor(colors.yellow)
        .setDescription(
          `ℹ️ The current prefix of the bot is \`${prefix}\`. ℹ️`
        );
      return await message.reply({
        embeds: [current_prefix_embed],
      });
    }
    if (!message.member.permissions.has(Permissions.FLAGS.MANAGE_GUILD)) {
      const invalid_permissions_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription(
          "❌ You need the `MANAGE_GUILD` permission to run this command! ❌"
        );
      return await message.reply({
        embeds: [invalid_permissions_embed],
      });
    }
    if(npre.length > 18) {
      const prefix_too_long_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ Please input a prefix that is 18 characters or less! ❌")
      return await message.reply({
        embeds: [prefix_too_long_embed]
      })
    }
    var data = await BotSettings.findOneAndUpdate(
      {
        guild: message.guild.id,
      },
      {
        $set: {
          prefix: npre,
        },
      }
    );
    data.save();
    const done_embed = new MessageEmbed()
      .setColor(colors.green)
      .setDescription(
        `✅ The prefix for **${message.guild.name}** has been updated from **\`${prefix}\`** to **\`${npre}\`** ✅`
      );
    await message.reply({
      embeds: [done_embed],
    });
    if (message.guild.me.permissions.has(Permissions.FLAGS.CHANGE_NICKNAME)) {
      await message.guild.me.setNickname(
        `[${npre}] ${client.user.username}`,
        "The prefix of the bot was changed."
      );
    }
  } else if (command == "eval") {
    if (message.author.id != "697414293712273408")
      return await message.reply({
        content: "You are **NOT** the owner of the bot!",
      });
    const code = args.join(" ");

    var result = new Promise((resolve, reject) => {
      resolve(eval(code));
    });

    var secrets = [
      process.env.TOKEN,
      process.env.KEY,
      process.env.MONGO_CS,
      process.env.FP_KEY,
      client.token,
      process.env.RADAR_KEY,
      process.env.STATCORD_KEY,
      process.env.BACKUP_DLS_API_KEY,
      process.env.BOATS_KEY,
      process.env.CLIENT_SECRET,
      process.env.DEL_API_KEY,
      process.env.DISCORDBOTLIST,
      process.env.DISCORDLISTOLOGY,
      process.env.INFINITY_API_TOKEN,
      process.env.KEY_TO_MOTION,
      process.env.MAIN_DLS_API_KEY,
      process.env.SECRET,
      process.env.SERVICES_API_KEY,
      process.env.TEST_VOTE_WEBHOOK_TOKEN,
      process.env.TOPGG_API_KEY,
      process.env.VOTE_WEBHOOK_TOKEN,
      process.env.WEBHOOK_AUTH,
      process.env.PAT,
    ];

    result
      .then(async (result) => {
        if (typeof result !== "string")
          result = util.inspect(result, { depth: 0 });

        for (const term of secrets) {
          if (
            (result.includes(term) && term != undefined) ||
            (result.includes(term) && term != null)
          )
            result = result.replace(term, "[SECRET]");
        }
        if (result.length > 2000) {
          const buffer = Buffer.from(result);
          var attachment = new MessageAttachment(buffer, "evaluated.js");
          return await interaction.followUp({
            content:
              "The result is too long to show on Discord, so here's a file.",
            files: [attachment],
          });
        }
        const evaluated_embed = new MessageEmbed()
          .setColor(colors.green)
          .setTitle("Evaluation")
          .setDescription(
            `Successful Evaluation.\n\nOutput:\n\`\`\`js\n${result}\n\`\`\``
          )
          .setTimestamp();
        try {
          await message.reply({
            embeds: [evaluated_embed],
          });
        } catch (e) {
          return;
        }
      })
      .catch(async (result) => {
        if (typeof result !== "string")
          result = util.inspect(result, { depth: 0 });

        for (const term of secrets) {
          if (
            (result.includes(term) && term != undefined) ||
            (result.includes(term) && term != null)
          )
            result = result.replace(term, "[SECRET]");
        }

        const error_embed = new MessageEmbed()
          .setColor(colors.red)
          .setTitle("Error Evaluating")
          .setDescription(
            `An error occurred.\n\nError:\n\`\`\`js\n${result}\n\`\`\``
          )
          .setTimestamp();
        try {
          await message.reply({ embeds: [error_embed] });
        } catch (e) {
          return;
        }
      });
  } else if (command == "lyrics") {
    return await message.reply({
      content: "Coming soon!",
    });
    const song = args.join(" ");
    if (!song) {
      const no_song_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ Please provide a song to find the lyrics of! ❌");
      return await message.reply({
        embeds: [no_song_embed],
      });
    }
    var data = Fetcher.get(
      `https://weebyapi.xyz/json/lyrics?query=${song}&token=${process.env.WEEBY_KEY}`
    );
    console.log(data);
    await message.reply({
      content: "Check the console!",
    });
  } else if (command == "exec") {
    if (message.author.id != "697414293712273408")
      return await message.reply({
        content: "You are **NOT** the owner of the bot!",
      });
    const cmd = args.join(" ");
    if (!cmd) {
      const no_cmd_embed = new MessageEmbed()
        .setColor(colors.red)
        .setDescription("❌ Please provide a shell command to execute! ❌");
      return await message.reply({
        embeds: [no_cmd_embed],
      });
    }
    var secrets = [
      process.env.TOKEN,
      process.env.BACKUP_DLS_API_KEY,
      process.env.BOATS_KEY,
      process.env.CLIENT_SECRET,
      process.env.DEL_API_KEY,
      process.env.DISCORDBOTLIST,
      process.env.DISCORDLISTOLOGY,
      process.env.FP_KEY,
      process.env.INFINITY_API_TOKEN,
      process.env.KEY,
      process.env.KEY_TO_MOTION,
      process.env.MAIN_DLS_API_KEY,
      process.env.MONGO_CS,
      process.env.RADAR_KEY,
      process.env.SECRET,
      process.env.SERVICES_API_KEY,
      process.env.STATCORD_KEY,
      process.env.TEST_VOTE_WEBHOOK_TOKEN,
      process.env.TOPGG_API_KEY,
      process.env.VOTE_WEBHOOK_TOKEN,
      process.env.WEBHOOK_AUTH,
      process.env.PAT,
    ];
    let output = shell.exec(cmd);
    if (output == "" && output.stderr != "") {
      output = `${output.stderr}`;
    } else if ((output == "" && output.stderr == "") || output == "\n") {
      output = "Command Completed (no output)";
    } else if (output.length > 4096 || output.stderr.length > 4096) {
      var buffer = Buffer.from(output);
      var attachment = new MessageAttachment(buffer, "output.txt");
      return await message.reply({
        content: `The output wanting to be shown for \`${cmd}\` is too long to be shown on Discord, so here's a file.`,
        files: [attachment],
      });
    }
    for (const secret of secrets) {
      if (output.includes(secret)) {
        output = "[HIDDEN SECRET (Console Cleared!)]";
        console.clear();
      }
    }
    const executed_embed = new MessageEmbed()
      .setColor(colors.orange)
      .setTitle("Executed Callback")
      .setDescription(
        `This is what came back from your command...\n\nCommand: \`\`\`bash\n${cmd}\n\`\`\`\n\nOutput: \`\`\`\n${output}\n\`\`\``
      )
      .setFooter(
        `${message.author.username} requested this.`,
        message.author.displayAvatarURL({
          dynamic: false,
          format: "png",
          size: 32,
        })
      )
      .setTimestamp();
    await message.reply({
      embeds: [executed_embed],
    });
  }
});

// Queue status template
const status = (queue) =>
  `Volume: \`${queue.volume}%\` | Filter: \`${
    queue.filters.join(", ") || "Off"
  }\` | Loop: \`${
    queue.repeatMode ? (queue.repeatMode === 2 ? "Queue" : "This Song") : "Off"
  }\` | Autoplay: \`${queue.autoplay ? "On" : "Off"}\``;

distube
  .on("playSong", (queue, song) =>
    queue.textChannel?.send(
      `Playing \`${song.name}\` - \`${
        song.formattedDuration
      }\`\nRequested by: ${song.user.username}\n${status(queue)}`
    )
  )
  .on("addSong", (queue, song) =>
    queue.textChannel?.send(
      `Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}`
    )
  )
  .on("addList", (queue, playlist) =>
    queue.textChannel?.send(
      `Added \`${playlist.name}\` playlist (${
        playlist.songs.length
      } songs) to queue\n${status(queue)}`
    )
  )
  .on("error", (textChannel, e) => {
    console.error(e);
    textChannel.send(`An error encountered: ${e.message.slice(0, 2000)}`);
  })
  .on("finish", (queue) => queue.textChannel?.send("Finished queue!"))
  .on("finishSong", () => {})
  .on("empty", (queue) =>
    queue.textChannel?.send(
      "The voice channel is empty! Leaving the voice channel..."
    )
  )
  // DisTubeOptions.searchSongs > 1
  .on("searchResult", async (message, result) => {
    let i = 0;
    const search_results_embed = new MessageEmbed()
      .setColor(colors.yellow)
      .setDescription(
        `**Choose an option from below**\n${result
          .map(
            (song) => `**${++i}**. ${song.name} - \`${song.formattedDuration}\``
          )
          .join("\n")}\n*Enter anything else or wait 30 seconds to cancel*`
      );
    await message.reply({
      embeds: [search_results_embed],
    });
  })
  .on("searchCancel", (message) => message.reply("Searching canceled"))
  .on("searchInvalidAnswer", () => {})
  .on("searchNoResult", (message) => message.reply("No results found!"))
  .on("searchDone", () => {});

client.login(token);
