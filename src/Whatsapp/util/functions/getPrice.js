const Config = require('../../Config.json')
const settings = require('../../settings.json')
const request = require('request')
const numeral = require('numeral');
const moment = require('moment');
const express = require( 'express' );
const util = require('util')

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
function tavan_taban_hesaplayıcı(closePrice){
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
Stock Markets Module(Turkey and USA)
*/
exports.stockMarket = async function get_price_stock(stock, whereIs, client, message){
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
        await request(url, (err, res, body) => {
        if (err) { return console.log(err); }
            const data = JSON.parse(body)
            var lastData = data.dataSet[data.dataSet.length-1]
            var change = (lastData.close - data.dataSet[data.dataSet.length-2].close) / data.dataSet[data.dataSet.length-2].close *100
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
            tavan_taban = tavan_taban_hesaplayıcı(data.dataSet[data.dataSet.length-2].close)
            var beta = (res[0] < 100) ? `*-------------[BETA]-------------*\n` : `*---------------[BETA]---------------*\n`
            var ytd = (res[0] < 100) ? `*---[Yatırım Tavsiyesi Değildir]---*\n` : `*----[Yatırım Tavsiyesi Değildir]----*\n`
            var reply = `*${Config.TR_description[Config.TR_symbols.indexOf(stock)]}* | ${stock}\n\n*Fiyat:* _${lastData.close.toFixed(2)} ₺_ | *Değişim:* _% ${change.toFixed(2)}_ \n*Düşük:* _${lastData.low.toFixed(2)} ₺_ | *Yüksek:* _${lastData.high.toFixed(2)} ₺_\n*Taban:* _${tavan_taban[0].toFixed(2)} ₺_ | *Tavan:* _${tavan_taban[1].toFixed(2)} ₺_\n*Hacim:* _${numeral(lastData.volume).format('0.00a').toUpperCase()} ₺_\n` + beta + `*Destek:* _${sup[0].toFixed(2)} ₺_ | *Direnç:* _${res[0].toFixed(2)} ₺_\n${ytd}`
            client.sendText(message.from, reply)
        })
    }else if(whereIs === 'US'){
        var url = `https://finnhub.io/api/v1/quote?symbol=${stock}&token=${settings.finnhubIO}`
        await request(url, (err, res, body) => {
        if (err) { return console.log(err); }
            const lastData = JSON.parse(body)
            var change = (lastData.c - lastData.pc) / lastData.pc *100
            var reply = `*${Config.US_description[Config.US_symbols.indexOf(stock)]}* | ${stock}\n\n*Fiyat:* _${lastData.c.toFixed(2)} $_ | *Değişim:* _% ${change.toFixed(2)}_ \n*Düşük:* _${lastData.l.toFixed(2)} $_ | *Yüksek:* _${lastData.h.toFixed(2)} $_`
            client.sendText(message.from, reply)
        })       
    }
}

/*
Crypto Currency
*/
exports.coin = async function crypto_price_get(msg, client, message){
    var coin_id = Config.COIN_id[Config.COIN_symbols.indexOf(msg)], coin_desc = Config.COIN_description[Config.COIN_symbols.indexOf(msg)]
    var url = `https://api.coingecko.com/api/v3/simple/price?ids=${coin_id}&vs_currencies=usd,try&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`
    await request(url, (err, res, body) => {
        if (err) { return console.log(err); }
            const lastData = JSON.parse(body)[coin_id]
            let options = {year: 'numeric', month: 'long', day: 'numeric'}
            var reply = `*${coin_desc}* | ${msg}\n\n*Fiyat:* _${lastData.usd.noExponents()} $_ | *Değişim:* _% ${lastData.usd_24h_change.toFixed(2)}_\n*Fiyat:* _${lastData.try} ₺_ | *Değişim:* _% ${lastData.try_24h_change.toFixed(2)}_\n*Hacim:* _${numeral(lastData.usd_24h_vol).format('0.00a').toUpperCase()} $_ | *Hacim:* _${numeral(lastData.try_24h_vol).format('0.00a').toUpperCase()} ₺_\n*Güncelleme:* ${new Date((lastData.last_updated_at)*1000).toLocaleString('tr-TR', options) + ' ' + new Date((lastData.last_updated_at)*1000).toLocaleTimeString('tr-TR')}`
            client.sendText(message.from, reply)
        })      
}

/*
Currencies Module
*/
exports.currencies = async function currency_rate(msg, client, message){
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
    var url = `https://web-paragaranti-pubsub.foreks.com/web-services/historical-data?userName=undefined&name=${msg + "/TRL"}&exchange=FOREX&market=N&group=F&last=300&period=1440&intraPeriod=null&isLast=false&from=${lastday_str}000000&to=${today_str}235900`
    await request(url, (err, res, body) => {
    if (err) { return console.log(err); }
        const data = JSON.parse(body)
        var lastData = data.dataSet[data.dataSet.length-1]
        var change = (lastData.close - data.dataSet[data.dataSet.length-2].close) / data.dataSet[data.dataSet.length-2].close *100
        reply = `*${Config.DOVIZ_description[Config.DOVIZ_symbols.indexOf(msg)].toUpperCase()}* | ${msg}\n\n*Fiyat:* _${lastData.close.toFixed(2)} ₺_ | *Değişim:* _% ${change.toFixed(2)}_ \n*Düşük:* _${lastData.low.toFixed(2)} ₺_ | *Yüksek:* _${lastData.high.toFixed(2)} ₺_`
        client.sendText(message.from, reply)
    })
}

/*
Index Module
*/

exports.index = async function index_worth(msg, client, message){
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
    var url = `https://web-paragaranti-pubsub.foreks.com/web-services/historical-data?userName=undefined&name=${msg}&exchange=BIST&market=N&group=I&last=300&period=1440&intraPeriod=null&isLast=false&from=${lastday_str}000000&to=${today_str}235900`
    await request(url, (err, res, body) => {
    if (err) { return console.log(err); }
        const data = JSON.parse(body)
        var lastData = data.dataSet[data.dataSet.length-1]
        var change = (lastData.close - data.dataSet[data.dataSet.length-2].close) / data.dataSet[data.dataSet.length-2].close *100
        reply = `*${Config.ENDEKS_description[Config.ENDEKS_symbols.indexOf(msg)].toUpperCase()}* | ${msg}\n\n*Fiyat:* _${lastData.close.toFixed(2)}_ | *Değişim:* _% ${change.toFixed(2)}_ \n*Düşük:* _${lastData.low.toFixed(2)}_ | *Yüksek:* _${lastData.high.toFixed(2)}_`
        client.sendText(message.from, reply)
    })
}

/*
Gold Module
*/
exports.gold = async function gold(msg, client, message){
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
    var url = `https://web-paragaranti-pubsub.foreks.com/web-services/historical-data?userName=undefined&name=${Config.GOLD_id[Config.GOLD_symbols.indexOf(msg)]}&exchange=FREE&market=N&group=G&last=300&period=1440&intraPeriod=null&isLast=false&from=${lastday_str}000000&to=${today_str}235900`
    await request(url, (err, res, body) => {
    if (err) { return console.log(err); }
        const data = JSON.parse(body)
        var lastData = data.dataSet[data.dataSet.length-1]
        var change = (lastData.close - data.dataSet[data.dataSet.length-2].close) / data.dataSet[data.dataSet.length-2].close *100
        reply = `*${Config.GOLD_description[Config.GOLD_symbols.indexOf(msg)].toUpperCase()}* | ${msg}\n\n*Fiyat:* _${lastData.close.toFixed(2)}_ | *Değişim:* _% ${change.toFixed(2)}_ \n*Düşük:* _${lastData.low.toFixed(2)}_ | *Yüksek:* _${lastData.high.toFixed(2)}_`
        client.sendText(message.from, reply)
    })
}