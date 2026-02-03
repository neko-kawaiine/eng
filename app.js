let currentDate = "";
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
const TARGET_WORDS = 50;
const emotionColors = {
  'Happy':'#2ecc71','Sad':'#3498db','Tired':'#f1c40f','Excited':'#e67e22',
  'Angry':'#e74c3c','Relaxed':'#9b59b6','Confused':'#95a5a6','Loved':'#ff6b81'
};

window.onload = () => {
  drawCalendar();
  document.getElementById('diaryText').addEventListener('input', updateWordCount);
}

function drawCalendar(){
  const calendarDiv = document.getElementById('calendar');
  const calendarTitle = document.getElementById('calendarTitle');
  calendarDiv.innerHTML='';
  calendarTitle.textContent=`${currentYear}/${currentMonth+1}`;

  const diaries = JSON.parse(localStorage.getItem('diaries')||'[]');
  const firstDay = new Date(currentYear,currentMonth,1).getDay();
  const lastDate = new Date(currentYear,currentMonth+1,0).getDate();
  const today = new Date();

  for(let i=0;i<firstDay;i++){
    const empty = document.createElement('div');
    empty.style.visibility='hidden';
    calendarDiv.appendChild(empty);
  }

  for(let d=1; d<=lastDate; d++){
    const dayDiv = document.createElement('div');
    dayDiv.textContent=d;
    const dateObj = new Date(currentYear,currentMonth,d);
    const dateStr = dateObj.toLocaleDateString();

    if(today.getFullYear()===currentYear && today.getMonth()===currentMonth && today.getDate()===d){
      dayDiv.classList.add('today');
    }

    const diaryEntry = diaries.find(e=>e.date===dateStr);
    if(diaryEntry){
      dayDiv.style.backgroundColor = emotionColors[diaryEntry.emotion] || '#fff';
      dayDiv.style.color='#fff';
    }

    dayDiv.onclick = ()=>openDiary(dateStr);
    calendarDiv.appendChild(dayDiv);
  }
}

function prevMonth(){currentMonth--; if(currentMonth<0){currentMonth=11;currentYear--;} drawCalendar();}
function nextMonth(){currentMonth++; if(currentMonth>11){currentMonth=0;currentYear++;} drawCalendar();}

function openDiary(dateStr){
  currentDate = dateStr;
  document.getElementById('selectedDate').textContent = `Diary for ${dateStr}`;
  const diaries = JSON.parse(localStorage.getItem('diaries')||'[]');
  const entry = diaries.find(e=>e.date===dateStr);
  document.getElementById('diaryText').value = entry ? entry.text : '';
  document.getElementById('emotionTag').value = entry ? entry.emotion : 'Happy';
  updateWordCount();
  document.getElementById('calendarScreen').style.display='none';
  document.getElementById('analysisScreen').style.display='none';
  document.getElementById('diaryScreen').style.display='block';
}

function backToCalendar(){
  document.getElementById('diaryScreen').style.display='none';
  document.getElementById('analysisScreen').style.display='none';
  document.getElementById('dateModal').style.display='none';
  document.getElementById('calendarScreen').style.display='block';
  drawCalendar();
  renderAnalysis();
}

function updateWordCount(){
  const text = document.getElementById('diaryText').value.trim();
  const words = text? text.split(/\s+/).length : 0;
  document.getElementById('wordCountDisplay').innerHTML=`Goal: ${TARGET_WORDS} <span style="font-size:0.9rem;color:#555;">(${words} words written)</span>`;
  const hasJapanese = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf]/.test(text);
  document.getElementById('englishWarning').style.display = hasJapanese ? 'block':'none';
  document.getElementById('diaryText').style.backgroundColor = words>=TARGET_WORDS ? '#d1f2eb':'#fff';
}

function saveDiary(){
  const text = document.getElementById('diaryText').value.trim();
  const emotion = document.getElementById('emotionTag').value;
  if(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9faf]/.test(text)){alert("English only! Cannot save diary containing Japanese."); return;}
  if(!text){alert("Please write your diary in English."); return;}
  const diaries = JSON.parse(localStorage.getItem('diaries')||'[]');
  const index = diaries.findIndex(e=>e.date===currentDate);
  if(index>=0) diaries[index]={text,emotion,date:currentDate};
  else diaries.push({text,emotion,date:currentDate});
  localStorage.setItem('diaries',JSON.stringify(diaries));
  alert("Diary saved!");
  backToCalendar();
}

// Analysis ABC dictionary + date jump
function openAnalysis(){
  document.getElementById('calendarScreen').style.display='none';
  document.getElementById('diaryScreen').style.display='none';
  document.getElementById('analysisScreen').style.display='block';
  renderAnalysis();
}

function renderAnalysis(){
  const diaries = JSON.parse(localStorage.getItem('diaries')||'[]');
  const wordsArr = diaries.map(d=>d.text).join(' ').split(/\s+/).filter(w=>w.length>2);
  const freq = {};
  const wordDates = {};
  diaries.forEach(d=>{d.text.split(/\s+/).forEach(w=>{const lw=w.toLowerCase();if(!wordDates[lw]) wordDates[lw]=new Set();wordDates[lw].add(d.date);});});
  wordsArr.forEach(w=>freq[w.toLowerCase()] = (freq[w.toLowerCase()]||0)+1);

  const sorted = Object.keys(freq).sort();
  const letters = {};
  sorted.forEach(word=>{
    const letter = word[0].toUpperCase();
    if(!letters[letter]) letters[letter]=[];
    letters[letter].push({word,count:freq[word],dates:Array.from(wordDates[word])});
  });

  let html = '<div style="margin-bottom:10px;">';
  Object.keys(letters).forEach(letter=>{
    html += `<a href="#letter-${letter}" style="margin:0 6px;font-weight:bold;color:#34495e;">${letter}</a>`;
  });
  html += '</div>';

  Object.keys(letters).forEach(letter=>{
    html += `<h4 id="letter-${letter}" style="margin-top:15px;color:#1abc9c;">${letter}</h4>`;
    letters[letter].forEach(e=>{
      html += `<div style="margin-left:15px;"><span style="cursor:pointer;color:#1abc9c;" onclick="showDateModal('${e.word}')">- ${e.word}</span>: ${e.count} times</div>`;
    });
  });

  document.getElementById('wordAnalysis').innerHTML=html;
}

function showDateModal(word){
  const diaries = JSON.parse(localStorage.getItem('diaries')||'[]');
  const filtered = diaries.filter(d=>d.text.toLowerCase().includes(word.toLowerCase()));
  if(filtered.length===1){openDiary(filtered[0].date); return;}
  const modalDates = document.getElementById('modalDates');
  modalDates.innerHTML='';
  filtered.forEach(d=>{
    const btn = document.createElement('button');
    btn.textContent = `${d.date} (${d.emotion})`;
    btn.className='nav-btn';
    btn.style.margin='4px';
    btn.style.backgroundColor = emotionColors[d.emotion]||'#34495e';
    btn.style.color='#fff';
    btn.onclick = ()=>{openDiary(d.date); closeModal();};
    modalDates.appendChild(btn);
  });
  document.getElementById('dateModal').style.display='flex';
}

function closeModal(){document.getElementById('dateModal').style.display='none';}
