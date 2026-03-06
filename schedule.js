import { supabase } from './supabase.js'

// ============================================
// STATE MANAGEMENT
// ============================================
let currentDate = new Date()
let selectedDate = null
let scheduleData = {} // Format: { "YYYY-MM-DD": { enabled: true, slots: [], bookings: [] } }
let timeSlots = []

// ============================================
// INITIALIZATION
// ============================================
async function init() {
    checkAuth()
    await loadScheduleData()
    renderCalendar()
    highlightActiveNav()
}

// ============================================
// AUTH CHECK
// ============================================
async function checkAuth() {
    const { data } = await supabase.auth.getSession()
    
    if (!data.session) {
        window.location.replace('login.html')
        return false
    }
    return true
}

// ============================================
// DATA FUNCTIONS
// ============================================
async function loadScheduleData() {
    // Simulate loading from Supabase - replace with actual API calls
    // const { data, error } = await supabase.from('schedule').select('*')
    
    // Mock data for demonstration
    const today = new Date().toISOString().split('T')[0]
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    
    scheduleData = {
        [today]: {
            enabled: true,
            slots: [
                { id: 1, kst: '09:00', wib: '07:00', maxOrders: 5, booked: 3, enabled: true },
                { id: 2, kst: '12:00', wib: '10:00', maxOrders: 5, booked: 5, enabled: true },
                { id: 3, kst: '18:00', wib: '16:00', maxOrders: 3, booked: 0, enabled: true },
                { id: 4, kst: '21:00', wib: '19:00', maxOrders: 5, booked: 1, enabled: false }
            ],
            bookings: [
                { id: 101, customer: 'sarah_kpopfan', product: 'UPICK Blue Jam x500', time: '09:00', status: 'confirmed' },
                { id: 102, customer: 'bts_army99', product: 'MY1PICK Heart x1000', time: '09:00', status: 'confirmed' },
                { id: 103, customer: 'blink_forever', product: 'IDOLCHAMP Ruby x200', time: '12:00', status: 'pending' }
            ]
        },
        [tomorrow]: {
            enabled: false,
            slots: [],
            bookings: []
        }
    }
}

function getDateKey(date) {
    return date.toISOString().split('T')[0]
}

// ============================================
// CALENDAR FUNCTIONS
// ============================================
function renderCalendar() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December']
    document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`
    
    // Get first day and days in month
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = new Date().toISOString().split('T')[0]
    
    // Generate calendar grid
    const grid = document.getElementById('calendar-grid')
    grid.innerHTML = ''
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div')
        empty.className = 'calendar-day empty'
        grid.appendChild(empty)
    }
    
    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        const dateKey = getDateKey(date)
        const dayData = scheduleData[dateKey] || { enabled: true, slots: [], bookings: [] }
        
        const cell = document.createElement('div')
        cell.className = 'calendar-day'
        cell.textContent = day
        
        // Check conditions
        const isToday = dateKey === today
        const isSelected = selectedDate && dateKey === getDateKey(selectedDate)
        const isDisabled = !dayData.enabled
        const hasSlots = dayData.slots.length > 0
        const hasBookings = dayData.bookings.length > 0
        
        // Apply classes
        if (isToday) cell.classList.add('today')
        if (isSelected) cell.classList.add('selected')
        if (isDisabled) cell.classList.add('disabled')
        else if (hasBookings) cell.classList.add('has-bookings')
        else if (hasSlots) cell.classList.add('available')
        
        // Slot indicator
        if (hasSlots && !isDisabled) {
            const indicator = document.createElement('span')
            indicator.className = 'slot-indicator'
            indicator.textContent = `${dayData.slots.length} slots`
            cell.appendChild(indicator)
        }
        
        // Click handler
        cell.onclick = () => {
            if (!isDisabled) selectDate(date)
        }
        
        grid.appendChild(cell)
    }
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta)
    renderCalendar()
}

function selectDate(date) {
    selectedDate = date
    renderCalendar()
    renderTimeSlots()
    updateDateDisplay()
}

function updateDateDisplay() {
    if (!selectedDate) return
    
    const dateKey = getDateKey(selectedDate)
    const dayData = scheduleData[dateKey] || { enabled: true, slots: [], bookings: [] }
    
    // Format date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    document.getElementById('selected-date-display').textContent = selectedDate.toLocaleDateString('en-US', options)
    
    // Update status
    const statusEl = document.getElementById('date-status-display')
    const toggleBtn = document.getElementById('date-toggle-btn')
    
    if (dayData.enabled) {
        statusEl.textContent = 'Date is enabled for bookings'
        statusEl.className = 'text-sm text-green-400 mt-1'
        toggleBtn.innerHTML = '<i class="fa-solid fa-power-off mr-2"></i>Disable Date'
        toggleBtn.classList.remove('bg-red-500/20', 'text-red-400')
        toggleBtn.classList.add('glass')
    } else {
        statusEl.textContent = 'Date is disabled'
        statusEl.className = 'text-sm text-red-400 mt-1'
        toggleBtn.innerHTML = '<i class="fa-solid fa-power-off mr-2"></i>Enable Date'
        toggleBtn.classList.remove('glass')
        toggleBtn.classList.add('bg-green-500/20', 'text-green-400')
    }
    
    // Update counters
    const totalSlots = dayData.slots.length
    const availableSlots = dayData.slots.filter(s => s.enabled && s.booked < s.maxOrders).length
    
    document.getElementById('total-slots').textContent = `${totalSlots} slots`
    document.getElementById('available-slots').textContent = `${availableSlots} available`
}

// ============================================
// TIME SLOTS FUNCTIONS
// ============================================
function renderTimeSlots() {
    const container = document.getElementById('time-slots-container')
    const bookingsSection = document.getElementById('bookings-section')
    const bookingsList = document.getElementById('bookings-list')
    
    if (!selectedDate) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-400">
                <i class="fa-solid fa-calendar-check text-5xl mb-4 block text-gray-600"></i>
                <p>Select a date to view time slots</p>
            </div>
        `
        bookingsSection.classList.add('hidden')
        return
    }
    
    const dateKey = getDateKey(selectedDate)
    const dayData = scheduleData[dateKey] || { enabled: true, slots: [], bookings: [] }
    
    if (!dayData.enabled) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-red-400">
                <i class="fa-solid fa-ban text-5xl mb-4 block"></i>
                <p>This date is disabled</p>
                <button onclick="toggleDateStatus()" class="mt-4 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition">
                    Enable Date
                </button>
            </div>
        `
        bookingsSection.classList.add('hidden')
        return
    }
    
    if (dayData.slots.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-400">
                <i class="fa-solid fa-clock text-5xl mb-4 block text-gray-600"></i>
                <p>No time slots for this date</p>
                <button onclick="openSlotModal()" class="mt-4 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition">
                    Add First Slot
                </button>
            </div>
        `
        bookingsSection.classList.add('hidden')
        return
    }
    
    // Sort slots by time
    const sortedSlots = [...dayData.slots].sort((a, b) => a.kst.localeCompare(b.kst))
    
    container.innerHTML = sortedSlots.map(slot => {
        const isFull = slot.booked >= slot.maxOrders
        const isDisabled = !slot.enabled
        
        let statusClass = 'available'
        if (isDisabled) statusClass = 'disabled'
        else if (isFull) statusClass = 'full'
        
        return `
            <div class="time-slot ${statusClass}" data-slot-id="${slot.id}">
                <div class="slot-status ${isDisabled ? 'disabled' : isFull ? 'booked' : 'available'}"></div>
                
                <div class="time-display">${slot.kst} <span class="text-gray-500">KST</span></div>
                <div class="timezone">${slot.wib} WIB</div>
                
                <div class="bookings-count">
                    <span class="${isFull ? 'text-yellow-400' : 'text-green-400'}">
                        ${slot.booked}/${slot.maxOrders} booked
                    </span>
                    <label class="slot-toggle">
                        <input type="checkbox" ${slot.enabled ? 'checked' : ''} onchange="toggleSlot(${slot.id})">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="actions">
                    <button onclick="editSlot(${slot.id})" class="bg-white/10 hover:bg-primary/20 text-primary">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button onclick="deleteSlot(${slot.id})" class="bg-white/10 hover:bg-red-500/20 text-red-400">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `
    }).join('')
    
    // Render bookings if any
    if (dayData.bookings.length > 0) {
        bookingsSection.classList.remove('hidden')
        bookingsList.innerHTML = dayData.bookings.map(booking => `
            <div class="booking-item">
                <div class="time-badge">${booking.time} KST</div>
                <div class="customer-info">
                    <div class="customer-name">${booking.customer}</div>
                    <div class="product-name">${booking.product}</div>
                </div>
                <span class="status-badge ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}">
                    ${booking.status}
                </span>
            </div>
        `).join('')
    } else {
        bookingsSection.classList.add('hidden')
    }
}

// ============================================
// MODAL FUNCTIONS
// ============================================
// Build KST checkbox grid
function buildCheckboxGrid() {
    const grid = document.getElementById('kst-checkbox-grid')
    if (!grid) return

    const dateKey = selectedDate ? getDateKey(selectedDate) : null
    const existingSlots = dateKey ? (scheduleData[dateKey]?.slots || []) : []
    const existingTimes = existingSlots.map(s => s.kst)

    grid.innerHTML = Array.from({ length: 24 }, (_, i) => {
        const kst = `${String(i).padStart(2, '0')}:00`
        const wibH = (i - 2 + 24) % 24
        const wib = `${String(wibH).padStart(2, '0')}:00`
        const alreadyAdded = existingTimes.includes(kst)

        return `
            <label class="kst-checkbox-item flex flex-col items-center gap-1 p-2 rounded-xl border cursor-pointer transition
                ${alreadyAdded ? 'border-white/5 bg-white/5 opacity-40 cursor-not-allowed' : 'border-white/10 bg-white/5 hover:border-primary/50 hover:bg-primary/10'}">
                <input type="checkbox" value="${kst}" data-wib="${wib}"
                    class="hidden peer" ${alreadyAdded ? 'disabled' : ''}
                    onchange="toggleCheckboxStyle(this)">
                <span class="text-xs font-bold font-mono peer-checked:text-primary">${kst}</span>
                <span class="text-[10px] text-gray-500">${wib} WIB</span>
            </label>
        `
    }).join('')
}

window.toggleCheckboxStyle = function(input) {
    const label = input.closest('label')
    if (input.checked) {
        label.classList.add('border-primary', 'bg-primary/20')
        label.classList.remove('border-white/10', 'bg-white/5')
    } else {
        label.classList.remove('border-primary', 'bg-primary/20')
        label.classList.add('border-white/10', 'bg-white/5')
    }
}

window.selectAllTimes = function() {
    document.querySelectorAll('#kst-checkbox-grid input[type="checkbox"]:not(:disabled)').forEach(cb => {
        cb.checked = true
        toggleCheckboxStyle(cb)
    })
}

window.clearAllTimes = function() {
    document.querySelectorAll('#kst-checkbox-grid input[type="checkbox"]:not(:disabled)').forEach(cb => {
        cb.checked = false
        toggleCheckboxStyle(cb)
    })
}

window.openSlotModal = function() {
    if (!selectedDate) {
        showToast('Please select a date first!')
        return
    }
    buildCheckboxGrid()
    document.getElementById('max-orders').value = 5
    document.getElementById('slot-modal').classList.remove('hidden')
}

window.closeSlotModal = function() {
    document.getElementById('slot-modal').classList.add('hidden')
}

window.saveTimeSlot = async function(e) {
    e.preventDefault()

    const checked = [...document.querySelectorAll('#kst-checkbox-grid input[type="checkbox"]:checked')]
    if (checked.length === 0) {
        showToast('Pilih minimal 1 waktu!')
        return
    }

    const maxOrders = parseInt(document.getElementById('max-orders').value)
    const dateKey = getDateKey(selectedDate)

    if (!scheduleData[dateKey]) {
        scheduleData[dateKey] = { enabled: true, slots: [], bookings: [] }
    }

    let added = 0
    checked.forEach(cb => {
        const kst = cb.value
        const wib = cb.dataset.wib
        const exists = scheduleData[dateKey].slots.find(s => s.kst === kst)
        if (!exists) {
            scheduleData[dateKey].slots.push({
                id: Date.now() + Math.random(),
                kst, wib, maxOrders, booked: 0, enabled: true
            })
            added++
        }
    })

    showToast(`${added} slot berhasil ditambahkan!`)
    closeSlotModal()
    renderCalendar()
    renderTimeSlots()
    updateDateDisplay()
}

// ============================================
// ACTIONS
// ============================================
window.toggleDateStatus = function() {
    if (!selectedDate) {
        showToast('Please select a date first!')
        return
    }
    
    const dateKey = getDateKey(selectedDate)
    if (!scheduleData[dateKey]) {
        scheduleData[dateKey] = { enabled: true, slots: [], bookings: [] }
    }
    
    scheduleData[dateKey].enabled = !scheduleData[dateKey].enabled
    showToast(`Date ${scheduleData[dateKey].enabled ? 'enabled' : 'disabled'}!`)
    
    renderCalendar()
    renderTimeSlots()
    updateDateDisplay()
}

window.toggleSlot = function(slotId) {
    const dateKey = getDateKey(selectedDate)
    const slot = scheduleData[dateKey]?.slots.find(s => s.id === slotId)
    if (slot) {
        slot.enabled = !slot.enabled
        showToast(`Slot ${slot.enabled ? 'enabled' : 'disabled'}!`)
        renderTimeSlots()
    }
}

window.editSlot = function(slotId) {
    openSlotModal(slotId)
}

window.deleteSlot = async function(slotId) {
    if (!confirm('Delete this time slot?')) return
    
    const dateKey = getDateKey(selectedDate)
    if (scheduleData[dateKey]) {
        scheduleData[dateKey].slots = scheduleData[dateKey].slots.filter(s => s.id !== slotId)
        showToast('Time slot deleted!')
        renderCalendar()
        renderTimeSlots()
        updateDateDisplay()
    }
}

// ============================================
// GLOBAL EXPORTS
// ============================================
window.changeMonth = changeMonth
window.logout = function() {
    localStorage.removeItem('dreamsvote_remember')
    sessionStorage.removeItem('dreamsvote_session')
    window.location.href = 'login.html'
}
window.toggleMobileMenu = function() {
    document.getElementById('mobile-menu').classList.toggle('hidden')
}
window.showToast = function(message) {
    const toast = document.getElementById('toast')
    document.getElementById('toast-message').textContent = message
    toast.classList.remove('translate-y-20', 'opacity-0')
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000)
}

function highlightActiveNav() {
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '')
    document.querySelectorAll('.sidebar-link').forEach(link => {
        if (link.id === `nav-${currentPage}`) {
            link.classList.add('active', 'bg-primary/20', 'text-primary', 'border-l-2', 'border-primary')
            link.classList.remove('text-gray-300')
        }
    })
}

// ============================================
// EVENT LISTENERS
// ============================================
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSlotModal()
})

document.addEventListener('DOMContentLoaded', init)
