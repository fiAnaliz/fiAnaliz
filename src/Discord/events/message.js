const settings = require('../settings.json');
const Config = require('../Config.json');
const price = require('../util/functions/getPrice.js')
const log = require('../util/functions/log.js')

module.exports = message => {
    let client = message.client;
    if (message.author.bot) return;
    if (!message.content.startsWith(settings.prefix)) return;
    let command = message.content.toUpperCase().split(' ')[0].slice(settings.prefix.length);
    let params = message.content.toUpperCase().split(' ').slice(1);
    let perms = client.elevation(message);
    let cmd;

    /* Reg and Log system BAŞ */ 

    try{
        log.log(message.content.toUpperCase().slice(settings.prefix.length), client, message)
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

    if (client.commands.has(command)) {
        cmd = client.commands.get(command);
    } else if (client.aliases.has(command)) {
        cmd = client.commands.get(client.aliases.get(command));
    }
    if (cmd) {
        if (perms < cmd.conf.permLevel) return;
        cmd.run(client, message, params, perms);
    }
};