

exports.run = (client, message, args) => {
    return client.sendMessage(message.chat.id, `*fiAnaliz* | Hakkımda\n\n*Öneri, destek ve şikayet için e-posta adresimiz:*\nyatirimpluss@gmail.com`, {parse_mode: 'Markdown'})
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