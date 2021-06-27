const settings = require('../settings.json')
const mysql = require('mysql2/promise')
const crypto = require('../util/functions/encrypt.js');

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
String.prototype.float = function() { 
    return parseFloat(this.replace(',', '.')); 
}

exports.run = async (client, message, args) => {
    if(message.from.toString().slice(-4) === 'g.us') return client.sendText(message.from, "*Bir hata tespit edildi!*\nBu komut sadece özel mesaj yoluyla çalışmaktadır.")
    if(args[0] === undefined) return client.sendText(message.from, "*HATALI KULLANIM*\nLütfen size özel kodu giriniz!")
    if(args[0] == "YARDIM")  return client.sendText(message.from, `*fiAnaliz* | Eşleme Yardım\n\n*Kod almak için:*\n!bağla\n*Bağlamak için:*\n!bağlan {KOD}\n\n*5 dakika içinde farklı platformlardan bağlanmanız gerekmektedir!*`)
    if(isNumeric(args[0]) == false) return client.sendText(message.from, "*KOD TANIMSIZ*\nLütfen yazdığınız kodu kontrol ediniz!")
    const connection = await mysql.createConnection({
        host: settings.host,
        user: settings.user,
        password: settings.password,
        database: settings.database
    })  
    try{
        var arr = [await crypto.encrypt(message.sender.id)]
        var [rows, fields] = await connection.execute('SELECT * FROM users WHERE whatsapp = ?', arr)
        var uuid = rows[0].uuid
        var [rows, fields] = await connection.execute('SELECT * FROM connectCode WHERE code = ?', [args[0]])
        if(rows.length == 0 || rows[rows.length -1].code != args[0]) return client.sendText(message.from, "*KOD TANIMSIZ*\nLütfen yazdığınız kodu kontrol ediniz!")
        if(new Date().getTime() - new Date(rows[rows.length -1].createdTime).getTime() > 300000) return client.sendText(message.from, "*SÜRESİ DOLMUŞ KOD*\nYazdığınız kodun süresi dolmuştur. Lütfen yeni kod alınız!")
        if(rows[0].platform == 0) return client.sendText(message.from, "*HATALI UYGULAMA*\nBu kod *WhatsApp* için kullanılamaz!")
        var [rows, fields] = await connection.execute('SELECT * FROM users WHERE uuid = ?', [rows[0].uuid])
        if(rows[0].whatsapp === null){
            await connection.execute('UPDATE users SET whatsapp = ? WHERE uuid = ?', [await crypto.encrypt(message.sender.id), rows[0].uuid])
            await connection.execute('UPDATE users SET inActive = 1 WHERE uuid = ?', [uuid])
            return client.sendText(message.from, "*Başarılı* bir şekilde eşleşme tamamlandı. Artık cüzdan ve alarmlarınızı diğer uygulamalarla ortak kullanabilirsiniz!")
        }      
        return client.sendText(message.from, "*Bir hata tespit edildi*\nBu kişi önceden WhatsApp ile eşleşme yapmış!")
    } finally {
        await connection.end()
    }
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