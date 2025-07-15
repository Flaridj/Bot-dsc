require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const CHANNEL_ID = process.env.CHANNEL_ID;
const MEMBERS_PER_PAGE = 10; // pagination

client.once('ready', async () => {
  console.log(`${client.user.tag} est en ligne !`);

  const data = JSON.parse(fs.readFileSync('membersData.json', 'utf-8'));

  for (const [serverName, members] of Object.entries(data)) {
    let pages = [];
    let page = [];

    members.forEach((member, i) => {
      page.push(`**${member.username}** — ${member.since}`);
      if ((i + 1) % MEMBERS_PER_PAGE === 0 || i === members.length - 1) {
        pages.push(page);
        page = [];
      }
    });

    const channel = await client.channels.fetch(CHANNEL_ID);
    let currentPage = 0;

    const embed = (pageIndex) => new EmbedBuilder()
      .setTitle(`Liste des femmes ${serverName}`)
      .setDescription(pages[pageIndex].join('\n'))
      .setColor('Grey');

    const getRow = (pageIndex) => new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev').setLabel('◀️').setStyle(ButtonStyle.Secondary).setDisabled(pageIndex === 0),
      new ButtonBuilder().setCustomId('next').setLabel('▶️').setStyle(ButtonStyle.Secondary).setDisabled(pageIndex === pages.length - 1),
    );

    const message = await channel.send({
      embeds: [embed(currentPage)],
      components: pages.length > 1 ? [getRow(currentPage)] : [],
    });

    if (pages.length > 1) {
      const collector = message.createMessageComponentCollector({
        time: 5 * 60 * 1000 // 5 min
      });

      collector.on('collect', async interaction => {
        if (interaction.customId === 'prev') currentPage--;
        else if (interaction.customId === 'next') currentPage++;

        await interaction.update({
          embeds: [embed(currentPage)],
          components: [getRow(currentPage)]
        });
      });
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
