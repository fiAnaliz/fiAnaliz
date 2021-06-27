const Discord = require('discord.js');
const client = new Discord.Client({
    disableMentions: 'everyone'
});
const settings = require('./settings.json');
const fs = require('fs');
const moment = require('moment');
const express = require('express');
const util = require('util');
const crypto = require('./util/functions/encrypt.js')
require('./util/eventLoader')(client);

const app = express();
var prefix = settings.prefix;

const log = message => {
    console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${message}`);
};

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir("./commands/", (err, files) => {
    if (err) console.error(err);
    log(`${files.length} komut yüklenecek.`);
    files.forEach(f => {
        let props = require(`./commands/${f}`);
        log(`Yüklenen komut: ${props.help.name}.`);
        client.commands.set(props.help.name, props);
        props.conf.aliases.forEach(alias => {
            client.aliases.set(alias, props.help.name);
        });
    });
});
client.reload = command => {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(`./commands/${command}`)];
            let cmd = require(`./commands/${command}`);
            client.commands.delete(command);
            client.aliases.forEach((cmd, alias) => {
                if (cmd === command) client.aliases.delete(alias);
            });
            client.commands.set(command, cmd);
            cmd.conf.aliases.forEach(alias => {
                client.aliases.set(alias, cmd.help.name);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};
client.load = command => {
    return new Promise((resolve, reject) => {
        try {
            let cmd = require(`./commands/${command}`);
            client.commands.set(command, cmd);
            cmd.conf.aliases.forEach(alias => {
                client.aliases.set(alias, cmd.help.name);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};
client.unload = command => {
    return new Promise((resolve, reject) => {
        try {
            delete require.cache[require.resolve(`./commands/${command}`)];
            let cmd = require(`./commands/${command}`);
            client.commands.delete(command);
            client.aliases.forEach((cmd, alias) => {
                if (cmd === command) client.aliases.delete(alias);
            });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
};

client.on('ready', () => {

    console.log('_________________________________________');
    console.log(`Kullanıcı İsmi     : ${client.user.username}`);
    console.log(`Sunucular          : ${client.guilds.cache.size}`);
    console.log(`Kullanıcılar       : ${client.users.cache.size}`);
    console.log(`Prefix             : ${settings.prefix}`);
    console.log(`Durum              : Bot Çevrimiçi!`);
    console.log('_________________________________________');

});


client.elevation = message => {
    if (!message.guild) {
        return;
    }
    let permlvl = 0;
    if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
    if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
    if (settings.administrators.includes(message.author.id)) permlvl = 4;
    return permlvl;
};


client.login(settings.token);
/* Alert Module */

function getEmbed(text, requester_id){
    return client.users.fetch(requester_id).then((msg) =>{
        return new Discord.MessageEmbed()
        .setColor(settings.color)
        .setDescription(text)
        .setTitle('fiAnaliz | ALARM SİSTEMİ 🔔🔔🔔')
        .setFooter(`${msg.tag} kişisinin alarmı gerçekleşmiştir`, msg.avatarURL())
        .setTimestamp()
    })

}

app.use( express.json() );

app.post( '/', async (req, res) => {
    requester_id = crypto.decrypt(req.body.fromNumber);
    requested_chat_id = crypto.decrypt(req.body.toNumber);
    alert_notification_message = util.format(req.body.message.toString(), `<@${requester_id}>`);
    client.channels.cache.get(requested_chat_id.toString()).send(await getEmbed(alert_notification_message, requester_id));
    res.sendStatus( 200 );
} );

app.listen( 9002, () => console.log( 'Node.js server started on port 9002.' ) );

