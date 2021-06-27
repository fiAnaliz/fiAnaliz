const Discord = require('discord.js');
const settings = require('../settings.json')
const request = require('request')
const Config = require('../Config.json')

function getEmbed(title, text, msg){
    return new Discord.MessageEmbed()
    .setTitle(title)
    .setColor(settings.color)
    .setDescription(text)
    .setFooter(`Bu komut ${msg.author.tag} kişisi tarafından çağrılmıştır.`, msg.author.avatarURL())
    .setTimestamp()
}


exports.run = async (client, msg, args) => {

    var whereIs = ''
    if(args[0] == undefined) return msg.channel.send(getEmbed("HATALI KULLANIM", `Yardım için: ${settings.prefix}komut yardım`, msg))
    if(Config.TR_symbols.includes(args[0])){
        whereIs = 'BIST'
    }else if(Config.US_symbols.includes(args[0].substring(1,args[0].length-3)) && args[0].substring(args[0].length-3) === ".US") {
        whereIs = 'US'
    }else if(Config.COIN_symbols.includes(args[0])) {
        whereIs = 'COIN'
    }
                

    /*
    if(Config.GOLD_symbols.includes(args[0])) 
    if(Config.ENDEKS_symbols.includes(args[0])) 
    if(Config.DOVIZ_symbols.includes(args[0])) 
    */


    if(whereIs == 'BIST'){
        var url = `http://localhost:5000/chart?stock=${args[0]}&whereIs=${whereIs}&desc=${Config.TR_description[Config.TR_symbols.indexOf(args[0])]}`
        await request(url, (err, res, body) => {
        if (err) { console.log(err); return msg.channel.send(getEmbed("Bir hata tespit edildi!", "Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", msg)) }
            const data = JSON.parse(body);
            var image = data.image;
            const attachment = new Discord.MessageAttachment(Buffer.from(image, 'base64'));
            return msg.channel.send(attachment);
        })
    }
    else if(whereIs == 'COIN'){
        var url = `http://localhost:5000/chart?stock=${Config.COIN_id[Config.COIN_symbols.indexOf(args[0])]}&whereIs=${whereIs}&coinKey=${args[0]}&desc=${Config.COIN_description[Config.COIN_symbols.indexOf(args[0])]}`
        await request(url, (err, res, body) => {
        if (err) { console.log(err); return msg.channel.send(getEmbed("Bir hata tespit edildi!", "Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", msg)) }
            const data = JSON.parse(body);
            var image = data.image;
            const attachment = new Discord.MessageAttachment(Buffer.from(image, 'base64'));
            return msg.channel.send(attachment);
        })
    }else if(whereIs == 'US'){
        var url = `http://localhost:5000/chart?stock=${msg}&whereIs=${whereIs}&coinKey=${msg}&desc=${Config.US_description[Config.US_symbols.indexOf(msg)]}`
        await request(url, (err, res, body) => {
        if (err) { console.log(err); return msg.channel.send(getEmbed("Bir hata tespit edildi!", "Yetkililer ilgileniyor! Lütfen daha sonra tekrar deneyiniz.", msg)) }
            const data = JSON.parse(body)
            var image = data.image
            const attachment = new Discord.MessageAttachment(Buffer.from(image, 'base64'));
            return msg.channel.send(attachment);
        })
    }else{
        return msg.channel.send(getEmbed("Bir hata tespit edildi!", "İstediğiniz grafik bulunamadı. Bir hata olduğunu düşünüyorsanız lütfen geliştiricilerime iletiniz.", msg))
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