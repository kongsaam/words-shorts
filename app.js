let words = [];
let currentIndex = 0;
let startY = 0;
let isDragging = false;
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

    let fontSize = "2.5rem";
    let letterSpacing = "normal";
    const len = word.word.length;
    
    if (len > 20) {
        fontSize = "1.2rem";
        letterSpacing = "-1px";
    } else if (len > 15) {
        fontSize = "1.4rem";
        letterSpacing = "-0.5px";
    } else if (len > 10) {
        fontSize = "1.8rem";
    }

    container.innerHTML = `
        <div class="card" id="current-card">
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
    if (direction === 'next' && currentIndex < words.length - 1) {
        currentIndex++;
    } else if (direction === 'prev' && currentIndex > 0) {
        currentIndex--;
    } else {
        return;
    }
    renderCard(currentIndex);
}

// [입력 제어]
// 1. 모바일 터치 (새로고침 방지 포함)
window.addEventListener('touchstart', e => { 
    startY = e.touches[0].pageY; 
}, { passive: false });

window.addEventListener('touchmove', e => {
    const currentY = e.touches[0].pageY;
    const diff = startY - currentY;

    // 카드가 맨 위에 있을 때 아래로 당기는 동작(diff < 0)이 감지되면 
    // 브라우저 새로고침만 딱 막고, 스와이프 계산은 계속 진행합니다.
    if (diff < 0 && window.scrollY <= 0) {
        if (e.cancelable) e.preventDefault();
    }
}, { passive: false });

window.addEventListener('touchend', e => {
    const diff = startY - e.changedTouches[0].pageY;
    // 이동 거리가 50px 이상일 때만 카드 변경 실행
    if (Math.abs(diff) > 50) {
        changeCard(diff > 0 ? 'next' : 'prev');
    }
}, { passive: false });

// 2. 마우스 클릭 드래그
window.addEventListener('mousedown', e => { startY = e.pageY; isDragging = true; });
window.addEventListener('mouseup', e => {
    if (!isDragging) return;
    const diff = startY - e.pageY;
    if (Math.abs(diff) > 50) changeCard(diff > 0 ? 'next' : 'prev');
    isDragging = false;
});

// 3. 키보드 (스페이스, 방향키, 엔터)
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

// 4. 마우스 휠
window.addEventListener('wheel', e => {
    if (isThrottled) return;
    if (Math.abs(e.deltaY) > 20) {
        changeCard(e.deltaY > 0 ? 'next' : 'prev');
        isThrottled = true;
        setTimeout(() => { isThrottled = false; }, 400);
    }
}, { passive: true });

loadWords();