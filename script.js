// ==========================================
// 1. 設定基礎參數
// ==========================================
const maxCats = 3;
const pricePerCatPerPeriod = 50000;

// ==========================================
// 2. 自動計算金額與更新畫面
// ==========================================
function calculateTotal() {
    const catsChecked = document.querySelectorAll('input[name="cats"]:checked').length;
    const periodsChecked = document.querySelectorAll('input[name="time"]:checked').length;
    
    // 計算總額
    const total = catsChecked * periodsChecked * pricePerCatPerPeriod;
    const formattedTotal = total.toLocaleString();

    // 更新「上方」金額 (預計指名費用)
    const topTotal = document.getElementById('top-total');
    if (topTotal) topTotal.innerText = formattedTotal;

    // 更新「下方」收據框細節
    if (document.getElementById('display-periods')) 
        document.getElementById('display-periods').innerText = periodsChecked;
    
    if (document.getElementById('display-cats')) 
        document.getElementById('display-cats').innerText = catsChecked;
    
    if (document.getElementById('total-amount')) 
        document.getElementById('total-amount').innerText = formattedTotal;
}

// ==========================================
// 3. 控制貓咪區塊的顯示與隱藏
// ==========================================
function toggleCatSection() {
    const catSection = document.getElementById('cat-selection-section');
    const selectedPeriods = document.querySelectorAll('input[name="time"]:checked').length;

    if (catSection) {
        if (selectedPeriods > 0) {
            // 有選時段：顯示貓咪區
            catSection.style.display = 'block';
            // 稍微延遲讓透明度動畫生效
            setTimeout(() => { catSection.style.opacity = '1'; }, 10);
        } else {
            // 沒選時段：隱藏貓咪區
            catSection.style.opacity = '0';
            setTimeout(() => { 
                catSection.style.display = 'none'; 
                // 隱藏時順便清空已選貓咪，避免沒選時段卻有金額
                document.querySelectorAll('input[name="cats"]').forEach(c => c.checked = false);
                calculateTotal();
            }, 400); // 這裡的時間要跟 CSS 的 transition 一致
        }
    }
}

// ==========================================
// 4. 初始化監聽器
// ==========================================
function setupListeners() {
    // A. 監聽時段勾選 (觸發顯示貓咪 & 計算金額)
    document.querySelectorAll('input[name="time"]').forEach(cb => {
        cb.addEventListener('change', () => {
            toggleCatSection();
            calculateTotal();
        });
    });

    // B. 監聽貓咪勾選 (觸發限選 & 計算金額)
    document.querySelectorAll('input[name="cats"]').forEach(cb => {
        cb.addEventListener('change', function() {
            const checkedCount = document.querySelectorAll('input[name="cats"]:checked').length;
            if (checkedCount > maxCats) {
                this.checked = false;
                alert('抱歉，每筆預約最多只能指名 3 位貓咪喔！');
            }
            calculateTotal();
        });
    });
}

// ==========================================
// 5. 頁面啟動
// ==========================================
window.onload = function() {
    setupListeners();
    toggleCatSection(); // 初始檢查一次（預設應為隱藏）
    calculateTotal();   // 初始金額 0
};
// 修改表單提交邏輯
document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault(); // 防止網頁重新整理
    
    // 1. 抓取所有選中的資料
    const selectedDate = document.querySelector('input[name="date"]:checked').value;
    const selectedTimes = Array.from(document.querySelectorAll('input[name="time"]:checked')).map(cb => cb.value).join(', ');
    const selectedCats = Array.from(document.querySelectorAll('input[name="cats"]:checked')).map(cb => cb.value).join(', ');
    const contactInfo = document.getElementById('contact-info').value;
    const notes = document.getElementById('notes').value;
    const totalPrice = document.getElementById('total-amount').innerText;

    // 2. 顯示傳送中狀態
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.innerText = "傳送中...";
    submitBtn.disabled = true;

    // 3. 使用 FormData 傳送給 Google Apps Script
    const formData = new FormData();
    formData.append('date', selectedDate);
    formData.append('time', selectedTimes);
    formData.append('cats', selectedCats);
    formData.append('contact', contactInfo);
    formData.append('notes', notes);
    formData.append('totalPrice', totalPrice);

    // 替換成你剛才部署的網址
    const GAS_URL = "https://script.google.com/macros/s/AKfycbwTdX3BGRk4KtlSRdHfFxMTSjYcYS-kuSMWftRpO726uTI1srZjkz5L2w9okBlD7OwmAQ/exec"; 

    fetch(GAS_URL, {
        method: 'POST',
        body: formData,
        mode: 'no-cors' // 避免瀏覽器 CORS 安全性報錯
    })
    .then(() => {
        alert('預約成功！我們會盡快與您聯絡。');
        submitBtn.innerText = "提交預約";
        submitBtn.disabled = false;
        // 成功後可以考慮重置表單
        // location.reload(); 
    })
    .catch(error => {
        console.error('Error!', error.message);
        alert('預約失敗，請檢查網路或聯繫管理員。');
        submitBtn.disabled = false;
    });
});