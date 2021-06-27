const Discord = require('discord.js');
const settings = require('../settings.json')

exports.run = (client, msg, args) => {
    const hakkımda = new Discord.MessageEmbed()
    .setColor(settings.color)
    .setTitle(`fiAnaliz | Hakkımda`)
    .setThumbnail(settings.avatarURL)
    .setDescription("Türkiye'nin ücretsiz borsa - kripto botu. Şimdi Whatsapp'ta, Telegram'da ve Discord'ta!\n\nhttps://twitter.com/fiAnaliz\n**Sunucunuza eklemek için:** https://bit.ly/33U73lp\n\n**Öneri, destek ve şikayet için e-posta adresimiz:**\nyatirimpluss@gmail.com")
    .setFooter(`Bu komut ${msg.author.tag} kişisi tarafından çağrılmıştır.`, msg.author.avatarURL())
    .setTimestamp()

    msg.channel.send(hakkımda)
};

exports.conf = {
    aliases: ['HAKKIMDA', 'HAKKİMDA'],
    permLevel: 0,
    kategori: 'Hakkımda'
};

exports.help = {
    name: 'hakkında',
    description: 'Bot hakkında bilgi verir',
    usage: 'hakkımda'
};