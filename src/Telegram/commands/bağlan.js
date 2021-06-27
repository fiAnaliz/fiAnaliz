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
    if(args[0] === undefined) return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nLütfen size özel kodu giriniz!", {parse_mode: 'Markdown'})
    if(args[0] == 'YARDIM') return client.sendMessage(message.chat.id, `*fiAnaliz* | Eşleme Yardım\n\n*Kod almak için:*\n!bağla\n*Bağlamak için:*\n!bağlan {KOD}\n\n*5 dakika içinde farklı platformlardan bağlanmanız gerekmektedir!*`, {parse_mode: 'Markdown'})
    if(isNumeric(args[0]) == false) return client.sendMessage(message.chat.id, "*KOD TANIMSIZ*\nLütfen yazdığınız kodu kontrol ediniz!", {parse_mode: 'Markdown'})
    const connection = await mysql.createConnection({
        host: settings.host,
        user: settings.user,
        password: settings.password,
        database: settings.database
      }) 
    var arr = [await encrypt(message.from.id)]
    var [rows, fields] = await connection.execute('SELECT * FROM users WHERE telegram = ?', arr)
    var uuid = rows[0].uuid
    var [rows, fields] = await connection.execute('SELECT * FROM connectCode WHERE code = ?', [args[0]])
    if(rows.length == 0 || rows[rows.length -1].code != args[0]) return client.sendMessage(message.chat.id, "*KOD TANIMSIZ*\nLütfen yazdığınız kodu kontrol ediniz!", {parse_mode: 'Markdown'})
    if(new Date().getTime() - new Date(rows[rows.length -1].createdTime).getTime() > 300000) return client.sendMessage(message.chat.id, "*SÜRESİ DOLMUŞ KOD*\nYazdığınız kodun süresi dolmuştur. Lütfen yeni kod alınız!", {parse_mode: 'Markdown'})
    if(rows[0].platform == 1) return client.sendMessage(message.chat.id, "*HATALI UYGULAMA*\nBu kod *Telegram* için kullanılamaz!", {parse_mode: 'Markdown'})
    var [rows, fields] = await connection.execute('SELECT * FROM users WHERE uuid = ?', [rows[0].uuid])
    if(rows[0].telegram === null){
        await connection.execute('UPDATE users SET telegram = ? WHERE uuid = ?', [await encrypt(message.from.id), rows[0].uuid])
        await connection.execute('UPDATE users SET inActive = 1 WHERE uuid = ?', [uuid])
        return client.sendMessage(message.chat.id, "*Başarılı* bir şekilde eşleşme tamamlandı. Artık cüzdan ve alarmlarınızı diğer uygulamalarla ortak kullanabilirsiniz!", {parse_mode: 'Markdown'})
    }      
    return client.sendMessage(message.chat.id, "*Bir hata tespit edildi*\nBu kişi önceden Telegram ile eşleşme yapmış!", {parse_mode: 'Markdown'})
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