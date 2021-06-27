

exports.run = (client, message, args) => {
    return client.sendText(message.from, `*fiAnaliz* | Komut Yardım\n\n*!{BIST Kodu}*\n*!{KRİPTO PARA Kodu}*\n*!{AMERİKAN Hisse Kodu}.US*\n*!{ALTIN}*\n\n*!grafik {KOD}*`)
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