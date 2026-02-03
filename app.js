document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

let currentDate = "";
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

const calendarDiv = document.getElementById('calendar');
const calendarTitle = document.getElementById('calendarTitle');

const calendarScreen = document.getElementById('calendarScreen');
const diaryScreen = document.getElementById('diaryScreen');
const analysisScreen = document.getElementById('analysisScreen');

const selectedDateH2 = document.getElementById('selectedDate');
const wordCountDiv = document.getElementById('wordCount');

const diaryText = document.getElementById('diaryText');
const charCountDiv = document.getElementById('charCount');
const englishWarning = document.getElementById('englishWarning');

const dateModal = document.getElementById('dateModal');
const modalDates = document.getElementById('modalDates');

const TARGET_WORDS = 50;

const emotionColors = {
  'Happy':'#2ecc71',
  'Sad':'#3498db',
  'Tired':'#f1c40f',
  'Excited':'#e67e22',
  'Angry':'#e74c3c',
  'Relaxed':'#9b59b6',
  'Confused':'#95a5a6',
  'Loved':'#ff6b81'
};

function initApp() {
    showCalendar();
    analyzeWords();
    updateWordCount();
    diaryText.addEventListener('input', updateWordCount);
}

// --- Calendar ---
function showCalendar(){
  const diaries = JSON.parse(localStorage.getItem('diaries')||'[]');
  calendarDiv.innerHTML='';

  calendarTitle.textContent=`${currentYear} / ${currentMonth+1}`;

  const firstDay = new Date(currentYear,currentMonth,1).getDay();
  const lastDate = new Date(currentYear,currentMonth+1,0).getDate();
  const today = new Date();

  // 空セル
  for(let i=0;i<firstDay;i++){
    const empty=document.createElement('div');
    empty.className='day';
    empty.style.visibility='hidden'; // 空白セル非表示
    calendarDiv.appendChild(empty);
  }

  // 日付
  for(let d=1; d<=lastDate; d++){
    const dayDiv = document.createElement('div');
    dayDiv.className='day';
    const dateObj = new Date(currentYear,currentMonth,d);
    const dateStr = dateObj.toLocaleDateString();

    dayDiv.textContent = d;

    // 今日の日付ハイライト
    if(today.getFullYear()===currentYear && today.getMonth()===currentMonth && today.getDate()===d){
      dayDiv.classList.add('today');
    }

    // 感情タグ色
    const diaryEntry = diaries.find(e=>e.date===dateStr);
    if(diaryEntry){
      const color = emotionColors[diaryEntry.emotion] || '#ffffff';
      dayDiv.style.backgroundColor = color;
      dayDiv.style.color = '#fff';
    } else {
      dayDiv.style.backgroundColor = '#ffffff';
      dayDiv.style.color = '#2c3e50';
    }

    dayDiv.onclick=()=>openDiary(dateStr);
    calendarDiv.appendChild(dayDiv);
  }
}

function prevMonth(){currentMonth--; if(currentMonth<0){currentMonth=11;currentYear--;} showCalendar();}
function nextMonth(){currentMonth++; if(currentMonth>11){currentMonth=0;currentYear++;} showCalendar();}

// --- Diary ---
function openDiary(dateStr){
  currentDate = dateStr;
  selectedDateH2.textContent = `Diary for ${dateStr}`;
  diaryText.value = getDiaryText(dateStr);
  document.getElementById('emotionTag').value = getDiaryEmotion(dateStr);
  updateWordCount();
  calendarScreen.style.display='none';
  analysisScreen.style.display='none';
  diaryScreen.style.display='block';
}

function backToCalendar(){
  diaryScreen.style.display='none';
  analysisScreen.style.display='none';
  dateModal.style.display='none';
  calendarScreen.style.display='block';
  showCalendar();
  analyzeWords();
}

// --- Word Count ---
function updateWordCount(){
  const text = diaryText.value.trim();
  const words = text === "" ? 0 : text.split(/\s+/).length;
  charCountDiv.innerHTML = `Goal: ${TARGET_WORDS} <span style="font-size:0.9rem; color:#555;">(${words} words written)</span>`;

  const hasJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf]/.test(text);
  englishWarning.style.display = hasJapanese ? 'block' : 'none';

  diaryText.style.backgroundColor = words >= TARGET_WORDS ? '#d1f2eb' : '#ffffff';
}

// --- Save Diary ---
function saveDiary(){
  const text = diaryText.value.trim();
  const emotion = document.getElementById('emotionTag').value;

  if(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf]/.test(text)){
    alert("English only! Cannot save diary containing Japanese.");
    return;
  }
  if(!text) return alert("Please write your diary in English.");

  let diaries = JSON.parse(localStorage.getItem('diaries')||'[]');
  const existingIndex = diaries.findIndex(e=>e.date===currentDate);
  if(existingIndex>=0){ diaries[existingIndex]={text, emotion, date: currentDate}; }
  else { diaries.push({text, emotion, date: currentDate}); }
  localStorage.setItem('diaries', JSON.stringify(diaries));
  alert("Diary saved!");
  backToCalendar();
}

// --- Analysis ---
function openAnalysis(){
  calendarScreen.style.display='none';
  diaryScreen.style.display='none';
  analysisScreen.style.display='block';
  analyzeWords();
}

// --- Analysis / Dictionary ---
function analyzeWords(){
  const diaries = JSON.parse(localStorage.getItem('diaries')||'[]');
  const allText = diaries.map(d=>d.text).join(' ');
  const words = allText.split(/\s+/).filter(w=>w.length>2);
  const freq = {};
  const wordDates = {};

  diaries.forEach(d=>{
    d.text.split(/\s+/).forEach(w=>{
      const lw = w.toLowerCase();
      if(!wordDates[lw]) wordDates[lw]=new Set();
      wordDates[lw].add(d.date);
    });
  });

  words.forEach(w=>freq[w.toLowerCase()] = (freq[w.toLowerCase()]||0)+1);
  const sortedWords = Object.keys(freq).sort();

  const letters = {};
  sortedWords.forEach(word=>{
    const letter = word[0].toUpperCase();
    if(!letters[letter]) letters[letter]=[];
    letters[letter].push({word, count: freq[word], dates: Array.from(wordDates[word])});
  });

  let html = '<div style="margin-bottom:10px;">';
  Object.keys(letters).forEach(letter=>{
    html += `<a href="#letter-${letter}" style="margin:0 6px; font-weight:bold; color:#34495e;">${letter}</a>`;
  });
  html += '</div>';

  Object.keys(letters).forEach(letter=>{
    html += `<h4 id="letter-${letter}" style="margin-top:15px; color:#1abc9c;">${letter}</h4>`;
    letters[letter].forEach(e=>{
      html += `<div style="margin-left:15px;">
        <span style="cursor:pointer; color:#1abc9c;" onclick="showDateModal('${e.word}')">- ${e.word}</span>: ${e.count} times
      </div>`;
    });
  });

  wordCountDiv.innerHTML = html;
}

// --- Modal ---
function showDateModal(word){
  const diaries = JSON.parse(localStorage.getItem('diaries')||'[]');
  const filtered = diaries.filter(d=>d.text.toLowerCase().includes(word.toLowerCase()));

  if(filtered.length===1){
    openDiary(filtered[0].date);
    return;
  }

  modalDates.innerHTML = '';
  filtered.forEach(d=>{
    const btn = document.createElement('button');
    btn.textContent = `${d.date} (${d.emotion})`;
    btn.className='nav-btn';
    btn.style.margin='4px';
    btn.style.backgroundColor = emotionColors[d.emotion] || '#34495e';
    btn.style.color = '#fff';
    btn.onclick = ()=>{ openDiary(d.date); closeModal(); };
    modalDates.appendChild(btn);
  });

  dateModal.style.display='flex';
}

function closeModal(){
  dateModal.style.display='none';
}

function getDiaryText(dateStr){ 
  const diaries=JSON.parse(localStorage.getItem('diaries')||'[]'); 
  const entry=diaries.find(e=>e.date===dateStr); 
  return entry?entry.text:""; 
}
function getDiaryEmotion(dateStr){ 
  const diaries=JSON.parse(localStorage.getItem('diaries')||'[]'); 
  const entry=diaries.find(e=>e.date===dateStr); 
  return entry?entry.emotion:"Happy"; 
}
