// ==========================================
// 1. 基礎參數設定
// ==========================================
const maxCats = 3; 
const pricePerCatPerPeriod = 50000;
const GAS_URL = "https://script.google.com/macros/s/AKfycbzV6P53CQYb4EobtaWTpkthUGXUgTvATD4QXLvRxIwThlGjIxDHDnWR0y-cEhlgMDeDxw/exec";
// 1. 新增全域變數存放抓回來的資料
let cachedData = null;
// ==========================================
// 2. 自動計算金額邏輯
// ==========================================
function calculateTotal() {
    // 1. 取得勾選的數量與對象
    const catsCheckedInputs = document.querySelectorAll('input[name="cats"]:checked');
    const catsCheckedCount = catsCheckedInputs.length;
    const periodsCheckedCount = document.querySelectorAll('input[name="time"]:checked').length;
    
    // 2. 設定金額基準
    const pricePerCatPerPeriod = 50000; // 基礎指名費
    const sketchExtraFee = 100000;      // 維梧爾加價 (10萬)
    
    let total = 0;
    let hasVoguer = false;

    // 3. 核心計算邏輯：逐一檢查選中的貓咪
    catsCheckedInputs.forEach(input => {
        if (input.value === "維梧爾") {
            hasVoguer = true;
            // 維梧爾：(5萬基礎 + 10萬速寫) * 時段數
            total += (pricePerCatPerPeriod + sketchExtraFee) * periodsCheckedCount;
        } else {
            // 其他貓咪：5萬 * 時段數
            total += pricePerCatPerPeriod * periodsCheckedCount;
        }
    });

    // 4. 處理「維梧爾專屬」收據顯示 (不影響備註)
    const sketchRow = document.getElementById('sketch-service-row');
    if (sketchRow) {
        sketchRow.style.display = hasVoguer ? 'block' : 'none';
    }

    // 5. 更新所有金額顯示
    const formattedTotal = total.toLocaleString();

    const topTotal = document.getElementById('top-total');
    if (topTotal) topTotal.innerText = formattedTotal;

    if (document.getElementById('display-periods')) {
        document.getElementById('display-periods').innerText = periodsCheckedCount;
    }
    if (document.getElementById('display-cats')) {
        document.getElementById('display-cats').innerText = catsCheckedCount;
    }
    if (document.getElementById('total-amount')) {
        document.getElementById('total-amount').innerText = formattedTotal;
    }
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
        cachedData = null; // 清除舊資料，迫使下次檢查時重新向 Google 抓取
        submitBtn.innerText = "提交預約";
        submitBtn.disabled = false;
    } catch (error) {
        console.error('傳送錯誤:', error);
        alert('傳送發生錯誤，請檢查網路。');
        submitBtn.disabled = false;
    }
}
async function checkAvailability() {
    const loader = document.getElementById('loading-overlay');
    
    // 如果還沒有資料，就去抓一次 (只轉這一次圈圈)
    if (!cachedData) {
        if (loader) loader.style.display = 'flex';
        try {
            // 使用最簡單的 fetch，避免 CORS 預檢請求失敗
            const response = await fetch(GAS_URL);
            cachedData = await response.json();
            console.log("資料讀取成功:", cachedData);
        } catch (error) {
            console.error("抓取初始資料失敗:", error);
            if (loader) loader.style.display = 'none';
            return;
        } finally {
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => { 
                    loader.style.display = 'none'; 
                    loader.style.opacity = '1'; 
                }, 500);
            }
        }
    }

    // --- 本地運算邏輯 ---
    const selectedDate = document.querySelector('input[name="date"]:checked')?.value;
    const selectedTimes = Array.from(document.querySelectorAll('input[name="time"]:checked')).map(cb => cb.value);

    // 重點：如果沒有選時段，把所有貓咪「恢復可選」並離開
    if (!selectedDate || selectedTimes.length === 0) {
        document.querySelectorAll('input[name="cats"]').forEach(input => {
            input.disabled = false;
            input.parentElement.classList.remove('disabled-cat');
        });
        calculateTotal();
        return;
    }

    // 開始檢查每一隻貓咪
    document.querySelectorAll('input[name="cats"]').forEach(input => {
        const catName = input.value;
        let isAvailable = true;

        // 1. 檢查班表 (Schedule)
        const daySchedule = cachedData.schedule[selectedDate] || {};
        const catWorkTimes = daySchedule[catName] || [];
        // 必須「所有選中的時段」這隻貓都有上班 (顯示可預約)
        const hasWork = selectedTimes.every(t => catWorkTimes.includes(t.trim()));
        
        if (!hasWork) isAvailable = false;

        // 2. 檢查預約紀錄 (Bookings)
        cachedData.bookings.forEach(b => {
            if (b.date === selectedDate) {
                const bTimes = b.time.split(',').map(s => s.trim());
                const bCats = b.cats.split(',').map(s => s.trim());
                // 如果選中的時段中有任何一個被訂了，且貓咪名字對上
                const isBooked = selectedTimes.some(t => bTimes.includes(t.trim())) && bCats.includes(catName);
                if (isBooked) isAvailable = false;
            }
        });

        // 執行 UI 鎖定與變灰
        input.disabled = !isAvailable;
        if (!isAvailable) {
            input.checked = false;
            input.parentElement.classList.add('disabled-cat');
        } else {
            input.parentElement.classList.remove('disabled-cat');
        }
    });
    calculateTotal();
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

   // 處理貓咪勾選監聽
    document.querySelectorAll('input[name="cats"]').forEach(cb => {
        cb.addEventListener('change', function() {
            const checkedCats = Array.from(document.querySelectorAll('input[name="cats"]:checked'));
            const selectedTimes = document.querySelectorAll('input[name="time"]:checked');

            if (this.checked) {
                // --- 【核心邏輯 A：維梧爾的排他性】 ---
                if (this.value === "維梧爾") {
                    // 如果選了維梧爾，就不能選其他貓
                    if (checkedCats.length > 1) {
                        this.checked = false;
                        alert('【預約限制】\n由於「維梧爾」提供專屬速寫服務，指名他時無法同時指名其他貓咪。');
                        return;
                    }
                    // 如果選了維梧爾，檢查時段是否超過一個
                    if (selectedTimes.length > 1) {
                        this.checked = false;
                        alert('【預約限制】\n「維梧爾」的速寫預約僅限選擇「一個」時段。');
                        return;
                    }
                } else {
                    // 如果選的是其他貓，但目前已經勾選了維梧爾
                    const hasVoguer = checkedCats.some(cat => cat.value === "維梧爾");
                    if (hasVoguer) {
                        this.checked = false;
                        alert('【預約限制】\n當前已選擇「維梧爾」，無法再指名其他貓咪。');
                        return;
                    }
                }

                // 原本的 3 隻貓限制
                if (checkedCats.length > 3) {
                    this.checked = false;
                    alert('抱歉，每筆預約最多只能指名 3 位貓咪喔！');
                    return;
                }
            }
            calculateTotal();
        });
    });

    // --- 【核心邏輯 B：時段勾選監聽】 ---
    document.querySelectorAll('input[name="time"]').forEach(tb => {
    tb.addEventListener('change', function() {
        const checkedCats = Array.from(document.querySelectorAll('input[name="cats"]:checked'));
        const hasVoguer = checkedCats.some(cat => cat.value === "維梧爾");
        const selectedTimes = document.querySelectorAll('input[name="time"]:checked');

        // 如果點擊後發現不符合維梧爾的限制
        if (this.checked && hasVoguer && selectedTimes.length > 1) {
            this.checked = false; // 強制取消勾選
            alert('【預約限制】\n「維梧爾」的速寫預約僅限選擇「一個」時段。');
            
            // --- 關鍵：取消勾選後，必須再跑一次計算來修正金額 ---
            calculateTotal(); 
            return; 
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