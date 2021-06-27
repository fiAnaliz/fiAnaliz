

exports.run = (client, message, args) => {
    return client.sendText(message.from, `*fiAnaliz* | Yardım\n\nBorsa İstanbul, Amerikan borsaları ve Kripto piyasası size hiç bu kadar yakın olmamıştı!\n\n*!komutlar*\n*!alarm yardım*\n*!cüzdan yardım*\n*!hakkımda*\n*!veripolitikası*`)
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