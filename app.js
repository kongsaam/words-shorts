let words = [];
let currentIndex = 0;
let startY = 0;

const container = document.getElementById('card-container');

// 1. JSON 데이터 로드
async function loadWords() {
    try {
        const response = await fetch('words.json');
        const data = await response.json();
        words = data.vocabulary_list;
        renderCard(currentIndex);
    } catch (e) { console.error("데이터 로드 실패!", e); }
}

// 2. 카드 렌더링
function renderCard(index) {
    const word = words[index];
    container.innerHTML = `
        <div class="card" id="current-card">
            <div class="inner-card" onclick="this.classList.toggle('flipped')">
                <div class="front">
                    <span class="word-text">${word.word}</span>
                    <div class="controls" onclick="event.stopPropagation()">
                        <input type="checkbox" class="icon" title="암기 완료">
                        <span class="icon" onclick="speak('${word.word}')">🔊</span>
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
}

// 3. 발음 기능
function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}

// 4. 스와이프 로직 (위아래)
window.addEventListener('touchstart', e => startY = e.touches[0].pageY);
window.addEventListener('touchend', e => {
    let diff = startY - e.changedTouches[0].pageY;
    if (Math.abs(diff) > 50) { // 50px 이상 움직였을 때
        if (diff > 0 && currentIndex < words.length - 1) currentIndex++; // 위로 스와이프 (다음)
        else if (diff < 0 && currentIndex > 0) currentIndex--; // 아래로 스와이프 (이전)
        renderCard(currentIndex);
    }
});

loadWords();