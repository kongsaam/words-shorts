let words = [];
let currentIndex = 0;
let touchStartY = 0;
let isThrottled = false;

// [데이터 관리] 별표 및 암기 완료 데이터 로드
let starredIds = JSON.parse(localStorage.getItem('starredWords')) || [];
let learnedIds = JSON.parse(localStorage.getItem('learnedWords')) || [];
let showOnlyStarred = false;

const container = document.getElementById('card-container');

async function loadWords() {
    try {
        const response = await fetch('words.json');
        const data = await response.json();
        words = data.vocabulary_list;
        renderCard(currentIndex);
    } catch (e) {
        console.error("데이터 로드 실패", e);
    }
}

// [현재 보여줄 단어 목록 필터링]
function getVisibleWords() {
    if (!showOnlyStarred) return words;
    return words.filter(w => starredIds.includes(w.id));
}

function renderCard(index) {
    const visibleWords = getVisibleWords();
    const word = visibleWords[index];

    if (!word) {
        container.innerHTML = `<div class="card"><div class="front"><p>해당되는 단어가 없습니다.</p><button onclick="toggleFilter()">필터 해제</button></div></div>`;
        return;
    }

    const isStarred = starredIds.includes(word.id);
    const isLearned = learnedIds.includes(word.id); // 암기 여부 확인
    const total = visibleWords.length;

    // 폰트 크기 자동 조절 로직
    let fontSize = "2.8rem";
    if (word.word.length >= 10) fontSize = "2.0rem";
    if (word.word.length >= 15) fontSize = "1.5rem";

    container.innerHTML = `
        <div class="card">
            <div class="inner-card" id="inner-card">
                <div class="front">
                    <div class="top-controls">
                        <span class="icon-btn" onclick="event.stopPropagation(); speak('${word.word}')">🔊</span>
                        <span class="icon-btn star-icon ${isStarred ? 'active' : ''}" 
                              onclick="toggleStar(${word.id}, event)">★</span>
                    </div>

                    <span class="word-text" style="font-size: ${fontSize};">${word.word}</span>
                    
                    <div class="bottom-area">
                        <div class="bottom-filter" onclick="event.stopPropagation();">
                            <input type="checkbox" id="star-check" ${showOnlyStarred ? 'checked' : ''} onchange="toggleFilter()">
                            <label for="star-check">별표만</label>
                        </div>
                        
                        <div class="index-display">${index + 1} / ${total}</div>

                        <div class="memo-check" onclick="event.stopPropagation();">
                            <input type="checkbox" id="learn-check" ${isLearned ? 'checked' : ''} 
                                   onchange="toggleLearned(${word.id})">
                            <label for="learn-check">외움</label>
                        </div>
                    </div>
                </div>
                <div class="back">
                    <div class="top-controls">
                        <span style="visibility:hidden">🔊</span>
                        <span class="icon-btn star-icon ${isStarred ? 'active' : ''}" 
                              onclick="toggleStar(${word.id}, event)">★</span>
                    </div>
                    <div class="detail-item"><span class="label">MEANING</span>${word.meaning}</div>
                    <div class="detail-item"><span class="label">PART</span>${word.part}</div>
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

// [기능: 별표 토글 및 저장]
function toggleStar(id, event) {
    event.stopPropagation();
    const idx = starredIds.indexOf(id);
    if (idx > -1) {
        starredIds.splice(idx, 1);
    } else {
        starredIds.push(id);
    }
    localStorage.setItem('starredWords', JSON.stringify(starredIds));
    renderCard(currentIndex);
}

// [기능: 암기 완료 토글] - 기존 기능 복구 및 저장 로직 추가
function toggleLearned(id) {
    const idx = learnedIds.indexOf(id);
    if (idx > -1) {
        learnedIds.splice(idx, 1);
    } else {
        learnedIds.push(id);
    }
    localStorage.setItem('learnedWords', JSON.stringify(learnedIds));
    // UI 업데이트가 필요하면 renderCard를 다시 호출할 수 있으나, 체크박스 자체 상태는 유지됨
}

// [기능: 필터 토글]
function toggleFilter() {
    showOnlyStarred = !showOnlyStarred;
    currentIndex = 0; // 목록이 바뀌므로 첫 장으로 리셋
    renderCard(currentIndex);
}

function changeCard(direction) {
    const visibleWords = getVisibleWords();
    if (visibleWords.length === 0) return;

    if (direction === 'next') {
        currentIndex = (currentIndex === visibleWords.length - 1) ? 0 : currentIndex + 1;
    } else {
        currentIndex = (currentIndex === 0) ? visibleWords.length - 1 : currentIndex - 1;
    }
    renderCard(currentIndex);
}

function speak(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
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