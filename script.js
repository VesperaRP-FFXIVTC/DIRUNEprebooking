// ==========================================
// 1. 基礎參數設定
// ==========================================
const maxCats = 3; 
const pricePerCatPerPeriod = 50000;
const GAS_URL = "https://script.google.com/macros/s/AKfycbwTdX3BGRk4KtlSRdHfFxMTSjYcYS-kuSMWftRpO726uTI1srZjkz5L2w9okBlD7OwmAQ/exec";

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

// ==========================================
// 5. 初始化與事件綁定
// ==========================================
function init() {
    // 監聽時段
    document.querySelectorAll('input[name="time"]').forEach(cb => {
        cb.addEventListener('change', () => {
            calculateTotal();
        });
    });

    // 監聽貓咪
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

    // 監聽提交
    const form = document.getElementById('bookingForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    // 初始執行
    calculateTotal();
}

window.onload = init;