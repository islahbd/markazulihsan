// ==========================================
// ১. স্লাইডার এবং মোডাল লজিক
// ==========================================
let sliderInterval;

function initSlider() {
    const slider = document.querySelector('.slider');
    if (!slider) return;
    const slides = Array.from(slider.querySelectorAll('img'));
    if (slides.length <= 1) return;
    
    // ক্লোনিং লজিক
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);
    
    const existingClones = slider.querySelectorAll('.clone');
    existingClones.forEach(el => el.remove());
    
    firstClone.classList.add('clone');
    lastClone.classList.add('clone');
    
    slider.appendChild(firstClone);
    slider.insertBefore(lastClone, slides[0]);
    
    const allSlides = Array.from(slider.querySelectorAll('img'));
    let currentIndex = 1; 
    let isTransitioning = false;
    const slideWidth = slider.parentElement.clientWidth;
    
    // ইনিশিয়াল পজিশন
    slider.style.transform = `translateX(${-slideWidth * currentIndex}px)`;

    function updateSlider() {
        if (isTransitioning) return;
        isTransitioning = true;
        currentIndex++;
        const slideWidth = slider.parentElement.clientWidth;
        slider.style.transition = 'transform 1s ease-in-out';
        slider.style.transform = `translateX(${-slideWidth * currentIndex}px)`;
    }

    slider.addEventListener('transitionend', () => {
        isTransitioning = false;
        const slideWidth = slider.parentElement.clientWidth;
        
        if (allSlides[currentIndex]?.src === firstClone.src) { 
            slider.style.transition = 'none';
            currentIndex = 1;
            slider.style.transform = `translateX(${-slideWidth * currentIndex}px)`;
        }
        if (allSlides[currentIndex]?.src === lastClone.src) {
            slider.style.transition = 'none';
            currentIndex = allSlides.length - 2;
            slider.style.transform = `translateX(${-slideWidth * currentIndex}px)`;
        }
    });

    startSlider();

    function startSlider() {
        clearInterval(sliderInterval);
        sliderInterval = setInterval(updateSlider, 4000);
    }

    window.addEventListener('resize', () => {
        clearInterval(sliderInterval);
        const slideWidth = slider.parentElement.clientWidth;
        slider.style.transition = 'none';
        slider.style.transform = `translateX(${-slideWidth * currentIndex}px)`;
        startSlider();
    });
}
window.addEventListener('load', initSlider);

// Modal Logic
let modalCloseTimer;
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.style.display = "flex";
}

function openModalWithTimeout(modalId) {
    openModal(modalId);
    modalCloseTimer = setTimeout(() => {
        closeModal(modalId);
    }, 15000);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.style.display = "none";
    if (modalCloseTimer) {
        clearTimeout(modalCloseTimer);
    }
}

window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let i = 0; i < modals.length; i++) {
        if (event.target == modals[i]) {
            modals[i].style.display = "none";
        }
    }
}

// ==========================================
// ২. গ্লোবাল RFID লিসেনার
// ==========================================
let rfidBuffer = ""; 
let lastKeyTime = Date.now();

document.addEventListener('keydown', function(event) {
    const currentTime = Date.now();
    
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return; 
    }

    if (currentTime - lastKeyTime > 100) { 
        rfidBuffer = ""; 
    }
    lastKeyTime = currentTime;

    if (event.key === "Enter") {
        if (rfidBuffer.length > 0) {
            console.log("Scanned:", rfidBuffer);
            searchByRFID(rfidBuffer);
            rfidBuffer = ""; 
        }
    } 
    else if (!isNaN(event.key)) {
        rfidBuffer += event.key;
    }
});


// ==========================================
// ৩. ডেটা হ্যান্ডলিং এবং সার্চ লজিক
// ==========================================

const googleSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTU_Ho2JCxvqg9PEeyxVXrdrHPsMpkXd_IJxHhu-mMQH07LYqcCh4jTYWM-5n9XFB9Hk5ngvRYd-xw7/pub?gid=0&single=true&output=csv';

let allMembersData = [];

window.addEventListener('DOMContentLoaded', () => {
    fetchMemberData();
    // Fetch data every 15 seconds
    setInterval(fetchMemberData, 15000); 
});

async function fetchMemberData() {
    try {
        const response = await fetch(googleSheetUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.text();
        const freshData = parseCSVString(data);
        
        // Check if data has actually changed before logging
        if (JSON.stringify(allMembersData) !== JSON.stringify(freshData)) {
            allMembersData = freshData;
            console.log("Data Updated/Reloaded:", allMembersData.length);
        } else {
            console.log("Data checked, no changes.");
        }

    } catch (error) {
        console.error("Error loading data:", error);
    }
}

function parseCSVString(text) {
    let pattern = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/; 
    let lines = text.split('\n');
    let result = [];
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line.length === 0) continue;
        line = line.replace(/\\s*/g, '').trim(); 
        let columns = line.split(pattern).map(col => {
            return col ? col.trim().replace(/^"|"$/g, '').trim() : '';
        });
        if (!isNaN(parseInt(columns[1])) && parseInt(columns[1]) > 0) {
            result.push(columns);
        }
    }
    return result;
}

function openSearchModal() {
    openModal('searchModal');
    const memberIdInput = document.getElementById('memberIdInput');
    const mobileNumberInput = document.getElementById('mobileNumberInput');
    if(memberIdInput) memberIdInput.value = '';
    if(mobileNumberInput) mobileNumberInput.value = '';
    setTimeout(() => memberIdInput?.focus(), 100); 
}

function searchByRFID(scannedCode) {
    if (allMembersData.length === 0) {
        alert("ডেটা লোড হচ্ছে, অনুগ্রহ করে একটু অপেক্ষা করুন...");
        return;
    }

    const normalizedInput = scannedCode.trim().replace(/^0+/, ''); 

    const member = allMembersData.find(m => {
        const sheetValue = m[0] ? m[0].toString().trim() : '';
        const normalizedSheetCode = sheetValue.replace(/^0+/, '');
        if (!normalizedSheetCode) return false; 
        return normalizedSheetCode === normalizedInput;
    });

    if (member) {
        closeModal('searchModal'); 
        displayMemberDetails(member);
    } else {
        alert(`দুঃখিত! এই কার্ডের (${scannedCode}) তথ্য পাওয়া যায়নি!`);
    }
}

function searchManual() {
    const searchId = document.getElementById('memberIdInput').value.trim();
    const searchMobile = document.getElementById('mobileNumberInput').value.trim();

    if (!searchId || !searchMobile) {
        alert("দয়া করে সদস্য নাম্বার এবং মোবাইল নাম্বার, উভয়ই পূরণ করুন।");
        return;
    }

    if (allMembersData.length === 0) {
        alert("ডেটা লোড হচ্ছে...");
        return;
    }

    const member = allMembersData.find(m => 
        m[1] && m[1].trim() == searchId &&
        m[5] && m[5].trim().includes(searchMobile)
    );

    if (member) {
        closeModal('searchModal'); 
        displayMemberDetails(member);
    } else {
        alert("দুঃখিত! এই তথ্যের কোনো সদস্য পাওয়া যায়নি।");
    }
}

// ==========================================
// ৪. উন্নত কনফেটি এবং অডিও ইফেক্ট (লাইট ভার্সন)
// ==========================================
function playWelcomeEffect() {
    // অডিও লজিক
    const audioPath = 'audio/welcome.mp3'; 
    const audio = new Audio(audioPath);
    audio.play().catch(error => {
        console.error("Audio Auto-play prevented", error);
    });

    // কনফেটি লজিক (Lite - Single Burst)
    if (typeof confetti === 'function') {
        const count = 100; // কণা সংখ্যা কম
        const defaults = {
            origin: { y: 0.7 },
            zIndex: 1001 // মোডালের উপরে দেখাবে
        };

        function fire(particleRatio, opts) {
            confetti(Object.assign({}, defaults, opts, {
                particleCount: Math.floor(count * particleRatio)
            }));
        }

        // একবার ফায়ার হবে (Single Shot)
        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }
}

// ==========================================
// ফলাফল দেখানোর ফাংশন (ছবি এবং আপডেট সহ)
// ==========================================
function displayMemberDetails(data) {
    const id = data[1] || 'N/A';
    const name = data[2] || 'N/A';
    const pledged = data[3] ? data[3].replace(/,/g, '') : 'N/A';
    const address = data[4] || 'তথ্য নেই';
    const mobile = data[5] || 'তথ্য নেই';
    
    const startYear = 2018;
    const dataEndYear = 2025; 
    const startYearIndex = 6; 

    let joinYear = "তথ্য নেই";
    let dueYears = [];
    let hasJoined = false;

    for (let year = startYear; year <= dataEndYear; year++) {
        const indexOffset = year - startYear;
        const colIndex = startYearIndex + indexOffset;
        const cellData = data[colIndex] ? data[colIndex].toString().trim() : '';
        
        const isPaid = (
            cellData !== '' && 
            cellData !== '0' && 
            cellData.toLowerCase() !== 'rejected' && 
            cellData.toLowerCase() !== 'closse' &&
            cellData.toLowerCase() !== 'cancel'
        );

        if (isPaid && !hasJoined) {
            joinYear = year.toString();
            hasJoined = true;
        }

        if (hasJoined) {
            if (!isPaid) {
                if (year >= 2024) {
                    dueYears.push(year); 
                }
            }
        }
    }

    const html = `
        <div class="profile-pic-container">
            <img src="image/444.png" alt="Logo" class="profile-pic">
        </div>

        <div class="detail-row">
            <span class="detail-label">সদস্যের নামঃ</span>
            <span class="detail-value">${name}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">সদস্য নাম্বারঃ</span>
            <span class="detail-value">${id}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">মোবাইল নাম্বারঃ</span>
            <span class="detail-value">${mobile}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">ঠিকানাঃ</span>
            <span class="detail-value">${address}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">সদস্য হওয়ার বছরঃ</span>
            <span class="detail-value">${joinYear}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">ওয়াদাকৃত পরিমাণঃ</span>
            <span class="detail-value">${pledged} টাকা</span>
        </div>
        <div class="detail-row" style="border-bottom: none; flex-direction: column;">
            <div class="detail-row" style="border-bottom: none; padding: 0;">
                 <span class="detail-label">বকেয়া আছে কি না?</span>
                 <span class="detail-value">${dueYears.length > 0 ? `<span class="status-due">হ্যাঁ</span>` : `<span class="status-paid">না (আলহামদুলিল্লাহ)</span>`}</span>
            </div>
            ${dueYears.length > 0 ? `<span class="detail-label" style="text-align: left; padding-top: 5px;">থাকলে কোন কোন বছর? <span class="due-years-list">${dueYears.join(', ')}</span></span>` : ''}
        </div>
    `;

    document.getElementById('memberDetails').innerHTML = html;
    openModalWithTimeout('memberResultModal');
    
    // ইফেক্ট কল করা হলো
    playWelcomeEffect();
}