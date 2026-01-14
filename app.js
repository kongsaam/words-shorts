let words = [];
let currentIndex = 0;
let startY = 0;
let isDragging = false;

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

    // 글자 길이에 따른 폰트 크기 세밀 조정 (한 줄 유지 목적)
    let fontSize = "2.5rem";
    const len = word.word.length;
    
    if (len > 18) fontSize = "1.3rem";
    else if (len > 15) fontSize = "1.6rem";
    else if (len > 12) fontSize = "1.9rem";
    else if (len > 10) fontSize = "2.2rem";

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

function changeCard(direction) {
    if (direction === 'next' && currentIndex < words.length - 1) {
        currentIndex++;
    } else if (direction === 'prev' && currentIndex > 0) {
        currentIndex--;
    } else {
        return;
    }
    renderCard(currentIndex);
}

window.addEventListener('touchstart', e => {
    startY = e.touches[0].pageY;
}, { passive: true });

window.addEventListener('touchend', e => {
    const diff = startY - e.changedTouches[0].pageY;
    if (Math.abs(diff) > 50) {
        changeCard(diff > 0 ? 'next' : 'prev');
    }
}, { passive: true });

window.addEventListener('mousedown', e => {
    startY = e.pageY;
    isDragging = true;
});

window.addEventListener('mouseup', e => {
    if (!isDragging) return;
    const diff = startY - e.pageY;
    if (Math.abs(diff) > 50) {
        changeCard(diff > 0 ? 'next' : 'prev');
    }
    isDragging = false;
});

window.addEventListener('keydown', e => {
    if (e.keyCode === 32 || e.keyCode === 40) {
        e.preventDefault();
        changeCard('next');
    } else if (e.keyCode === 38) {
        e.preventDefault();
        changeCard('prev');
    } else if (e.keyCode === 13) {
        const inner = document.getElementById('inner-card');
        if (inner) inner.classList.toggle('flipped');
    }
});

loadWords();