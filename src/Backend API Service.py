import asyncio
from threading import Thread
import json
from flask import Flask, jsonify, request
from flask_restplus import Api, Resource, reqparse, fields
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
api = Api(app, version='1.0', title='financedomAPI',
          description='Finansal özgürlük! Çok Yakında!',)
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
Namespaces
"""
chart_api = api.namespace("chart", description="This method get financial chart.")
alert_api = api.namespace("alert", description="This method set/get/dell alert.")
wallets_api = api.namespace("wallets", description="This method get/update wallets")


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
@chart_api.route("")
class chart(Resource):
    @chart_api.response(200, "Success")
    @chart_api.response(400, "Bad Request or Invalid Argument")
    @chart_api.response(500, "Server Error! Contact the admin!")

    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('stock', type=str, required=True)
        parser.add_argument('desc', type=str, required=True)
        parser.add_argument('whereIs', type=str, required=True)
        parser.add_argument('coinKey', type=str, required=False)
        args = parser.parse_args()
        whereIs, msg, desc, coinKey = args['whereIs'], args['stock'], args['desc'], args['coinKey']
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
@alert_api.route("/set")
class alertSet(Resource):

    @alert_api.response(200, "Success")
    @alert_api.response(400, "Bad Request or Invalid Argument")
    @alert_api.response(500, "Server Error! Contact the admin!")

    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('fromNumber', type=str, required=True)
        parser.add_argument('toNumber', type=str, required=True)
        parser.add_argument('price', type=float, required=True)
        parser.add_argument('coinID', type=str, required=True)
        parser.add_argument('status', type=int, required=True)
        parser.add_argument('type', type=int, required=True) # 0 = COIN / 1 = BIST
        parser.add_argument('platform', type=int, required=True) # 0 = WP / 1 = TG / 2 = DC
        args = parser.parse_args()
        fromNumber, toNumber, price, coinID, status, typeX, platform = args['fromNumber'], args['toNumber'], args['price'], args['coinID'], args['status'], args['type'], args['platform']
        try:
            db.commit()
            if platform == 0:
                baglanti.execute('SELECT * FROM users WHERE whatsapp = %s AND inActive = 0', (fromNumber))
                user = baglanti.fetchall()
                if len(user) == 0:
                    baglanti.execute('INSERT INTO users(`uuid`,`whatsapp`) VALUES (%s,%s)',(uuid.uuid4(),fromNumber)) 
                    db.commit()
            elif platform == 1:
                baglanti.execute('SELECT * FROM users WHERE telegram = %s AND inActive = 0', (fromNumber))
                user = baglanti.fetchall()
                if len(user) == 0:
                    baglanti.execute('INSERT INTO users(`uuid`,`telegram`) VALUES (%s,%s)',(uuid.uuid4(),fromNumber)) 
                    db.commit()
            elif platform == 2:
                baglanti.execute('SELECT * FROM users WHERE discord = %s AND inActive = 0', (fromNumber))
                user = baglanti.fetchall()
                if len(user) == 0:
                    baglanti.execute('INSERT INTO users(`uuid`,`discord`) VALUES (%s,%s)',(uuid.uuid4(),fromNumber)) 
                    db.commit()
            if not (0 if len(user) == 0 else user[0]['alertConfirmation']):
                return jsonify({"statusCode": 331, "message": "Yasal uyarıyı onaylayınız!"})  
            baglanti.execute('SELECT * FROM alerts WHERE uuid = %s AND completed = 0', (user[0]['uuid']))
            alerts = baglanti.fetchall()
            if len(alerts) == user[0]['maxAlert']:
                return jsonify({"statusCode": 333, "max": len(alerts), "message": "Üzgünüm çok fazla alarmınız var!"})
            baglanti.execute('INSERT INTO alerts(`uuid`, `platform`, `toChat`, `code`, `price`, `compare`, `completed`, `type`) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)',(user[0]['uuid'], platform, toNumber, coinID, price, status, 0, typeX))
            db.commit()
            return jsonify({"statusCode": 200, 'message': "Başarılı"})
        except Exception as E:
            connect()
            print(E)
            return jsonify({"statusCode": 400, "message": "Hata tespit edildi"})


@alert_api.route("/get")
class alertGet(Resource):
 
    @alert_api.response(200, "Success")
    @alert_api.response(400, "Bad Request or Invalid Argument")
    @alert_api.response(500, "Server Error! Contact the admin!")

    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('fromNumber', type=str, required=True)
        parser.add_argument('platform', type=int, required=True) # 0 = WP / 1 = TG / 2 = DC
        args = parser.parse_args()
        fromNumber, platform = args['fromNumber'], args['platform']
        try:
            db.commit()
            if platform == 0:
                baglanti.execute('SELECT * FROM users WHERE whatsapp = %s AND inActive = 0', (fromNumber))
                user = baglanti.fetchall()
                if len(user) == 0:
                    baglanti.execute('INSERT INTO users(`uuid`,`whatsapp`) VALUES (%s,%s)',(uuid.uuid4(),fromNumber)) 
                    db.commit()
            elif platform == 1:
                baglanti.execute('SELECT * FROM users WHERE telegram = %s AND inActive = 0', (fromNumber))
                user = baglanti.fetchall()
                if len(user) == 0:
                    baglanti.execute('INSERT INTO users(`uuid`,`telegram`) VALUES (%s,%s)',(uuid.uuid4(),fromNumber)) 
                    db.commit()
            elif platform == 2:
                baglanti.execute('SELECT * FROM users WHERE discord = %s AND inActive = 0', (fromNumber))
                user = baglanti.fetchall()
                if len(user) == 0:
                    baglanti.execute('INSERT INTO users(`uuid`,`discord`) VALUES (%s,%s)',(uuid.uuid4(),fromNumber)) 
                    db.commit()
            if not (0 if len(user) == 0 else user[0]['alertConfirmation']):
                return jsonify({"statusCode": 331, "message": "Yasal uyarıyı onaylayınız!"})  
            baglanti.execute('SELECT * FROM alerts WHERE uuid = %s AND completed = 0', (user[0]['uuid']))
            data = baglanti.fetchall()
            return jsonify({"statusCode": 200, "amount": len(data),"message": data})
        except Exception as E:
            connect()
            print(E)
            return jsonify({"statusCode": 400, "message": "Hata tespit edildi"})
        
@alert_api.route("/del")
class alertGet(Resource):
    
    @alert_api.response(200, "Success")
    @alert_api.response(400, "Bad Request or Invalid Argument")
    @alert_api.response(500, "Server Error! Contact the admin!")

    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('fromNumber', type=str, required=True)
        parser.add_argument('id', type=int, required=True)
        parser.add_argument('platform', type=int, required=True) # 0 = WP / 1 = TG / 2 = DC
        args = parser.parse_args()
        fromNumber, ID, platform = args['fromNumber'], args['id'], args['platform']
        try:
            db.commit()
            if platform == 0:
                baglanti.execute('SELECT * FROM users WHERE whatsapp = %s AND inActive = 0', (fromNumber))
                user = baglanti.fetchall()
                if len(user) == 0:
                    baglanti.execute('INSERT INTO users(`uuid`,`whatsapp`) VALUES (%s,%s)',(uuid.uuid4(),fromNumber)) 
                    db.commit()
            elif platform == 1:
                baglanti.execute('SELECT * FROM users WHERE telegram = %s AND inActive = 0', (fromNumber))
                user = baglanti.fetchall()
                if len(user) == 0:
                    baglanti.execute('INSERT INTO users(`uuid`,`telegram`) VALUES (%s,%s)',(uuid.uuid4(),fromNumber)) 
                    db.commit()
            elif platform == 2:
                baglanti.execute('SELECT * FROM users WHERE discord = %s AND inActive = 0', (fromNumber))
                user = baglanti.fetchall()
                if len(user) == 0:
                    baglanti.execute('INSERT INTO users(`uuid`,`discord`) VALUES (%s,%s)',(uuid.uuid4(),fromNumber)) 
                    db.commit()
            if not (0 if len(user) == 0 else user[0]['alertConfirmation']):
                return jsonify({"statusCode": 331, "message": "Yasal uyarıyı onaylayınız!"})  
            baglanti.execute('SELECT * FROM alerts WHERE uuid = %s AND completed = 0', (user[0]['uuid']))
            alerts = baglanti.fetchall()
            if len(alerts) < ID:
                return jsonify({"statusCode": 333, "message": "Böyle bir alarm bulunamadı!"})          
            ID = alerts[ID-1]['id']
            if len(alerts) == 0:
                return jsonify({"statusCode": 333, "message": "Böyle bir alarm bulunamadı!"})
            baglanti.execute('UPDATE alerts SET completed = -1 WHERE id = %s AND uuid = %s AND completed = 0', (ID, user[0]['uuid']))
            db.commit()
            return jsonify({"statusCode": 200, "message": "Başarılı! Alarm silindi!"})
        except Exception as E:
            connect()
            print(E)
            return jsonify({"statusCode": 400, "message": "Hata tespit edildi!"})

@alert_api.route("/confirmation")
class walletGet(Resource):

    @wallets_api.response(200, "Success")
    @wallets_api.response(400, "Bad Request or Invalid Argument")
    @wallets_api.response(500, "Server Error! Contact the admin!")

    def get(self):
        ts = time.time()
        timestamp = datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')           
        parser = reqparse.RequestParser()
        parser.add_argument('fromNumber', type=str, required=True)
        parser.add_argument('platform', type=int, required=True) # 0 = WP / 1 = TG / 2 = DC
        args = parser.parse_args()
        userID, platform = args['fromNumber'], args['platform']
        try:
            if platform == 0:
                baglanti.execute('SELECT * FROM users WHERE whatsapp = %s AND inActive = 0', (userID))
                user = baglanti.fetchall()
                if len(user) == 0:
                    baglanti.execute('INSERT INTO users(`uuid`,`whatsapp`) VALUES (%s,%s)',(uuid.uuid4(),userID)) 
                    db.commit()
            elif platform == 1:
                baglanti.execute('SELECT * FROM users WHERE telegram = %s AND inActive = 0', (userID))
                user = baglanti.fetchall()
                if len(user) == 0:
                    baglanti.execute('INSERT INTO users(`uuid`,`telegram`) VALUES (%s,%s)',(uuid.uuid4(),userID)) 
                    db.commit()
            elif platform == 2:
                baglanti.execute('SELECT * FROM users WHERE discord = %s AND inActive = 0', (userID))
                user = baglanti.fetchall()
                if len(user) == 0:
                    baglanti.execute('INSERT INTO users(`uuid`,`discord`) VALUES (%s,%s)',(uuid.uuid4(),userID)) 
                    db.commit()
            baglanti.execute('UPDATE users SET alertConfirmation = %s, alertConfirmationTime = %s WHERE uuid = %s', (1, timestamp, user[0]['uuid']))
            db.commit()
            return jsonify({"statusCode": 200, "message": "Başarıyla onayladınız!"})
        except Exception as E:
            connect()
            print(E)
            return jsonify({"statusCode": 400, "message": "Hata tespit edildi"})
                   
"""
Wallets API
"""
@wallets_api.route("/get")
class walletGet(Resource):

    @wallets_api.response(200, "Success")
    @wallets_api.response(400, "Bad Request or Invalid Argument")
    @wallets_api.response(500, "Server Error! Contact the admin!")

    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('userID', type=str, required=True)
        parser.add_argument('platform', type=int, required=True)
        args = parser.parse_args()
        userID, platform = args['userID'], args['platform']
        try:
            db.commit()
            if platform == 0:
                baglanti.execute('SELECT * FROM users WHERE whatsapp = %s AND inActive = 0', (userID))
                user = baglanti.fetchall()
                if len(user) == 0:
                    baglanti.execute('INSERT INTO users(`uuid`,`whatsapp`) VALUES (%s,%s)',(uuid.uuid4() ,userID)) 
                    db.commit()
                    baglanti.execute('SELECT * FROM users WHERE whatsapp = %s AND inActive = 0', (userID))
                    user = baglanti.fetchall()
            elif platform == 1:
                baglanti.execute('SELECT * FROM users WHERE telegram = %s AND inActive = 0', (userID))
                user = baglanti.fetchall()
                if len(user) == 0:
                    baglanti.execute('INSERT INTO users(`uuid`,`telegram`) VALUES (%s,%s)',(uuid.uuid4() ,userID)) 
                    db.commit()
                    baglanti.execute('SELECT * FROM users WHERE telegram = %s AND inActive = 0', (userID))
                    user = baglanti.fetchall()
            elif platform == 2:
                baglanti.execute('SELECT * FROM users WHERE discord = %s AND inActive = 0', (userID))
                user = baglanti.fetchall()
                if len(user) == 0:
                    baglanti.execute('INSERT INTO users(`uuid`,`discord`) VALUES (%s,%s)',(uuid.uuid4() ,userID)) 
                    db.commit()
                    baglanti.execute('SELECT * FROM users WHERE discord = %s AND inActive = 0', (userID))
                    user = baglanti.fetchall()
            baglanti.execute('SELECT * FROM wallets WHERE uuid = %s',(user[0]['uuid']))
            wallet = baglanti.fetchall()
            if len(wallet) == 0:
                baglanti.execute('INSERT INTO wallets(`uuid`, `wallet`) VALUES (%s,%s)',(user[0]['uuid'], json.dumps({'coin': {}, 'bist': {}})))
                db.commit()
                baglanti.execute('SELECT * FROM wallets WHERE uuid = %s',(user[0]['uuid']))
                wallet = baglanti.fetchall()
            wallet_id = user[0]['uuid']
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
            return jsonify({"statusCode": 400, "message": "Hata tespit edildi"})
        
@wallets_api.route("/update")
class walletUpdate(Resource):

    @wallets_api.response(200, "Success")
    @wallets_api.response(400, "Bad Request or Invalid Argument")
    @wallets_api.response(500, "Server Error! Contact the admin!")

    def get(self):
        parser = reqparse.RequestParser()
        parser.add_argument('userID', type=str, required=True)
        parser.add_argument('stockID', type=str, required=True)
        parser.add_argument('count', type=float, required=True)
        parser.add_argument('buy', type=int, required=True)
        parser.add_argument('platform', type=int, required=True)
        parser.add_argument('type', type=int, required=True)
        args = parser.parse_args()
        userID, buy, count, stockID, platform, typeX = args['userID'], args['buy'], args['count'], args['stockID'], args['platform'], args['type']
        try:
            db.commit()
            print('A')
            if platform == 0:
                baglanti.execute('SELECT * FROM users WHERE whatsapp = %s AND inActive = 0', (userID))
                user = baglanti.fetchall()
                if len(user) == 0:
                    baglanti.execute('INSERT INTO users(`uuid`,`whatsapp`) VALUES (%s,%s)',(uuid.uuid4() ,userID)) 
                    db.commit()
                    baglanti.execute('SELECT * FROM users WHERE whatsapp = %s AND inActive = 0', (userID))
                    user = baglanti.fetchall()
            elif platform == 1:
                baglanti.execute('SELECT * FROM users WHERE telegram = %s AND inActive = 0', (userID))
                user = baglanti.fetchall()
                if len(user) == 0:
                    baglanti.execute('INSERT INTO users(`uuid`,`telegram`) VALUES (%s,%s)',(uuid.uuid4() ,userID)) 
                    db.commit()
                    baglanti.execute('SELECT * FROM users WHERE telegram = %s AND inActive = 0', (userID))
                    user = baglanti.fetchall()
            elif platform == 2:
                baglanti.execute('SELECT * FROM users WHERE discord = %s AND inActive = 0', (userID))
                user = baglanti.fetchall()
                if len(user) == 0:
                    baglanti.execute('INSERT INTO users(`uuid`,`discord`) VALUES (%s,%s)',(uuid.uuid4() ,userID)) 
                    db.commit()
                    baglanti.execute('SELECT * FROM users WHERE discord = %s AND inActive = 0', (userID))
                    user = baglanti.fetchall()
            print(user)
            baglanti.execute('SELECT * FROM wallets WHERE uuid = %s',(user[0]['uuid']))
            wallet = baglanti.fetchall()
            print(wallet)
            if len(wallet) == 0:
                baglanti.execute('INSERT INTO wallets(`uuid`, `wallet`) VALUES (%s,%s)',(user[0]['uuid'], json.dumps({'coin': {}, 'bist': {}})))
                db.commit()
                baglanti.execute('SELECT * FROM wallets WHERE uuid = %s',(user[0]['uuid']))
                wallet = baglanti.fetchall()
            wallet_id = user[0]['uuid']
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
                    if len(wallets['coin']) + len(wallets['bist']) == user[0]['maxWallet']:
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
    app.run(debug=True,host='127.0.0.1')