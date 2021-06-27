const Discord = require('discord.js');
const request = require('request')
const settings = require('../settings.json')
const crypto = require('../util/functions/encrypt.js')
const Config = require('../Config.json')

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
String.prototype.float = function () {
    return parseFloat(this.replace(',', '.'));
}

function getEmbed(title, text, msg){
    return new Discord.MessageEmbed()
    .setTitle(title)
    .setColor(settings.color)
    .setDescription(text)
    .setFooter(`Cüzdan ${msg.author.tag} kişisine aittir.`, msg.author.avatarURL())
    .setTimestamp()
}


exports.run = async (client, msg, args) => {
    const cüzdanyardım = new Discord.MessageEmbed()
        .setColor(settings.color)
        .setTitle(`fiAnaliz | Cüzdan`)
        .setThumbnail(settings.avatarURL)
        .addFields({
            name: `Görmek için:`,
            value: `${settings.prefix}cüzdan`,
            inline: true
        }, {
            name: `Eklemek için:`,
            value: `${settings.prefix}cüzdan ekle {kripto} {miktar}`,
            inline: true
        }, {
            name: `Silmek için:`,
            value: `${settings.prefix}cüzdan sil {kripto} {Opsiyonel:miktar}`,
            inline: true
        })
        .setFooter(`${new Date().toLocaleString('tr-TR', {year: 'numeric', month: 'long', day: 'numeric'}) + ' ' + new Date().toLocaleTimeString('tr-TR')}`, settings.avatarURL);

    if (args[0] === undefined) {
        var url = `http://localhost:5000/wallets/get?userID=${crypto.encrypt(msg.author.id)}&platform=2`
        await request(url, (err, res, body) => {
            if (err) { console.log(err); return msg.channel.send(getEmbed("Bir hata tespit edildi!", "Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", msg)) }
            const data = JSON.parse(body)
            if (data.statusCode == 400) {
                msg.channel.send(getEmbed(`**Bir hata tespit edildi!**\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.`));
                return undefined
            }
            if (data.message.amount == 0) {
                var embed = new Discord.MessageEmbed()
                    .setColor(settings.color)
                    .setTitle(`fiAnaliz | CÜZDANIM`)
                    .setThumbnail(msg.author.avatarURL())
                    .setDescription(`Kripto varlık bulunamadı!\n\n**Toplam:**\n**TRY:** 0 ₺ **USD:** 0 $`)
                    .setFooter(`Cüzdan ${msg.author.tag} kişisine aittir.`, msg.author.avatarURL())
                    .setTimestamp()
                msg.channel.send(embed);
                return undefined
            }
            var walletInfo = ``
            data.message.prices.forEach(element => {
                if (element.type == 0) {
                    walletInfo = walletInfo + `**${Config.COIN_description[Config.COIN_id.indexOf(element.coinID)]}** | ${element.amount} ${Config.COIN_symbols[Config.COIN_id.indexOf(element.coinID)]}\n**TRY:** ${element.try.toFixed(2)} ₺ **USD:** ${element.usd.toFixed(2)} $\n\n`
                } else if (element.type == 1) {
                    walletInfo = walletInfo + `**${Config.TR_description[Config.TR_symbols.indexOf(element.coinID)]}** | ${element.amount} ${element.coinID}\n**TRY:** ${element.try.toFixed(2)} ₺ **USD:** ${element.usd.toFixed(2)} $\n\n`
                }
            })
            var embed = new Discord.MessageEmbed()
                .setColor(settings.color)
                .setTitle(`fiAnaliz | CÜZDANIM`)
                .setThumbnail(msg.author.avatarURL())
                .setDescription(`${walletInfo}**TOPLAM:**\n**TRY:** ${data.message.totals.try.toFixed(2)} ₺ **USD:** ${data.message.totals.usd.toFixed(2)} $`)
                .setFooter(`Cüzdan ${msg.author.tag} kişisine aittir.`, msg.author.avatarURL())
                .setTimestamp()
            return msg.channel.send(embed)
        })
        return undefined
    }
    if (args[0] == 'YARDIM') return msg.channel.send(cüzdanyardım)
    if (args[0] == 'EKLE') {
        if (args[1] === undefined) return msg.channel.send(getEmbed(`HATALI KULLANIM`, `Yardım için: ${settings.prefix}cüzdan yardım`, msg))
        if (Config.COIN_symbols.indexOf(args[1]) > -1) {
            if (args[2] === undefined) return msg.channel.send(getEmbed(`HATALI KULLANIM`, `Yardım için: ${settings.prefix}cüzdan yardım`, msg))
            if (isNumeric(args[2]) == false) return msg.channel.send(getEmbed(`HATALI KULLANIM`, `Lütfen miktarı sayı olarak giriniz!`, msg))
            if (args[2].float() <= 0) return msg.channel.send(getEmbed(`HATALI KULLANIM`, `Lütfen miktarı 0'dan büyük giriniz!`, msg))
            var url = `http://localhost:5000/wallets/update?userID=${crypto.encrypt(msg.author.id)}&stockID=${Config.COIN_id[Config.COIN_symbols.indexOf(args[1])]}&count=${args[2]}&buy=1&platform=2&type=0`
            await request(url, (err, res, body) => {
                if (err) { console.log(err); return msg.channel.send(getEmbed("Bir hata tespit edildi!", "Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", msg)) }
                const data = JSON.parse(body)
                if (data.statusCode == 400) {
                    msg.channel.send(getEmbed(`**Bir hata tespit edildi!**\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.`));
                    return undefined
                }
                if (data.statusCode == 333) {
                    msg.channel.send(getEmbed(`fiAnaliz | CÜZDANIM`, `Cüzdanınızda maksimum **(${data.max})** adette kripto bulunmaktadır!`, msg))
                    return undefined
                }
                return msg.reply(getEmbed(`fiAnaliz | CÜZDANIM`, `Başarıyla hesabınıza **${args[2]}** adet **${args[1]}** eklendi!`, msg))
            })
        }else if(Config.TR_symbols.indexOf(args[1]) > -1) {
            if (args[2] === undefined) return msg.channel.send(getEmbed(`HATALI KULLANIM`, `Yardım için: ${settings.prefix}cüzdan yardım`, msg))
            if (isNumeric(args[2]) == false) return msg.channel.send(getEmbed(`HATALI KULLANIM`, `Lütfen miktarı sayı olarak giriniz!`, msg))
            if (args[2].float() <= 0) return msg.channel.send(getEmbed(`HATALI KULLANIM`, `Lütfen miktarı 0'dan büyük giriniz!`, msg))
            var url = `http://localhost:5000/wallets/update?userID=${crypto.encrypt(msg.author.id)}&stockID=${args[1]}&count=${args[2]}&buy=1&platform=2&type=1`
            await request(url, (err, res, body) => {
                if (err) { console.log(err); return msg.channel.send(getEmbed("Bir hata tespit edildi!", "Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", msg)) }
                const data = JSON.parse(body)
                if (data.statusCode == 400) {
                    msg.channel.send(getEmbed(`**Bir hata tespit edildi!**\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.`));
                    return undefined
                }
                if (data.statusCode == 333) {
                    msg.channel.send(getEmbed(`fiAnaliz | CÜZDANIM`, `Cüzdanınızda maksimum **(${data.max})** adette kripto bulunmaktadır!`, msg))
                    return undefined
                }
                return msg.reply(getEmbed(`fiAnaliz | CÜZDANIM`, `Başarıyla hesabınıza **${args[2]}** adet **${args[1]}** eklendi!`, msg))
            })
        }else {
            msg.channel.send(getEmbed(`HATALI KULLANIM`, `Hisse tanımsız! Bir yanlışlık olduğunu düşünüyorsanız yetkililere iletiniz.`, msg));
            return undefined
        }
        return undefined
    }
    if (args[0] == 'SIL') {
        if (args[1] === undefined) return msg.channel.send(getEmbed(`HATALI KULLANIM`, `Yardım için: ${settings.prefix}cüzdan yardım`, msg))
        if (Config.COIN_symbols.indexOf(args[1]) > -1) {
            if (args[2] === undefined) {
                var url = `http://localhost:5000/wallets/update?userID=${crypto.encrypt(msg.author.id)}&stockID=${Config.COIN_id[Config.COIN_symbols.indexOf(args[1])]}&count=-1&buy=0&type=0&platform=2`
                await request(url, (err, res, body) => {
                    if (err) { console.log(err); return msg.channel.send(getEmbed("Bir hata tespit edildi!", "Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", msg)) }
                    const data = JSON.parse(body)
                    if (data.statusCode == 400) {
                        msg.reply(getEmbed(`Bir hata tespit edildi!`, `Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.`, msg));
                        return undefined
                    }
                    if (data.statusCode == 333 || data.statusCode == 332) {
                        msg.reply(getEmbed(`fiAnaliz | CÜZDANIM`, `Cüzdanınızda yeterli miktarda **${args[1]}** bulunamadı!`, msg))
                        return undefined
                    }
                    return msg.reply(getEmbed(`fiAnaliz | CÜZDANIM`, `Başarıyla hesabınızdan **${args[1]}** silindi!`, msg))
                })
                return undefined
            }
            if (isNumeric(args[2]) == false) return msg.channel.send(getEmbed(`HATALI KULLANIM`, `Lütfen miktarı sayı olarak giriniz!`, msg));
            if (args[2].float() <= 0) return msg.channel.send(getEmbed(`HATALI KULLANIM`, `Lütfen miktarı 0'dan büyük giriniz!`, msg));
            var url = `http://localhost:5000/wallets/update?userID=${crypto.encrypt(msg.author.id)}&stockID=${Config.COIN_id[Config.COIN_symbols.indexOf(args[1])]}&count=${args[2]}&buy=0&type=0&platform=2`
            await request(url, (err, res, body) => {
                if (err) {
                    return console.log(err);
                }
                const data = JSON.parse(body)
                if (data.statusCode == 400) {
                    msg.reply(getEmbed(`Bir hata tespit edildi!`, `Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.`, msg))
                    return undefined
                }
                if (data.statusCode == 333 || data.statusCode == 332) {
                    msg.reply(getEmbed(`fiAnaliz | CÜZDANIM`, `Cüzdanınızda yeterli miktarda **${args[1]}** bulunamadı!`, msg))
                    return undefined
                }
                return msg.reply(getEmbed(`fiAnaliz | CÜZDANIM`, `Başarıyla hesabınızdan **${args[2]}** adet **${args[1]}** silindi!`, msg))
            })
            return undefined
        }else if (Config.TR_symbols.indexOf(args[1]) > -1) {
            if (args[2] === undefined) {
                var url = `http://localhost:5000/wallets/update?userID=${crypto.encrypt(msg.author.id)}&stockID=${args[1]}&count=-1&buy=0&type=1&platform=2`
                await request(url, (err, res, body) => {
                    if (err) { console.log(err); return msg.channel.send(getEmbed("Bir hata tespit edildi!", "Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", msg)) }
                    const data = JSON.parse(body)
                    if (data.statusCode == 400) {
                        msg.reply(getEmbed(`Bir hata tespit edildi!`, `Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.`, msg));
                        return undefined
                    }
                    if (data.statusCode == 333 || data.statusCode == 332) {
                        msg.reply(getEmbed(`fiAnaliz | CÜZDANIM`, `Cüzdanınızda yeterli miktarda **${args[1]}** bulunamadı!`, msg))
                        return undefined
                    }
                    return msg.reply(getEmbed(`fiAnaliz | CÜZDANIM`, `Başarıyla hesabınızdan **${args[1]}** silindi!`, msg))
                })
                return undefined
            }
            if (isNumeric(args[2]) == false) return msg.channel.send(getEmbed(`HATALI KULLANIM`, `Lütfen miktarı sayı olarak giriniz!`, msg));
            if (args[2].float() <= 0) return msg.channel.send(getEmbed(`HATALI KULLANIM`, `Lütfen miktarı 0'dan büyük giriniz!`, msg));
            var url = `http://localhost:5000/wallets/update?userID=${crypto.encrypt(msg.author.id)}&stockID=${args[1]}&count=${args[2]}&buy=0&type=1&platform=2`
            await request(url, (err, res, body) => {
                if (err) { console.log(err); return msg.channel.send(getEmbed("Bir hata tespit edildi!", "Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", msg)) }
                const data = JSON.parse(body)
                if (data.statusCode == 400) {
                    msg.reply(getEmbed(`Bir hata tespit edildi!`, `Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.`, msg))
                    return undefined
                }
                if (data.statusCode == 333 || data.statusCode == 332) {
                    msg.reply(getEmbed(`fiAnaliz | CÜZDANIM`, `Cüzdanınızda yeterli miktarda **${args[1]}** bulunamadı!`, msg))
                    return undefined
                }
                return msg.reply(getEmbed(`fiAnaliz | CÜZDANIM`, `Başarıyla hesabınızdan **${args[2]}** adet **${args[1]}** silindi!`, msg))
            })
            return undefined
        } else {
            msg.channel.send(getEmbed(`HATALI KULLANIM`, `Hisse tanımsız! Bir yanlışlık olduğunu düşünüyorsanız yetkililere iletiniz.`, msg));
            return undefined
        }
    }
    return msg.channel.send(getEmbed(`HATALI KULLANIM`, `Yardım için: ${settings.prefix}cüzdan yardım`, msg));
};

exports.conf = {
    aliases: ['cuzdan', 'CUZDAN', 'CÜZDAN'],
    permLevel: 0,
    kategori: 'Cüzdan'
};

exports.help = {
    name: 'cüzdan',
    description: 'Bilgi amaçlı cüzdanı gösterir',
    usage: 'cüzdan'
};