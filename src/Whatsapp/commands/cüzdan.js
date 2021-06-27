const request = require('request')
const crypto = require('../util/functions/encrypt.js')
const Config = require('../Config.json')

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
String.prototype.float = function () {
    return parseFloat(this.replace(',', '.'));
}

exports.run = async (client, message, args) => {
    if(args[0] === undefined){
        var url = `http://localhost:5000/wallets/get?userID=${crypto.encrypt(message.sender.id)}&platform=0`
        await request(url, (err, res, body) => {
        if (err) {console.log(err); return client.sendText(message.from, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.");}
            const data = JSON.parse(body)
            if(data.statusCode == 400){
                client.sendText(message.from, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.")
                return undefined
            }
            if(data.message.amount == 0){
                client.sendTextWithMentions(message.from, `*CÜZDANIM* | @${message.sender.id}\n\nKripto varlık bulunamadı!\n\n*Toplam:*\n*TRY:* 0 ₺ *USD:* 0 $`)
                return undefined     
            }
            var walletInfo = ``
            data.message.prices.forEach(element => {
                if(element.type == 0){
                    walletInfo = walletInfo + `*${Config.COIN_description[Config.COIN_id.indexOf(element.coinID)]}* | ${element.amount} ${Config.COIN_symbols[Config.COIN_id.indexOf(element.coinID)]}\n*TRY:* ${element.try.toFixed(2)} ₺ *USD:* ${element.usd.toFixed(2)} $\n\n`
                }else if(element.type == 1){
                    walletInfo = walletInfo + `*${Config.TR_description[Config.TR_symbols.indexOf(element.coinID)]}* | ${element.amount} ${element.coinID}\n*TRY:* ${element.try.toFixed(2)} ₺ *USD:* ${element.usd.toFixed(2)} $\n\n`
                }
            })
            return client.sendTextWithMentions(message.from, `*CÜZDANIM* | @${message.sender.id}\n\n${walletInfo}*Toplam:*\n*TRY:* ${data.message.totals.try.toFixed(2)} ₺ *USD:* ${data.message.totals.usd.toFixed(2)} $`)
        })
        return undefined
    }
    if(args[0] == 'YARDIM') return client.sendText(message.from, "*CÜZDANIM* | Yardım\n\n*Görmek için:*\n!cüzdan\n*Eklemek için:*\n!cüzdan ekle {kripto ya da hisse} {miktar}\n*Silmek için:*\n!cüzdan sil {kripto ya da hisse} {Opsiyonel:miktar}")
    if(args[0] == 'EKLE'){
        if(args[1] === undefined) return client.sendText(message.from, "*HATALI KULLANIM*\nYardım için: !cüzdan yardım")
        if(Config.COIN_symbols.indexOf(args[1]) > -1){
            if(args[2] === undefined) return client.sendText(message.from, "*HATALI KULLANIM*\nYardım için: !cüzdan yardım")
            if(isNumeric(args[2]) == false) return client.sendText(message.from, "*HATALI KULLANIM*\nLütfen miktarı sayı olarak giriniz!")
            if(args[2].float() <= 0) return client.sendText(message.from, "*HATALI KULLANIM*\nLütfen miktarı 0'dan büyük giriniz!")
            var url = `http://localhost:5000/wallets/update?userID=${crypto.encrypt(message.sender.id)}&stockID=${Config.COIN_id[Config.COIN_symbols.indexOf(args[1])]}&count=${args[2]}&buy=1&platform=0&type=0`
            await request(url, (err, res, body) => {
            if (err) {console.log(err); return client.sendText(message.from, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz."); }
                const data = JSON.parse(body)
                if(data.statusCode == 400){
                    client.sendText(message.from, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.")
                    return undefined
                }
                if(data.statusCode == 333){
                    client.sendTextWithMentions(message.from, `*CÜZDANIM* | @${message.sender.id}\n\nCüzdanınızda maksimum *(${data.max})* adette kripto bulunmaktadır!`)
                    return undefined
                }
                return client.sendTextWithMentions(message.from, `*CÜZDANIM* | @${message.sender.id}\n\nBaşarıyla hesabınıza *${args[2]}* adet *${args[1]}* eklendi!`)
            })
            return undefined
        }else if(Config.TR_symbols.indexOf(args[1]) > -1){
                if(args[2] === undefined) return client.sendText(message.from, "*HATALI KULLANIM*\nYardım için: !cüzdan yardım")
                if(isNumeric(args[2]) == false) return client.sendText(message.from, "*HATALI KULLANIM*\nLütfen miktarı sayı olarak giriniz!")
                if(args[2].float() <= 0) return client.sendText(message.from, "*HATALI KULLANIM*\nLütfen miktarı 0'dan büyük giriniz!")
                var url = `http://localhost:5000/wallets/update?userID=${crypto.encrypt(message.sender.id)}&stockID=${args[1]}&count=${args[2]}&buy=1&platform=0&type=1`
                await request(url, (err, res, body) => {
                if (err) {console.log(err); return client.sendText(message.from, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz."); }
                    const data = JSON.parse(body)
                    if(data.statusCode == 400){
                        client.sendText(message.from, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.")
                        return undefined
                    }
                    if(data.statusCode == 333){
                        client.sendTextWithMentions(message.from, `*CÜZDANIM* | @${message.sender.id}\n\nCüzdanınızda maksimum *(${data.max})* adette kripto bulunmaktadır!`)
                        return undefined
                    }
                    return client.sendTextWithMentions(message.from, `*CÜZDANIM* | @${message.sender.id}\n\nBaşarıyla hesabınıza *${args[2]}* adet *${args[1]}* eklendi!`)
                
                })
                return undefined
        }else{
            client.sendText(message.from, "*HATALI KULLANIM*\nKripto tanımsız! Bir yanlışlık olduğunu düşünüyorsanız yetkililere iletiniz.")
            return undefined
        }
        return undefined
    }
    if(args[0] == 'SIL'){
        if(args[1] === undefined) return client.sendText(message.from, "*HATALI KULLANIM*\nYardım için: !cüzdan yardım")
        if(Config.COIN_symbols.indexOf(args[1]) > -1){
            if(args[2] === undefined){
                var url = `http://localhost:5000/wallets/update?userID=${crypto.encrypt(message.sender.id)}&stockID=${Config.COIN_id[Config.COIN_symbols.indexOf(args[1])]}&count=-1&buy=0&type=0&platform=0`
                await request(url, (err, res, body) => {
                if (err) {console.log(err); return client.sendText(message.from, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz."); }
                    const data = JSON.parse(body)
                    if(data.statusCode == 400){
                        client.sendText(message.from, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.")
                        return undefined
                    }
                    if(data.statusCode == 333 || data.statusCode == 332){
                        client.sendTextWithMentions(message.from, `*CÜZDANIM* | @${message.sender.id}\n\nCüzdanınızda yeterli miktarda *${args[1]}* bulunamadı!`)
                        return undefined
                    }
                    return client.sendTextWithMentions(message.from, `*CÜZDANIM* | @${message.sender.id}\n\nBaşarıyla hesabınızdan *${args[1]}* silindi!`)
                })  
                return undefined       
            }
            if(isNumeric(args[2]) == false) return client.sendText(message.from, "*HATALI KULLANIM*\nLütfen miktarı sayı olarak giriniz!")
            if(args[2].float() <= 0) return client.sendText(message.from, "*HATALI KULLANIM*\nLütfen miktarı 0'dan büyük giriniz!")
            var url = `http://localhost:5000/wallets/update?userID=${crypto.encrypt(message.sender.id)}&stockID=${Config.COIN_id[Config.COIN_symbols.indexOf(args[1])]}&count=${args[2]}&buy=0&type=0&platform=0`
            await request(url, (err, res, body) => {
            if (err) {console.log(err); return client.sendText(message.from, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz."); }
                const data = JSON.parse(body)
                if(data.statusCode == 400){
                    client.sendText(message.from, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.")
                    return undefined
                }
                if(data.statusCode == 333 || data.statusCode == 332){
                    client.sendTextWithMentions(message.from, `*CÜZDANIM* | @${message.sender.id}\n\nCüzdanınızda yeterli miktarda *${args[1]}* bulunamadı!`)
                    return undefined
                }
                return client.sendTextWithMentions(message.from, `*CÜZDANIM* | @${message.sender.id}\n\nBaşarıyla hesabınızdan *${args[2]}* adet *${args[1]}* azaltıldı!`)
            }) 
        }else if(Config.TR_symbols.indexOf(args[1]) > -1){
                if(args[2] === undefined){
                    var url = `http://localhost:5000/wallets/update?userID=${crypto.encrypt(message.sender.id)}&stockID=${args[1]}&count=-1&buy=0&type=1&platform=0`
                    await request(url, (err, res, body) => {
                    if (err) {console.log(err); return client.sendText(message.from, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz."); }
                        const data = JSON.parse(body)
                        if(data.statusCode == 400){
                            client.sendText(message.from, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.")
                            return undefined
                        }
                        if(data.statusCode == 333 || data.statusCode == 332){
                            client.sendTextWithMentions(message.from, `*CÜZDANIM* | @${message.sender.id}\n\nCüzdanınızda yeterli miktarda *${args[1]}* bulunamadı!`)
                            return undefined
                        }
                        return client.sendTextWithMentions(message.from, `*CÜZDANIM* | @${message.sender.id}\n\nBaşarıyla hesabınızdan *${args[1]}* silindi!`)
                    })  
                    return undefined       
                }
                if(isNumeric(args[2]) == false) return client.sendText(message.from, "*HATALI KULLANIM*\nLütfen miktarı sayı olarak giriniz!")
                if(args[2].float() <= 0) return client.sendText(message.from, "*HATALI KULLANIM*\nLütfen miktarı 0'dan büyük giriniz!")
                var url = `http://localhost:5000/wallets/update?userID=${crypto.encrypt(message.sender.id)}&stockID=${args[1]}&count=${args[2]}&buy=0&type=1&platform=0`
                await request(url, (err, res, body) => {
                if (err) {console.log(err); return client.sendText(message.from, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz."); }
                    const data = JSON.parse(body)
                    if(data.statusCode == 400){
                        client.sendText(message.from, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.")
                        return undefined
                    }
                    if(data.statusCode == 333 || data.statusCode == 332){
                        client.sendTextWithMentions(message.from, `*CÜZDANIM* | @${message.sender.id}\n\nCüzdanınızda yeterli miktarda *${args[1]}* bulunamadı!`)
                        return undefined
                    }
                    return client.sendTextWithMentions(message.from, `*CÜZDANIM* | @${message.sender.id}\n\nBaşarıyla hesabınızdan *${args[2]}* adet *${args[1]}* azaltıldı!`)
                }) 
                return undefined
        }else{
            client.sendText(message.from, "*HATALI KULLANIM*\nKod tanımsız! Bir yanlışlık olduğunu düşünüyorsanız yetkililere iletiniz.")
            return undefined
        }
        return undefined
    }
    return client.sendText(message.from, "*HATALI KULLANIM*\nYardım için: !cüzdan yardım")
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