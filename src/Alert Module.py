# -*- coding: utf-8 -*-
import pymysql.cursors
import random
import requests
import time
import json
import datetime
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
def divide_chunks(l, n):
      
    # looping till length l
    for i in range(0, len(l), n): 
        yield l[i:i + n]

baglanti = ""
def connect():
    global db
    global baglanti
    db = pymysql.connect(host= Database.host,
        user= Database.user,
        password= Database.password,
        db= Database.db,
        charset= Database.charset,
        cursorclass=pymysql.cursors.DictCursor)
    baglanti = db.cursor()
"""
Alerts Loop
"""
with open('Config.json', encoding='utf-8') as json_file:
    dataX = json.load(json_file)
connect()
while True:
    try:     
        db.commit()
        baglanti.execute("SELECT code FROM alerts WHERE completed = 0 AND type = 0 GROUP BY code")
        alerts = baglanti.fetchall()
        if (len(alerts) != 0):
            for coinID in list(divide_chunks(alerts, 10)):
                coins = ""
                for i in coinID:
                    coins = coins + i['code'] + ","
                data = requests.get('https://api.coingecko.com/api/v3/simple/price?ids={}&vs_currencies=usd'.format(coins[:-1])).json()
                for coinID in coinID:
                    baglanti.execute("SELECT * FROM alerts WHERE code = %s AND completed = 0 AND type = 0", (coinID['code']))
                    for alert in baglanti.fetchall():
                        if alert['compare'] == 1 and alert['price'] <= data[coinID['code']]['usd']:
                            baglanti.execute("SELECT * FROM users WHERE uuid = %s", (alert['uuid']))
                            if alert['platform'] == 0:
                                fromNumber = baglanti.fetchall()[0]['whatsapp']
                                payload = { "id": alert['id'],
                                    "toNumber": alert['toChat'],
                                    "fromNumber": fromNumber,
                                    "crypto": 1,
                                    "message": "*ALARMLARIM* | @%s  🔔🔔🔔\n\n*{}*, *{}* $ hedef fiyatlı *büyük veya eşit olma koşullu* alarmınız gerçekleşmiştir!\n\n*Güncel fiyat:* {} $".format(dataX['COIN_symbols'][dataX['COIN_id'].index(alert['code'])], alert['price'],float(data[coinID['code']]['usd']))
                                    }
                                response = requests.post('http://localhost:9000', json=payload)
                            elif alert['platform'] == 1:
                                fromNumber = baglanti.fetchall()[0]['telegram']
                                payload = { "id": alert['id'],
                                    "toNumber": alert['toChat'],
                                    "fromNumber": fromNumber,
                                    "crypto": 1,
                                    "message": "*ALARMLARIM* | @%s  🔔🔔🔔\n\n*{}*, *{}* $ hedef fiyatlı *büyük veya eşit olma koşullu* alarmınız gerçekleşmiştir!\n\n*Güncel fiyat:* {} $".format(dataX['COIN_symbols'][dataX['COIN_id'].index(alert['code'])], alert['price'],float(data[coinID['code']]['usd']))
                                    }
                                response = requests.post('http://localhost:9001', json=payload)
                            elif alert['platform'] == 2:
                                fromNumber = baglanti.fetchall()[0]['discord']
                                payload = { "id": alert['id'],
                                    "toNumber": alert['toChat'],
                                    "fromNumber": fromNumber,
                                    "crypto": 1,
                                    "message": "**{}**, **{}** $ hedef fiyatlı **büyük veya eşit olma koşullu** alarmınız gerçekleşmiştir!\n\n**Güncel fiyat:** {} $ | %s".format(dataX['COIN_symbols'][dataX['COIN_id'].index(alert['code'])], alert['price'],float(data[coinID['code']]['usd']))
                                    }
                                response = requests.post('http://localhost:9002', json=payload)
                            baglanti.execute('UPDATE alerts SET completed = 1 WHERE id = %s', (alert['id']))
                            db.commit()
                        elif alert['compare'] == 0 and alert['price'] >= data[coinID['code']]['usd']:
                            baglanti.execute("SELECT * FROM users WHERE uuid = %s", (alert['uuid']))
                            if alert['platform'] == 0:
                                fromNumber = baglanti.fetchall()[0]['whatsapp']
                                payload = { "id": alert['id'],
                                    "toNumber": alert['toChat'],
                                    "fromNumber": fromNumber,
                                    "crypto": 1,
                                    "message": "*ALARMLARIM* | @%s  🔔🔔🔔\n\n*{}*, *{}* $ hedef fiyatlı *küçük veya eşit olma koşullu* alarmınız gerçekleşmiştir!\n\n*Güncel fiyat:* {} $".format( dataX['COIN_symbols'][dataX['COIN_id'].index(alert['code'])], alert['price'],float(data[coinID['code']]['usd']))
                                    }
                                response = requests.post('http://localhost:9000', json=payload)
                            elif alert['platform'] == 1:
                                fromNumber = baglanti.fetchall()[0]['telegram']
                                payload = { "id": alert['id'],
                                    "toNumber": alert['toChat'],
                                    "fromNumber": fromNumber,
                                    "crypto": 1,
                                    "message": "*ALARMLARIM* | @%s  🔔🔔🔔\n\n*{}*, *{}* $ hedef fiyatlı *küçük veya eşit olma koşullu* alarmınız gerçekleşmiştir!\n\n*Güncel fiyat:* {} $".format( dataX['COIN_symbols'][dataX['COIN_id'].index(alert['code'])], alert['price'],float(data[coinID['code']]['usd']))
                                    }
                                response = requests.post('http://localhost:9001', json=payload)
                            elif alert['platform'] == 2:
                                fromNumber = baglanti.fetchall()[0]['discord']
                                payload = { "id": alert['id'],
                                    "toNumber": alert['toChat'],
                                    "fromNumber": fromNumber,
                                    "crypto": 1,
                                    "message": "**{}**, **{}** $ hedef fiyatlı **küçük veya eşit olma koşullu** alarmınız gerçekleşmiştir!\n\n**Güncel fiyat:** {} $ | %s".format( dataX['COIN_symbols'][dataX['COIN_id'].index(alert['code'])], alert['price'],float(data[coinID['code']]['usd']))
                                    }
                                response = requests.post('http://localhost:9002', json=payload)

                            baglanti.execute('UPDATE alerts SET completed = 1 WHERE id = %s', (alert['id']))
                            db.commit()
        now = datetime.datetime.now() 
        if(10 < now.hour < 19 and now.weekday() < 6):
            baglanti.execute("SELECT code FROM alerts WHERE completed = 0 AND type = 1 GROUP BY code")
            alerts = baglanti.fetchall()
            if (len(alerts) != 0):
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
                    for code in alerts:
                        code = code['code']
                        data = requests.get("https://web-paragaranti-pubsub.foreks.com/web-services/historical-data?userName=undefined&name={}&exchange=BIST&market=E&group=F&last=300&period=1440&intraPeriod=null&isLast=false&from={}000000&to={}235900".format(code, lastday, today)).json()['dataSet'][-1]
                        baglanti.execute("SELECT * FROM alerts WHERE code = %s AND completed = 0 AND type = 1", (code))
                        for alert in baglanti.fetchall():
                            if alert['compare'] == 1 and alert['price'] <=  data['close']:
                                baglanti.execute("SELECT * FROM users WHERE uuid = %s", (alert['uuid']))
                                if alert['platform'] == 0:
                                    fromNumber = baglanti.fetchall()[0]['whatsapp']
                                    payload = { "id": alert['id'],
                                        "toNumber": alert['toChat'],
                                        "fromNumber": fromNumber,
                                        "crypto": 1,
                                        "message": "*ALARMLARIM* | @%s  🔔🔔🔔\n\n*{}*, *{}* ₺ hedef fiyatlı *büyük veya eşit olma koşullu* alarmınız gerçekleşmiştir!\n\n*Güncel fiyat:* {} ₺".format(alert['code'], alert['price'], float(data['close']))
                                        }
                                    response = requests.post('http://localhost:9000', json=payload)
                                elif alert['platform'] == 1:
                                    fromNumber = baglanti.fetchall()[0]['telegram']
                                    payload = { "id": alert['id'],
                                        "toNumber": alert['toChat'],
                                        "fromNumber": fromNumber,
                                        "crypto": 1,
                                        "message": "*ALARMLARIM* | @%s  🔔🔔🔔\n\n*{}*, *{}* ₺ hedef fiyatlı *büyük veya eşit olma koşullu* alarmınız gerçekleşmiştir!\n\n*Güncel fiyat:* {} ₺".format(alert['code'], alert['price'], float(data['close']))
                                        }
                                    response = requests.post('http://localhost:9001', json=payload)
                                elif alert['platform'] == 2:
                                    fromNumber = baglanti.fetchall()[0]['discord']
                                    payload = { "id": alert['id'],
                                        "toNumber": alert['toChat'],
                                        "fromNumber": fromNumber,
                                        "crypto": 1,
                                        "message": "**{}**, **{}** ₺ hedef fiyatlı *büyük veya eşit olma koşullu* alarmınız gerçekleşmiştir!\n\n*Güncel fiyat:* {} ₺ | %s".format(alert['code'], alert['price'], float(data['close']))
                                        }
                                    response = requests.post('http://localhost:9002', json=payload)
                                baglanti.execute('UPDATE alerts SET completed = 1 WHERE id = %s', (alert['id']))
                                db.commit()

                            elif alert['compare'] == 0 and alert['price'] >= data['close']:
                                baglanti.execute("SELECT whatsapp FROM users WHERE uuid = %s", (alert['uuid']))
                                if alert['platform'] == 0:
                                    fromNumber = baglanti.fetchall()[0]['whatsapp']
                                    payload = { "id": alert['id'],
                                        "toNumber": alert['toChat'],
                                        "fromNumber": fromNumber,
                                        "crypto": 1,
                                        "message": "*ALARMLARIM* | @%s  🔔🔔🔔\n\n*{}*, *{}* ₺ hedef fiyatlı *küçük veya eşit olma koşullu* alarmınız gerçekleşmiştir!\n\n*Güncel fiyat:* {} ₺".format(alert['code'] , alert['price'], float(data['close']))
                                        }
                                    response = requests.post('http://localhost:9000', json=payload)
                                elif alert['platform'] == 1:
                                    fromNumber = baglanti.fetchall()[0]['telegram']
                                    payload = { "id": alert['id'],
                                        "toNumber": alert['toChat'],
                                        "fromNumber": fromNumber,
                                        "crypto": 1,
                                        "message": "*ALARMLARIM* | @%s  🔔🔔🔔\n\n*{}*, *{}* ₺ hedef fiyatlı *küçük veya eşit olma koşullu* alarmınız gerçekleşmiştir!\n\n*Güncel fiyat:* {} ₺".format(alert['code'] , alert['price'], float(data['close']))
                                        }
                                    response = requests.post('http://localhost:9001', json=payload)
                                elif alert['platform'] == 2:
                                    fromNumber = baglanti.fetchall()[0]['discord']
                                    payload = { "id": alert['id'],
                                        "toNumber": alert['toChat'],
                                        "fromNumber": fromNumber,
                                        "crypto": 1,
                                        "message": "**{}**, **{}** ₺ hedef fiyatlı *küçük veya eşit olma koşullu* alarmınız gerçekleşmiştir!\n\n*Güncel fiyat:* {} ₺ | %s".format(alert['code'] , alert['price'], float(data['close']))
                                        }
                                    response = requests.post('http://localhost:9002', json=payload)
                                baglanti.execute('UPDATE alerts SET completed = 1 WHERE id = %s', (alert['id']))
                                db.commit()
                        time.sleep(1)
                
    except Exception as E:
        connect()
        print(E)
    print('BEKLEMEDE')
    time.sleep(60)

