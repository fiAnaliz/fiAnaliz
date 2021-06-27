const settings = require('../settings.json')
const Config = require('../Config.json')
const request = require('request')
const crypto = require('../util/functions/encrypt.js');

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

exports.run = async (client, message, args) => {
    if(args[0] === undefined){
        var url = `http://localhost:5000/alert/get?fromNumber=${crypto.encrypt(message.from.id)}&platform=1`;
        await request(url, (err, res, body) => {
        if (err) { console.log(err); return client.sendMessage(message.chat.id, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", {parse_mode: 'Markdown'}) }
            const data = JSON.parse(body)
            if(data.statusCode == 400){
                client.sendMessage(message.chat.id, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", {parse_mode: 'Markdown'})
                return undefined
            }
            if(data.statusCode == 331){
                client.sendMessage(message.chat.id, `*! YASAL UYARI !*\n\nFiyat alarm sisteminde meydana gelebilecek olan arıza, kesinti veya bakım sebebiyle sistem üzerindeki alarmlarınızın koşulların gerçekleşip bildirimlerin sizin tarafınıza gönderilememesi halinde kullanıcı sistemi *sorumlu tutamaz*, herhangi bir *yasal hak talep edemez*.\n\n*Onaylamak için:* !alarm onayla`, {parse_mode : "Markdown", reply_to_message_id : message.message_id})
                return undefined
            }
            if(data.amount == 0){
                client.sendMessage(message.chat.id, `*ALARMLARIM*\n\nKayıtlı bir alarm bulunamadı!\n\n*Eklemek için:*\n!alarm ekle {kripto} {< ya da >} {hedef fiyat}`, {parse_mode : "Markdown", reply_to_message_id : message.message_id})
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
                walletInfo = walletInfo + `*[${i}] [${platform}]* ${desc} ${(element.compare == 0) ? '<': '>'} ${element.price} ${curr}\n`
            })
            return client.sendMessage(message.chat.id, `*ALARMLARIM*\n\n${walletInfo}\nToplam *${data.amount}* adet alarmınız bulunmaktadır!`, {parse_mode : "Markdown", reply_to_message_id : message.message_id})
        })
        return undefined
    }
    if(args[0] == 'YARDIM') return client.sendMessage(message.chat.id, "*ALARMLARIM* | Yardım\n\n*Görmek için:*\n!alarm\n*Eklemek için:*\n!alarm ekle {kripto} {< ya da >} {hedef fiyat}\n*Silmek için:*\n!alarm sil {alarm numarası}", {parse_mode : "Markdown"})
    if(args[0] == 'EKLE'){
        if(args[1] === undefined) return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nYardım için: !alarm yardım", {parse_mode: 'Markdown'})
        if(Config.COIN_symbols.indexOf(args[1]) > -1){
            if(args[2] === undefined) return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nYardım için: !alarm yardım", {parse_mode: 'Markdown'})
            if(!(args[2] == '<' || args[2] == '>')) return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nLütfen sadece büyüktür ya da küçüktür işareti kullanınız!", {parse_mode: 'Markdown'})
            if(args[3] === undefined) return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nYardım için: !alarm yardım", {parse_mode: 'Markdown'})
            if(isNumeric(args[3]) == false) return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nLütfen hedef fiyatı sayı olarak giriniz!", {parse_mode: 'Markdown'})
            if(args[3].float() <= 0) return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nLütfen hedef fiyatı 0'dan büyük giriniz!", {parse_mode: 'Markdown'})
            var url = `http://localhost:5000/alert/set?fromNumber=${crypto.encrypt(message.from.id)}&toNumber=${crypto.encrypt(message.chat.id)}&price=${args[3]}&status=${(args[2] == '<') ? '0' : '1'}&type=0&coinID=${Config.COIN_id[Config.COIN_symbols.indexOf(args[1])]}&platform=1`
            await request(url, (err, res, body) => {
                if (err) { console.log(err); return client.sendMessage(message.chat.id, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", {parse_mode: 'Markdown'}) }
                    const data = JSON.parse(body)
                    if(data.statusCode == 400){
                        client.sendMessage(message.chat.id, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", {parse_mode: 'Markdown'})
                        return undefined
                    }
                    if(data.statusCode == 331){
                        client.sendMessage(message.chat.id, `*! YASAL UYARI !*\n\nFiyat alarm sisteminde meydana gelebilecek olan arıza, kesinti veya bakım sebebiyle sistem üzerindeki alarmlarınızın koşulların gerçekleşip bildirimlerin sizin tarafınıza gönderilememesi halinde kullanıcı sistemi *sorumlu tutamaz*, herhangi bir *yasal hak talep edemez*.\n\n*Onaylamak için:* !alarm onayla`, {parse_mode : "Markdown", reply_to_message_id : message.message_id})
                        return undefined
                    }
                    if(data.statusCode == 333){
                        client.sendMessage(message.chat.id, `*ALARMLARIM*\n\nCüzdanınızda maksimum *(${data.max})* adette alarm bulunmaktadır!`, {parse_mode : "Markdown", reply_to_message_id : message.message_id})
                        return undefined
                    }
                    return client.sendMessage(message.chat.id, `*ALARMLARIM*\n\nBaşarıyla *${args[1]}*, *${args[3]}* fiyattan ${(args[2] == '<') ? '*küçük veya eşit*' : '*büyük veya eşit*'} olma koşullu alarmınız eklendi!`, {parse_mode : "Markdown", reply_to_message_id : message.message_id})
                })
            return undefined
        }else if(Config.TR_symbols.indexOf(args[1]) > -1){
            if(args[2] === undefined) return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nYardım için: !alarm yardım", {parse_mode: 'Markdown'})
            if(!(args[2] == '<' || args[2] == '>')) return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nLütfen sadece büyüktür ya da küçüktür işareti kullanınız!", {parse_mode: 'Markdown'})
            if(args[3] === undefined) return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nYardım için: !alarm yardım", {parse_mode: 'Markdown'})
            if(isNumeric(args[3]) == false) return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nLütfen hedef fiyatı sayı olarak giriniz!", {parse_mode: 'Markdown'})
            if(args[3].float() <= 0) return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nLütfen hedef fiyatı 0'dan büyük giriniz!", {parse_mode: 'Markdown'})
            var url = `http://localhost:5000/alert/set?fromNumber=${crypto.encrypt(message.from.id)}&toNumber=${crypto.encrypt(message.chat.id)}&price=${args[3]}&status=${(args[2] == '<') ? '0' : '1'}&type=1&coinID=${args[1]}&platform=1`
            await request(url, (err, res, body) => {
                if (err) { console.log(err); return client.sendMessage(message.chat.id, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", {parse_mode: 'Markdown'}) }
                    const data = JSON.parse(body)
                    if(data.statusCode == 400){
                        client.sendMessage(message.chat.id, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", {parse_mode: 'Markdown'})
                        return undefined
                    }
                    if(data.statusCode == 331){
                        client.sendMessage(message.chat.id, `*! YASAL UYARI !*\n\nFiyat alarm sisteminde meydana gelebilecek olan arıza, kesinti veya bakım sebebiyle sistem üzerindeki alarmlarınızın koşulların gerçekleşip bildirimlerin sizin tarafınıza gönderilememesi halinde kullanıcı sistemi *sorumlu tutamaz*, herhangi bir *yasal hak talep edemez*.\n\n*Onaylamak için:* !alarm onayla`, {parse_mode : "Markdown", reply_to_message_id : message.message_id})
                        return undefined
                    }
                    if(data.statusCode == 333){
                        client.sendMessage(message.chat.id, `*ALARMLARIM*\n\nCüzdanınızda maksimum *(${data.max})* adette alarm bulunmaktadır!`, {parse_mode : "Markdown", reply_to_message_id : message.message_id})
                        return undefined
                    }
                    return client.sendMessage(message.chat.id, `*ALARMLARIM*\n\nBaşarıyla *${args[1]}*, *${args[3]}* fiyattan ${(args[2] == '<') ? '*küçük veya eşit*' : '*büyük veya eşit*'} olma koşullu alarmınız eklendi!`, {parse_mode : "Markdown", reply_to_message_id : message.message_id})
                })
            return undefined
        }else{
            client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nKripto tanımsız! Bir yanlışlık olduğunu düşünüyorsanız yetkililere iletiniz.", {parse_mode : 'Markdown'})
            return undefined
        }
        return undefined
    }
    if(args[0] == 'SIL'){
        if(args[1] === undefined) return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nYardım için: !alarm yardım", {parse_mode: 'Markdown'})
        if(isNumeric(args[1]) == false) return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nLütfen alarm numarasını sayı olarak giriniz!", {parse_mode: 'Markdown'})
        if(args[1].float() <= 0) return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nLütfen alarm numarasını 0'dan büyük giriniz!", {parse_mode: 'Markdown'})
        if(!Number.isInteger(args[1].float())) return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nLütfen alarm numarasını tam sayı giriniz!", {parse_mode: 'Markdown'})
        args[1] = parseInt(args[1])
        var url = `http://localhost:5000/alert/del?fromNumber=${crypto.encrypt(message.from.id)}&id=${args[1]}&platform=1` 
        await request(url, (err, res, body) => {
            if (err) { console.log(err); return client.sendMessage(message.chat.id, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", {parse_mode: 'Markdown'}) }
                const data = JSON.parse(body)
                if(data.statusCode == 400){
                    client.sendMessage(message.chat.id, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", {parse_mode: 'Markdown'})
                    return undefined
                }
                if(data.statusCode == 331){
                    client.sendMessage(message.chat.id, `*! YASAL UYARI !*\n\nFiyat alarm sisteminde meydana gelebilecek olan arıza, kesinti veya bakım sebebiyle sistem üzerindeki alarmlarınızın koşulların gerçekleşip bildirimlerin sizin tarafınıza gönderilememesi halinde kullanıcı sistemi *sorumlu tutamaz*, herhangi bir *yasal hak talep edemez*.\n\n*Onaylamak için:* !alarm onayla`, {parse_mode : "Markdown", reply_to_message_id : message.message_id})
                    return undefined
                }
                if(data.statusCode == 333){
                    client.sendMessage(message.chat.id, `*ALARMLARIM*\n\n*[${args[1]}]* numaralı alarm bulunamadı!`, {parse_mode : "Markdown", reply_to_message_id : message.message_id})
                    return undefined
                }
                return client.sendMessage(message.chat.id, `*ALARMLARIM*\n\nBaşarıyla *[${args[1]}]* numaralı alarmınız silindi!`, {parse_mode : "Markdown", reply_to_message_id : message.message_id})
            })
        return undefined
    }
    if(args[0] == 'ONAYLA'){
        var url = `http://localhost:5000/alert/confirmation?fromNumber=${crypto.encrypt(message.from.id)}&platform=1` 
        await request(url, (err, res, body) => {
            if (err) { console.log(err); return client.sendMessage(message.chat.id, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", {parse_mode: 'Markdown'}) }
                const data = JSON.parse(body)
                if(data.statusCode == 400){
                    client.sendMessage(message.chat.id, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", {parse_mode: 'Markdown'})
                    return undefined
                }
                return client.sendMessage(message.chat.id, `*ALARMLARIM*\n\nArtık fiyat alarm sistemini kullanmaya başlayabilirsiniz!`, {parse_mode : "Markdown", reply_to_message_id : message.message_id})
            })
        return undefined
    }
    return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nYardım için: !alarm yardım", {parse_mode: 'Markdown'})
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