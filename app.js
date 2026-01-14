let words = [];
let currentIndex = 0;
let startY = 0;
let isDragging = false;
let wheelAccumulator = 0;
let isThrottled = false;

const container = document.getElementById('card-container');

async function loadWords() {
    try {
        const response = await fetch('words.json');
        const data = await response.json();
        words = data.vocabulary_list;
        renderCard(currentIndex);
    } catch (e) {
        console.error("로드 실패", e);
    }
}

function renderCard(index) {
    const word = words[index];
    if (!word) return;

    let fontSize = "2.5rem";
    if (word.word.length > 15) fontSize = "1.5rem";
    else if (word.word.length > 10) fontSize = "1.8rem";

    container.innerHTML = `
        <div class="card" id="current-card">
            <div class="inner-card" id="inner-card">
                <div class="front">
                    <span class="word-text" style="font-size: ${fontSize}">${word.word}</span>
                    <div class="controls">
                        <span class="icon" onclick="event.stopPropagation(); speak('${word.word}')">🔊</span>
                        <input type="checkbox" class="icon" title="암기 완료" onclick="event.stopPropagation()">
                    </div>
                </div>
                <div class="back">
                    <div class="detail-item"><span class="label">PART</span>${word.part}</div>
                    <div class="detail-item"><span class="label">MEANING</span>${word.meaning}</div>
                    <div class="detail-item"><span class="label">PARAPHRASING</span>${word.paraphrasing.join(', ')}</div>
                    <div class="detail-item"><span class="label">COLLOCATIONS</span>${word.collocations.join('<br>')}</div>
                    <div class="detail-item"><span class="label">TIP</span>${word.tip}</div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('inner-card').addEventListener('click', function() {
        this.classList.toggle('flipped');
    });
}

function speak(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
}

function handleSwipe(diff) {
    const threshold = 30;
    if (Math.abs(diff) > threshold) {
        if (diff > 0 && currentIndex < words.length - 1) {
            currentIndex++;
        } else if (diff < 0 && currentIndex > 0) {
            currentIndex--;
        }
        renderCard(currentIndex);
    }
}

// [모바일 터치 수정] passive: false로 설정하여 스와이프 안정성 확보
window.addEventListener('touchstart', e => {
    startY = e.touches[0].pageY;
}, { passive: true });

window.addEventListener('touchend', e => {
    const endY = e.changedTouches[0].pageY;
    handleSwipe(startY - endY);
}, { passive: true });

// [PC 마우스]
window.addEventListener('mousedown', e => {
    startY = e.pageY;
    isDragging = true;
});

window.addEventListener('mouseup', e => {
    if (!isDragging) return;
    handleSwipe(startY - e.pageY);
    isDragging = false;
});

// [휠/터치패드]
window.addEventListener('wheel', e => {
    if (Math.abs(e.deltaY) < 5) return; // 미세 진동 무시
    
    wheelAccumulator += e.deltaY;
    if (!isThrottled) {
        if (Math.abs(wheelAccumulator) > 50) {
            handleSwipe(wheelAccumulator);
            wheelAccumulator = 0;
            isThrottled = true;
            setTimeout(() => { isThrottled = false; }, 400); // 락 타임 살짝 단축
        }
    }
}, { passive: true });

loadWords();