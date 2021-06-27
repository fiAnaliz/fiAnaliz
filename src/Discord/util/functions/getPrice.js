const Discord = require('discord.js');
const Config = require('../../Config.json')
const request = require('request');
const numeral = require('numeral');
const util = require('util');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const { resolve } = require('path');
'use strict';

/*
E converter
*/

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

/*
Daily Max-Min Price Calculation Function
*/
function tavan_taban_hesaplayici(closePrice){
    taban = Math.ceil(closePrice*90)
    tavan = Math.floor(closePrice*110)
    var taban_fiyat_adimi = 0
    if(taban < 2000){
        taban_fiyat_adimi = 1
    }else if(taban < 5000){
        taban_fiyat_adimi = 2
    }else if(taban < 10000){
        taban_fiyat_adimi = 5
    }else{
        taban_fiyat_adimi = 10
    }

    if(tavan < 2000){
        tavan_fiyat_adimi = 1
    }else if(tavan < 5000){
        tavan_fiyat_adimi = 2
    }else if(tavan < 10000){
        tavan_fiyat_adimi = 5
    }else{
        tavan_fiyat_adimi = 10
    }

    tavan = Math.floor(tavan / tavan_fiyat_adimi)
    tavan *= tavan_fiyat_adimi
    taban -= 1
    taban = Math.floor(taban / taban_fiyat_adimi)
    taban +=1
    taban *= taban_fiyat_adimi

    taban /= 100.0
    tavan /= 100.0

    return [taban, tavan]
}

/*
Support Resistence Module for Stock Markets (only Turkey)
*/
function isRes(data, i){
    if(data[i].high > data[i-1].high && data[i].high > data[i+1].high && data[i+1].high > data[i+2].high && data[i-1].high > data[i-2].high){
        return true
    }
    return false
}
function isSup(data, i){
    if(data[i].low < data[i-1].low && data[i].low < data[i+1].low && data[i-1].low < data[i-2].lowv && data[i+1].low < data[i+2].low){
        return true
    }
    return false
}
function fibonacci(data, levels){
    var max = 0
    var min = 1000000000
    var fibo_levels = [0.000, 0.236, 0.382, 0.500, 0.618, 0.736, -0.618, 1.236]
    for(i = 0; i < data.length - 2; i++){
        if(max < data[i].high){
            max = data[i].high
        }
        if(min > data[i].high){
            min = data[i].high
        }
    }
    var diff = max - min
    for(i = 0; i < fibo_levels.length; i++){
        levels.push(max - fibo_levels[i] * diff)
    }
}
/*
Request Module
*/
function doRequest(url) {
    return new Promise(function (resolve, reject) {
      request(url, function (error, res, body) {
        if (!error && res.statusCode == 200) {
          resolve(res);
        } else {
          reject(error);
        }
      });
    });
  }

/*
Image DownCheck
*/

const download_image = (url, image_path) =>
  axios({
    url,
    responseType: 'stream',
  }).then(
    response =>
      new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(image_path))
          .on('finish', () => resolve())
          .on('error', e => reject(e));
      }),
  );

async function imageDownCheck(stock, type){
    try{
        if(!(fs.existsSync(`logo/${stock}.png`))){
            if(type == 'US'){
                var image_url = `https://finnhub.io/api/logo?symbol=${stock}`
                let res = await doRequest(image_url)
                let image = await download_image(res.request.href, `logo/${stock}.png`);
                return `logo/${stock}.png`
            }
            if(type == 'BIST'){
                arr = []
                await axios.get('https://www.kap.org.tr/tr/bist-sirketler').then(async (res) => {
                    const $ = cheerio.load(res.data)
                    $('.w-clearfix.w-inline-block.comp-row').each((index, element) => {
                        const title = $(element).children().first().children('a').first().text()
                        var link = $(element).children().first().children('a').first().attr('href')
                        link = 'https://www.kap.org.tr' + link
                        if(title.split(',')[0] == stock || ((title.split(',').length == 2) ? title.split(',')[1] == stock : false)){
                            arr = {title, link}
                            return false
                        }
                    })
                    await axios.get(arr.link).then(async (res) => {
                        const $ = cheerio.load(res.data)
                        var image = "https://www.kap.org.tr" + $('.comp-logo').attr('src')
                        image = await download_image(image, `logo/${stock}.png`);
                    })
                    return false
                    })
                return `logo/${stock}.png`
            }
        }else{
            return `logo/${stock}.png`
        }
        
    }catch(err){
        console.log(err)
        return settings.avatarURL
    }
}



exports.gold = async function gold(goldtype, bot, msg){
    var today = new Date()
    var day = today.getDate().toString()
    var month = (today.getMonth() + 1).toString()
    var year = today.getFullYear().toString() 
    if(day.length === 1){
        day = "0" + day
    }
    if(month.length === 1){
        month = "0" + month
    }
    today_str = year+month+day
    var lastday = new Date()
    lastday.setMonth(today.getMonth()-1)
    var day = lastday.getDate().toString()
    var month = (lastday.getMonth() + 1).toString()
    var year = lastday.getFullYear().toString() 
    if(day.length === 1){
        day = "0" + day
    }
    if(month.length === 1){
        month = "0" + month
    } 
    lastday_str = year+month+day
    var url = `https://web-paragaranti-pubsub.foreks.com/web-services/historical-data?userName=undefined&name=${Config.GOLD_id[Config.GOLD_symbols.indexOf(goldtype)]}&exchange=FREE&market=N&group=G&last=300&period=1440&intraPeriod=null&isLast=false&from=${lastday_str}000000&to=${today_str}235900`
    await request(url, (err, res, body) => {
    if (err) { return console.log(err); }
        const data = JSON.parse(body)
        let options = {year: 'numeric', month: 'long', day: 'numeric'}
        var lastData = data.dataSet[data.dataSet.length-1]
        var change = (lastData.close - data.dataSet[data.dataSet.length-2].close) / data.dataSet[data.dataSet.length-2].close * 100
        const goldEmbed = new Discord.MessageEmbed()
        .setColor('#FFE700')
        .setTitle(`${Config.GOLD_description[Config.GOLD_symbols.indexOf(goldtype)].toUpperCase()} | ${goldtype}`)
        .setThumbnail('https://i.imgur.com/P5vd9Ct.png')
        .addFields(
            {name: 'Fiyat:', value: `${lastData.close.toFixed(2)}`, inline: true},
            {name: 'Değişim:', value: `% ${change.toFixed(2)}`, inline: true},
            {name: '\u200B', value: `\u200B`, inline: true},
            {name: 'Yüksek:', value: `${lastData.high.toFixed(2)}`, inline: true},
            {name: 'Düşük:', value: `${lastData.low.toFixed(2)}`, inline: true},
            {name: '\u200B', value: `\u200B`, inline: true},
        )
        .setFooter(`Güncelleme: ${new Date().toLocaleString('tr-TR', options) + ' ' + new Date().toLocaleTimeString('tr-TR')}`, settings.avatarURL)
        msg.channel.send(goldEmbed)
    })
}

exports.coin = async function crypto_price_get(cryptocurrency, bot, msg){
    var coin_id = Config.COIN_id[Config.COIN_symbols.indexOf(cryptocurrency)], coin_desc = Config.COIN_description[Config.COIN_symbols.indexOf(cryptocurrency)]
    var url = `https://api.coingecko.com/api/v3/coins/${coin_id}?tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
    await request(url, async (err, res, body) => {
        if (err) { return console.log(err); }
            const data = JSON.parse(body)
            let options = {year: 'numeric', month: 'long', day: 'numeric'}
            let cryptoEmbed = [new Discord.MessageEmbed()
                .setColor('#FFE700')
                .setTitle(`${coin_desc} | ${cryptocurrency}`)
                .setThumbnail(data.image.large)
                .addFields(
                    {name: 'Fiyat:', value: `${data.market_data.current_price.usd.noExponents()} $`, inline: true},
                    {name: 'Değişim:', value: `% ${data.market_data.price_change_percentage_24h_in_currency.usd.toFixed(2)} `, inline: true},
                    {name: 'Hacim:', value: `${numeral(data.market_data.total_volume.usd).format('0.00a').toUpperCase()} $`, inline: true},
                    {name: 'Fiyat:', value: `${data.market_data.current_price.try.noExponents()} ₺`, inline: true},
                    {name: 'Değişim:', value: `% ${data.market_data.price_change_percentage_24h_in_currency.try.toFixed(2)} `, inline: true},
                    {name: 'Hacim:', value: `${numeral(data.market_data.total_volume.try).format('0.00a').toUpperCase()} ₺`, inline: true}
                )
                .setFooter(`Güncelleme: ${new Date(data.market_data.last_updated).toLocaleString('tr-TR', options) + ' ' + new Date(data.market_data.last_updated).toLocaleTimeString('tr-TR')}`, settings.avatarURL),
                new Discord.MessageEmbed()
                .setColor('#FFE700')
                .setTitle(`${coin_desc} | ${cryptocurrency}`)
                .setThumbnail(data.image.large)
                .addFields(
                    {name: '1 Saat:', value: `% ${data.market_data.price_change_percentage_1h_in_currency.usd.toFixed(2)}`, inline: true},
                    {name: '24 Saat:', value: `% ${data.market_data.price_change_percentage_24h.toFixed(2)}`, inline: true},
                    {name: '7 Gün:', value: `% ${data.market_data.price_change_percentage_7d.toFixed(2)}`, inline: true},
                    {name: '14 Gün:', value: `% ${data.market_data.price_change_percentage_14d.toFixed(2)}`, inline: true},
                    {name: '30 Gün:', value: `% ${data.market_data.price_change_percentage_30d.toFixed(2)}`, inline: true},
                    {name: '200 Gün:', value: `% ${data.market_data.price_change_percentage_200d.toFixed(2)}`, inline: true}
                )
                .setFooter(`Güncelleme: ${new Date(data.market_data.last_updated).toLocaleString('tr-TR', options) + ' ' + new Date(data.market_data.last_updated).toLocaleTimeString('tr-TR')}`, settings.avatarURL),
                new Discord.MessageEmbed()
                .setColor('#FFE700')
                .setTitle(`${coin_desc} | ${cryptocurrency}`)
                .setThumbnail(data.image.large)
                .addFields(
                    {name: 'ATH:', value: `${data.market_data.ath.usd.noExponents()} $`, inline: true},
                    {name: 'Değişim:', value: `% ${data.market_data.ath_change_percentage.usd.toFixed(2)} `, inline: true},
                    {name: 'Tarih:', value: `${new Date(data.market_data.ath_date.try).toLocaleString('tr-TR', options)}`, inline: true},
                    {name: 'ATL:', value: `${data.market_data.atl.usd.noExponents()} $`, inline: true},
                    {name: 'Değişim:', value: `% ${data.market_data.atl_change_percentage.usd.toFixed(2)} `, inline: true},
                    {name: 'Tarih:', value: `${new Date(data.market_data.atl_date.try).toLocaleString('tr-TR', options)}`, inline: true}
                )
                .setFooter(`Güncelleme: ${new Date(data.market_data.last_updated).toLocaleString('tr-TR', options) + ' ' + new Date(data.market_data.last_updated).toLocaleTimeString('tr-TR')}`, settings.avatarURL)
                ]       
                let currentPage = 0 
                const sentEmbed = await msg.channel.send(cryptoEmbed[currentPage])
                await sentEmbed.react('⏪')
                await sentEmbed.react('⏩')
                const filter = (reaction, user) => ['⏩', '⏪'].includes(reaction.emoji.name) && (msg.author.id === user.id)
                const collector = sentEmbed.createReactionCollector(filter, {
                    time: 60000
                })
                
                collector.on('collect', (reaction, user) => {
                    if (reaction.emoji.name === '⏩') {
                        if (currentPage < cryptoEmbed.length - 1) {
                        currentPage++
                        sentEmbed.edit(cryptoEmbed[currentPage])
                        }
                    } else if (reaction.emoji.name === '⏪') {
                        if (currentPage !== 0) {
                        --currentPage
                        sentEmbed.edit(cryptoEmbed[currentPage])
                        }
                    }
                })  
        })  
}

exports.stockMarket = async function get_price_stock(stock, whereIs, bot, msg){
    if(whereIs === 'BIST'){
        var today = new Date()
        var day = today.getDate().toString()
        var month = (today.getMonth() + 1).toString()
        var year = today.getFullYear().toString() 
        if(day.length === 1){
            day = "0" + day
        }
        if(month.length === 1){
            month = "0" + month
        }
        today_str = year+month+day
        var lastday = new Date()
        lastday.setMonth(today.getMonth()-6)
        var day = lastday.getDate().toString()
        var month = (lastday.getMonth() + 1).toString()
        var year = lastday.getFullYear().toString() 
        if(day.length === 1){
            day = "0" + day
        }
        if(month.length === 1){
            month = "0" + month
        }
        lastday_str = year+month+day
        var url = `https://web-paragaranti-pubsub.foreks.com/web-services/historical-data?userName=undefined&name=${stock}&exchange=BIST&market=E&group=F&last=300&period=1440&intraPeriod=null&isLast=false&from=${lastday_str}000000&to=${today_str}23590000`
        await request(url, async (err, res, body) => {
        if (err) { return console.log(err); }
            const data = JSON.parse(body)
            var lastData = data.dataSet[data.dataSet.length-1]
            var change = (lastData.close - data.dataSet[data.dataSet.length-2].close) / data.dataSet[data.dataSet.length-2].close * 100;
            var sup  = [], res = [], levels = []
            levels.push(0)
            levels.push(lastData.close * 1.618)
            for(i = 2; i < data.dataSet.length - 5; i++){
                if(isRes(data.dataSet, i)){
                    levels.push(data.dataSet[i].low)
                }
                if(isSup(data.dataSet, i)){
                    levels.push(data.dataSet[i].low)
                }
            }
            fibonacci(data.dataSet, levels)
            for(i=0; i < levels.length; i++){
                if(levels[i] <= lastData.close){
                    sup.push(levels[i])
                }
                else if(levels[i] >= lastData.close){
                    res.push(levels[i])
                }
            }
            res.sort((a, b) => a - b)
            sup.sort((a, b) => b - a)
            tavan_taban = tavan_taban_hesaplayici(data.dataSet[data.dataSet.length-2].close)
            var beta = (res[0] < 100) ? `**-------------[BETA]-------------**\n` : `**---------------[BETA]---------------**\n`
            var ytd = (res[0] < 100) ? `**---[Yatırım Tavsiyesi Değildir]---**\n` : `**----[Yatırım Tavsiyesi Değildir]----**\n`
            let options = {year: 'numeric', month: 'long', day: 'numeric'}
            const attachment = new Discord.MessageAttachment(await (imageDownCheck(stock, whereIs)), "image.png");
            var stockEmbed = new Discord.MessageEmbed()
                .setColor('#FFE700')
                .setTitle(`${Config.TR_description[Config.TR_symbols.indexOf(stock)]} | ${stock}`)
                .attachFiles(attachment)
                .setThumbnail(url="attachment://image.png")
                .addFields(
                    {name: 'Fiyat:', value: `${lastData.close.toFixed(2)} ₺`, inline: true},
                    {name: 'Değişim:', value: `% ${change.toFixed(2)} `, inline: true},
                    {name: 'Hacim:', value: `${numeral(lastData.volume).format('0.00a').toUpperCase()} ₺`, inline: true},
                    {name: 'Düşük:', value: `${lastData.low.toFixed(2)} ₺`, inline: true},
                    {name: 'Yüksek:', value: `${lastData.high.toFixed(2)} ₺`, inline: true},
                    {name: '\u200B', value: `\u200B`, inline: true},
                    {name: 'Taban:', value: `${tavan_taban[0].toFixed(2)} ₺`, inline: true},
                    {name: 'Tavan:', value: `${tavan_taban[1].toFixed(2)} ₺`, inline: true},
                    {name: '\u200B', value: `\u200B`, inline: true},
                )
                .setFooter(`Güncelleme: ${new Date().toLocaleString('tr-TR', options) + ' ' + new Date().toLocaleTimeString('tr-TR')}`, settings.avatarURL);
            msg.channel.send(stockEmbed)
        })
    }else if(whereIs === 'US'){
        var url = `https://finnhub.io/api/v1/quote?symbol=${stock}&token=${settings.finnhubIO}`
        await request(url,async (err, res, body) => {
        if (err) { return console.log(err); }
            const data = JSON.parse(body)
            var change = (data.c - data.pc) / data.pc * 100
            let options = {year: 'numeric', month: 'long', day: 'numeric'}
            const attachment = new Discord.MessageAttachment(await (imageDownCheck(stock, whereIs)), "image.png");
            var stockEmbed = new Discord.MessageEmbed()
                .setColor('#FFE700')
                .setTitle(`${Config.US_description[Config.US_symbols.indexOf(stock)]} | ${stock}`)
                .attachFiles(attachment)
                .setThumbnail(url="attachment://image.png")
                .addFields(
                    {name: 'Fiyat:', value: `${data.c.toFixed(2)} $`, inline: true},
                    {name: 'Değişim:', value: `% ${change.toFixed(2)} `, inline: true},
                    {name: '\u200B', value: `\u200B`, inline: true},
                    {name: 'Yüksek:', value: `${data.h.toFixed(2)} $`, inline: true},
                    {name: 'Düşük:', value: `${data.l.toFixed(2)} $`, inline: true},
                    {name: '\u200B', value: `\u200B`, inline: true},
                )
                .setFooter(`Güncelleme: ${new Date(data.t * 1000).toLocaleString('tr-TR', options) + ' ' + new Date(data.t * 1000).toLocaleTimeString('tr-TR')}`, settings.avatarURL);
            msg.channel.send(stockEmbed)
        })       
    }
}

exports.currencies = async function currency_rate(currency, bot, msg){
    var today = new Date()
    var day = today.getDate().toString()
    var month = (today.getMonth() + 1).toString()
    var year = today.getFullYear().toString() 
    if(day.length === 1){
        day = "0" + day
    }
    if(month.length === 1){
        month = "0" + month
    }
    today_str = year+month+day
    var lastday = new Date()
    lastday.setMonth(today.getMonth()-1)
    var day = lastday.getDate().toString()
    var month = (lastday.getMonth() + 1).toString()
    var year = lastday.getFullYear().toString() 
    if(day.length === 1){
        day = "0" + day
    }
    if(month.length === 1){
        month = "0" + month
    } 
    lastday_str = year+month+day
    var url = `https://web-paragaranti-pubsub.foreks.com/web-services/historical-data?userName=undefined&name=${currency + "/TRL"}&exchange=FOREX&market=N&group=F&last=300&period=1440&intraPeriod=null&isLast=false&from=${lastday_str}000000&to=${today_str}235900`;
    await request(url, (err, res, body) => {
    if (err) { return console.log(err); }
        const data = JSON.parse(body)
        let options = {year: 'numeric', month: 'long', day: 'numeric'}
        var lastData = data.dataSet[data.dataSet.length-1]
        var change = (lastData.close - data.dataSet[data.dataSet.length-2].close) / data.dataSet[data.dataSet.length-2].close * 100
        const currencyEmbed = new Discord.MessageEmbed()
        .setColor('#FFE700')
        .setTitle(`${Config.DOVIZ_description[Config.DOVIZ_symbols.indexOf(currency)].toUpperCase()} | ${currency}`)
        .setThumbnail('https://i.imgur.com/TWMQYdi.png')
        .addFields(
            {name: 'Fiyat:', value: `${lastData.close.toFixed(2)}`, inline: true},
            {name: 'Değişim:', value: `% ${change.toFixed(2)}`, inline: true},
            {name: '\u200B', value: `\u200B`, inline: true},
            {name: 'Yüksek:', value: `${lastData.high.toFixed(2)}`, inline: true},
            {name: 'Düşük:', value: `${lastData.low.toFixed(2)}`, inline: true},
            {name: '\u200B', value: `\u200B`, inline: true},
        )
        .setFooter(`Güncelleme: ${new Date().toLocaleString('tr-TR', options) + ' ' + new Date().toLocaleTimeString('tr-TR')}`, settings.avatarURL)
        msg.channel.send(currencyEmbed)
    })
}


exports.index = async function index_worth(indextype, bot, msg){
    var today = new Date()
    var day = today.getDate().toString()
    var month = (today.getMonth() + 1).toString()
    var year = today.getFullYear().toString() 
    if(day.length === 1){
        day = "0" + day
    }
    if(month.length === 1){
        month = "0" + month
    }
    today_str = year+month+day
    var lastday = new Date()
    lastday.setMonth(today.getMonth()-1)
    var day = lastday.getDate().toString()
    var month = (lastday.getMonth() + 1).toString()
    var year = lastday.getFullYear().toString() 
    if(day.length === 1){
        day = "0" + day
    }
    if(month.length === 1){
        month = "0" + month
    } 
    lastday_str = year+month+day
    var url = `https://web-paragaranti-pubsub.foreks.com/web-services/historical-data?userName=undefined&name=${indextype}&exchange=BIST&market=N&group=I&last=300&period=1440&intraPeriod=null&isLast=false&from=${lastday_str}000000&to=${today_str}235900`
    await request(url, (err, res, body) => {
    if (err) { return console.log(err); }
        const data = JSON.parse(body)
        let options = {year: 'numeric', month: 'long', day: 'numeric'}
        var lastData = data.dataSet[data.dataSet.length-1]
        var change = (lastData.close - data.dataSet[data.dataSet.length-2].close) / data.dataSet[data.dataSet.length-2].close * 100
        const indexEmbed = new Discord.MessageEmbed()
        .setColor('#FFE700')
        .setTitle(`${Config.ENDEKS_description[Config.ENDEKS_symbols.indexOf(indextype)].toUpperCase()} | ${indextype}`)
        .setThumbnail('https://www.borsaistanbul.com/files/borsa-istanbul-exchange-group-yuvarlak-logo.png')
        .addFields(
            {name: 'Fiyat:', value: `${lastData.close.toFixed(2)}`, inline: true},
            {name: 'Değişim:', value: `% ${change.toFixed(2)}`, inline: true},
            {name: 'Hacim:', value: `${numeral(lastData.volume).format('0.00a').toUpperCase()}`, inline: true},
            {name: 'Yüksek:', value: `${lastData.high.toFixed(2)}`, inline: true},
            {name: 'Düşük:', value: `${lastData.low.toFixed(2)}`, inline: true},
            {name: '\u200B', value: `\u200B`, inline: true},
        )
        .setFooter(`Güncelleme: ${new Date().toLocaleString('tr-TR', options) + ' ' + new Date().toLocaleTimeString('tr-TR')}`, settings.avatarURL)
        msg.channel.send(indexEmbed)
    })
}