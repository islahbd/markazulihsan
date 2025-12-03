// ==========================================
// ১. উন্নত স্লাইডার লজিক (Crash Proof Slider)
// ==========================================
let sliderInterval;

function initSlider() {
    const slider = document.querySelector('.slider');
    if (!slider) return;

    const slides = Array.from(slider.querySelectorAll('img'));
    if (slides.length <= 1) return;

    // ক্লোন লজিক (ইনফিনিটি লুপের জন্য)
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[slides.length - 1].cloneNode(true);

    // ডুপ্লিকেট এড়াতে আগের ক্লোন থাকলে ক্লিয়ার করুন
    const existingClones = slider.querySelectorAll('.clone');
    existingClones.forEach(el => el.remove());

    firstClone.classList.add('clone');
    lastClone.classList.add('clone');

    slider.appendChild(firstClone);
    slider.insertBefore(lastClone, slides[0]);

    const allSlides = Array.from(slider.querySelectorAll('img'));
    let currentIndex = 1; 
    let isTransitioning = false;

    // স্লাইডারের প্রাথমিক অবস্থান
    const slideWidth = slider.parentElement.clientWidth;
    slider.style.transform = `translateX(${-slideWidth * currentIndex}px)`;

    function updateSlider() {
        if (isTransitioning) return;
        isTransitioning = true;
        
        currentIndex++;
        const slideWidth = slider.parentElement.clientWidth;
        slider.style.transition = 'transform 1s ease-in-out';
        slider.style.transform = `translateX(${-slideWidth * currentIndex}px)`;
    }

    // ট্রানজিশন শেষ হলে চেক করা (Loop Reset)
    slider.addEventListener('transitionend', () => {
        isTransitioning = false;
        const slideWidth = slider.parentElement.clientWidth;
        
        if (allSlides[currentIndex].src === firstClone.src) {
            slider.style.transition = 'none';
            currentIndex = 1;
            slider.style.transform = `translateX(${-slideWidth * currentIndex}px)`;
        }
        
        if (allSlides[currentIndex].src === lastClone.src) {
            slider.style.transition = 'none';
            currentIndex = allSlides.length - 2;
            slider.style.transform = `translateX(${-slideWidth * currentIndex}px)`;
        }
    });

    // অটো প্লে শুরু
    startSlider();

    function startSlider() {
        clearInterval(sliderInterval);
        sliderInterval = setInterval(updateSlider, 4000);
    }

    // রিসাইজ হলে স্লাইডার ঠিক রাখা
    window.addEventListener('resize', () => {
        clearInterval(sliderInterval);
        const slideWidth = slider.parentElement.clientWidth;
        slider.style.transition = 'none';
        slider.style.transform = `translateX(${-slideWidth * currentIndex}px)`;
        startSlider();
    });
}

// পেজ লোড হলে স্লাইডার চালু হবে
window.addEventListener('load', initSlider);


// ==========================================
// ২. Modal এবং Scroll Logic
// ==========================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.style.display = "flex"; 
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) modal.style.display = "none";
}

window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let i = 0; i < modals.length; i++) {
        if (event.target == modals[i]) {
            modals[i].style.display = "none";
        }
    }
}

document.querySelectorAll('.glass-footer a').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
             window.scrollTo({
                top: targetElement.offsetTop - 20,
                behavior: 'smooth'
            });
        }
    });
});


// ==========================================
// ৩. Google Sheet Data & Search Logic (Updated)
// ==========================================

const googleSheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRWEap40Bf1MCS9FHjdxNjQb5XbqZ0n9bmiig8s8vecMZbC9Ke4RKJWVKli9ydlhE3TcDfFmn-TulC5/pub?gid=0&single=true&output=csv';

let allMembersData = [];

window.addEventListener('DOMContentLoaded', () => {
    fetchMemberData();
});

async function fetchMemberData() {
    try {
        const response = await fetch(googleSheetUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.text();
        allMembersData = parseCSVString(data);
        console.log("Data loaded:", allMembersData.length);
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
        if (!isNaN(parseInt(columns[0])) && parseInt(columns[0]) > 0) {
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
    setTimeout(() => memberIdInput.focus(), 100);
}

function searchMember() {
    // Try-Catch ব্লক ব্যবহার করা হয়েছে যাতে স্লাইডার ক্র্যাশ না করে
    try {
        if (allMembersData.length === 0) {
            alert("ডেটা লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...");
            return;
        }

        const searchId = document.getElementById('memberIdInput').value.trim();
        const searchMobile = document.getElementById('mobileNumberInput').value.trim();

        if (!searchId || !searchMobile) {
            alert("দয়া করে সদস্য নাম্বার এবং মোবাইল নাম্বার, উভয়ই পূরণ করুন।");
            return;
        }

        const member = allMembersData.find(m => 
            m[0] && m[0].trim() == searchId &&
            m[4] && m[4].trim().includes(searchMobile)
        );

        if (member) {
            closeModal('searchModal'); 
            displayMemberDetails(member);
        } else {
            alert("দুঃখিত! কোনো সদস্য পাওয়া যায়নি।");
        }
    } catch (error) {
        console.error("Search Error:", error);
        alert("অনুসন্ধানে সমস্যা হয়েছে, পেজটি রিফ্রেশ করুন।");
    }
}

function displayMemberDetails(data) {
    const id = data[0] || 'N/A';
    const name = data[1] || 'N/A';
    const pledged = data[2] ? data[2].replace(/,/g, '') : 'N/A';
    const address = data[3] || 'তথ্য নেই';
    const mobile = data[4] || 'তথ্য নেই';
    
    // সাল সংক্রান্ত লজিক আপডেট
    const currentSystemYear = new Date().getFullYear();
    const dataEndYear = 2025; // আপনার শিটে ২০২৫ পর্যন্ত কলাম আছে
    // আমরা লুপ চালাবো ২০২৫ সাল পর্যন্ত নিশ্চিত করার জন্য
    const targetYear = Math.max(currentSystemYear, dataEndYear); 
    
    const startYear = 2018;
    const startYearIndex = 5; 

    let joinYear = "তথ্য নেই";
    let dueYears = [];
    let hasJoined = false;

    // লুপ: ২০১৮ থেকে ২০২৫ (বা বর্তমান বছর) পর্যন্ত চেক করবে
    for (let year = startYear; year <= dataEndYear; year++) {
        const indexOffset = year - startYear;
        const colIndex = startYearIndex + indexOffset;
        
        const cellData = data[colIndex] ? data[colIndex].toString().trim() : '';
        
        // পেমেন্ট চেক লজিক (ফাঁকা, ০ বা টেক্সট থাকলে অপরিশোধিত)
        // isPaid = সত্য যদি কিছু টাকা বা তথ্য থাকে যা 'Rejected' বা '0' না হয়
        const isPaid = (
            cellData !== '' && 
            cellData !== '0' && 
            cellData.toLowerCase() !== 'rejected' && 
            cellData.toLowerCase() !== 'closse' &&
            cellData.toLowerCase() !== 'cancel'
        );

        // ১. যোগদানের বছর নির্ধারণ
        if (isPaid && !hasJoined) {
            joinYear = year.toString();
            hasJoined = true;
        }

        // ২. বকেয়া বছর নির্ধারণ (যোগদানের পর থেকে বর্তমান/ডাটা শেষ বছর পর্যন্ত)
        if (hasJoined) {
            if (!isPaid) {
                 dueYears.push(year); 
            }
        }
    }

    const html = `
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
    openModal('memberResultModal');
}

document.getElementById("memberIdInput")?.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    searchMember();
  }
});