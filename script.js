// ==========================================
// 1. 基礎參數設定
// ==========================================
const maxCats = 3; 
const pricePerCatPerPeriod = 50000;
const GAS_URL = "https://script.google.com/macros/s/AKfycbzV6P53CQYb4EobtaWTpkthUGXUgTvATD4QXLvRxIwThlGjIxDHDnWR0y-cEhlgMDeDxw/exec";

// ==========================================
// 2. 自動計算金額邏輯
// ==========================================
function calculateTotal() {
    const catsChecked = document.querySelectorAll('input[name="cats"]:checked').length;
    const periodsChecked = document.querySelectorAll('input[name="time"]:checked').length;
    
    // 計算總額 (貓咪數 * 時段數 * 50,000)
    const total = catsChecked * periodsChecked * pricePerCatPerPeriod;
    const formattedTotal = total.toLocaleString();

    // 更新「上方」預計費用 (id="top-total")
    const topTotal = document.getElementById('top-total');
    if (topTotal) topTotal.innerText = formattedTotal;

    // 更新「下方」收據框 (display-periods, display-cats, total-amount)
    if (document.getElementById('display-periods')) 
        document.getElementById('display-periods').innerText = periodsChecked;
    
    if (document.getElementById('display-cats')) 
        document.getElementById('display-cats').innerText = catsChecked;
    
    if (document.getElementById('total-amount')) 
        document.getElementById('total-amount').innerText = formattedTotal;
}

// ==========================================
// 4. 處理表單提交 (方案 A)
// ==========================================
async function handleFormSubmit(e) {
    e.preventDefault(); 
    console.log("開始檢查資料...");

    const submitBtn = document.getElementById('submitBtn');
    
    // 1. 檢查日期
    const dateInput = document.querySelector('input[name="date"]:checked');
    if (!dateInput) {
        alert("請選擇預約日期！");
        return;
    }

    // 2. 檢查聯絡方法
    const contactInput = document.getElementById('contact-info');
    if (!contactInput) {
        console.error("找不到 ID 為 contact-info 的輸入框，請檢查 HTML！");
        alert("系統設定錯誤：找不到聯絡方法輸入框");
        return;
    }
    if (contactInput.value.trim() === "") {
        alert("請填寫聯絡方法（Discord/Threads）！");
        return;
    }

    // 3. 檢查時段與貓咪
    const selectedTimes = Array.from(document.querySelectorAll('input[name="time"]:checked')).map(cb => cb.value).join(', ');
    const selectedCats = Array.from(document.querySelectorAll('input[name="cats"]:checked')).map(cb => cb.value).join(', ');
    const totalValue = document.getElementById('total-amount').innerText;

    if (selectedTimes === "" || selectedCats === "") {
        alert("請確認已選擇時段與貓咪！");
        return;
    }

    // 鎖定按鈕
    submitBtn.innerText = "傳送中...";
    submitBtn.disabled = true;

    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    formData.append('date', dateInput.value);
    formData.append('time', selectedTimes);
    formData.append('cats', selectedCats);
    formData.append('contact', contactInput.value);
    formData.append('notes', document.getElementById('notes').value || "無備註");
    formData.append('totalPrice', totalValue);

    try {
        // 使用你的 GAS 網址
        await fetch("https://script.google.com/macros/s/AKfycbwTdX3BGRk4KtlSRdHfFxMTSjYcYS-kuSMWftRpO726uTI1srZjkz5L2w9okBlD7OwmAQ/exec", {
            method: 'POST',
            body: formData,
            mode: 'no-cors' 
        });
        
        alert('預約成功！資料已送出。');
        submitBtn.innerText = "提交預約";
        submitBtn.disabled = false;
    } catch (error) {
        console.error('傳送錯誤:', error);
        alert('傳送發生錯誤，請檢查網路。');
        submitBtn.disabled = false;
    }
}
async function checkAvailability() {
    try {
      const response = await fetch(GAS_URL); 
const data = await response.json();
        
        const selectedDate = document.querySelector('input[name="date"]:checked')?.value;
        const selectedTimes = Array.from(document.querySelectorAll('input[name="time"]:checked')).map(cb => cb.value);

        if (!selectedDate || selectedTimes.length === 0) return;

        document.querySelectorAll('input[name="cats"]').forEach(input => {
            const catName = input.value;
            let isAvailable = true;

            // 第一關：檢查班表 (Schedule)
            const daySchedule = data.schedule[selectedDate] || {};
            const catWorkTimes = daySchedule[catName] || [];
            // 必須選中的所有時段該貓咪都有上班 (顯示「可預約」)
            const hasWork = selectedTimes.every(t => catWorkTimes.includes(t));
            if (!hasWork) isAvailable = false;

            // 第二關：檢查預約紀錄 (Bookings)
            data.bookings.forEach(b => {
                if (b.date === selectedDate) {
                    const bTimes = b.time.split(', ');
                    const bCats = b.cats.split(', ');
                    // 如果選中的時段中，有任何一個時段這隻貓已經被訂了
                    const isBooked = selectedTimes.some(t => bTimes.includes(t)) && bCats.includes(catName);
                    if (isBooked) isAvailable = false;
                }
            });

            // 執行鎖定與變灰
            input.disabled = !isAvailable;
            if (!isAvailable) {
                input.checked = false;
                input.parentElement.classList.add('disabled-cat');
            } else {
                input.parentElement.classList.remove('disabled-cat');
            }
        });
        calculateTotal();
    } catch (error) {
        console.error("讀取狀態失敗:", error);
    }
}
// ==========================================
// 5. 初始化與事件綁定
// ==========================================
function init() {
    // 監聽日期切換 (新增)
    document.querySelectorAll('input[name="date"]').forEach(radio => {
        radio.addEventListener('change', checkAvailability);
    });

    // 監聽時段勾選 (修改：原本只有 calculateTotal，現在要加 checkAvailability)
    document.querySelectorAll('input[name="time"]').forEach(cb => {
        cb.addEventListener('change', () => {
            checkAvailability(); // 新增這行
            calculateTotal();
        });
    });

    // 監聽貓咪 (維持原樣)
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

    const form = document.getElementById('bookingForm');
    if (form) { form.addEventListener('submit', handleFormSubmit); }
    
    // 頁面開啟時先跑一次檢查
    checkAvailability(); 
    calculateTotal();
}

window.onload = init;
// 點擊圖片放大的功能
document.getElementById('menuImage').addEventListener('click', function() {
    // 建立一個黑色的背景遮罩
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '1000';
    overlay.style.cursor = 'zoom-out';

    // 建立放大的圖片
    const fullImg = document.createElement('img');
    fullImg.src = this.src;
    fullImg.style.maxWidth = '90%';
    fullImg.style.maxHeight = '90%';
    fullImg.style.borderRadius = '10px';
    fullImg.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';

    // 將圖片放入遮罩，再將遮罩放入網頁
    overlay.appendChild(fullImg);
    document.body.appendChild(overlay);

    // 點擊任何地方就關閉放大
    overlay.addEventListener('click', function() {
        document.body.removeChild(overlay);
    });
});