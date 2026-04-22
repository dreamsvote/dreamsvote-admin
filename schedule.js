import { supabase } from './supabase.js'

let currentDate = new Date()
let selectedDate = null
let slots = []
let kstTimes = []

// ============================================
// INIT
// ============================================
async function init() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
        window.location.replace('login.html')
        return
    }

    renderCalendar()
    generateKSTCheckboxes()
}

// ============================================
// CALENDAR LOGIC
// ============================================
window.renderCalendar = function() {
    const grid = document.getElementById('calendar-grid')
    const monthDisplay = document.getElementById('current-month')
    
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    monthDisplay.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate)
    
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    grid.innerHTML = ''
    
    // Padding
    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += '<div></div>'
    }
    
    // Days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const isSelected = selectedDate === dateStr
        const isToday = new Date().toISOString().split('T')[0] === dateStr
        
        grid.innerHTML += `
            <button onclick="selectDate('${dateStr}')" 
                class="aspect-square rounded-xl text-sm font-bold transition-all flex items-center justify-center
                ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'hover:bg-primary-light hover:text-primary'}
                ${isToday && !isSelected ? 'border-2 border-primary text-primary' : 'text-text-main'}">
                ${day}
            </button>
        `
    }
}

window.changeMonth = function(dir) {
    currentDate.setMonth(currentDate.getMonth() + dir)
    renderCalendar()
}

window.selectDate = async function(date) {
    selectedDate = date
    renderCalendar()
    
    document.getElementById('selected-date-display').textContent = new Date(date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    document.getElementById('date-status-display').textContent = 'Loading slots...'
    document.getElementById('add-slot-btn').disabled = false
    
    // Load slots from Supabase (Mocked for now since table might not exist yet)
    loadSlots(date)
}

async function loadSlots(date) {
    // const { data } = await supabase.from('schedule_slots').select('*').eq('date', date)
    // For now, empty
    document.getElementById('date-status-display').textContent = 'Manage slots for this date'
    document.getElementById('time-slots-container').innerHTML = `
        <div class="col-span-full flex flex-col items-center justify-center py-20 text-text-muted opacity-50">
            <i data-lucide="clock" class="w-12 h-12 mb-4"></i>
            <p class="font-bold text-xs uppercase tracking-widest">No slots defined for this date</p>
        </div>
    `
    if (window.lucide) lucide.createIcons()
}

// ============================================
// SLOT MODAL LOGIC
// ============================================
function generateKSTCheckboxes() {
    const grid = document.getElementById('kst-checkbox-grid')
    grid.innerHTML = ''
    
    for (let h = 0; h < 24; h++) {
        const time = `${String(h).padStart(2, '0')}:00`
        const wib = `${String((h - 2 + 24) % 24).padStart(2, '0')}:00`
        
        grid.innerHTML += `
            <label class="relative group cursor-pointer">
                <input type="checkbox" value="${time}" class="peer sr-only kst-check">
                <div class="p-3 rounded-xl border border-border bg-white text-center transition-all peer-checked:border-primary peer-checked:bg-primary-light peer-checked:text-primary">
                    <p class="text-[10px] font-bold">${time} KST</p>
                    <p class="text-[8px] font-medium text-text-muted opacity-0 group-hover:opacity-100 peer-checked:opacity-100">${wib} WIB</p>
                </div>
            </label>
        `
    }
}

window.openSlotModal = () => {
    if (!selectedDate) {
        alert('Please select a date first')
        return
    }
    document.getElementById('slot-modal').classList.remove('hidden')
}

window.closeSlotModal = () => document.getElementById('slot-modal').classList.add('hidden')

window.selectAllTimes = () => document.querySelectorAll('.kst-check').forEach(c => c.checked = true)
window.clearAllTimes = () => document.querySelectorAll('.kst-check').forEach(c => c.checked = false)

window.saveTimeSlot = async (e) => {
    e.preventDefault()
    const selectedTimes = Array.from(document.querySelectorAll('.kst-check:checked')).map(c => c.value)
    const maxOrders = document.getElementById('max-orders').value
    
    if (!selectedTimes.length) {
        alert('Select at least one time slot')
        return
    }

    showToast(`Added ${selectedTimes.length} slots for ${selectedDate}`)
    closeSlotModal()
    loadSlots(selectedDate)
}

document.addEventListener('DOMContentLoaded', init)
