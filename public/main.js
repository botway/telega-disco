const appBody = document.getElementsByTagName("body")[0];
const container = document.getElementById("container");
const vidA = document.getElementById("vid-a");
const vidB = document.getElementById("vid-b");
const nextOverlay = document.getElementById("next-overlay");
const nextBtn = document.getElementById("next-btn");
const userOverlay = document.getElementById("submit-notification");
const userNameBox = document.getElementById("user-name-overlay");

nextOverlay.classList.add("fade");
nextOverlay.style.display = "none";

const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

const playerW = container.clientWidth;
let playerA = "player-a";
let playerB = "player-b";
let activePlayer = playerA;
const FADEOUT_TIME = 15;

let playlist;
let currVid;
let nextVid;
let isFading = false;

vidB.classList.toggle("fade");

const updateSrc = new EventSource("/playlist-update");
updateSrc.addEventListener("message", (message) => {
    if (event.data) {
        const result = JSON.parse(event.data);
        userOverlay.classList.add("fade-in");
        userNameBox.innerHTML = `${result.user} just added a track`;
        playlist = setTimeout(() => {
            userOverlay.classList.remove("fade-in");
        }, 4000);
    }
});

window.addEventListener("mousemove", (event) => {
    if (!isFading) handleNextOverlay(event);
});

nextBtn.addEventListener("mousemove", (event) => {
    if (!isFading) handleNextOverlay(event);
});

nextBtn.addEventListener("click", (event) => {
    triggerFadeNext();
});

nextBtn.addEventListener("keydown", (e) => {
    if (e.code === "KeyN") triggerFadeNext();
});

async function onYouTubeIframeAPIReady() {
    playlist = await getPlaylist();
    playerA = initPlayer(await popFromPlaylist(), playerW, playerA);
    playerB = initPlayer(await popFromPlaylist(), playerW, playerB);

    setTimeListener(playerA);
    setTimeListener(playerB);
}

function setTimeListener(player) {
    const iframeWindow = player.getIframe().contentWindow;
    window.addEventListener("message", function (event) {
        if (event.source === iframeWindow) {
            const data = JSON.parse(event.data);
            if (
                data.event === "infoDelivery" &&
                data.info &&
                data.info.currentTime
            ) {
                const time = Math.floor(data.info.currentTime);
                let curVidPlaybackTime = 0;
                if (time !== curVidPlaybackTime) {
                    curVidPlaybackTime = time;
                    if (
                        player.getDuration() - curVidPlaybackTime <=
                        FADEOUT_TIME + 5 &&
                        !isFading
                    ) {
                        if (player.v.id === "player-a") {
                            fadePlayers(vidA, vidB, playerA, playerB, FADEOUT_TIME);
                            isFading = true;
                        } else {
                            fadePlayers(vidB, vidA, playerB, playerA, FADEOUT_TIME);
                            isFading = true;
                        }
                        nextOverlay.style.display = "none";
                    }
                }
            }
        }
    });
}

async function fadePlayers(
    curVid,
    nextVid,
    curPlayer,
    nextPlayer,
    duration
) {
    nextOverlay.classList.add("fade");
    curVid.classList.toggle("fade");
    nextPlayer.playVideo();
    setTimeout(() => { nextVid.classList.toggle("fade") }, 2000);
    const increment = 100 / ((duration * 1000) / 16);
    let fadeOutVol = 100;
    let fadeInVol = 0;
    const timer = setInterval(() => {
        if (fadeOutVol <= 1) {
            clearInterval(timer);
            curPlayer.stopVideo();
            setTimeout(async () => {
                curPlayer.loadVideoById(await popFromPlaylist());
                curPlayer.stopVideo();
            }, 1000);
            nextPlayer.setVolume(100);
            curPlayer.setVolume(0);
            nextVid.style.zIndex = 2;
            curVid.style.zIndex = 1;
            activePlayer = nextPlayer;
        }
        fadeOutVol -= increment;
        fadeInVol += increment;
        curPlayer.setVolume(Math.max(fadeOutVol, 0));
        nextPlayer.setVolume(Math.min(fadeInVol, 100));
    }, 16);
}

function triggerFadeNext() {
    if (activePlayer.v?.id === "player-a") {
        fadePlayers(vidA, vidB, playerA, playerB, FADEOUT_TIME);
        isFading = true;
    } else {
        fadePlayers(vidB, vidA, playerB, playerA, FADEOUT_TIME);
        isFading = true;
    }
}

async function getPlaylist() {
    const res = await fetch("/playlist");
    return res.json();
}

function initPlayer(vidId, playerWidth, targetPlayer) {
    return new YT.Player(targetPlayer, {
        videoId: vidId,
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange,
        },
    });
}

async function onPlayerReady(event) {
    if (event.target.v.id === "player-a") {
        playerA.setVolume(100);
        activePlayer = playerA;
    }
    if (event.target.v.id === "player-b") {
        playerB.setVolume(100);
    }
}

async function onPlayerStateChange(event) {
    if (event.data === 5) {
        handleNextOverlay(event);
        isFading = false;
    }
}

async function popFromPlaylist() {
    if (!playlist.length) playlist = await getPlaylist();
    const pick = rndInt(0, playlist.length - 1);
    const pickedVid = playlist[pick].vidId;
    playlist.splice(pick, 1);
    return pickedVid;
}

let fadeOverlayTimeout;
function handleNextOverlay(event) {
    clearTimeout(fadeOverlayTimeout);
    nextOverlay.classList.remove("fade");
    nextOverlay.style.display = "flex";
    nextBtn.focus();
    fadeOverlayTimeout = setTimeout(() => {
        nextOverlay.classList.add("fade");
    }, 3000);
}

function rndInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}