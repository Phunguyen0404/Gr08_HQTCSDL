

const state = {
    roomTypes: []
};

const form = document.getElementById('roomTypeForm');
const roomTypeId = document.getElementById('roomTypeId');
const roomTypeName = document.getElementById('roomTypeName');
const roomTypePrice = document.getElementById('roomTypePrice');
const roomTypeCapacity = document.getElementById('roomTypeCapacity');
const roomTypeDescription = document.getElementById('roomTypeDescription');
const tableBody = document.getElementById('roomTypeTableBody');

function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(value);
}

async function loadRoomTypes() {
    try {
        state.roomTypes = await RoomTypeAPI.getAll();
        renderTable();
    } catch (error) {
        alert('Lỗi khi tải danh sách loại phòng: ' + error.message);
    }
}

function renderTable() {
    if (!state.roomTypes.length) {
        tableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">Chưa có loại phòng nào.</td>
      </tr>
    `;
        return;
    }

    tableBody.innerHTML = state.roomTypes.map(rt => `
    <tr>
      <td>${rt.id}</td>
      <td><strong>${rt.name}</strong></td>
      <td>${formatCurrency(rt.price)}</td>
      <td>${rt.capacity} người</td>
      <td>${rt.description || ''}</td>
      <td>
        <div class="action-group">
          <button type="button" class="icon-btn edit" data-action="edit" data-id="${rt.id}">Sửa</button>
          <button type="button" class="icon-btn delete" data-action="delete" data-id="${rt.id}">Xóa</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function resetForm() {
    form.reset();
    roomTypeId.value = '';
}

function fillForm(rt) {
    roomTypeId.value = rt.id;
    roomTypeName.value = rt.name;
    roomTypePrice.value = rt.price;
    roomTypeCapacity.value = rt.capacity;
    roomTypeDescription.value = rt.description || '';
}

async function handleSubmit(event) {
    event.preventDefault();

    const data = {
        name: roomTypeName.value.trim(),
        price: Number(roomTypePrice.value),
        capacity: Number(roomTypeCapacity.value),
        description: roomTypeDescription.value.trim()
    };

    if (!data.name) {
        alert('Vui lòng nhập tên loại phòng.');
        return;
    }

    const id = roomTypeId.value;

    try {
        if (id) {
            await RoomTypeAPI.update(id, data);
            alert('Cập nhật thành công!');
        } else {
            await RoomTypeAPI.create(data);
            alert('Thêm mới thành công!');
        }
        resetForm();
        loadRoomTypes();
    } catch (error) {
        alert('Lỗi: ' + error.message);
    }
}

async function handleTableClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === 'edit') {
        const rt = state.roomTypes.find(item => item.id === id);
        if (rt) {
            fillForm(rt);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
    }

    if (action === 'delete') {
        const confirmDelete = window.confirm(`Bạn có chắc muốn xóa loại phòng này?`);
        if (!confirmDelete) return;

        try {
            await RoomTypeAPI.delete(id);
            alert('Xóa thành công!');
            loadRoomTypes();
        } catch (error) {
            alert('Lỗi khi xóa: ' + error.message);
        }
    }
}

form.addEventListener('submit', handleSubmit);
tableBody.addEventListener('click', handleTableClick);

// Init
loadRoomTypes();
