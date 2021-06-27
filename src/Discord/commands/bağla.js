const Discord = require('discord.js');
const settings = require('../settings.json')
const mysql = require('mysql2/promise')
const crypto = require('../util/functions/encrypt.js');


exports.run = async (client, message, args) => {
    const baglayardım = new Discord.MessageEmbed()
    .setColor(settings.color)
    .setTitle(`fiAnaliz | Eşleme Yardım`)
    .setThumbnail(settings.avatarURL)
    .setDescription("Eşleme sistemimiz sayesinde Whatsapp ve Telegram'daki cüzdanınıza ve alarmlarınıza Discord'tan da erişebilirsiniz. Bu sayede bir bot ile tüm işlemlerinizi aynı çatı altında yapabilirsiniz.")
    .addFields({
        name: `Kod almak için:`,
        value: `${settings.prefix}bağla`,
        inline: true
    }, {
        name: `Bağlamak için:`,
        value: `${settings.prefix}bağlan {KOD}`,
        inline: true
    })
    .setFooter(`Bu komut ${msg.author.tag} kişisi tarafından çağrılmıştır.`, msg.author.avatarURL())
    .setTimestamp()
    if(msg.channel.type != 'dm') return msg.channel.send(getEmbed("Bir hata tespit edildi!", "Bu komut sadece özel mesaj yoluyla çalışmaktadır.", msg))
    if(args[0] == undefined){
        const connection = await mysql.createConnection({
            host: settings.host,
            user: settings.user,
            password: settings.password,
            database: settings.database
          })
        var arr = [await crypto.encrypt(msg.author.id)]
        var [rows, fields] = await connection.execute('SELECT * FROM users WHERE discord = ?', arr)
        if(rows.length == 0) return msg.channel.send(getEmbed("Bir hata tespit edildi!", "Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", msg))
        var uuid = rows[0].uuid
        var [rows, fields] = await connection.execute('SELECT * FROM connectCode WHERE uuid = ?', [uuid])
        if(rows.length != 0 && new Date().getTime() - new Date(rows[rows.length -1].createdTime).getTime() < 300000) return msg.channel.send(getEmbed(undefined, `**${rows[rows.length -1].code}** nolu bağlantı kodunuz **${((300000 - new Date().getTime() + new Date(rows[rows.length -1].createdTime).getTime()) / 1000).toFixed(0)}** saniye daha geçerlidir.\n\n**Yardım için:** ${settings.prefix}bağla yardım`, msg))
        var code = Math.floor(Math.random() * (999999 - 111111)) + 111111
        arr = [2, uuid, code]
        await connection.execute('INSERT INTO connectCode (platform, uuid, code) VALUES (?,?,?)', arr)
        return msg.channel.send(getEmbed(undefined, `**${code}** nolu bağlantı kodunuz başarıyla oluşturuldu.\n\n**Yardım için:** ${settings.prefix}bağla yardım`, msg))
    }
    return msg.channel.send(baglayardım)
};

exports.conf = {
    aliases: ['BAĞLA', 'BAGLA'],
    permLevel: 0,
    kategori: 'Bağlama'
};

exports.help = {
    name: 'bağla',
    description: 'Diğer uygulamalarla eşlemeye yarıyor',
    usage: 'bağla'
};