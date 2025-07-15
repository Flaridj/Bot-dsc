const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

let membersData = [];
let currentPage = 0;

const EMBED_COLOR = '#808080'; // Gris

function formatDuration(ms) {
  if (!ms) return 'N/A';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  let str = '';
  if (days > 0) str += `${days}j `;
  if (hours > 0) str += `${hours}h `;
  str += `${minutes}m`;
  return str;
}

function buildEmbed(page = 0) {
  if (membersData.length === 0) return null;
  const data = membersData[page];
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle(`Liste Des Femmes ${data.name}`)
    .setDescription(
      data.members.map(m => {
        const vocDuration = m.inVoice
          ? `est en voc depuis ${formatDuration(Date.now() - m.voiceSince)}`
          : 'n’est pas en voc';
        return `**${m.username}** — ${vocDuration}`;
      }).join('\n') || 'Aucun membre avec ce rôle trouvé.'
    )
    .setFooter({ text: `Page ${page + 1} / ${membersData.length}` });

  return embed;
}

client.on('ready', async () => {
  console.log(`[+] ${client.user.username} prêt !`);

  if (!fs.existsSync('./membersData.json')) {
    console.error('Erreur : fichier membersData.json introuvable !');
    process.exit(1);
  }
  membersData = JSON.parse(fs.readFileSync('./membersData.json', 'utf-8'));

  const channel = await client.channels.fetch(process.env.CHANNEL_ID).catch(() => null);
  if (!channel) {
    console.error("Channel introuvable !");
    process.exit(1);
  }

  const embedMessage = await channel.send({ embeds: [buildEmbed(0)], components: [new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('prev')
      .setLabel('◀️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('next')
      .setLabel('▶️')
      .setStyle(ButtonStyle.Primary)
  )] });

  const collector = embedMessage.createMessageComponentCollector({ time: 5 * 60 * 1000 });

  collector.on('collect', interaction => {
    if (interaction.customId === 'next') {
      currentPage = (currentPage + 1) % membersData.length;
    } else if (interaction.customId === 'prev') {
      currentPage = (currentPage - 1 + membersData.length) % membersData.length;
    }
    interaction.update({ embeds: [buildEmbed(currentPage)] });
  });

  collector.on('end', () => {
    embedMessage.edit({ components: [] });
  });
});

client.login(process.env.BOT_TOKEN);
