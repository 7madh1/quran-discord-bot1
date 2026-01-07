require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("اختبار سرعة البوت"),

  new SlashCommandBuilder()
    .setName("quran")
    .setDescription("إذاعة القرآن الكريم")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("عرض الأوامر")
].map(c => c.toJSON());

client.once("ready", async () => {
  console.log("📖 Quran Bot Online");

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: commands }
  );

  console.log("✅ Commands Registered");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    return interaction.reply(`🏓 Pong: ${client.ws.ping}ms`);
  }

  if (interaction.commandName === "help") {
    const embed = new EmbedBuilder()
      .setTitle("📖 Quran Bot")
      .setColor(0x2ecc71)
      .addFields(
        { name: "/ping", value: "اختبار البوت" },
        { name: "/quran", value: "روابط إذاعة القرآن (Admin)" }
      );

    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === "quran") {
    const embed = new EmbedBuilder()
      .setTitle("📻 إذاعة القرآن الكريم")
      .setColor(0x1abc9c)
      .setDescription(
        "🇪🇬 مصر:\nhttps://stream.radiojar.com/8s5u5tpdtwzuv\n\n" +
        "🇸🇦 السعودية:\nhttps://stream.radiojar.com/0tpy1h0kxtzuv"
      );

    return interaction.reply({ embeds: [embed] });
  }
});

client.login(TOKEN);
