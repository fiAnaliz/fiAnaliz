const settings = require('../settings.json')
const mysql = require('mysql2/promise')
const crypto = require('../util/functions/encrypt.js');


exports.run = async (client, message, args) => {
    if(message.chat.type != 'private') return client.sendMessage(message.chat.id, "*Bir hata tespit edildi!*\nBu komut sadece özel mesaj yoluyla çalışmaktadır.", {parse_mode: 'Markdown'})
    if(args[0] == 'YARDIM') return client.sendMessage(message.chat.id, `*fiAnaliz* | Eşleme Yardım\n\n*Kod almak için:*\n!bağla\n*Bağlamak için:*\n!bağlan {KOD}\n\n*5 dakika içinde farklı platformlardan bağlanmanız gerekmektedir!*`, {parse_mode: 'Markdown'})
    const connection = await mysql.createConnection({
        host: settings.host,
        user: settings.user,
        password: settings.password,
        database: settings.database
      })
    var arr = [await crypto.encrypt(message.from.id)]
    var [rows, fields] = await connection.execute('SELECT * FROM users WHERE telegram = ?', arr)
    if(rows.length == 0) return client.sendMessage(message.chat.id, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", {parse_mode: 'Markdown'})
    var uuid = rows[0].uuid
    var [rows, fields] = await connection.execute('SELECT * FROM connectCode WHERE uuid = ?', [uuid])
    if(rows.length != 0 && new Date().getTime() - new Date(rows[rows.length -1].createdTime).getTime() < 300000) return client.sendMessage(message.chat.id, `*${rows[rows.length -1].code}* nolu bağlantı kodunuz *${((300000 - new Date().getTime() + new Date(rows[rows.length -1].createdTime).getTime()) / 1000).toFixed(0)}* saniye daha geçerlidir.\n\n*Yardım için:* !bağla yardım`, {parse_mode: 'Markdown'})
    var code = Math.floor(Math.random() * (999999 - 111111)) + 111111
    arr = [1, uuid, code]
    await connection.execute('INSERT INTO connectCode (platform, uuid, code) VALUES (?,?,?)', arr)
    return client.sendMessage(message.chat.id, `*${code}* nolu bağlantı kodunuz başarıyla oluşturuldu.\n\n*Yardım için:* !bağla yardım`, {parse_mode: 'Markdown'})

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