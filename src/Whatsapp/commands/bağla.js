const settings = require('../settings.json')
const mysql = require('mysql2/promise')
const crypto = require('../util/functions/encrypt.js');
const { get } = require('cheerio/lib/api/traversing');


exports.run = async (client, message, args) => {
    if(message.from.toString().slice(-4) === 'g.us') return client.sendText(message.from, "*Bir hata tespit edildi!*\nBu komut sadece özel mesaj yoluyla çalışmaktadır.")
    if(args[0] == "YARDIM")  return client.sendText(message.from, `*fiAnaliz* | Eşleme Yardım\n\n*Kod almak için:*\n!bağla\n*Bağlamak için:*\n!bağlan {KOD}\n\n*5 dakika içinde farklı platformlardan bağlanmanız gerekmektedir!*`)
    const connection = await mysql.createConnection({
        host: settings.host,
        user: settings.user,
        password: settings.password,
        database: settings.database
        })
    try{
        var arr = [await crypto.encrypt(message.sender.id)]
        var [rows, fields] = await connection.execute('SELECT * FROM users WHERE whatsapp = ?', arr)
        if(rows.length == 0) return client.sendText(message.from, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.")
        var uuid = rows[0].uuid
        var [rows, fields] = await connection.execute('SELECT * FROM connectCode WHERE uuid = ?', [uuid])
        if(rows.length != 0 && new Date().getTime() - new Date(rows[rows.length -1].createdTime).getTime() < 300000) return client.sendText(message.from, `*${rows[rows.length -1].code}* nolu bağlantı kodunuz *${((300000 - new Date().getTime() + new Date(rows[rows.length -1].createdTime).getTime()) / 1000).toFixed(0)}* saniye daha geçerlidir.\n\n*Yardım için:* !bağla yardım`)
        var code = Math.floor(Math.random() * (999999 - 111111)) + 111111
        arr = [0, uuid, code]
        await connection.execute('INSERT INTO connectCode (platform, uuid, code) VALUES (?,?,?)', arr)
        await connection.end()
        return client.sendText(message.from, `*${code}* nolu bağlantı kodunuz başarıyla oluşturuldu.\n\n*Yardım için:* !bağla yardım`)
    }  finally {
        await connection.end()
    }
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