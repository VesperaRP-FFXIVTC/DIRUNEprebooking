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
// 3. 控制貓咪區塊的顯示與隱藏
// ==========================================
function toggleCatSection() {
    const catSection = document.getElementById('cat-selection-section');
    const selectedPeriods = document.querySelectorAll('input[name="time"]:checked').length;

    if (catSection) {
        if (selectedPeriods > 0) {
            // 有選時段時顯示
            catSection.style.display = 'block';
            setTimeout(() => { catSection.style.opacity = '1'; }, 10);
        } else {
            // 沒選時段時隱藏並清空貓咪勾選
            catSection.style.opacity = '0';
            setTimeout(() => { 
                catSection.style.display = 'none'; 
                document.querySelectorAll('input[name="cats"]').forEach(c => c.checked = false);
                calculateTotal();
            }, 400);
        }
    }
}

// ==========================================
// 4. 處理表單提交 (方案 A)
// ==========================================
async function handleFormSubmit(e) {
    e.preventDefault(); 
    console.log("正在準備提交預約資料...");

    const submitBtn = document.getElementById('submitBtn');
    
    // 取得資料
    const dateInput = document.querySelector('input[name="date"]:checked');
    const contactInput = document.getElementById('contact-info');
    
    // 防呆檢查
    if (!dateInput || !contactInput || contactInput.value.trim() === "") {
        alert("請確認已填寫「日期」與「聯絡方法」喔！");
        return;
    }

    const selectedDate = dateInput.value;
    const selectedTimes = Array.from(document.querySelectorAll('input[name="time"]:checked')).map(cb => cb.value).join(', ');
    const selectedCats = Array.from(document.querySelectorAll('input[name="cats"]:checked')).map(cb => cb.value).join(', ');
    const contactValue = contactInput.value;
    const notesValue = document.getElementById('notes').value || "無備註";
    const totalValue = document.getElementById('total-amount').innerText;

    // 鎖定按鈕
    submitBtn.innerText = "傳送中...";
    submitBtn.disabled = true;

    // 準備傳送資料
    const formData = new FormData();
    formData.append('date', selectedDate);
    formData.append('time', selectedTimes);
    formData.append('cats', selectedCats);
    formData.append('contact', contactValue);
    formData.append('notes', notesValue);
    formData.append('totalPrice', totalValue);

    try {
        await fetch(GAS_URL, {
            method: 'POST',
            body: formData,
            mode: 'no-cors' 
        });
        
        alert('預約成功！資料已送出。');
        submitBtn.innerText = "提交預約";
        submitBtn.disabled = false;
        // 可選：預約成功後重置表單
        // location.reload();

    } catch (error) {
        console.error('傳送錯誤:', error);
        alert('傳送發生預料之外的錯誤，請再試一次。');
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
            toggleCatSection();
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
    toggleCatSection();
}

window.onload = init;