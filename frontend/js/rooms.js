const initialRooms = [
    {
        id: 1,
        code: 'P101',
        name: 'Phòng Deluxe 101',
        type: 'Deluxe',
        price: 1200000,
        capacity: 2,
        status: 'Trống',
        note: 'View hướng hồ bơi'
    },
    {
        id: 2,
        code: 'P102',
        name: 'Phòng Standard 102',
        type: 'Standard',
        price: 850000,
        capacity: 2,
        status: 'Đang thuê',
        note: 'Phòng cho 2 người'
    },
    {
        id: 3,
        code: 'P201',
        name: 'Phòng Suite 201',
        type: 'Suite',
        price: 2200000,
        capacity: 4,
        status: 'Đặt trước',
        note: 'Cho gia đình'
    },
    {
        id: 4,
        code: 'P205',
        name: 'Phòng Family 205',
        type: 'Family',
        price: 1800000,
        capacity: 5,
        status: 'Bảo trì',
        note: 'Đang sửa máy lạnh'
    },
    {
        id: 5,
        code: 'P202',
        name: 'Phòng Standard 202',
        type: 'Standard',
        price: 900000,
        capacity: 2,
        status: 'Trống',
        note: 'Gần thang máy'
    },
    {
        id: 6,
        code: 'P203',
        name: 'Phòng Deluxe 203',
        type: 'Deluxe',
        price: 1350000,
        capacity: 3,
        status: 'Đang thuê',
        note: 'Có giường king size'
    },
    {
        id: 7,
        code: 'P301',
        name: 'Phòng VIP 301',
        type: 'VIP',
        price: 3200000,
        capacity: 2,
        status: 'Trống',
        note: 'Phòng cao cấp'
    },
    {
        id: 8,
        code: 'P302',
        name: 'Phòng Family 302',
        type: 'Family',
        price: 1950000,
        capacity: 4,
        status: 'Đặt trước',
        note: 'Phù hợp gia đình lớn'
    },
    {
        id: 9,
        code: 'P303',
        name: 'Phòng Suite 303',
        type: 'Suite',
        price: 2500000,
        capacity: 3,
        status: 'Bảo trì',
        note: 'Sửa tủ lạnh'
    },
    {
        id: 10,
        code: 'P401',
        name: 'Phòng Standard 401',
        type: 'Standard',
        price: 950000,
        capacity: 2,
        status: 'Trống',
        note: 'Phòng gần hồ bơi'
    }
];

const state = {
    rooms: [...initialRooms],
    search: '',
    filter: 'all',
    sortBy: 'code-asc'
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
        tableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">Không có phòng nào phù hợp.</td>
      </tr>
    `;
        return;
    }

    tableBody.innerHTML = sortedRooms.map(room => `
    <tr>
      <td>${room.code}</td>
      <td>${room.name}</td>
      <td>${room.type}</td>
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
  `).join('');
}

function resetForm() {
    form.reset();
    roomId.value = '';
    roomType.value = 'Standard';
    roomStatus.value = 'Trống';
    roomCapacity.value = 2;
}

function fillForm(room) {
    roomId.value = room.id;
    roomCode.value = room.code;
    roomName.value = room.name;
    roomType.value = room.type;
    roomPrice.value = room.price;
    roomStatus.value = room.status;
    roomCapacity.value = room.capacity;
    roomNote.value = room.note || '';
}

function render() {
    renderStats();
    renderTable();
}

function handleSubmit(event) {
    event.preventDefault();

    const data = {
        code: roomCode.value.trim(),
        name: roomName.value.trim(),
        type: roomType.value,
        price: Number(roomPrice.value),
        status: roomStatus.value,
        capacity: Number(roomCapacity.value),
        note: roomNote.value.trim()
    };

    if (!data.code || !data.name || !data.price || !data.capacity) {
        alert('Vui lòng nhập đầy đủ thông tin phòng.');
        return;
    }

    const id = roomId.value;

    if (id) {
        state.rooms = state.rooms.map(room =>
            room.id === Number(id) ? { ...room, ...data } : room
        );
    } else {
        state.rooms.unshift({
            id: Date.now(),
            ...data
        });
    }

    resetForm();
    render();
}

function handleTableClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const roomIdValue = Number(button.dataset.id);
    const room = state.rooms.find(item => item.id === roomIdValue);
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

        state.rooms = state.rooms.filter(item => item.id !== roomIdValue);
        render();
    }
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
        roomType.value = 'Standard';
        roomStatus.value = 'Trống';
        roomCapacity.value = 2;
    }, 0);
});
tableBody.addEventListener('click', handleTableClick);

resetForm();
render();
