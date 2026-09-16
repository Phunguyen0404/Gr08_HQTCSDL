

const state = {
    rooms: [],
    roomTypes: [],
    search: '',
    filter: 'all',
    sortBy: 'code-asc',
    availabilityCheckMode: false // true if we are showing only available rooms
};

const form = document.getElementById('roomForm');
const roomId = document.getElementById('roomId');
const roomCode = document.getElementById('roomCode');
const roomName = document.getElementById('roomName');
const roomType = document.getElementById('roomType');
const roomPrice = document.getElementById('roomPrice');
const roomStatus = document.getElementById('roomStatus');
const roomCapacity = document.getElementById('roomCapacity');
const roomNote = document.getElementById('roomNote');
const tableBody = document.getElementById('roomTableBody');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const sortSelect = document.getElementById('sortSelect');

// Availability Check Form
const checkAvailabilityForm = document.getElementById('checkAvailabilityForm');
const checkInDate = document.getElementById('checkInDate');
const checkOutDate = document.getElementById('checkOutDate');
const resetCheckAvailabilityBtn = document.getElementById('resetCheckAvailability');

function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value);
}

function getStatusClass(status) {
    const map = {
        Trống: 'badge-trong',
        'Đang thuê': 'badge-dang-thue',
        'Bảo trì': 'badge-bao-tri',
        'Đặt trước': 'badge-dat-truoc'
    };
    return map[status] || 'badge-trong';
}

async function loadData() {
    try {
        const [rooms, roomTypes] = await Promise.all([
            RoomAPI.getAll(),
            RoomTypeAPI.getAll()
        ]);

        state.rooms = rooms;
        state.roomTypes = roomTypes;

        populateRoomTypesDropdown();
        render();
    } catch (error) {
        alert('Lỗi khi tải dữ liệu: ' + error.message);
    }
}

function populateRoomTypesDropdown() {
    roomType.innerHTML = '<option value="" disabled selected>-- Chọn loại phòng --</option>';
    state.roomTypes.forEach(rt => {
        const option = document.createElement('option');
        option.value = rt.id;
        option.textContent = rt.name;
        // store default price & capacity for auto-fill
        option.dataset.price = rt.price;
        option.dataset.capacity = rt.capacity;
        roomType.appendChild(option);
    });
}

// Auto-fill price and capacity when room type changes
roomType.addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    if (selectedOption && selectedOption.dataset.price) {
        roomPrice.value = selectedOption.dataset.price;
        roomCapacity.value = selectedOption.dataset.capacity;
    }
});

function renderStats() {
    const total = state.rooms.length;
    const available = state.rooms.filter(room => room.status === 'Trống').length;
    const occupied = state.rooms.filter(room => room.status === 'Đang thuê').length;
    const maintenance = state.rooms.filter(room => room.status === 'Bảo trì').length;

    document.getElementById('totalRooms').textContent = String(total);
    document.getElementById('availableRooms').textContent = String(available);
    document.getElementById('occupiedRooms').textContent = String(occupied);
    document.getElementById('maintenanceRooms').textContent = String(maintenance);
}

function sortRooms(rooms) {
    const [field, direction] = state.sortBy.split('-');

    const sorted = [...rooms].sort((a, b) => {
        let result = 0;

        if (field === 'price') {
            result = a.price - b.price;
        } else if (field === 'capacity') {
            result = a.capacity - b.capacity;
        } else if (field === 'status') {
            const statusOrder = {
                Trống: 1,
                'Đang thuê': 2,
                'Đặt trước': 3,
                'Bảo trì': 4
            };
            result = statusOrder[a.status] - statusOrder[b.status];
        } else if (field === 'name') {
            result = a.name.localeCompare(b.name, 'vi');
        } else {
            result = a.code.localeCompare(b.code, 'en');
        }

        return direction === 'asc' ? result : -result;
    });

    return sorted;
}

function renderTable() {
    const filteredRooms = state.rooms.filter(room => {
        const searchText = `${room.code} ${room.name}`.toLowerCase();
        const matchSearch = searchText.includes(state.search.toLowerCase());
        const matchFilter = state.filter === 'all' || room.status === state.filter;
        return matchSearch && matchFilter;
    });

    const sortedRooms = sortRooms(filteredRooms);

    if (!sortedRooms.length) {
        let msg = "Không có phòng nào phù hợp.";
        if (state.availabilityCheckMode) {
            msg = "Không tìm thấy phòng trống trong khoảng thời gian này.";
        }
        tableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">${msg}</td>
      </tr>
    `;
        return;
    }

    tableBody.innerHTML = sortedRooms.map(room => {
        // Resolve room type name if we have the id
        let typeName = room.roomType;
        if (room.roomTypeId) {
            const rt = state.roomTypes.find(t => t.id == room.roomTypeId);
            if (rt) typeName = rt.name;
        }

        return `
    <tr>
      <td>${room.code}</td>
      <td>${room.name}</td>
      <td>${typeName || ''}</td>
      <td>${formatCurrency(room.price)}</td>
      <td>${room.capacity} người</td>
      <td><span class="badge ${getStatusClass(room.status)}">${room.status}</span></td>
      <td>
        <div class="action-group">
          <button type="button" class="icon-btn edit" data-action="edit" data-id="${room.id}">Sửa</button>
          <button type="button" class="icon-btn delete" data-action="delete" data-id="${room.id}">Xóa</button>
        </div>
      </td>
    </tr>
  `}).join('');
}

function resetForm() {
    form.reset();
    roomId.value = '';
    roomType.value = '';
    roomStatus.value = 'Trống';
}

function fillForm(room) {
    roomId.value = room.id;
    roomCode.value = room.code;
    roomName.value = room.name;
    roomType.value = room.roomTypeId || '';
    roomPrice.value = room.price;
    roomStatus.value = room.status;
    roomCapacity.value = room.capacity;
    roomNote.value = room.note || '';
}

function render() {
    if (!state.availabilityCheckMode) {
        renderStats();
    }
    renderTable();
}

async function handleSubmit(event) {
    event.preventDefault();

    const selectedType = roomType.options[roomType.selectedIndex];

    const data = {
        code: roomCode.value.trim(),
        name: roomName.value.trim(),
        roomTypeId: Number(roomType.value),
        roomType: selectedType ? selectedType.text : '',
        price: Number(roomPrice.value),
        status: roomStatus.value,
        capacity: Number(roomCapacity.value),
        note: roomNote.value.trim()
    };

    if (!data.code || !data.name || !data.price || !data.capacity || !data.roomTypeId) {
        alert('Vui lòng nhập đầy đủ thông tin phòng (Mã, Tên, Loại, Giá, Sức chứa).');
        return;
    }

    const id = roomId.value;

    try {
        if (id) {
            await RoomAPI.update(id, data);
            alert('Cập nhật phòng thành công!');
        } else {
            await RoomAPI.create(data);
            alert('Thêm mới phòng thành công!');
        }
        resetForm();
        if (!state.availabilityCheckMode) {
            loadData();
        } else {
            // If in check mode, better to reset everything to see new room normally
            resetAvailabilityCheck();
        }
    } catch (error) {
        alert('Lỗi: ' + error.message);
    }
}

async function handleTableClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const roomIdValue = button.dataset.id;
    const room = state.rooms.find(item => item.id == roomIdValue);
    if (!room) return;

    const action = button.dataset.action;

    if (action === 'edit') {
        fillForm(room);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    if (action === 'delete') {
        const confirmDelete = window.confirm(`Bạn có muốn xóa phòng ${room.name}?`);
        if (!confirmDelete) return;

        try {
            await RoomAPI.delete(roomIdValue);
            alert('Xóa phòng thành công!');
            if (!state.availabilityCheckMode) {
                loadData();
            } else {
                state.rooms = state.rooms.filter(item => item.id != roomIdValue);
                render();
            }
        } catch (error) {
            alert('Lỗi khi xóa: ' + error.message);
        }
    }
}

// Availability Functions
async function handleCheckAvailability(event) {
    event.preventDefault();
    const cin = checkInDate.value;
    const cout = checkOutDate.value;

    if (!cin || !cout) return;

    try {
        const availableRooms = await RoomAPI.getAvailable(cin, cout);
        state.rooms = availableRooms;
        state.availabilityCheckMode = true;

        // Hide stats if in check mode
        const statsPanel = document.querySelector('.staff-stats');
        if (statsPanel) {
            statsPanel.style.opacity = '0.5';
        }

        resetCheckAvailabilityBtn.style.display = 'inline-block';
        renderTable();
        alert(`Tìm thấy ${availableRooms.length} phòng trống.`);
    } catch (error) {
        alert('Lỗi khi kiểm tra: ' + error.message);
    }
}

function resetAvailabilityCheck() {
    checkAvailabilityForm.reset();
    resetCheckAvailabilityBtn.style.display = 'none';
    state.availabilityCheckMode = false;
    const statsPanel = document.querySelector('.staff-stats');
    if (statsPanel) {
        statsPanel.style.opacity = '1';
    }
    loadData();
}

function handleSearch(event) {
    state.search = event.target.value;
    renderTable();
}

function handleFilter(event) {
    state.filter = event.target.value;
    renderTable();
}

function handleSort(event) {
    state.sortBy = event.target.value;
    renderTable();
}

searchInput.addEventListener('input', handleSearch);
statusFilter.addEventListener('change', handleFilter);
sortSelect.addEventListener('change', handleSort);
form.addEventListener('submit', handleSubmit);
form.addEventListener('reset', () => {
    setTimeout(() => {
        roomType.value = '';
        roomStatus.value = 'Trống';
        roomCapacity.value = 2;
    }, 0);
});
tableBody.addEventListener('click', handleTableClick);

checkAvailabilityForm.addEventListener('submit', handleCheckAvailability);
resetCheckAvailabilityBtn.addEventListener('click', resetAvailabilityCheck);

// Init
resetForm();
loadData();
