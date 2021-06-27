const settings = require('./settings.json');
const Config = require('./Config.json');
const price = require('./util/functions/getPrice');
const log = require('./util/functions/log')
const wa = require('@open-wa/wa-automate');
const fs = require('fs');
const moment = require('moment');

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

wa.create().then(client => start(client));

function start(client) {
    client.onMessage(async message => {
        if(message.type != "chat") return;
        if (!message.body.startsWith(settings.prefix)) return;
        let command = message.body.toUpperCase().split(' ')[0].slice(settings.prefix.length);
        let params = message.body.toUpperCase().split(' ').slice(1);
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
        
        if(Config.TR_symbols.includes(command)) return price.stockMarket(command, 'BIST', client, message)
        if(Config.US_symbols.includes(command.substring(1,command.length-3)) && command.substring(command.length-3) === ".US") return price.stockMarket(command.substring(1,command.length-3), 'US', client, message)
        if(Config.GOLD_symbols.includes(command)) return price.gold(command, client, message)
        if(Config.ENDEKS_symbols.includes(command)) return price.index(command, client, message)
        if(Config.DOVIZ_symbols.includes(command)) return price.currencies(command, client, message)
        if(Config.COIN_symbols.includes(command)) return price.coin(command, client, message)
    
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
}

