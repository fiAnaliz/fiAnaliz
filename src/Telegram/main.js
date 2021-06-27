process.env.NTBA_FIX_319 = 1;

const TelegramBot = require('node-telegram-bot-api');
const settings = require('./settings.json');
const Config = require('./Config.json');
const price = require('./util/functions/getPrice');
const log = require('./util/functions/log')
const crypto = require('./util/functions/encrypt')
const fs = require('fs');
const moment = require('moment');
const express = require('express');
const app = express();
const util = require('util');

const client = new TelegramBot(settings.token, {polling: true});

var commands = new Map();
var aliases = new Map();

fs.readdir("./commands/", (err, files) => {
    if (err) console.error(err);
    console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${files.length} komut yüklenecek.`);
    files.forEach(f => {
        let props = require(`./commands/${f}`);
        console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] Yüklenen komut: ${props.help.name}.`);
        commands.set(props.help.name, props);
        props.conf.aliases.forEach(alias => {
            aliases.set(alias, props.help.name);
        });
    });
});

client.on('message',async (message) => {
    if(message.text === undefined) return;
    if (!message.text.toString().startsWith(settings.prefix)) return;
    let command = message.text.toString().toUpperCase().split(' ')[0].slice(settings.prefix.length);
    let params = message.text.toString().toUpperCase().split(' ').slice(1);
    let cmd;

    /* Reg and Log system BAŞ */ 

    try{
        log.log(command, client, message)
    }
    catch(error){
        console.log(error)
    }

    /* Reg and Log system SON */
    
    /*   Altın Döviz Kripto Kontrol BAŞ */
    try{
    if(Config.TR_symbols.includes(command)) return price.stockMarket(command, 'BIST', client, message)
    if(Config.US_symbols.includes(command.substring(1,command.length-3)) && command.substring(command.length-3) === ".US") return price.stockMarket(command.substring(1,command.length-3), 'US', client, message)
    if(Config.GOLD_symbols.includes(command)) return price.gold(command, client, message)
    if(Config.ENDEKS_symbols.includes(command)) return price.index(command, client, message)
    if(Config.DOVIZ_symbols.includes(command)) return price.currencies(command, client, message)
    if(Config.COIN_symbols.includes(command)) return price.coin(command, client, message)
    }
    catch(error){
        console.log(error)
    }
    /* Altın Döviz Kripto Kontrol SON */

    if (commands.has(command)) {
        cmd = commands.get(command);
    } else if (aliases.has(command)) {
        cmd = commands.get(aliases.get(command));
    }
    if (cmd) {
        cmd.run(client, message, params);
    }
})

app.use( express.json() );

app.post( '/', async (req, res) => {
    console.log('Received Webhook', req.body);
    requester_id = crypto.decrypt(req.body.fromNumber);
    requested_chat_id = parseInt(crypto.decrypt(req.body.toNumber));
    requester_username = (await client.getChatMember(requested_chat_id, requester_id)).user.username;
    client.sendMessage(requested_chat_id, util.format(req.body.message.toString(), requester_username), {parse_mode : "Markdown"});
    res.sendStatus( 200 );
} );

app.listen( 9001, () => console.log( 'Node.js server started on port 9001.' ) );