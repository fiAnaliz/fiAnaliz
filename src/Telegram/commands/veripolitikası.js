

exports.run = (client, message, args) => {
    return client.sendMessage(message.chat.id, `*VERİ POLİTİKAMIZ*\n\nfiAnaliz ekibi olarak kişisel gizlilik haklarınıza saygı duyuyor ve botlarımızı kullandığınız süre zarfında bunu sağlamak için çaba sarf ediyoruz. Kişisel bilgilerinizin güvenliği ile ilgili açıklamalar aşağıda açıklanmış ve bilginize sunulmuştur.\n\n*Mesajlar:* \nMesajlarınız, gizliliğinize verdiğimiz önem sebebiyle kayıt altına alınmamakta ve üçüncü taraflarla paylaşılmamaktadır. Sadece ünlem işaretiyle (!) başlayan mesajlarınız veri tabanlarımızda AES 256 bit şifreleme ile güvenlik ve kullanım istatistikleri amacıyla saklanmaktadır.\n\n*Numaralarınız:* \nNumaralarınız cüzdan ve alarm sistemlerimizin kullanımı için veri tabanlarımızda AES 256 bit şifreleme ile saklanmaktadır. Veri tabanlarımız Türkiye sınırları içerisinde olup verileriniz yurt dışına çıkmamaktadır.\n\n*fiAnaliz* ekibi verilerinizin güvenliği ve gizliliği için çalışmaktadır.`, {parse_mode: 'Markdown'})
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