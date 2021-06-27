const Discord = require('discord.js');
const settings = require('../settings.json')
const mysql = require('mysql2/promise')
const crypto = require('../util/functions/encrypt.js');
const { get } = require('cheerio/lib/api/traversing');

function getEmbed(title, text, msg){
    if(title === undefined) return new Discord.MessageEmbed()
    .setColor(settings.color)
    .setDescription(text)
    .setFooter(`Bu komut ${msg.author.tag} kişisi tarafından çağrılmıştır.`, msg.author.avatarURL())
    .setTimestamp()
    if(!(title === undefined)) return new Discord.MessageEmbed()
    .setColor(settings.color)
    .setTitle(title)
    .setDescription(text)
    .setFooter(`Bu komut ${msg.author.tag} kişisi tarafından çağrılmıştır.`, msg.author.avatarURL())
    .setTimestamp()
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
String.prototype.float = function() { 
    return parseFloat(this.replace(',', '.')); 
}

exports.run = async (client, msg, args) => {
    if(msg.channel.type != 'dm') return msg.channel.send(getEmbed("Bir hata tespit edildi!", "Bu komut sadece özel mesaj yoluyla çalışmaktadır.", msg))
    if(args[0] === undefined) return msg.channel.send(getEmbed("HATALI KULLANIM", "Lütfen size özel kodu giriniz!", msg))
    if(isNumeric(args[0]) == false) return msg.channel.send(getEmbed(`KOD TANIMSIZ`, `Lütfen yazdığınız kodu kontrol ediniz!`, msg))
    const connection = await mysql.createConnection({
        host: settings.host,
        user: settings.user,
        password: settings.password,
        database: settings.database
      })
    var arr = [await crypto.encrypt(msg.author.id)]
    var [rows, fields] = await connection.execute('SELECT * FROM users WHERE discord = ?', arr)
    var uuid = rows[0].uuid
    var [rows, fields] = await connection.execute('SELECT * FROM connectCode WHERE code = ?', [args[0]])
    if(rows.length == 0 || rows[rows.length -1].code != args[0]) return msg.channel.send(getEmbed(`KOD TANIMSIZ`, `Lütfen yazdığınız kodu kontrol ediniz!`, msg))
    if(new Date().getTime() - new Date(rows[rows.length -1].createdTime).getTime() > 300000) return msg.channel.send(getEmbed(`SÜRESİ DOLMUŞ KOD`, `Yazdığınız kodun süresi dolmuştur. Lütfen yeni kod alınız!`, msg))
    if(rows[0].platform == 2) return msg.channel.send(getEmbed(`HATALI UYGULAMA`, `Bu kod **Discord** için kullanılamaz!`, msg))
    var [rows, fields] = await connection.execute('SELECT * FROM users WHERE uuid = ?', [rows[0].uuid])
    if(rows[0].discord === null){  
        await connection.execute('UPDATE users SET discord = ? WHERE uuid = ?', [await crypto.encrypt(msg.author.id), rows[0].uuid])
        await connection.execute('UPDATE users SET inActive = 1 WHERE uuid = ?', [uuid])
        return msg.channel.send(  getEmbed(undefined, `**Başarılı** bir şekilde eşleşme tamamlandı. Artık cüzdan ve alarmlarınızı diğer uygulamalarla ortak kullanabilirsiniz!`, msg))
    }    
    return msg.channel.send(getEmbed(`Bir hata tespit edildi`, `Bu kişi önceden Discord ile eşleşme yapmış!`, msg))
};

exports.conf = {
    aliases: ['BAĞLAN', 'BAGLAN'],
    permLevel: 0,
    kategori: 'Bağlama'
};

exports.help = {
    name: 'bağlan',
    description: 'Diğer uygulamalarla eşlemeye yarıyor',
    usage: 'bağlan'
};