const Discord = require('discord.js');
const moment = require('moment')
const settings = require('../settings.json')

exports.run = (client, message, args) => {
    const embed = new Discord.MessageEmbed()
        .setDescription('**Botun yeniden başlatılmasına onay veriyorsanız 30 saniye içinde evet yazın.**')
        .setFooter('30 saniye içinde evet yazmassanız iptal edilecek!')
        .setColor(settings.color)
        .setTimestamp()
    message.channel.send(embed)
        .then(() => {
            message.channel.awaitMessages(response => response.content === "evet", {
                    max: 1,
                    time: 30000,
                    errors: ['time'],
                })
                .then((collected) => {
                    message.channel.send("**Bot yeniden başlatılıyor...**").then(message => {
                        console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] Bot yeniden başlatılıyor...`)
                        process.exit(1);
                    }).catch(console.error)
                })
                .catch(() => {
                    message.channel.send('Yeniden başlatma işlemi iptal edildi.');
                });
        });
};

exports.conf = {
    aliases: ['REBOOT'],
    permLevel: 4,
    kategori: 'Yönetim'
};

exports.help = {
    name: 'reboot',
    description: 'Botu tekrar başlatır!',
    usage: 'reboot'
};