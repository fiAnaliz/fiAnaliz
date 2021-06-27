<br />
<p align="center">
  <a href="https://github.com/fiAnaliz/fiAnaliz">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">fiAnaliz | Market Bot</h3>

  <p align="center">
    Turkey's free stock market - crypto bot. Now on Whatsapp, Telegram and Discord!
  <br />
    <a href="https://api.whatsapp.com/send/?phone=16053157748&text=!yardim">Whatsapp</a>
    ·
    <a href="https://t.me/fiAnalizBot">Telegram</a>
    ·
    <a href="https://discord.com/oauth2/authorize?client_id=844210790512984096&scope=bot&permissions=8">Discord</a>
  </p>
</p>
<p align="center">
<a href="https://twitter.com/intent/user?screen_name=fiAnaliz">Follow on Twitter <img src="images/twitter.png" alt="Twitter: @fiAnaliz"></a>
</p>

<details open="open">
  <summary><h2 style="display: inline-block">Table of Contents</h2></summary>
  <ol>
    <li>
      <a href="#about">About</a>
      <ul>
        <li><a href="#data-policy">Data Policy</a></li>
      </ul>
    </li>
    <li>
      <a href="#installationconfiguration">Installation/Configuration</a>
      <ul>
        <li><a href="#server">Server</a></li>
          <ul>
            <li><a href="#prerequisities">Prerequisities</a></li>
            <li><a href="#database-configuration">Database Configuration</a></li>
            <li><a href="#running-the-server">Running the server</a></li>
          </ul>
        <li><a href="#client">Client</a></li>
            <ul>
            <li><a href="#prerequisities-1">Prerequisities</a></li>
            <li><a href="#running-the-client">Running the client</a></li>
          </ul>
      </ul>
    </li>
    <li>
      <a href="#usage">Usage</a>
      <ul>
        <li><a href="#whatsapp">Whatsapp</a></li>
        <li><a href="#telegram">Telegram</a></li>
        <li><a href="#discord">Discord</a></li>
      </ul>
    </li>
    <li><a href="#system-diagram">System Diagram</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>


# About

fiAnaliz can work synchronously across multiple platforms and allows people to learn about financial markets for free. fiAnaliz can operate on the three messaging and communication platforms with the highest number of users in Turkey.

## Data Policy

As the fiAnaliz team, we respect your privacy rights and strive to ensure this while you are using our bots. The explanations regarding the security of your personal information are explained below and presented for your information:

Messages:
Your messages are not recorded and shared with third parties due to the importance we attach to your privacy. Your messages that only start with an exclamation point (!) are stored in our databases with AES 256-bit encryption for fault detection and usage statistics.

User Information:
Your usernames and phone numbers are stored in our databases with AES 256-bit encryption for the usage of our wallets and alarm systems. Our databases are within the borders of Turkey and your data does not go abroad.

fiAnaliz team works for the security and privacy of your data.

# Installation/Configuration
## Server
### Prerequisities
* python3
* Flask
* PyMySQL
* requests
* Pandas
* mplfinance

### Database Configuration
```
git clone https://github.com/fiAnaliz/fiAnaliz.git
cd fiAnaliz/src
mysql -h server_name -u user_name -p password fiAnaliz < mysql/configure_database.sql
```

### Running the server
To use the alarm function, alert_module and backend_api_service are required. Graphing and wallet functions also depend on backend_api_service.
After changing the host, user, password and db variables under the Database class in these two codes, run the scripts in two separate terminals.

```
python3 alert_module.py
python3 backend_api_service.py
```

## Client
### Prerequisities
* Node.js
* Moment.js
* Express
* Discord.js (for Discord)
* node-telegram-bot-api (for Telegram)
* wa-automate-nodejs (for Whatsapp)

### Running the client
```
node Whatsapp/main.js
node Discord/main.js
node Telegram/main.js
```

# Usage

On which platform you want to use fiAnaliz, you can start using the invitation links below.
<p align="center">
    <a href="https://api.whatsapp.com/send/?phone=16053157748&text=!yardim">Whatsapp</a>
    ·
    <a href="https://t.me/fiAnalizBot">Telegram</a>
    ·
    <a href="https://discord.com/oauth2/authorize?client_id=844210790512984096&scope=bot&permissions=8">Discord</a>
</p>

You can learn the commands you can use with a private message or by typing !yardim on the group you added the bot to.

<p align="center">
    <img src="images/yardim.png" alt="Help">
</p>

## Whatsapp

<p align="center">
  <a href="https://api.whatsapp.com/send/?phone=16053157748&text=!yardim">
    <img src="images/gifs/Whatsapp.gif" alt="Usage on Whatsapp" width="500">
  </a>
</p>

## Telegram

<p align="center">
  <a href="https://t.me/fiAnalizBot">
    <img src="images/gifs/Telegram.gif" alt="Usage on Telegram" width="500">
  </a>
</p>

## Discord

<p align="center">
  <a href="https://discord.com/oauth2/authorize?client_id=844210790512984096&scope=bot&permissions=8">
    <img src="images/gifs/Discord.gif" alt="Usage on Discord" width="500">
  </a>
</p>

# System Diagram

<p align="center">
  <img src="images/system-diagram.png" alt="System Diagram" width="1000">
</p>

# Contact

İbrahim Enes Duran - Istanbul Technical University - [LinkedIn](https://linkedin.com/in/ibrahimenesduran)\
Mesut Melih Akpınar - Bogazici University - [LinkedIn](https://www.linkedin.com/in/melihakpinar)  
