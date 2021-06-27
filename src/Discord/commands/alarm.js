const Discord = require('discord.js');
const settings = require('../settings.json')
const Config = require('../Config.json')
const request = require('request')
const crypto = require('../util/functions/encrypt.js');
const { get } = require('cheerio/lib/api/traversing');

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
String.prototype.float = function() { 
    return parseFloat(this.replace(',', '.')); 
}

Number.prototype.noExponents= function(){
    var data= String(this).split(/[eE]/);
    if(data.length== 1) return data[0]; 

    var  z= '', sign= this<0? '-':'',
    str= data[0].replace('.', ''),
    mag= Number(data[1])+ 1;

    if(mag<0){
        z= sign + '0.';
        while(mag++) z += '0';
        return z + str.replace(/^\-/,'');
    }
    mag -= str.length;  
    while(mag--) z += '0';
    return str + z;
}

function getEmbed(title, text, msg){
    return new Discord.MessageEmbed()
    .setTitle(title)
    .setColor(settings.color)
    .setDescription(text)
    .setFooter(`Alarmlar ${msg.author.tag} kişisine aittir.`, msg.author.avatarURL())
    .setTimestamp()
}

exports.run = async (client, msg, args) => {
    const alarmyardım = new Discord.MessageEmbed()
    .setColor(settings.color)
    .setTitle(`fiAnaliz | Alarm Yardım`)
    .setThumbnail(settings.avatarURL)
    .addFields(
        {name: `Görmek için:`, value: `${settings.prefix}alarm`, inline: true},
        {name: `Eklemek için:`, value: `${settings.prefix}alarm ekle {kripto} {< ya da >} {hedef fiyat}`, inline: true},
        {name: `Silmek için:`, value: `${settings.prefix}alarm sil {alarm numarası}`, inline: true}
    )
    .setFooter(`${new Date().toLocaleString('tr-TR', {year: 'numeric', month: 'long', day: 'numeric'}) + ' ' + new Date().toLocaleTimeString('tr-TR')}`, settings.avatarURL);

    if(args[0] === undefined){
        var url = `http://localhost:5000/alert/get?fromNumber=${crypto.encrypt(msg.author.id)}&platform=2`;
        await request(url, (err, res, body) => {
        if (err) { console.log(err); return msg.channel.send(getEmbed("Bir hata tespit edildi!", "Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", msg)) }
            const data = JSON.parse(body)
            if(data.statusCode == 400){
                msg.channel.send(getEmbed("Bir hata tespit edildi!", "Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", msg));
                return undefined
            }
            if(data.statusCode == 331){
                msg.channel.send(getEmbed("! YASAL UYARI !", `Fiyat alarm sisteminde meydana gelebilecek olan arıza, kesinti veya bakım sebebiyle sistem üzerindeki alarmlarınızın koşulların gerçekleşip bildirimlerin sizin tarafınıza gönderilememesi halinde kullanıcı sistemi **sorumlu tutamaz**, herhangi bir **yasal hak talep edemez**.\n\n**Onaylamak için:** ${settings.prefix}alarm onayla`, msg))
                return undefined
            }
            if(data.amount == 0){
                msg.channel.send(getEmbed("fiAnaliz | ALARMLARIM", `Kayıtlı bir alarm bulunamadı!\n\n**Eklemek için:**\n${settings.prefix}alarm ekle {kripto} {< ya da >} {hedef fiyat}`, msg))
                return undefined     
            }
            var walletInfo = ``, i = 0
            data.message.forEach(element => {
                ++i
                switch(element.platform){
                    case 0:
                        platform = "WP"
                        break
                    case 1:
                        platform = "TG"
                        break
                    case 2:
                        platform = "DC"
                }
                switch(element.type){
                    case 0:
                        desc = Config.COIN_symbols[Config.COIN_id.indexOf(element.code)]
                        curr = "$"
                        break
                    case 1:
                        desc= element.code
                        curr = "₺"
                }
                walletInfo = walletInfo + `**[${i}] [${platform}]** ${desc} ${(element.compare == 0) ? '<': '>'} ${element.price.noExponents()} ${curr}\n`
            })
            return msg.channel.send(getEmbed("fiAnaliz | ALARMLARIM", `${walletInfo}\nToplam **${data.amount}** adet alarmınız bulunmaktadır!`, msg))
        })
        return undefined
    }
    if(args[0] == 'YARDIM') return msg.channel.send(alarmyardım)
    if(args[0] == 'EKLE'){
        if(args[1] === undefined) return msg.channel.send(getEmbed("HATALI KULLANIM", `Yardım için: ${settings.prefix}alarm yardım`, msg))
        if(Config.COIN_symbols.indexOf(args[1]) > -1){
            if(args[2] === undefined) return msg.channel.send(getEmbed("HATALI KULLANIM", `Yardım için: ${settings.prefix}alarm yardım`, msg))
            if(!(args[2] == '<' || args[2] == '>')) return msg.channel.send(getEmbed("HATALI KULLANIM", "Lütfen sadece büyüktür (>) ya da küçüktür (<) işareti kullanınız!", msg))
            if(args[3] === undefined) return msg.channel.send(getEmbed("HATALI KULLANIM", `Yardım için: ${settings.prefix}alarm yardım`, msg))
            if(isNumeric(args[3]) == false) return msg.channel.send(getEmbed("HATALI KULLANIM", "Lütfen hedef fiyatı sayı olarak giriniz!", msg))
            if(args[3].float() <= 0) return msg.channel.send(getEmbed("HATALI KULLANIM", "Lütfen hedef fiyatı 0'dan büyük giriniz!", msg))
            var url = `http://localhost:5000/alert/set?fromNumber=${crypto.encrypt(msg.author.id)}&toNumber=${crypto.encrypt(msg.channel.id)}&price=${args[3]}&status=${(args[2] == '<') ? '0' : '1'}&type=0&coinID=${Config.COIN_id[Config.COIN_symbols.indexOf(args[1])]}&platform=2`
            await request(url, (err, res, body) => {
                if (err) { console.log(err); return msg.channel.send(getEmbed("Bir hata tespit edildi!", "Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", msg)) }
                    const data = JSON.parse(body)
                    if(data.statusCode == 400){
                        msg.channel.send(getEmbed("Bir hata tespit edildi!", "Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", msg))
                        return undefined
                    }
                    if(data.statusCode == 331){
                        msg.channel.send(getEmbed("! YASAL UYARI !", `Fiyat alarm sisteminde meydana gelebilecek olan arıza, kesinti veya bakım sebebiyle sistem üzerindeki alarmlarınızın koşulların gerçekleşip bildirimlerin sizin tarafınıza gönderilememesi halinde kullanıcı sistemi **sorumlu tutamaz**, herhangi bir **yasal hak talep edemez**.\n\n**Onaylamak için:** ${settings.prefix}alarm onayla`, msg))
                        return undefined
                    }
                    if(data.statusCode == 333){
                        msg.channel.send(getEmbed("fiAnaliz | ALARMLARIM", `Cüzdanınızda maksimum **(${data.max})** adette alarm bulunmaktadır!`, msg))
                        return undefined
                    }
                    return msg.channel.send(getEmbed("fiAnaliz | ALARMLARIM", `Başarıyla **${args[1]}**, **${args[3]}** fiyattan ${(args[2] == '<') ? '**küçük veya eşit**' : '**büyük veya eşit**'} olma koşullu alarmınız eklendi!`, msg))
                })
            return undefined
        }else{
            msg.channel.send(getEmbed("HATALI KULLANIM", "Kripto tanımsız! Bir yanlışlık olduğunu düşünüyorsanız yetkililere iletiniz.", msg))
            return undefined
        }
        return undefined
    }
    if(args[0] == 'SIL'){
        if(args[1] === undefined) return msg.channel.send(`**HATALI KULLANIM**\nYardım için: ${settings.prefix}alarm yardım`)
        if(isNumeric(args[1]) == false) return msg.channel.send(`**HATALI KULLANIM**\nLütfen alarm numarasını sayı olarak giriniz!`)
        if(args[1].float() <= 0) return msg.channel.send(`**HATALI KULLANIM**\nLütfen alarm numarasını 0'dan büyük giriniz!`)
        if(!Number.isInteger(args[1].float())) return msg.channel.send(`**HATALI KULLANIM**\nLütfen alarm numarasını tam sayı giriniz!`)
        args[1] = parseInt(args[1])
        var url = `http://localhost:5000/alert/del?fromNumber=${crypto.encrypt(msg.author.id)}&id=${args[1]}&platform=2` 
        await request(url, (err, res, body) => {
            if (err) { console.log(err); return msg.channel.send(getEmbed("Bir hata tespit edildi!", "Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", msg)) }
                const data = JSON.parse(body)
                if(data.statusCode == 400){
                    msg.channel.send(getEmbed("Bir hata tespit edildi!", "Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", msg))
                    return undefined
                }
                if(data.statusCode == 331){
                    msg.channel.send(getEmbed("! YASAL UYARI !", `Fiyat alarm sisteminde meydana gelebilecek olan arıza, kesinti veya bakım sebebiyle sistem üzerindeki alarmlarınızın koşulların gerçekleşip bildirimlerin sizin tarafınıza gönderilememesi halinde kullanıcı sistemi **sorumlu tutamaz**, herhangi bir **yasal hak talep edemez**.\n\n**Onaylamak için:** ${settings.prefix}alarm onayla`, msg))
                    return undefined
                }
                if(data.statusCode == 333){
                    msg.channel.send(getEmbed("fiAnaliz | ALARMLARIM", `**[${args[1]}]** numaralı alarm bulunamadı!`, msg))
                    return undefined
                }
                return msg.channel.send(getEmbed("fiAnaliz | ALARMLARIM", `Başarıyla **[${args[1]}]** numaralı alarmınız silindi!`, msg))
            })
        return undefined
    }
    if(args[0] == 'ONAYLA'){
        var url = `http://localhost:5000/alert/confirmation?fromNumber=${crypto.encrypt(msg.author.id)}&platform=2` 
        await request(url, (err, res, body) => {
            if (err) { console.log(err); return msg.channel.send(getEmbed("Bir hata tespit edildi!", "Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", msg)) }
                const data = JSON.parse(body)
                if(data.statusCode == 400){
                    msg.channel.send(getEmbed("Bir hata tespit edildi!", "Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", msg))
                    return undefined
                }
                return msg.channel.send(getEmbed("fiAnaliz | ALARMLARIM", `Artık fiyat alarm sistemini kullanmaya başlayabilirsiniz!`, msg))
            })
        return undefined
    }
    return msg.channel.send(getEmbed("HATALI KULLANIM", `Yardım için: ${settings.prefix}alarm yardım`, msg))
}



exports.conf = {
    aliases: ['ALARM'],
    permLevel: 0,
    kategori: 'Alarm'
};

exports.help = {
    name: 'alarm',
    description: 'Alarm sistemine ekleme çıkarma yapmaya yarar.',
    usage: 'alarm'
};