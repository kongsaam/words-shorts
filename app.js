let words = [];
let currentIndex = 0;
let touchStartY = 0;
let isDragging = false;
let startY = 0;
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

    const total = words.length;
    const currentDisplay = index + 1;

    // [폰트 크기 자동 조절 로직 - 강화형]
    let fontSize = "2.8rem"; // 기본 크기
    let letterSpacing = "normal";
    const wordLength = word.word.length;

    if (wordLength > 18) {
        fontSize = "1.3rem"; // 매우 긴 단어
        letterSpacing = "-1px";
    } else if (wordLength > 13) {
        fontSize = "1.6rem"; // 긴 단어
        letterSpacing = "-0.5px";
    } else if (wordLength >= 10) {
        fontSize = "2.0rem"; // 10자 이상일 때부터 폰트 줄임 시작
        letterSpacing = "-0.2px";
    }

    container.innerHTML = `
        <div class="card">
            <div class="inner-card" id="inner-card">
                <div class="front">
                    <span class="word-text" style="font-size: ${fontSize}; letter-spacing: ${letterSpacing};">
                        ${word.word}
                    </span>
                    <div class="controls">
                        <span class="icon" onclick="event.stopPropagation(); speak('${word.word}')">🔊</span>
                        <div class="index-display">${currentDisplay} / ${total}</div>
                        <input type="checkbox" class="icon" title="암기 완료" onclick="event.stopPropagation()">
                    </div>
                </div>
                <div class="back">
                    <div class="detail-item"><span class="label">PART</span>${word.part}</div>
                    <div class="detail-item"><span class="label">MEANING</span>${word.meaning}</div>
                    <div class="detail-item"><span class="label">PARAPHRASING</span>${word.paraphrasing.join(', ')}</div>
                    <div class="detail-item"><span class="label">COLLOCATIONS</span>${word.collocations.join('<br>')}</div>
                    <div class="detail-item"><span class="label">TIP</span>${word.tip}</div>
                    <div class="controls">
                         <span style="visibility:hidden" class="icon">🔊</span>
                         <div class="index-display">${currentDisplay} / ${total}</div>
                         <span style="visibility:hidden" class="icon">✔️</span>
                    </div>
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
    if (direction === 'next') {
        currentIndex = (currentIndex === words.length - 1) ? 0 : currentIndex + 1;
    } else if (direction === 'prev') {
        currentIndex = (currentIndex === 0) ? words.length - 1 : currentIndex - 1;
    } 
    renderCard(currentIndex);
}

// [모바일 터치 제어 - 클릭 방해 없는 새로고침 방지]
window.addEventListener('touchstart', e => { 
    touchStartY = e.touches[0].pageY; 
}, { passive: true });

window.addEventListener('touchmove', e => {
    const currentY = e.touches[0].pageY;
    const diff = touchStartY - currentY;
    if (e.target.closest('.back')) return;
    if (diff < 0 && window.scrollY <= 0) {
        if (e.cancelable) e.preventDefault();
    }
}, { passive: false });

window.addEventListener('touchend', e => {
    const diff = touchStartY - e.changedTouches[0].pageY;
    if (Math.abs(diff) > 50) {
        changeCard(diff > 0 ? 'prev' : 'next');
    }
}, { passive: true });

// [기타 입력 제어]
window.addEventListener('mousedown', e => { startY = e.pageY; isDragging = true; });
window.addEventListener('mouseup', e => {
    if (!isDragging) return;
    const diff = startY - e.pageY;
    if (Math.abs(diff) > 50) changeCard(diff > 0 ? 'prev' : 'next');
    isDragging = false;
});

window.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.key === 'ArrowDown') {
        e.preventDefault();
        changeCard('next');
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        changeCard('prev');
    } else if (e.key === 'Enter') {
        const inner = document.getElementById('inner-card');
        if (inner) inner.classList.toggle('flipped');
    }
});

window.addEventListener('wheel', e => {
    if (isThrottled) return;
    if (Math.abs(e.deltaY) > 20) {
        changeCard(e.deltaY > 0 ? 'next' : 'prev');
        isThrottled = true;
        setTimeout(() => { isThrottled = false; }, 400);
    }
}, { passive: true });

loadWords();