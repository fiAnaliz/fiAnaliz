const Discord = require('discord.js');
const settings = require('../settings.json')

exports.run = (client, msg, args) => {
    const yardım = new Discord.MessageEmbed()
    .setColor(settings.color)
    .setTitle(`fiAnaliz | Yardım`)
    .setThumbnail(settings.avatarURL)
    .setDescription("Borsa İstanbul, Amerikan borsaları ve Kripto piyasası size hiç bu kadar yakın olmamıştı!\n")
    .addFields(
        {name: `${settings.prefix}komutlar`, value: `\u200B`, inline: true},
        {name: `${settings.prefix}alarm yardım`, value: `\u200B`, inline: true},
        {name: `${settings.prefix}cüzdan yardım`, value: `\u200B`, inline: true},
        {name: `${settings.prefix}bağla yardım`, value: `\u200B`, inline: true},
        {name: `${settings.prefix}hakkımda`, value: `\u200B`, inline: true},
        {name: `${settings.prefix}veripolitikası`, value: `\u200B`, inline: true}        
    )
    .setFooter(`Bu komut ${msg.author.tag} kişisi tarafından çağrılmıştır.`, msg.author.avatarURL())
    .setTimestamp()
    msg.channel.send(yardım)
};

exports.conf = {
    aliases: ['YARDIM', 'YARDİM'],
    permLevel: 0,
    kategori: ''
};

exports.help = {
    name: 'yardım',
    description: 'Komutların listesini gösterir',
    usage: 'yardım'
};