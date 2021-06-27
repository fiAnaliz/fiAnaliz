const settings = require('../settings.json')
const request = require('request')
const Config = require('../Config.json')

exports.run = async (client, message, args) => {
    var whereIs = ''
    if(args[0] == undefined) return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nLütfen bir kod giriniz!", {parse_mode: 'Markdown'})
    if(Config.TR_symbols.includes(args[0])){
        whereIs = 'BIST'
    }else if(Config.US_symbols.includes(args[0].substring(1,args[0].length-3)) && args[0].substring(args[0].length-3) === ".US") {
        whereIs = 'US'
    }else if(Config.COIN_symbols.includes(args[0])) {
        whereIs = 'COIN'
    }else{
        return client.sendMessage(message.chat.id, "*HATALI KULLANIM*\nTanımsız bir kod girdiniz!", {parse_mode: 'Markdown'})
    }
                
    if(whereIs == 'BIST'){
        var url = `http://localhost:5000/chart?stock=${args[0]}&whereIs=${whereIs}&desc=${Config.TR_description[Config.TR_symbols.indexOf(args[0])]}`
        await request(url, (err, res, body) => {
        if (err) {  console.log(err); return client.sendMessage(message.chat.id, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", {parse_mode: 'Markdown'})}
            const data = JSON.parse(body);
            var image = data.image;
            client.sendPhoto(message.chat.id, Buffer.from(image, 'base64'));
        })
    }else if(whereIs == 'COIN'){
        var url = `http://localhost:5000/chart?stock=${Config.COIN_id[Config.COIN_symbols.indexOf(args[0])]}&whereIs=${whereIs}&coinKey=${args[0]}&desc=${Config.COIN_description[Config.COIN_symbols.indexOf(args[0])]}`
        await request(url, (err, res, body) => {
        if (err) { console.log(err); return client.sendMessage(message.chat.id, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", {parse_mode: 'Markdown'})}
            const data = JSON.parse(body);
            var image = data.image;
            client.sendPhoto(message.chat.id, Buffer.from(image, 'base64'));
        })
    }else if(whereIs == 'US'){
        var url = `http://localhost:5000/chart?stock=${args[0]}&whereIs=${whereIs}&coinKey=${args[0]}&desc=${Config.US_description[Config.US_symbols.indexOf(args[0])]}`
        await request(url, (err, res, body) => {
        if (err) { console.log(err); return client.sendMessage(message.chat.id, "*Bir hata tespit edildi!*\nYetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", {parse_mode: 'Markdown'});}
            const data = JSON.parse(body);
            var image = data.image;
            client.sendPhoto(message.chat.id, Buffer.from(image, 'base64'));
        })
    }
}

exports.conf = {
    aliases: ['GRAFIK', 'GRAFİK'],
    permLevel: 0,
    kategori: 'Grafik'
};

exports.help = {
    name: 'grafik',
    description: 'Seçilen şeyin grafiğini getirir',
    usage: 'grafik (kod)'
};