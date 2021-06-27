const Discord = require('discord.js');
const settings = require('../settings.json')

exports.run = (client, msg, args) => {
    const veriPolitikası = new Discord.MessageEmbed()
    .setColor(settings.color)
    .setTitle(`VERİ POLİTİKAMIZ`)
    .setThumbnail(settings.avatarURL)
    .setDescription('fiAnaliz ekibi olarak kişisel gizlilik haklarınıza saygı duyuyor ve botlarımızı kullandığınız süre zarfında bunu sağlamak için çaba sarf ediyoruz. Kişisel bilgilerinizin güvenliği ile ilgili açıklamalar aşağıda açıklanmış ve bilginize sunulmuştur.\n\n**Mesajlar:** \nMesajlarınız, gizliliğinize verdiğimiz önem sebebiyle kayıt altına alınmamakta ve üçüncü taraflarla paylaşılmamaktadır. Sadece ünlem işaretiyle (!) başlayan mesajlarınız veri tabanlarımızda AES 256 bit şifreleme ile güvenlik ve kullanım istatistikleri amacıyla saklanmaktadır.\n\n**Numaralarınız:** \nNumaralarınız cüzdan ve alarm sistemlerimizin kullanımı için veri tabanlarımızda AES 256 bit şifreleme ile saklanmaktadır. Veri tabanlarımız Türkiye sınırları içerisinde olup verileriniz yurt dışına çıkmamaktadır.\n\n**fiAnaliz** ekibi verilerinizin güvenliği ve gizliliği için çalışmaktadır.')
    .setFooter(`Bu komut ${msg.author.tag} kişisi tarafından çağrılmıştır.`, msg.author.avatarURL())
    .setTimestamp()

    msg.channel.send(veriPolitikası)
};

exports.conf = {
    aliases: ['VERİPOLİTİKASI', 'VERIPOLITIKASI'],
    permLevel: 0,
    kategori: 'Veriler'
};

exports.help = {
    name: 'veripolitikası',
    description: 'Verilerin gizliliğini tahahüt eder.',
    usage: 'veripolitikası'
};