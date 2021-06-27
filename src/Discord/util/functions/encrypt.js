const crypto = require('crypto');
const settings = require('../../settings.json')

/*
Encryption - Decryption Function
*/
exports.encrypt = function encrypt(text) {
    text = text.toString();

    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(settings.AES[0]), settings.AES[1]);
    let encrypted = cipher.update(text);
   
    encrypted = Buffer.concat([encrypted, cipher.final()]);
   
    return encrypted.toString('hex');
}   
exports.decrypt = function decrypt(text) {

    let encryptedText = Buffer.from(text, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(settings.AES[0]), settings.AES[1]);
    let decrypted = decipher.update(encryptedText);
   
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}