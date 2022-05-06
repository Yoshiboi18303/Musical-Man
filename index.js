console.clear();
require("colors");
const { Client, Intents, MessageEmbed } = require("discord.js");
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
  plugins: [new SoundCloudPlugin(), new SpotifyPlugin(), new YtDlpPlugin()],
  searchSongs: 15,
  youtubeDL: false,
});
const { prefix } = require("./config.json");
const colors = require("./colors.json");
const { keepAlive } = require("./keepAlive");
const { voicePermissionCheck: vcCheck, textPermissionCheck: textCheck } = require("./permissionCheck");

/**
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

client.on("ready", () => {
  console.log("The client is ready!".green);
  keepAlive(process.env.PORT);
  client.user.setActivity({
    name: `music! - ${prefix}help`,
    type: "LISTENING",
  });
});

client.on("messageCreate", async (message) => {
  if (
    message.author.bot ||
    !message.content.startsWith(prefix) ||
    !message.guild
  )
    return;

  if(!textCheck(message)) return;

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
      const song = args.join(" ");
      if (!song) {
        const no_song_embed = new MessageEmbed()
          .setColor(colors.red)
          .setDescription("❌ Please provide a song/url! ❌");
        return await message.reply({
          embeds: [no_song_embed],
        });
      } else {
        if(!vcCheck(message)) {
          const cant_speak_embed = new MessageEmbed()
            .setColor(colors.red)
            .setDescription("❌ I require the `CONNECT` and `SPEAK` permissions! ❌")
          return await message.reply({
            embeds: [cant_speak_embed]
          })
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
          `**Usage:** \`${prefix}play\` \`<song/url>\`\n**Aliases:** None`,
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
      ])
      .setFooter({
        text: "Syntax: <> = required, [] = optional",
      });
    await message.reply({
      embeds: [help_embed],
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

// DisTube event listeners, more in the documentation page
distube
  .on("playSong", (queue, song) =>
    queue.textChannel?.send(
      `Playing \`${song.name}\` - \`${
        song.formattedDuration
      }\`\nRequested by: ${song.user}\n${status(queue)}`
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
