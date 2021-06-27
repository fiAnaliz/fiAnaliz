const mysql = require('mysql2/promise')
const settings = require('../../settings.json')
const crypto = require('./encrypt.js')
const { v4: uuidv4 } = require('uuid');

exports.log = async function regLogSystem(receive, bot, msg){
    const connection = await mysql.createConnection({
        host: settings.host,
        user: settings.user,
        password: settings.password,
        database: settings.database
      })
    try{
        var arr = [await crypto.encrypt(msg.author.id)]
        const [rows, fields] = await connection.execute('SELECT * FROM users WHERE discord = ?', arr)
        if(rows.length == 0){
            uuid = await uuidv4()
            var arr = [uuid ,await crypto.encrypt(msg.author.id)]
            await connection.execute('INSERT INTO users (uuid, discord) VALUES (?,?)', arr)
        }else{
            uuid = rows[0].uuid
        }
        arr = [uuid, 2, receive]
        await connection.execute('INSERT INTO logs (uuid, platform, message) VALUES (?,?,?)', arr)
    } finally{
        await connection.end()
    }

}
