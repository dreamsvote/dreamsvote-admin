import { supabase } from './supabase.js'

let currentDate = new Date()
let selectedDate = null
let slots = []

// --- BIND TO WINDOW IMMEDIATELY ---
window.changeMonth = (dir) => {
    currentDate.setMonth(currentDate.getMonth() + dir)
    renderCalendar()
}

window.selectDate = async (date) => {
    selectedDate = date
    renderCalendar()
    const display = document.getElementById('selected-date-display')
    if (display) display.textContent = new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    
    const status = document.getElementById('date-status-display')
    if (status) status.textContent = 'Loading slots...'
    
    const btn = document.getElementById('add-slot-btn')
    if (btn) btn.disabled = false
    
    loadSlots(date)
}

window.openSlotModal = () => selectedDate ? document.getElementById('slot-modal').classList.remove('hidden') : alert('Select a date first')
window.closeSlotModal = () => document.getElementById('slot-modal').classList.add('hidden')

window.selectAllTimes = () => document.querySelectorAll('.kst-check').forEach(c => c.checked = true)
window.clearAllTimes = () => document.querySelectorAll('.kst-check').forEach(c => c.checked = false)

window.saveTimeSlot = async (e) => {
    if (e) e.preventDefault()
    const checks = Array.from(document.querySelectorAll('.kst-check:checked'))
    if (!checks.length) return alert('Select at least one slot')

    const newSlots = checks.map(c => ({
        date: selectedDate,
        time_kst: c.value,
        time_wib: c.dataset.wib,
        max_orders: parseInt(document.getElementById('max-orders').value),
        current_orders: 0,
        is_active: true
    }))

    const { error } = await supabase.from('schedule_slots').insert(newSlots)
    if (error) {
        alert('Error: ' + error.message)
    } else {
        showToast('Slots added successfully!')
        window.closeSlotModal()
        loadSlots(selectedDate)
    }
}

// PERBAIKAN: Fungsi toggle dan delete sekarang lebih kuat
window.toggleSlot = async function(id, isActive) {
    try {
        const { error } = await supabase
            .from('schedule_slots')
            .update({ is_active: isActive })
            .eq('id', id)
        
        if (error) throw error
        showToast(`Slot is now ${isActive ? 'Active' : 'Disabled'}`)
        
        // Update data lokal
        const idx = slots.findIndex(s => s.id === id)
        if (idx !== -1) slots[idx].is_active = isActive
        renderSlots()
    } catch (err) {
        console.error('Toggle error:', err)
        showToast('Failed to update slot', 'error')
    }
}

window.deleteSlot = async function(id) {
    if (!confirm('Are you sure you want to delete this slot?')) return
    try {
        const { error } = await supabase
            .from('schedule_slots')
            .delete()
            .eq('id', id)
        
        if (error) throw error
        showToast('Slot deleted')
        slots = slots.filter(s => s.id !== id)
        renderSlots()
    } catch (err) {
        console.error('Delete error:', err)
        showToast('Failed to delete slot', 'error')
    }
}

// --- LOGIC ---
function renderCalendar() {
    const grid = document.getElementById('calendar-grid')
    const display = document.getElementById('current-month')
    if (!grid || !display) return

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    display.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate)
    
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    grid.innerHTML = ''
    for (let i = 0; i < firstDay; i++) grid.innerHTML += '<div></div>'
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const isSelected = selectedDate === dateStr
        grid.innerHTML += `<button onclick="selectDate('${dateStr}')" class="aspect-square rounded-xl text-xs font-bold transition-all ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-primary-light text-text-main'}">${day}</button>`
    }
}

async function loadSlots(date) {
    const { data, error } = await supabase
        .from('schedule_slots')
        .select('*')
        .eq('date', date)
        .order('time_kst', { ascending: true })
    
    slots = data || []
    const status = document.getElementById('date-status-display')
    if (status) status.textContent = slots.length > 0 ? 'Manage slots for this date' : 'No slots found for this date'
    
    renderSlots()
}

function renderSlots() {
    const container = document.getElementById('time-slots-container')
    const totalEl = document.getElementById('total-slots')
    if (!container) return
    if (totalEl) totalEl.textContent = `${slots.length} SLOTS`
    
    if (!slots.length) {
        container.innerHTML = `<div class="col-span-full py-16 text-center text-text-muted text-xs opacity-50 flex flex-col items-center justify-center"><i data-lucide="clock" class="w-10 h-10 mb-4"></i><p>No slots found for this date</p></div>`
    } else {
        container.innerHTML = slots.map(s => `
            <div class="p-4 rounded-2xl border ${s.is_active ? 'border-border bg-white shadow-sm' : 'border-red-100 bg-red-50/20 opacity-80'} flex justify-between items-center transition-all">
                <div class="${!s.is_active ? 'grayscale' : ''}">
                    <p class="text-sm font-bold text-text-main">${s.time_kst.substring(0,5)} KST</p>
                    <p class="text-[10px] font-bold text-text-muted uppercase">${s.time_wib.substring(0,5)} WIB</p>
                </div>
                <div class="flex items-center gap-4">
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" ${s.is_active ? 'checked' : ''} onchange="toggleSlot(${s.id}, this.checked)" class="sr-only peer">
                        <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <button onclick="deleteSlot(${s.id})" class="text-text-muted hover:text-red-600 transition-colors">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `).join('')
    }
    if (window.lucide) lucide.createIcons()
}

function generateKSTCheckboxes() {
    const grid = document.getElementById('kst-checkbox-grid')
    if (!grid) return
    grid.innerHTML = ''
    for (let h = 0; h < 24; h++) {
        const time = `${String(h).padStart(2, '0')}:00`
        const wib = `${String((h - 2 + 24) % 24).padStart(2, '0')}:00`
        grid.innerHTML += `
            <label class="cursor-pointer group">
                <input type="checkbox" value="${time}" data-wib="${wib}" class="peer sr-only kst-check">
                <div class="p-3 rounded-xl border border-border bg-white text-center hover:border-primary transition-all peer-checked:bg-primary-light peer-checked:text-primary peer-checked:border-primary">
                    <p class="text-[10px] font-bold">${time}</p>
                    <p class="text-[8px] font-medium text-text-muted opacity-60">${wib}</p>
                </div>
            </label>
        `
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return window.location.replace('login.html')
    renderCalendar()
    generateKSTCheckboxes()
})
