require('dotenv').config();
const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');

const client = new Client();

// Formatage de durée humaine
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days} jour${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} heure${hours > 1 ? 's' : ''}`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  return parts.join(', ');
}

// Configuration : [nom, serveur, rôle]
const serversToScan = [
  { name: 'MIYO', serverId: '1339037624270196856', roleId: '1391949425076867104' },
  { name: 'SHIBUYA', serverId: '1038108273703919746', roleId: '1191697012878475355' },
  { name: 'KAYUNA', serverId: '1392123083422302339', roleId: '1392145132265930832' },
  { name: 'ELDIA', serverId: '1250948681100951576', roleId: '1383599539763675296' }
];

client.on('ready', async () => {
  console.log(`[=] ${client.user.username} est prêt.`);

  const globalResults = {};

  for (const config of serversToScan) {
    try {
      const guild = await client.guilds.fetch(config.serverId);
      const role = await guild.roles.fetch(config.roleId);
      const members = role.members;

      const now = Date.now();
      const result = [];

      members.forEach(member => {
        const voiceState = member.voice;
        const inVoice = voiceState?.channel !== null;

        let durationText = 'Pas en vocal';

        if (inVoice) {
          const joinedTimestamp = voiceState.channel?.members.get(member.id)?.joinedTimestamp;
          if (joinedTimestamp) {
            const duration = now - joinedTimestamp;
            durationText = `Est en voc depuis : ${formatDuration(duration)}`;
          } else {
            durationText = 'Est en voc (temps inconnu)';
          }
        }

        result.push({
          username: member.user.username,
          id: member.id,
          inVoice,
          since: durationText
        });
      });

      globalResults[config.name] = result;
      console.log(`✅ ${config.name} analysé (${result.length} membres)`);

    } catch (err) {
      console.error(`❌ Erreur pour ${config.name} :`, err.message);
    }
  }

  fs.writeFileSync('membersData.json', JSON.stringify(globalResults, null, 2));
  console.log('📁 Fichier membersData.json généré avec succès.');
});

client.login(process.env.SELF_TOKEN);
