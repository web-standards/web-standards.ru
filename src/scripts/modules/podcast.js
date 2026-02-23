const player = document.querySelector('.player__audio');
const backButton = document.querySelector('.player__rewind--back');
const forwardButton = document.querySelector('.player__rewind--forward');

/**
 * Выделяет из строки временные метки вида `00:14:30` или `14:30`.
 *
 * @param {string} string
 * @returns {string | null}
 */
function matchTimecode(string) {
    const match = string.match(/.+#(\d\d:\d\d(:\d\d)?)$/);
    return match && match[1] ? match[1] : null;
}

/**
 * Преобразует временные метки вида `00:14:30` или `14:30` в количество секунд.
 *
 * @param {string} time
 * @returns {number}
 */
function parseTimecode(time) {
    return time.split(':').reduceRight((acc, item, index, items) => {
        return acc + parseFloat(item) * Math.pow(60, items.length - 1 - index);
    }, 0);
}

/**
 * @param {number} time
 * @returns {void}
 */
function setTime(time) {
    player.currentTime = time;
}

/** Перемотка аудио назад на `seconds` секунд
 * @param seconds количество секунд
 */
function rewindAudio(seconds) {
    if (player.duration && !isNaN(player.duration)) {
        const currentTime = player.currentTime;
        const targetTime = currentTime + seconds;

        player.currentTime = targetTime;
    }
}

function handlePassedTimecode() {
    const passed = matchTimecode(document.URL);

    if (passed) {
        setTime(parseTimecode(passed));
    }
}

function initAnchor() {
    window.addEventListener('hashchange', () => {
        handlePassedTimecode();
    });
}

if (player) {
    if (player.networkState === HTMLMediaElement.NETWORK_LOADING) {
        player.addEventListener('loadedmetadata', handlePassedTimecode);
    } else {
        handlePassedTimecode();
    }
    initAnchor();

    backButton.addEventListener('click', () => {
        rewindAudio(-10);
    });

    forwardButton.addEventListener('click', () => {
        rewindAudio(10);
    });
}
