/***********************
 * Quran Radio Discord Bot
 * Compatible with Wispbyte & Fly.io
 ***********************/

require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
} = require("@discordjs/voice");

const http = require("http");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// ================= CONFIG =================
const TOKEN = process.env.TOKEN; // حطه في Secrets
const VOICE_CHANNEL_ID = "1458438644489654365"; // روم الفويس
const PORT = process.env.PORT || 3000;

// إذاعات
const STREAMS = {
  egypt: "http://stream.radiojar.com/8s5u5tpdtwzuv",
  saudi: "https://stream.radiojar.com/0tpy1h0kxtzuv",
};

let currentStream = STREAMS.egypt;
let volume = 0.5;
let player;
let connection;

// ================= CLIENT =================
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// ================= PLAY RADIO =================
async function playRadio() {
  const channel = await client.channels.fetch(VOICE_CHANNEL_ID).catch(() => null);
  if (!channel || !channel.isVoiceBased()) return;

  connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
  });

  const response = await fetch(currentStream);
  const resource = createAudioResource(response.body, {
    inlineVolume: true,
  });
  resource.volume.setVolume(volume);

  player = createAudioPlayer({
    behaviors: { noSubscriber: NoSubscriberBehavior.Play },
  });

  player.play(resource);
  connection.subscribe(player);

  console.log("📻 Radio streaming started");
}

// ================= SLASH COMMANDS =================
const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("اختبار سرعة البوت"),

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("حالة البوت"),

  new SlashCommandBuilder()
    .setName("radio")
    .setDescription("تغيير الإذاعة")
    .addStringOption((opt) =>
      opt
        .setName("type")
        .setDescription("نوع الإذاعة")
        .setRequired(true)
        .addChoices(
          { name: "📻 مصر", value: "egypt" },
          { name: "📻 السعودية", value: "saudi" }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("volume")
    .setDescription("تغيير مستوى الصوت")
    .addIntegerOption((opt) =>
      opt
        .setName("level")
        .setDescription("من 1 إلى 100")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
].map((c) => c.toJSON());

// ================= READY =================
client.once("ready", async () => {
  console.log("📖 Quran Bot Online");

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), {
    body: commands,
  });

  console.log("✅ Commands Registered");
  await playRadio();
});

// ================= INTERACTIONS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    return interaction.reply(`🏓 Pong: ${client.ws.ping}ms`);
  }

  if (interaction.commandName === "status") {
    const embed = new EmbedBuilder()
      .setTitle("📖 Quran Radio Bot")
      .setColor(0x2ecc71)
      .addFields(
        { name: "الحالة", value: "🟢 يعمل 24/7" },
        { name: "الصوت", value: `${Math.round(volume * 100)}%` }
      );
    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === "radio") {
    const type = interaction.options.getString("type");
    currentStream = STREAMS[type];
    await playRadio();
    return interaction.reply("📻 تم تغيير الإذاعة بنجاح");
  }

  if (interaction.commandName === "volume") {
    const lvl = interaction.options.getInteger("level");
    volume = Math.min(1, Math.max(0.01, lvl / 100));
    await playRadio();
    return interaction.reply(`🔊 تم ضبط الصوت على ${lvl}%`);
  }
});

// ================= LOGIN =================
client.login(TOKEN);

// ================= DUMMY HTTP SERVER =================
// مهم جدًا لـ Fly.io / Wispbyte
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Quran Discord Bot is running ✅");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 HTTP server running on port ${PORT}`);
});
