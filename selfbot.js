const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
require('dotenv').config();

const client = new Client();

const serversToScan = [
  { guildId: "1339037624270196856", roleId: "1391949425076867104", name: "MIYO" },
  { guildId: "1038108273703919746", roleId: "1191697012878475355", name: "SHIBUYA" },
  { guildId: "1392123083422302339", roleId: "1392145132265930832", name: "KAYUNA" },
  { guildId: "1250948681100951576", roleId: "1383599539763675296", name: "ELDIA" }
];

client.on('ready', async () => {
  console.log(`[=] ${client.user.username} ready!`);

  let allData = [];

  for (const { guildId, roleId, name } of serversToScan) {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) continue;

    const role = await guild.roles.fetch(roleId).catch(() => null);
    if (!role) continue;

    const members = await guild.members.fetch();

    const data = members
      .filter(m => m.roles.cache.has(roleId))
      .map(m => {
        const voice = m.voice?.channel ? {
          channel: m.voice.channel.name,
          since: m.voice.channel.joinedTimestamp || Date.now()
        } : null;

        return {
          username: m.user.username,
          id: m.user.id,
          guild: name,
          inVoice: Boolean(voice),
          voiceSince: voice?.since || null
        };
      });

    allData.push({ guildId, name, members: data });
  }

  fs.writeFileSync("membersData.json", JSON.stringify(allData, null, 2));
  console.log("✅ membersData.json mis à jour !");
  process.exit();
});

client.login(process.env.SELF_TOKEN);
