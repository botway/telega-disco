# telega-disco
Auto mix youtube videos submitted through telegram bot by your community.

Created this application for the Christmass party we hosted in 2022. Projected the videos on a large canvas, it was a lot of fun.

*How to use:*
1. Cretate your telegram bot as described here https://core.telegram.org/bots#how-do-i-create-a-bot
2. Copy *Bot API Token* from API Token tab in the bot settings.
3. Open .env file and paste the token between the qoutes into TELEGRAM_BOT_TOKEN="".
4. Deploy the code to your hosting. For example, you can fork this repo and directly deploy it to glitch.com as described here https://help.glitch.com/kb/article/20-importing-code-from-github/ (note, that you will have to use glitch environmental variables insted of .env).
5. Invite your users into the telegram bot and let them paste their favourite YouTube links into it.
6. For the ease of use you can delete all default bot commands like /start
7. Open the app in the browser, playback videos on the device of your choice and have fun.

*Important:*

If you will enable telegram webhook:
* you won't be able to use any other telegram REST API endpoints.
* if you will run it locally, you will need to configure an HTTP tunnel using ngrok agent https://ngrok.com/
* the app should be hosted using HTTPS
 
Only one bot instance can run at a time. If you want to run another service, you will need to create a new bot.

If you want to skip the track, use NEXT button, which is faded in on mouse move or just use N key  