const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cron = require('node-cron');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const EPIC_GAMES_FREE_GAMES_URL = 'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions';
const CHANNEL_ID = '';
const CHECK_INTERVAL = '04 12 * * *'; // every day at midnight

let lastFreeGames = [];

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    // Schedule the task to check free games daily
    cron.schedule(CHECK_INTERVAL, checkFreeGames);
});

client.login('');
async function checkFreeGames() {
    try {
        const response = await axios.get(EPIC_GAMES_FREE_GAMES_URL);
        const freeGames = response.data.data.Catalog.searchStore.elements.filter(game => game.promotions && game.promotions.promotionalOffers.length > 0);

        const newFreeGames = freeGames.filter(game => !lastFreeGames.includes(game.id));
        
        if (newFreeGames.length > 0) {
            const channel = client.channels.cache.get(CHANNEL_ID);
            newFreeGames.forEach(game => {
                const gameTitle = game.title;
                const gameUrl = `https://www.epicgames.com/store/it-IT/p/${game.productSlug}`;

                // Find the appropriate image
                let thumbnailUrl = null;
                const thumbnailTypes = ['DieselStoreFrontWide', 'OfferImageWide', 'VaultClosed'];
                
                for (const type of thumbnailTypes) {
                    const image = game.keyImages.find(img => img.type === type);
                    if (image) {
                        thumbnailUrl = image.url;
                        break;
                    }
                }
                // Fallback to a placeholder image if no suitable image is found
                thumbnailUrl = thumbnailUrl || 'https://via.placeholder.com/150';

                const embed = new EmbedBuilder()
                    .setTitle(gameTitle)
                    .setURL(gameUrl)
                    .setImage(thumbnailUrl)
                    .setDescription(`E' disponibile un nuovo gioco su Epic Games: [${gameTitle}](${gameUrl})`);

                channel.send({ embeds: [embed] });
            });
            lastFreeGames = freeGames.map(game => game.id);
        }
    } catch (error) {
        console.error('Error fetching free games:', error);
    }
}