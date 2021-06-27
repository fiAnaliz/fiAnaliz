const mysql = require('mysql2/promise')
const settings = require('../../settings.json')
const crypto = require('./encrypt.js')
const { v4: uuidv4 } = require('uuid');

exports.log = async function regLogSystem(receive, client, message){
    const connection = await mysql.createConnection({
        host: settings.host,
        user: settings.user,
        password: settings.password,
        database: settings.database
      })
      try{
        var arr = [await crypto.encrypt(message.sender.id)]
        const [rows, fields] = await connection.execute('SELECT * FROM users WHERE whatsapp = ?', arr)
        if(rows.length == 0){
            uuid = await uuidv4()
            var arr = [uuid,await crypto.encrypt(message.sender.id)]
            await connection.execute('INSERT INTO users (uuid, whatsapp) VALUES (?,?)', arr)
        }else{
            uuid = rows[0].uuid
        }
        arr = [uuid, 0, receive]
        await connection.execute('INSERT INTO logs (uuid, platform, message) VALUES (?,?,?)', arr)
    }catch(err){
        console.log(err)
    } finally {
        await connection.end();
    }
}
