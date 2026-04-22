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
    loadSlots(date)
}

window.openSlotModal = () => selectedDate ? document.getElementById('slot-modal').classList.remove('hidden') : alert('Select a date first')
window.closeSlotModal = () => document.getElementById('slot-modal').classList.add('hidden')

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
        window.showToast('Slots added!')
        window.closeSlotModal()
        loadSlots(selectedDate)
    }
}

window.toggleSlot = async function(id, isActive) {
    const { error } = await supabase.from('schedule_slots').update({ is_active: isActive }).eq('id', id)
    if (error) {
        console.error(error)
        window.showToast('Failed to update', 'error')
    } else {
        window.showToast(`Slot ${isActive ? 'Active' : 'Disabled'}`)
        loadSlots(selectedDate)
    }
}

window.deleteSlot = async function(id) {
    if (!confirm('Delete this slot?')) return
    const { error } = await supabase.from('schedule_slots').delete().eq('id', id)
    if (error) {
        console.error(error)
        window.showToast('Failed to delete', 'error')
    } else {
        window.showToast('Slot deleted')
        loadSlots(selectedDate)
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
        grid.innerHTML += `<button onclick="window.selectDate('${dateStr}')" class="aspect-square rounded-xl text-xs font-bold transition-all ${isSelected ? 'bg-primary text-white shadow-lg' : 'hover:bg-primary-light text-text-main'}">${day}</button>`
    }
}

async function loadSlots(date) {
    const { data } = await supabase.from('schedule_slots').select('*').eq('date', date).order('time_kst', { ascending: true })
    slots = data || []
    renderSlots()
}

function renderSlots() {
    const container = document.getElementById('time-slots-container')
    if (!container) return
    
    if (!slots.length) {
        container.innerHTML = `<div class="col-span-full py-16 text-center text-text-muted text-xs opacity-50">No slots found</div>`
    } else {
        container.innerHTML = slots.map(s => `
            <div class="p-4 rounded-2xl border ${s.is_active ? 'border-border bg-white shadow-sm' : 'border-red-100 bg-red-50/20'} flex justify-between items-center">
                <div>
                    <p class="text-sm font-bold ${s.is_active ? 'text-text-main' : 'text-text-muted'}">${s.time_kst.substring(0,5)} KST</p>
                    <p class="text-[10px] font-bold text-text-muted">${s.time_wib.substring(0,5)} WIB</p>
                </div>
                <div class="flex items-center gap-4">
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" ${s.is_active ? 'checked' : ''} onchange="window.toggleSlot(${s.id}, this.checked)" class="sr-only peer">
                        <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    <button onclick="window.deleteSlot(${s.id})" class="text-text-muted hover:text-red-600">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `).join('')
    }
    if (window.lucide) lucide.createIcons()
}

window.selectAllTimes = () => document.querySelectorAll('.kst-check').forEach(c => c.checked = true)
window.clearAllTimes = () => document.querySelectorAll('.kst-check').forEach(c => c.checked = false)

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
                <div class="p-2 rounded-lg border border-border bg-white text-center peer-checked:bg-primary-light peer-checked:text-primary transition-all">
                    <p class="text-[10px] font-bold">${time}</p>
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
