import express from "express";
import got from "got";
import fs from "fs";
import path from "path";
import { Telegraf } from "telegraf";
import { EventEmitter } from 'events';
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import JSONdb from "simple-json-db";

const db = new JSONdb("storage.json");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const botApiKey = process.env.TELEGRAM_BOT_TOKEN;
const telegramAPI = `https://api.telegram.org/bot${botApiKey}`;
const bot = new Telegraf(botApiKey);
const emitter = new EventEmitter();

let playlist = [];
let updates = [];

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// enable webhook
// app.use(await bot.createWebhook({ domain: example.com }));

bot.on("text", ctx => {
    const message = ctx.update.message;
    addToPlaylist(message);
    emitter.emit("message", message);
});
bot.launch();

app.get("/playlist-update", async (req, res) => {
    res.set({
        "Cache-Control": "no-cache",
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
    });
    res.flushHeaders();

    emitter.addListener("message", msg => {
        if (db.has(msg.message_id)) {
            const _msg = { user: msg.from.first_name, vidId: msg.text };
            res.write("retry: 10000\n\n");
            res.write(`data: ${JSON.stringify(_msg)}\n\n`);
        }
    });

    res.connection.on("close", () => {
        emitter.removeListener("message", () => console.log("listener removed"));
        bot.stop();
    })
});

app.get("/playlist", async (req, res) => {
    const data = await getMessages();
    playlist = setPlaylist(data);
    res.json(playlist);
});

app.get("/*", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

async function getMessages() {
    const messages = await getBotMessages();
    const prevDB = db.JSON();
    messages.forEach((el) => {
        addToPlaylist(el.message);
    });
    const curDB = db.JSON();
    db.sync({ ...prevDB, ...curDB });
    return { ...prevDB, ...curDB };
}

function addToPlaylist(message) {
    if (message?.entities && message?.entities[0].type === "url") {
        const data = {
            username: message.from.username,
            firstname: message.from.first_name,
            date: message.date,
            text: message.text,
            vidId: handleMultipleLinks(message.text).map((l) => extractVidId(l)),
        };
        updates.push(data);
        db.set(message.message_id, data);
    }
}

function setPlaylist(data) {
    const result = [];
    Object.values(data).forEach((v) => {
        if (v.vidId.length > 1) {
            v.vidId.forEach((id) => {
                if (id.length === 11) {
                    result.push({
                        username: v.username,
                        firstname: v.first_name || '',
                        vidId: id,
                        date: v.date,
                    });
                }
            });
        } else {
            if (v.vidId[0].length === 11) {
                result.push({
                    username: v.username,
                    firstname: v.first_name || '',
                    vidId: v.vidId[0],
                    date: v.date,
                });
            }
        }
    });
    return result;
}

async function getBotMessages() {
    // only works without webhook enabled
    const data = await got(`${telegramAPI}/getUpdates`);
    return JSON.parse(data.body).result;
}

function handleMultipleLinks(linksStr) {
    return linksStr.split(/[\s,]+/);
}

function extractVidId(url) {
    const match = url.match(
        /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/
    );
    return match ? match["1"] : url;
}

function writeFile(data) {
    fs.writeFile("results.json", data, function (err, data) {
        if (err) console.log(err);
        console.log("Successfully Written to File.");
    });
}

const listener = app.listen(process.env.PORT || 2222, function () {
    console.log("listening on port " + listener.address().port);
});
