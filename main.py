import discord
from discord.ext import commands
from discord.ui import Button, View
import random
import asyncio
import os
from dotenv import load_dotenv
from aiohttp import web

load_dotenv()
TOKEN = os.getenv("DISCORD_TOKEN")

intents = discord.Intents.default()
intents.message_content = True
intents.members = True

bot = commands.Bot(command_prefix="&", intents=intents)

queue = []
leaderboard = {}
wins_losses = {}
rewards_log_channel_id = 123456789012345678  # Remplace par ton ID salon logs

# --- Keep_alive HTTP server minimal (style Replit) ---
async def handle(request):
    return web.Response(text="Bot is alive!")

def run_keep_alive():
    app = web.Application()
    app.router.add_get("/", handle)
    runner = web.AppRunner(app)

    async def start():
        await runner.setup()
        site = web.TCPSite(runner, "0.0.0.0", 8080)
        await site.start()

    loop = asyncio.get_event_loop()
    loop.create_task(start())

# --- Fonctions utiles ---

def create_embed(title=None, description=None):
    embed = discord.Embed(title=title, description=description, color=0xFFFFFF)
    embed.set_footer(text="Inaya On'top")
    return embed

async def create_private_channel(guild, player1, player2):
    channel_name = f"{player1.display_name}-vs-{player2.display_name}"
    overwrites = {
        guild.default_role: discord.PermissionOverwrite(read_messages=False),
        player1: discord.PermissionOverwrite(read_messages=True, send_messages=True),
        player2: discord.PermissionOverwrite(read_messages=True, send_messages=True),
        guild.me: discord.PermissionOverwrite(read_messages=True, send_messages=True)
    }
    return await guild.create_text_channel(channel_name, overwrites=overwrites)

async def reward_roulette(winner, guild):
    rewards = ["Rank x1", "Rank x2", "Mute 10 minutes (30% chance)", "Rôle perso (10% chance)"]

    # Calcul des chances
    chance = random.random()
    reward_given = None

    if chance <= 0.1:  # 10% rôle perso
        role = discord.utils.get(guild.roles, name="Role Perso")
        if role:
            await winner.add_roles(role)
            reward_given = "Rôle perso"
    elif chance <= 0.4:  # 30% mute 10 minutes
        try:
            await winner.timeout(duration=600, reason="Récompense mute 10 minutes")
            reward_given = "Mute 10 minutes"
        except:
            pass
    else:
        # Rank x1 ou x2 (chances 60%)
        if random.random() < 0.5:
            role = discord.utils.get(guild.roles, name="Rank x1")
            reward_given = "Rank x1"
        else:
            role = discord.utils.get(guild.roles, name="Rank x2")
            reward_given = "Rank x2"

        if role:
            await winner.add_roles(role)

    try:
        await winner.send(embed=create_embed("Récompense", f"Tu as gagné : **{reward_given}**"))
    except:
        pass

    # Log dans le salon rewards logs
    channel = guild.get_channel(rewards_log_channel_id)
    if channel and reward_given:
        await channel.send(embed=create_embed("Récompense attribuée", f"{winner.mention} a reçu : **{reward_given}**"))

# --- Commandes basiques et logique du jeu (simplifié) ---

@bot.event
async def on_ready():
    print(f"Connecté en tant que {bot.user}")

@bot.command()
async def start(ctx):
    if ctx.author in queue:
        await ctx.send(embed=create_embed("Erreur", "Tu es déjà en file d'attente."))
        return

    queue.append(ctx.author)
    await ctx.send(embed=create_embed("File d'attente", f"{ctx.author.mention} a rejoint la file d'attente. ({len(queue)} joueur(s))"))

    if len(queue) >= 2:
        player1 = queue.pop(0)
        player2 = queue.pop(0)
        guild = ctx.guild
        channel = await create_private_channel(guild, player1, player2)
        await channel.send(embed=create_embed("Début de la partie", f"{player1.mention} vs {player2.mention}"))

        # Ici on fait juste un pile ou face pour test
        winner = random.choice([player1, player2])
        await channel.send(embed=create_embed("Victoire", f"Félicitations {winner.mention}, tu as gagné !"))

        # Mise à jour stats
        leaderboard[winner.id] = leaderboard.get(winner.id, 0) + 1
        wins_losses[winner.id] = wins_losses.get(winner.id, [0, 0])
        wins_losses[winner.id][0] += 1

        loser = player2 if winner == player1 else player1
        wins_losses[loser.id] = wins_losses.get(loser.id, [0, 0])
        wins_losses[loser.id][1] += 1

        # Récompense
        await reward_roulette(winner, guild)

        await asyncio.sleep(10)
        await channel.delete()

@bot.command()
async def lb(ctx):
    if not leaderboard:
        await ctx.send(embed=create_embed("Leaderboard", "Pas encore de parties jouées."))
        return
    sorted_lb = sorted(leaderboard.items(), key=lambda x: x[1], reverse=True)
    desc = ""
    for i, (user_id, wins) in enumerate(sorted_lb, start=1):
        user = ctx.guild.get_member(user_id)
        if user:
            desc += f"{i}. {user.display_name} - {wins} victoire(s)\n"
    await ctx.send(embed=create_embed("Classement", desc))

@bot.command()
async def wl(ctx, member: discord.Member = None):
    member = member or ctx.author
    wl = wins_losses.get(member.id, [0, 0])
    await ctx.send(embed=create_embed("Win/Loss", f"{member.display_name} : {wl[0]} victoire(s), {wl[1]} défaite(s)"))

@bot.command()
async def addwin(ctx, member: discord.Member):
    if ctx.author.guild_permissions.administrator:
        leaderboard[member.id] = leaderboard.get(member.id, 0) + 1
        wins_losses[member.id] = wins_losses.get(member.id, [0, 0])
        wins_losses[member.id][0] += 1
        await ctx.send(embed=create_embed("Add Win", f"1 victoire ajoutée à {member.display_name}"))
    else:
        await ctx.send(embed=create_embed("Erreur", "Tu n'as pas la permission d'utiliser cette commande."))

# --- Lancement keep_alive + bot.run ---

if __name__ == "__main__":
    run_keep_alive()
    bot.run(TOKEN)
