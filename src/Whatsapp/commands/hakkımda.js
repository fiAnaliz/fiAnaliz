

exports.run = (client, message, args) => {
    return client.sendText(message.from, `*fiAnaliz* | Hakkımda\n\n*Öneri, destek ve şikayet için e-posta adresimiz:*\nyatirimpluss@gmail.com`)
};

exports.conf = {
    aliases: ['HAKKIMDA', 'HAKKİMDA'],
    permLevel: 0,
    kategori: 'Hakkımda'
};

exports.help = {
    name: 'hakkında',
    description: 'Bot hakkında bilgi verir',
    usage: 'hakkımda'
};