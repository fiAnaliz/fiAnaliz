import asyncio
from threading import Thread
import json
from flask import Flask, jsonify, request, make_response
from numpy import where
import pymysql.cursors
import datetime
import time
import hashlib as hasher
from base64 import b64encode
import io 
import requests
import pandas as pd
import mplfinance as mpf
import uuid
"""
Main
"""
app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

"""
Database Connection
"""
class Database:
    host = ""
    user = ""
    password = ""
    db = ""
    charset = "utf8mb4"

"""
Functions
"""
baglanti = ""
db = ""
def connect():
    global baglanti
    global db
    db = pymysql.connect(host= Database.host,
        user= Database.user,
        password= Database.password,
        db= Database.db,
        charset= Database.charset,
        cursorclass=pymysql.cursors.DictCursor)
    baglanti = db.cursor()

def divide_chunks(l, n):

    for i in range(0, len(l), n): 
        yield l[i:i + n]
        

"""
Chart API
"""
@app.route("/chart", methods=['POST', 'GET'])
def chart_get():
    whereIs, msg, desc, coinKey = request.args.get('whereIs'), request.args.get('stock'), request.args.get('desc'), request.args.get('coinKey')
    buff = io.BytesIO()
    if whereIs == 'BIST':
        now = datetime.datetime.now() + datetime.timedelta(days=3)
        yy, mm, dd = str(now.year), str(now.month), str(now.day)
        if(len(dd)==1):
            dd = "0" + dd
        if(len(mm)==1):
            mm = "0" + mm
        today = yy+mm+dd
        now = now - datetime.timedelta(days=90)
        yy, mm, dd = str(now.year), str(now.month), str(now.day)
        if(len(dd)==1):
            dd = "0" + dd
        if(len(mm)==1):
            mm = "0" + mm
        lastday = yy+mm+dd

        url = "https://web-paragaranti-pubsub.foreks.com/web-services/historical-data?userName=undefined&name={}&exchange=BIST&market=E&group=F&last=300&period=360&intraPeriod=null&isLast=false&from={}000000&to={}000000".format(msg, lastday, today)
        data = requests.get(url)
        data = data.json()["dataSet"]

        stock_df = pd.DataFrame.from_dict(data, orient='columns')
        stock_df = stock_df.rename(columns={"close": "Close", "date": "Date", "high": "High", "low": "Low", "open": "Open", "volume": "Volume"})
        stock_df = stock_df[["Date", "Open", "High", "Low", "Close", "Volume"]]

        for i in range(0,len(stock_df)):
            stock_df["Date"][i] = datetime.datetime.fromtimestamp(int(str(stock_df["Date"][i])[:-3])) # %H:%M:%S.strftime('%Y-%m-%d')

        stock_df['Volume'] = stock_df['Volume']
        stock_df = stock_df.set_index('Date')

        mpf.plot(stock_df, type='candle', style='binance',
                title= desc + ' | ' + msg,
                ylabel= 'Fiyat (TL)',
                ylabel_lower='Hacim',
                volume=True, 
                savefig=dict(fname=buff,bbox_inches="tight"),
                figratio=(18,10),
                figscale=1.2,
                datetime_format='%d-%m-%Y')
    elif whereIs == 'COIN':
        currency = 'usd'
        url = "https://api.coingecko.com/api/v3/coins/{}/ohlc?vs_currency={}&days=30".format(msg, currency)
        data = requests.get(url)
        data = data.json()
        stock_df = pd.DataFrame(data= data, columns=["Date", "Open", "High", "Low", "Close"])

        for i in range(0,len(stock_df)):
            stock_df["Date"][i] = datetime.datetime.fromtimestamp(int(str(stock_df["Date"][i])[:-3])) # %H:%M:%S.strftime('%Y-%m-%d')

        stock_df = stock_df.set_index('Date')

        mpf.plot(stock_df, type='candle', style='binance',
                title= desc + " | " + coinKey,
                ylabel= 'Fiyat (USD)',
                volume=False, 
                savefig=dict(fname=buff,bbox_inches="tight"),
                figratio=(18,10),
                figscale=1.2,
                datetime_format='%d-%m-%Y')
    elif whereIs == 'US':
        today = int(datetime.datetime.timestamp(datetime.datetime.now() + datetime.timedelta(days=3)))
        lastday = int(datetime.datetime.timestamp(datetime.datetime.now() - datetime.timedelta(days=200)))
        url = "https://finnhub.io/api/v1/stock/candle?symbol={}&resolution=D&from={}&to={}&token=c226v12ad3id53vuhmu0".format(msg, lastday, today)
        data = requests.get(url)
        data = data.json()
        stock_df = pd.DataFrame(data=data)

        stock_df = stock_df.rename(columns={"c": "Close", "t": "Date", "h": "High", "l": "Low", "o": "Open", "v": "Volume"})
        stock_df = stock_df[["Date", "Open", "High", "Low", "Close", "Volume"]]

        for i in range(0,len(stock_df)):
            stock_df["Date"][i] = datetime.datetime.fromtimestamp(int(str(stock_df["Date"][i]))) # %H:%M:%S.strftime('%Y-%m-%d')
        stock_df = stock_df.set_index('Date')

        mpf.plot(stock_df, type='candle', style='binance',
                title= desc + " | " + coinKey,
                ylabel= 'Fiyat (USD)',
                ylabel_lower='Hacim',
                volume=True, 
                savefig=dict(fname=buff,bbox_inches="tight"),
                figratio=(18,10),
                figscale=1.2,
                datetime_format='%d-%m-%Y')
    buff.seek(0)
    buff = b64encode(buff.read()).decode()
    buff = {"image": buff}
    return jsonify(buff)

"""
Alert API
"""
@app.route("/alerts/set", methods=['POST', 'GET'])
def alerts_Set():
    fromNumber, toNumber, price, coinID, status, typeX, platform = request.args.get('fromNumber'), request.args.get('toNumber'), request.args.get('price'), request.args.get('coinID'), request.args.get('status'), request.args.get('type'), int(request.args.get('platform'))
    try:
        db.commit()
        if platform == 0:
            baglanti.execute('SELECT * FROM users WHERE whatsapp = %s AND inActive = 0', (fromNumber))
            db_user = baglanti.fetchall()
            if len(db_user) == 0:
                baglanti.execute('INSERT INTO users(`uuid`,`whatsapp`) VALUES (%s,%s)',(uuid.uuid4(),fromNumber)) 
                db.commit()
        elif platform == 1:
            baglanti.execute('SELECT * FROM users WHERE telegram = %s AND inActive = 0', (fromNumber))
            db_user = baglanti.fetchall()
            if len(db_user) == 0:
                baglanti.execute('INSERT INTO users(`uuid`,`telegram`) VALUES (%s,%s)',(uuid.uuid4(),fromNumber)) 
                db.commit()
        elif platform == 2:
            baglanti.execute('SELECT * FROM users WHERE discord = %s AND inActive = 0', (fromNumber))
            db_user = baglanti.fetchall()
            if len(db_user) == 0:
                baglanti.execute('INSERT INTO users(`uuid`,`discord`) VALUES (%s,%s)',(uuid.uuid4(),fromNumber)) 
                db.commit()
        if not (0 if len(db_user) == 0 else db_user[0]['alertConfirmation']):
            return jsonify({"statusCode": 331, "message": "Yasal uyarıyı onaylayınız!"})  
        baglanti.execute('SELECT * FROM alerts WHERE uuid = %s AND completed = 0', (db_user[0]['uuid']))
        alerts = baglanti.fetchall()
        if len(alerts) == db_user[0]['maxAlert']:
            return jsonify({"statusCode": 333, "max": len(alerts), "message": "Üzgünüm çok fazla alarmınız var!"})
        baglanti.execute('INSERT INTO alerts(`uuid`, `platform`, `toChat`, `code`, `price`, `compare`, `completed`, `type`) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)',(db_user[0]['uuid'], platform, toNumber, coinID, price, status, 0, typeX))
        db.commit()
        return jsonify({"statusCode": 200, 'message': "Başarılı"})
    except Exception as E:
        connect()
        print(E)
        return jsonify({"statusCode": 400, "message": "Hata tespit edildi"})


@app.route("/alerts/get", methods=['POST', 'GET'])
def alerts_Get():
    fromNumber, platform = request.args.get('fromNumber'), int(request.args.get('platform'))
    try:
        db.commit()
        if platform == 0:
            baglanti.execute('SELECT * FROM users WHERE whatsapp = %s AND inActive = 0', (fromNumber))
            db_user = baglanti.fetchall()
            if len(db_user) == 0:
                baglanti.execute('INSERT INTO users(`uuid`,`whatsapp`) VALUES (%s,%s)',(uuid.uuid4(),fromNumber)) 
                db.commit()
        elif platform == 1:
            baglanti.execute('SELECT * FROM users WHERE telegram = %s AND inActive = 0', (fromNumber))
            db_user = baglanti.fetchall()
            if len(db_user) == 0:
                baglanti.execute('INSERT INTO users(`uuid`,`telegram`) VALUES (%s,%s)',(uuid.uuid4(),fromNumber)) 
                db.commit()
        elif platform == 2:
            baglanti.execute('SELECT * FROM users WHERE discord = %s AND inActive = 0', (fromNumber))
            db_user = baglanti.fetchall()
            if len(db_user) == 0:
                baglanti.execute('INSERT INTO users(`uuid`,`discord`) VALUES (%s,%s)',(uuid.uuid4(),fromNumber)) 
                db.commit()
        if not (0 if len(db_user) == 0 else db_user[0]['alertConfirmation']):
            return jsonify({"statusCode": 331, "message": "Yasal uyarıyı onaylayınız!"})  
        baglanti.execute('SELECT * FROM alerts WHERE uuid = %s AND completed = 0', (db_user[0]['uuid']))
        data = baglanti.fetchall()
        return jsonify({"statusCode": 200, "amount": len(data),"message": data})
    except Exception as E:
        connect()
        print(E)
        return jsonify({"statusCode": 400, "message": "Hata tespit edildi"})
        
@app.route("/alerts/del", methods=['POST', 'GET'])
def alerts_Del():
    fromNumber, ID, platform = request.args.get('fromNumber'), request.args.get('id'), int(request.args.get('platform'))
    try:
        db.commit()
        if platform == 0:
            baglanti.execute('SELECT * FROM users WHERE whatsapp = %s AND inActive = 0', (fromNumber))
            db_user = baglanti.fetchall()
            if len(db_user) == 0:
                baglanti.execute('INSERT INTO users(`uuid`,`whatsapp`) VALUES (%s,%s)',(uuid.uuid4(),fromNumber)) 
                db.commit()
        elif platform == 1:
            baglanti.execute('SELECT * FROM users WHERE telegram = %s AND inActive = 0', (fromNumber))
            db_user = baglanti.fetchall()
            if len(db_user) == 0:
                baglanti.execute('INSERT INTO users(`uuid`,`telegram`) VALUES (%s,%s)',(uuid.uuid4(),fromNumber)) 
                db.commit()
        elif platform == 2:
            baglanti.execute('SELECT * FROM users WHERE discord = %s AND inActive = 0', (fromNumber))
            db_user = baglanti.fetchall()
            if len(db_user) == 0:
                baglanti.execute('INSERT INTO users(`uuid`,`discord`) VALUES (%s,%s)',(uuid.uuid4(),fromNumber)) 
                db.commit()
        if not (0 if len(db_user) == 0 else db_user[0]['alertConfirmation']):
            return jsonify({"statusCode": 331, "message": "Yasal uyarıyı onaylayınız!"})  
        baglanti.execute('SELECT * FROM alerts WHERE uuid = %s AND completed = 0', (db_user[0]['uuid']))
        alerts = baglanti.fetchall()
        if len(alerts) < ID:
            return jsonify({"statusCode": 333, "message": "Böyle bir alarm bulunamadı!"})          
        ID = alerts[ID-1]['id']
        if len(alerts) == 0:
            return jsonify({"statusCode": 333, "message": "Böyle bir alarm bulunamadı!"})
        baglanti.execute('UPDATE alerts SET completed = -1 WHERE id = %s AND uuid = %s AND completed = 0', (ID, db_user[0]['uuid']))
        db.commit()
        return jsonify({"statusCode": 200, "message": "Başarılı! Alarm silindi!"})
    except Exception as E:
        connect()
        print(E)
        return jsonify({"statusCode": 400, "message": "Hata tespit edildi!"})

@app.route("/alerts/confirmation", methods=['POST', 'GET'])
def alerts_Confirmation():
    ts = time.time()
    timestamp = datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')           
    args = parser.parse_args()
    userID, platform = request.args.get('fromNumber'), int(request.args.get('platform'))
    try:
        if platform == 0:
            baglanti.execute('SELECT * FROM users WHERE whatsapp = %s AND inActive = 0', (userID))
            db_user = baglanti.fetchall()
            if len(db_user) == 0:
                baglanti.execute('INSERT INTO users(`uuid`,`whatsapp`) VALUES (%s,%s)',(uuid.uuid4(),userID)) 
                db.commit()
        elif platform == 1:
            baglanti.execute('SELECT * FROM users WHERE telegram = %s AND inActive = 0', (userID))
            db_user = baglanti.fetchall()
            if len(db_user) == 0:
                baglanti.execute('INSERT INTO users(`uuid`,`telegram`) VALUES (%s,%s)',(uuid.uuid4(),userID)) 
                db.commit()
        elif platform == 2:
            baglanti.execute('SELECT * FROM users WHERE discord = %s AND inActive = 0', (userID))
            db_user = baglanti.fetchall()
            if len(db_user) == 0:
                baglanti.execute('INSERT INTO users(`uuid`,`discord`) VALUES (%s,%s)',(uuid.uuid4(),userID)) 
                db.commit()
        baglanti.execute('UPDATE users SET alertConfirmation = %s, alertConfirmationTime = %s WHERE uuid = %s', (1, timestamp, db_user[0]['uuid']))
        db.commit()
        return jsonify({"statusCode": 200, "message": "Başarıyla onayladınız!"})
    except Exception as E:
        connect()
        print(E)
        return jsonify({"statusCode": 400, "message": "Hata tespit edildi"})
                
"""
Wallets API
"""
@app.route("/wallets/get", methods=['POST', 'GET'])
def wallets_Get():
    userID, platform = request.args.get('userID'), int(request.args.get('platform'))
    try:
        db.commit()
        if platform == 0:
            baglanti.execute('SELECT * FROM users WHERE whatsapp = %s AND inActive = 0', (userID))
            db_user = baglanti.fetchall()
            if len(db_user) == 0:
                baglanti.execute('INSERT INTO users(`uuid`,`whatsapp`) VALUES (%s,%s)',(uuid.uuid4() ,userID)) 
                db.commit()
                baglanti.execute('SELECT * FROM users WHERE whatsapp = %s AND inActive = 0', (userID))
                db_user = baglanti.fetchall()
        elif platform == 1:
            baglanti.execute('SELECT * FROM users WHERE telegram = %s AND inActive = 0', (userID))
            db_user = baglanti.fetchall()
            if len(db_user) == 0:
                baglanti.execute('INSERT INTO users(`uuid`,`telegram`) VALUES (%s,%s)',(uuid.uuid4() ,userID)) 
                db.commit()
                baglanti.execute('SELECT * FROM users WHERE telegram = %s AND inActive = 0', (userID))
                db_user = baglanti.fetchall()
        elif platform == 2:
            baglanti.execute('SELECT * FROM users WHERE discord = %s AND inActive = 0', (userID))
            db_user = baglanti.fetchall()
            if len(db_user) == 0:
                baglanti.execute('INSERT INTO users(`uuid`,`discord`) VALUES (%s,%s)',(uuid.uuid4() ,userID)) 
                db.commit()
                baglanti.execute('SELECT * FROM users WHERE discord = %s AND inActive = 0', (userID))
                db_user = baglanti.fetchall()
        baglanti.execute('SELECT * FROM wallets WHERE uuid = %s',(db_user[0]['uuid']))
        wallet = baglanti.fetchall()
        if len(wallet) == 0:
            baglanti.execute('INSERT INTO wallets(`uuid`, `wallet`) VALUES (%s,%s)',(db_user[0]['uuid'], json.dumps({'coin': {}, 'bist': {}})))
            db.commit()
            baglanti.execute('SELECT * FROM wallets WHERE uuid = %s',(db_user[0]['uuid']))
            wallet = baglanti.fetchall()
        wallet_id = db_user[0]['uuid']
        wallets = json.loads(wallet[0]['wallet'])
        if len(wallets['coin']) + len(wallets['bist']) == 0:
            walletP = {'userID': wallet_id,
                    'amount': len(wallets['coin']) + len(wallets['bist']),
                    'prices': []                    
                    }
            return jsonify({"statusCode": 200, 'message': walletP})
        now = datetime.datetime.now() + datetime.timedelta(days=3)
        yy, mm, dd = str(now.year), str(now.month), str(now.day)
        if(len(dd)==1):
            dd = "0" + dd
        if(len(mm)==1):
            mm = "0" + mm
        today = yy+mm+dd
        now = now - datetime.timedelta(days=10)
        yy, mm, dd = str(now.year), str(now.month), str(now.day)
        if(len(dd)==1):
            dd = "0" + dd
        if(len(mm)==1):
            mm = "0" + mm
        lastday = yy+mm+dd
        dollarPrice = requests.get('https://web-paragaranti-pubsub.foreks.com/web-services/historical-data?userName=undefined&name=USD/TRL&exchange=FOREX&market=N&group=F&last=300&period=1440&intraPeriod=null&isLast=false&from={}000000&to={}235900'.format(lastday, today)).json()['dataSet'][-1]['close']
        prices, totalUSD, totalTRY = [], 0, 0
        if len(wallets['coin']) != 0:
            for coinID in list(divide_chunks(list(wallets['coin'].keys()), 10)):
                coins = ""
                for i in coinID:
                    coins = coins + i + ","
                requestData = requests.get('https://api.coingecko.com/api/v3/simple/price?ids={}&vs_currencies=usd,try'.format(coins[:-1])).json()
                for coin in coinID:
                    prices.append({'coinID': coin , 'type': 0, 'amount': wallets['coin'][coin], 'usd': requestData[coin]['usd'] * wallets['coin'][coin], 'try': requestData[coin]['try'] * wallets['coin'][coin]})
                    totalTRY = totalTRY + requestData[coin]['try'] * wallets['coin'][coin]
                    totalUSD = totalUSD + requestData[coin]['usd'] * wallets['coin'][coin]
        if len(wallets['bist']) != 0:
            for codeBIST in wallets['bist'].keys():
                data = requests.get("https://web-paragaranti-pubsub.foreks.com/web-services/historical-data?userName=undefined&name={}&exchange=BIST&market=E&group=F&last=300&period=1440&intraPeriod=null&isLast=false&from={}000000&to={}235900".format(codeBIST, lastday, today))
                data = data.json()['dataSet'][-1]
                prices.append({'coinID': codeBIST, 'type': 1, 'amount': wallets['bist'][codeBIST], 'usd': data['close'] * wallets['bist'][codeBIST] / dollarPrice, 'try': data['close'] * wallets['bist'][codeBIST]})
                totalTRY = totalTRY + data['close'] * wallets['bist'][codeBIST]
                totalUSD = totalUSD + data['close'] * wallets['bist'][codeBIST] / dollarPrice
        prices = sorted(prices, key=lambda k: k['try'], reverse=True)
        walletP = {'userID': wallet_id,
            'amount': len(wallets['coin']) + len(wallets['bist']),
            'prices': prices,
            'totals': {'try': totalTRY,
                        'usd': totalUSD}
        } 
        return jsonify({"statusCode": 200, 'message': walletP})
    except Exception as E:
        connect()
        print(E)
        return make_response(jsonify({"statusCode": 400, "message": "Hata tespit edildi"}))
        
@app.route("/wallets/update", methods=['POST', 'GET'])
def wallets_Update():
    userID, buy, count, stockID, platform, typeX = request.args.get('userID'), request.args.get('buy'), request.args.get('count'), request.args.get('stockID'), int(request.args.get('platform')), request.args.get('type')
    try:
        db.commit()
        print('A')
        if platform == 0:
            baglanti.execute('SELECT * FROM users WHERE whatsapp = %s AND inActive = 0', (userID))
            db_user = baglanti.fetchall()
            if len(db_user) == 0:
                baglanti.execute('INSERT INTO users(`uuid`,`whatsapp`) VALUES (%s,%s)',(uuid.uuid4() ,userID)) 
                db.commit()
                baglanti.execute('SELECT * FROM users WHERE whatsapp = %s AND inActive = 0', (userID))
                db_user = baglanti.fetchall()
        elif platform == 1:
            baglanti.execute('SELECT * FROM users WHERE telegram = %s AND inActive = 0', (userID))
            db_user = baglanti.fetchall()
            if len(db_user) == 0:
                baglanti.execute('INSERT INTO users(`uuid`,`telegram`) VALUES (%s,%s)',(uuid.uuid4() ,userID)) 
                db.commit()
                baglanti.execute('SELECT * FROM users WHERE telegram = %s AND inActive = 0', (userID))
                db_user = baglanti.fetchall()
        elif platform == 2:
            baglanti.execute('SELECT * FROM users WHERE discord = %s AND inActive = 0', (userID))
            db_user = baglanti.fetchall()
            if len(db_user) == 0:
                baglanti.execute('INSERT INTO users(`uuid`,`discord`) VALUES (%s,%s)',(uuid.uuid4() ,userID)) 
                db.commit()
                baglanti.execute('SELECT * FROM users WHERE discord = %s AND inActive = 0', (userID))
                db_user = baglanti.fetchall()
        print(db_user)
        baglanti.execute('SELECT * FROM wallets WHERE uuid = %s',(db_user[0]['uuid']))
        wallet = baglanti.fetchall()
        print(wallet)
        if len(wallet) == 0:
            baglanti.execute('INSERT INTO wallets(`uuid`, `wallet`) VALUES (%s,%s)',(db_user[0]['uuid'], json.dumps({'coin': {}, 'bist': {}})))
            db.commit()
            baglanti.execute('SELECT * FROM wallets WHERE uuid = %s',(db_user[0]['uuid']))
            wallet = baglanti.fetchall()
        wallet_id = db_user[0]['uuid']
        wallets = json.loads(wallet[0]['wallet'])
        if typeX == 0:
            typeA = 'coin'
        if typeX == 1:
            typeA = 'bist'
        print('A')
        if buy == 0:
            if stockID not in wallets[typeA]:
                return jsonify({"statusCode": 332, "message": "{} cüzdanda bulunamadı".format(stockID)})
            if count == -1:
                wallets[typeA].pop(stockID)
                wallet = json.dumps(wallets)
                baglanti.execute('UPDATE wallets SET wallet = %s WHERE uuid = %s', (str(wallet), wallet_id))
                db.commit()
                return jsonify({"statusCode": 200, "message": "{} hepsi satıldı!".format(stockID)})
            else:
                if wallets[typeA][stockID] < count:
                    return jsonify({"statusCode": 333, "count": wallets[typeA][stockID] , "message": "{} cüzdanda yeterli bir miktarda bulunamadı!".format(stockID)})
                elif wallets[typeA][stockID] == count:
                    wallets[typeA].pop(stockID)
                    wallet = json.dumps(wallets)
                    baglanti.execute('UPDATE wallets SET wallet = %s WHERE uuid = %s', (str(wallet), wallet_id))
                    db.commit()
                    return jsonify({"statusCode": 200, "message": "{} başarıyla satıldı!".format(stockID)})
                else:
                    wallets[typeA][stockID] = wallets[typeA][stockID] - count
                    wallet = json.dumps(wallets)
                    baglanti.execute('UPDATE wallets SET wallet = %s WHERE uuid = %s', (str(wallet), wallet_id))
                    db.commit()
                    return jsonify({"statusCode": 200, "message": "{} başarıyla satıldı!".format(stockID)})
        elif buy == 1:
            if stockID not in wallets[typeA]:
                if len(wallets['coin']) + len(wallets['bist']) == db_user[0]['maxWallet']:
                    return jsonify({"statusCode": 333, "max": len(wallets['coin']) + len(wallets['bist']), "message": "Üzgünüm çok fazla kripto var!".format(stockID)})
                wallets[typeA][stockID] = count
                wallet = json.dumps(wallets)
                baglanti.execute('UPDATE wallets SET wallet = %s WHERE uuid = %s', (str(wallet), wallet_id))
                db.commit()
                return jsonify({"statusCode": 200, "message": "{} başarıyla cüzdana eklendi!".format(stockID)})
            wallets[typeA][stockID] = count + wallets[typeA][stockID]
            wallet = json.dumps(wallets)
            baglanti.execute('UPDATE wallets SET wallet = %s WHERE uuid = %s', (str(wallet), wallet_id))
            db.commit()
            return jsonify({"statusCode": 200, "message": "{} başarıyla cüzdana eklendi!".format(stockID)})
        return jsonify({"statusCode": 400, "message": "Hata tespit edildi"})
    except Exception as E:
        connect()
        print(E)
        return jsonify({"statusCode": 400, "message": "Hata tespit edildi"})

if __name__ == '__main__':
    app.config['JSON_AS_ASCII'] = False
    connect()
    app.run(debug=True,host='0.0.0.0')
