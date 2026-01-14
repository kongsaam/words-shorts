let words = [];
let currentIndex = 0;
let startY = 0;
let isDragging = false;

// 터치패드 및 휠 최적화를 위한 변수
let wheelAccumulator = 0;
let isThrottled = false;

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
        container.innerHTML = `<div style="color:white; padding:20px;">데이터를 불러오지 못했습니다. Live Server로 실행 중인지 확인하세요.</div>`;
    }
}

// 2. 카드 렌더링 (글자 길이에 따른 자동 폰트 조절 포함)
function renderCard(index) {
    const word = words[index];
    if (!word) return;

    // 글자 길이에 따른 폰트 크기 계산
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
                    <span class="word-text" style="font-size: ${fontSize}">${word.word}</span>
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

    document.getElementById('inner-card').addEventListener('click', function() {
        this.classList.toggle('flipped');
    });
}

// 3. 발음 기능
function speak(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
}

// 4. 입력 제어 통합 처리 (스와이프, 드래그, 휠)
function handleSwipe(diff) {
    const threshold = 30; // 인식 문턱값
    if (Math.abs(diff) > threshold) {
        if (diff > 0 && currentIndex < words.length - 1) {
            currentIndex++;
        } else if (diff < 0 && currentIndex > 0) {
            currentIndex--;
        }
        renderCard(currentIndex);
    }
}

// [모바일 터치]
window.addEventListener('touchstart', e => {
    startY = e.touches[0].pageY;
}, { passive: true });

window.addEventListener('touchend', e => {
    handleSwipe(startY - e.changedTouches[0].pageY);
}, { passive: true });

// [PC 마우스 드래그]
window.addEventListener('mousedown', e => {
    startY = e.pageY;
    isDragging = true;
});

window.addEventListener('mouseup', e => {
    if (!isDragging) return;
    handleSwipe(startY - e.pageY);
    isDragging = false;
});

// [PC 휠 & 터치패드 트랙패드]
window.addEventListener('wheel', e => {
    // 브라우저 기본 스크롤 방지 (앱처럼 작동하게 함)
    e.preventDefault();
    
    // 터치패드의 미세한 움직임을 누적
    wheelAccumulator += e.deltaY;

    if (!isThrottled) {
        // 누적값이 일정 수준 이상일 때만 실행
        if (Math.abs(wheelAccumulator) > 50) {
            handleSwipe(wheelAccumulator);
            wheelAccumulator = 0; // 누적값 초기화
            
            // 연속 실행 방지 (0.5초 동안 잠금)
            isThrottled = true;
            setTimeout(() => {
                isThrottled = false;
            }, 500);
        }
    }
}, { passive: false });

loadWords();