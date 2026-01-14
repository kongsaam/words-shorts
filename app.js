let words = [];
let currentIndex = 0;
let startY = 0;
let isDragging = false;

const container = document.getElementById('card-container');

// 1. JSON 데이터 로드
async function loadWords() {
    try {
        const response = await fetch('words.json');
        const data = await response.json();
        words = data.vocabulary_list;
        renderCard(currentIndex);
    } catch (e) {
        console.error("데이터 로드 실패!", e);
        container.innerHTML = `<div style="color:white; padding:20px;">데이터를 불러오지 못했습니다. JSON 형식을 확인해주세요.</div>`;
    }
}

// 2. 카드 렌더링
function renderCard(index) {
    const word = words[index];
    if (!word) return;
    
    let fontSize = "2.5rem";
    if (word.word.length > 15) {
        fontSize = "1.5rem";
    } else if (word.word.length > 10) {
        fontSize = "1.8rem";
    }
    
    container.innerHTML = `
        <div class="card" id="current-card">
            <div class="inner-card" id="inner-card">
                <div class="front">
                    <span class="word-text">${word.word}</span>
                    <div class="controls">
                        <input type="checkbox" class="icon" title="암기 완료" onclick="event.stopPropagation()">
                        <span class="icon" onclick="event.stopPropagation(); speak('${word.word}')">🔊</span>
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

    // 터치/클릭 시 뒤집기 이벤트 연결
    document.getElementById('inner-card').addEventListener('click', function() {
        this.classList.toggle('flipped');
    });
}

// 3. 발음 기능 (Web Speech API)
function speak(text) {
    window.speechSynthesis.cancel(); // 현재 재생 중인 소리 중지
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8; // 속도를 살짝 늦춰서 명확하게 들리도록 설정
    window.speechSynthesis.speak(utterance);
}

// 4. 입력 제어 (스와이프, 드래그, 휠)
function handleSwipe(diff) {
    const threshold = 50; // 50px 이상 움직여야 다음 단어로 인식
    if (Math.abs(diff) > threshold) {
        if (diff > 0 && currentIndex < words.length - 1) {
            currentIndex++; // 위로 올리면 다음 단어
            renderCard(currentIndex);
        } else if (diff < 0 && currentIndex > 0) {
            currentIndex--; // 아래로 내리면 이전 단어
            renderCard(currentIndex);
        }
    }
}

// 모바일 터치 이벤트
window.addEventListener('touchstart', e => {
    startY = e.touches[0].pageY;
}, { passive: true });

window.addEventListener('touchend', e => {
    handleSwipe(startY - e.changedTouches[0].pageY);
}, { passive: true });

// PC 마우스 드래그 이벤트
window.addEventListener('mousedown', e => {
    startY = e.pageY;
    isDragging = true;
});

window.addEventListener('mouseup', e => {
    if (!isDragging) return;
    handleSwipe(startY - e.pageY);
    isDragging = false;
});

// PC 마우스 휠 및 터치패드 스크롤 이벤트
let wheelTimeout;
window.addEventListener('wheel', e => {
    // 휠의 경우 너무 빠르게 넘어가지 않도록 디바운싱 처리
    clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => {
        handleSwipe(e.deltaY);
    }, 50);
}, { passive: true });

// 앱 시작
loadWords();