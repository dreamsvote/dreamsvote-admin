import { supabase } from './supabase.js'

let currentDate = new Date()
let selectedDate = null
let slots = []

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
    
    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += '<div></div>'
    }
    
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
    document.getElementById('date-status-display').textContent = 'Fetching slots...'
    document.getElementById('add-slot-btn').disabled = false
    
    loadSlots(date)
}

// ============================================
// LOAD SLOTS FROM SUPABASE
// ============================================
async function loadSlots(date) {
    const { data, error } = await supabase
        .from('schedule_slots')
        .select('*')
        .eq('date', date)
        .order('time_kst', { ascending: true })

    if (error) {
        console.error('Error fetching slots:', error)
        return
    }

    slots = data || []
    renderSlots()
}

function renderSlots() {
    const container = document.getElementById('time-slots-container')
    const totalEl = document.getElementById('total-slots')
    const availEl = document.getElementById('available-slots')

    totalEl.textContent = `${slots.length} SLOTS`
    availEl.textContent = `${slots.filter(s => s.is_active).length} AVAILABLE`

    if (!slots.length) {
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-text-muted opacity-50">
                <i data-lucide="clock" class="w-12 h-12 mb-4"></i>
                <p class="font-bold text-xs uppercase tracking-widest">No slots defined for this date</p>
            </div>
        `
    } else {
        container.innerHTML = slots.map(s => `
            <div class="p-4 rounded-2xl border ${s.is_active ? 'border-border bg-white' : 'border-red-100 bg-red-50/30'} transition-all hover:shadow-md">
                <div class="flex justify-between items-start mb-3">
                    <span class="text-sm font-bold text-text-main">${s.time_kst.substring(0,5)} KST</span>
                    <button onclick="deleteSlot(${s.id})" class="text-text-muted hover:text-red-600 transition-colors">
                        <i data-lucide="x-circle" class="w-4 h-4"></i>
                    </button>
                </div>
                <div class="flex justify-between items-end">
                    <div>
                        <p class="text-[10px] font-bold text-text-muted uppercase">${s.time_wib.substring(0,5)} WIB</p>
                        <p class="text-[10px] font-medium mt-1 ${s.current_orders >= s.max_orders ? 'text-red-500' : 'text-green-600'}">
                            ${s.current_orders}/${s.max_orders} Booked
                        </p>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" ${s.is_active ? 'checked' : ''} onchange="toggleSlot(${s.id}, this.checked)" class="sr-only peer">
                        <div class="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>
            </div>
        `).join('')
    }
    if (window.lucide) lucide.createIcons()
}

// ============================================
// SLOT ACTIONS
// ============================================
window.toggleSlot = async function(id, isActive) {
    const { error } = await supabase.from('schedule_slots').update({ is_active: isActive }).eq('id', id)
    if (!error) showToast(`Slot ${isActive ? 'activated' : 'deactivated'}`)
}

window.deleteSlot = async function(id) {
    if (!confirm('Delete this time slot?')) return
    const { error } = await supabase.from('schedule_slots').delete().eq('id', id)
    if (!error) {
        slots = slots.filter(s => s.id !== id)
        renderSlots()
        showToast('Slot deleted')
    }
}

// ============================================
// MODAL LOGIC
// ============================================
function generateKSTCheckboxes() {
    const grid = document.getElementById('kst-checkbox-grid')
    grid.innerHTML = ''
    for (let h = 0; h < 24; h++) {
        const time = `${String(h).padStart(2, '0')}:00`
        const wib = `${String((h - 2 + 24) % 24).padStart(2, '0')}:00`
        grid.innerHTML += `
            <label class="relative group cursor-pointer">
                <input type="checkbox" value="${time}" data-wib="${wib}" class="peer sr-only kst-check">
                <div class="p-3 rounded-xl border border-border bg-white text-center transition-all peer-checked:border-primary peer-checked:bg-primary-light peer-checked:text-primary">
                    <p class="text-[10px] font-bold">${time} KST</p>
                    <p class="text-[8px] font-medium text-text-muted opacity-0 group-hover:opacity-100 peer-checked:opacity-100">${wib} WIB</p>
                </div>
            </label>
        `
    }
}

window.saveTimeSlot = async (e) => {
    e.preventDefault()
    const checks = Array.from(document.querySelectorAll('.kst-check:checked'))
    const maxOrders = parseInt(document.getElementById('max-orders').value)
    
    if (!checks.length) return alert('Select at least one time slot')

    const newSlots = checks.map(c => ({
        date: selectedDate,
        time_kst: c.value,
        time_wib: c.dataset.wib,
        max_orders: maxOrders,
        current_orders: 0,
        is_active: true
    }))

    const { data, error } = await supabase.from('schedule_slots').insert(newSlots).select()
    
    if (error) {
        alert('Error: ' + error.message)
    } else {
        showToast(`Successfully added ${newSlots.length} slots`)
        closeSlotModal()
        loadSlots(selectedDate)
    }
}

window.openSlotModal = () => selectedDate ? document.getElementById('slot-modal').classList.remove('hidden') : alert('Select a date first')
window.closeSlotModal = () => document.getElementById('slot-modal').classList.add('hidden')
window.selectAllTimes = () => document.querySelectorAll('.kst-check').forEach(c => c.checked = true)
window.clearAllTimes = () => document.querySelectorAll('.kst-check').forEach(c => c.checked = false)

document.addEventListener('DOMContentLoaded', init)
