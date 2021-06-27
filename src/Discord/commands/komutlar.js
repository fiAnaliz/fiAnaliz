const Discord = require('discord.js');
const settings = require('../settings.json')

exports.run = (client, msg, args) => {
    const yardım = new Discord.MessageEmbed()
    .setColor(settings.color)
    .setTitle(`fiAnaliz | Komutlar`)
    .setThumbnail(settings.avatarURL)
    .setDescription("Aşağıda sizlerin kullanım deneyiminizi artırmanız için sistemimizde bulunan örnek komutlar verilmiştir.")
    .addFields(
        {name: `${settings.prefix}{KRIPTO KODU}`, value: `${settings.prefix}BTC`, inline: true},
        {name: `${settings.prefix}{BIST KODU}`, value: `${settings.prefix}THYAO`, inline: true},
        {name: `${settings.prefix}{ABD KODU}.US`, value: `${settings.prefix}TSLA.US`, inline: true},
        {name: `${settings.prefix}{ALTIN}`, value: `${settings.prefix}GRAM`, inline: true},
        {name: `${settings.prefix}{DOVIZ}`, value: `${settings.prefix}USD`, inline: true},
        {name: `${settings.prefix}{ENDEKSLER}`, value: `${settings.prefix}XU100`, inline: true},
        {name: `${settings.prefix}grafik {KRIPTO BIST AMERIKAN}`, value: `${settings.prefix}grafik BTC`, inline: false}
    )
    .setFooter(`Bu komut ${msg.author.tag} kişisi tarafından çağrılmıştır.`, msg.author.avatarURL())
    .setTimestamp()
    msg.channel.send(yardım)
};

exports.conf = {
    aliases: ['KOMUTLAR', 'KOMUT'],
    permLevel: 0,
    kategori: ''
};

exports.help = {
    name: 'komutlar',
    description: 'Komutların listesini gösterir',
    usage: 'komutlar'
};