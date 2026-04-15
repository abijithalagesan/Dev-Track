// Ensure user is authenticated as Admin
if (!checkAuth('admin')) {
    throw new Error('Unauthenticated or unauthorized');
}

const statusFilterBtn = document.getElementById('status-filter');
const submissionsList = document.getElementById('submissions-list');

// Task Modal elements
const taskModal = document.getElementById('task-modal');
const taskModalContent = document.getElementById('task-modal-content');
const createTaskForm = document.getElementById('create-task-form');

// Verify Modal elements
const verifyModal = document.getElementById('verify-modal');
const verifyModalContent = document.getElementById('verify-modal-content');
const verifyForm = document.getElementById('verify-form');
const verifySubId = document.getElementById('verify-sub-id');
const verifyStatus = document.getElementById('verify-status');
const verifyFeedback = document.getElementById('verify-feedback');
const verifySubmitBtn = document.getElementById('verify-submit-btn');

async function initAdmin() {
    statusFilterBtn.addEventListener('change', () => {
        loadSubmissions(statusFilterBtn.value);
    });

    await loadStats();
    await loadSubmissions('pending');
}

async function loadStats() {
    try {
        const stats = await apiFetch('/admin/stats');
        document.getElementById('stat-users').textContent = stats.totalUsers;
        document.getElementById('stat-completed').textContent = stats.totalTasksCompleted;
        document.getElementById('stat-pending').textContent = stats.pendingApprovals;
    } catch (e) {
        console.error('Failed to load stats', e);
    }
}

async function loadSubmissions(status = '') {
    submissionsList.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i> Loading...</td></tr>';

    try {
        const query = status ? `?status=${status}` : '';
        const subs = await apiFetch(`/admin/submissions${query}`);

        if (subs.length === 0) {
            submissionsList.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-gray-500">No submissions found.</td></tr>';
            return;
        }

        renderSubmissions(subs);
    } catch (error) {
        submissionsList.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-red-400">Error: ${error.message}</td></tr>`;
    }
}

function renderSubmissions(subs) {
    submissionsList.innerHTML = '';

    subs.forEach(sub => {
        let statusBadge = '';
        if (sub.status === 'pending') statusBadge = '<span class="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 w-inline-block"><i class="fas fa-clock mr-1"></i> Pending</span>';
        else if (sub.status === 'approved') statusBadge = '<span class="px-2.5 py-1 text-xs font-semibold rounded-md bg-secondary/20 text-secondary border border-secondary/30 w-inline-block"><i class="fas fa-check mr-1"></i> Approved</span>';
        else if (sub.status === 'rejected') statusBadge = '<span class="px-2.5 py-1 text-xs font-semibold rounded-md bg-red-500/20 text-red-400 border border-red-500/30 w-inline-block"><i class="fas fa-times mr-1"></i> Rejected</span>';

        // Check if proof is a URL or uploaded file
        let proofHtml = sub.proof;
        const urlRegex = /^(http|https):\/\/[^ "]+$/;
        
        if (sub.proof && sub.proof.startsWith('/uploads/')) {
            proofHtml = `<a href="${sub.proof}" target="_blank" class="px-3 py-1.5 bg-primary/20 text-primary hover:bg-primary/30 rounded-lg transition-colors inline-flex items-center"><i class="fas fa-image mr-2"></i> View Image</a>`;
        } else if (urlRegex.test(sub.proof.trim())) {
            proofHtml = `<a href="${sub.proof.trim()}" target="_blank" class="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center"><i class="fas fa-external-link-alt mr-1 text-xs"></i> View Link</a>`;
        } else if (sub.proof.length > 50) {
            proofHtml = `<span title="${sub.proof.replace(/"/g, '&quot;')}">${sub.proof.substring(0, 50)}...</span>`;
        }

        if (sub.githubValidation && sub.githubValidation.status !== 'none') {
            const v = sub.githubValidation;
            let vClass = v.status === 'valid' ? 'text-emerald-400' : v.status === 'pending' ? 'text-blue-400' : 'text-red-400';
            let vIcon = v.status === 'valid' ? 'fa-check-circle' : v.status === 'pending' ? 'fa-clock' : 'fa-exclamation-circle';
            proofHtml += `<div class="mt-2 text-xs font-medium ${vClass}"><i class="fas ${vIcon} mr-1"></i> GitHub <span>${v.status.charAt(0).toUpperCase() + v.status.slice(1)}</span></div>`;
            if (v.status === 'valid' && v.repoDetails) {
                 proofHtml += `<div class="text-[10px] text-gray-500 mt-1"><i class="fas fa-star text-yellow-500/80 mr-1"></i>${v.repoDetails.stars || 0} stars <span class="mx-1">•</span> <i class="fas fa-history mr-1"></i>Last push: ${new Date(v.repoDetails.lastCommit).toLocaleDateString()}</div>`;
            } else if (v.message) {
                 proofHtml += `<div class="text-[10px] text-red-400/80 mt-1">${v.message}</div>`;
            }
        }

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-800/40 transition-colors group';
        tr.innerHTML = `
            <td class="p-4">
                <div class="font-medium text-white">${sub.user?.name || 'Unknown'}</div>
                <div class="text-xs text-gray-400 mt-0.5">${sub.user?.email || ''}</div>
            </td>
            <td class="p-4 font-medium text-gray-200">${sub.task?.title || 'Unknown Task'}</td>
            <td class="p-4"><span class="text-[10px] uppercase tracking-wider font-bold bg-gray-800 px-2.5 py-1 rounded text-gray-300 border border-gray-700">${sub.task?.type || '-'}</span></td>
            <td class="p-4 text-gray-300">
                ${proofHtml}
            </td>
            <td class="p-4">${statusBadge}</td>
            <td class="p-4 text-right">
                ${sub.status === 'pending' ? `
                    <div class="flex justify-end space-x-2">
                        <button onclick="promptVerify('${sub._id}', 'approved')" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-secondary hover:bg-secondary/10 rounded-lg transition-colors border border-transparent hover:border-secondary/30" title="Approve"><i class="fas fa-check"></i></button>
                        <button onclick="promptVerify('${sub._id}', 'rejected')" class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/30" title="Reject"><i class="fas fa-times"></i></button>
                    </div>
                ` : `<span class="text-xs text-gray-500 font-medium bg-gray-800/50 px-2 py-1 rounded border border-gray-700">Processed</span>`}
            </td>
        `;
        submissionsList.appendChild(tr);
    });
}

// ------ Task Creation ------

async function openTaskModal() {
    document.getElementById('create-task-form').reset();
    
    // Load students for assignment checkboxes
    const assignContainer = document.getElementById('assign-checkbox-list');
    assignContainer.innerHTML = '<label class="flex items-center space-x-2 text-sm text-gray-400"><i class="fas fa-spinner fa-spin"></i> <span>Loading students...</span></label>';

    try {
        // allStudents is declared in the global scope later in the file for attendance, but if it's empty, fetch here
        if (typeof allStudents === 'undefined' || allStudents.length === 0) {
            // we will just fetch it directly to be safe, caching as needed
            if(typeof window.adminUsersCache === 'undefined') {
                window.adminUsersCache = await apiFetch('/admin/users');
            }
        } else {
             window.adminUsersCache = allStudents;
        }
        
        const usersToRender = window.adminUsersCache || [];
        
        if (usersToRender.length === 0) {
            assignContainer.innerHTML = '<p class="text-sm text-gray-500 px-2 my-1">No students available.</p>';
        } else {
            assignContainer.innerHTML = usersToRender.map(student => `
                <label class="flex items-center space-x-3 cursor-pointer p-1.5 rounded-lg hover:bg-gray-800/60 transition-colors">
                    <input type="checkbox" name="assign_users" value="${student._id}" class="w-4 h-4 text-primary bg-darkBg border-gray-600 rounded focus:ring-primary focus:ring-2">
                    <span class="text-sm text-gray-300 font-medium">${student.name} <span class="text-xs text-gray-500 font-normal ml-1 hidden sm:inline-block">(${student.email})</span></span>
                </label>
            `).join('');
        }
    } catch(err) {
        assignContainer.innerHTML = '<p class="text-sm text-red-400">Failed to load students.</p>';
    }

    taskModal.classList.remove('hidden');
    taskModal.classList.add('flex');
    setTimeout(() => {
        taskModalContent.classList.remove('scale-95', 'opacity-0');
        taskModalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeTaskModal() {
    taskModalContent.classList.remove('scale-100', 'opacity-100');
    taskModalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        taskModal.classList.add('hidden');
        taskModal.classList.remove('flex');
    }, 300);
}

createTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('task-submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating...';

    const checkedBoxes = document.querySelectorAll('input[name="assign_users"]:checked');
    const assignedTo = Array.from(checkedBoxes).map(cb => cb.value);

    try {
        await apiFetch('/admin/tasks', {
            method: 'POST',
            body: JSON.stringify({
                title: document.getElementById('task-title').value,
                type: document.getElementById('task-type').value,
                description: document.getElementById('task-desc').value,
                day: document.getElementById('task-day').value || null,
                assignedTo: assignedTo // Empty array means global assignment
            })
        });
        closeTaskModal();
    } catch (err) {
        alert(err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Create Task';
    }
});

// ------ Student Creation ------
const studentModal = document.getElementById('student-modal');
const studentModalContent = document.getElementById('student-modal-content');
const createStudentForm = document.getElementById('create-student-form');

function openStudentModal() {
    createStudentForm.reset();
    studentModal.classList.remove('hidden');
    studentModal.classList.add('flex');
    setTimeout(() => {
        studentModalContent.classList.remove('scale-95', 'opacity-0');
        studentModalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeStudentModal() {
    studentModalContent.classList.remove('scale-100', 'opacity-100');
    studentModalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        studentModal.classList.add('hidden');
        studentModal.classList.remove('flex');
    }, 300);
}

createStudentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('student-submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Creating...';

    try {
        await apiFetch('/admin/users', {
            method: 'POST',
            body: JSON.stringify({
                name: document.getElementById('student-name').value,
                email: document.getElementById('student-email').value,
                password: document.getElementById('student-password').value
            })
        });
        
        // Clear caches so the new student appears in attendance/assign lists
        if (typeof allStudents !== 'undefined') allStudents = [];
        window.adminUsersCache = undefined;
        if (typeof loadStats === 'function') loadStats(); // Re-fetch total users number

        closeStudentModal();
        alert('Student account created successfully!');
    } catch (err) {
        alert(err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Create Account';
    }
});

// ------ Verification Flow ------

function promptVerify(id, status) {
    verifySubId.value = id;
    verifyStatus.value = status;
    verifyFeedback.value = '';

    if (status === 'approved') {
        verifySubmitBtn.className = 'px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg bg-secondary hover:bg-green-600 focus:ring-4 focus:ring-secondary/30 transition-colors flex items-center';
        verifySubmitBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Approve';
    } else {
        verifySubmitBtn.className = 'px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-lg bg-red-500 hover:bg-red-600 focus:ring-4 focus:ring-red-500/30 transition-colors flex items-center';
        verifySubmitBtn.innerHTML = '<i class="fas fa-times-circle mr-2"></i> Reject';
    }

    verifyModal.classList.remove('hidden');
    verifyModal.classList.add('flex');
    setTimeout(() => {
        verifyModalContent.classList.remove('scale-95', 'opacity-0');
        verifyModalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeVerifyModal() {
    verifyModalContent.classList.remove('scale-100', 'opacity-100');
    verifyModalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        verifyModal.classList.add('hidden');
        verifyModal.classList.remove('flex');
    }, 300);
}

verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    verifySubmitBtn.disabled = true;
    const originalContent = verifySubmitBtn.innerHTML;
    verifySubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';

    try {
        await apiFetch(`/admin/submissions/${verifySubId.value}`, {
            method: 'PUT',
            body: JSON.stringify({
                status: verifyStatus.value,
                feedback: verifyFeedback.value
            })
        });

        closeVerifyModal();
        await loadStats();
        await loadSubmissions(statusFilterBtn.value);
    } catch (err) {
        alert(err.message);
    } finally {
        verifySubmitBtn.disabled = false;
        verifySubmitBtn.innerHTML = originalContent;
    }
});

initAdmin();

// --- Attendance Module ---
const panelVerification = document.getElementById('panel-verification');
const panelAttendance = document.getElementById('panel-attendance');
const navVerification = document.getElementById('nav-verification');
const navAttendance = document.getElementById('nav-attendance');

window.switchTab = function (tab) {
    if (tab === 'verification') {
        panelVerification.classList.remove('hidden');
        panelAttendance.classList.add('hidden');
        navVerification.className = 'flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-500/20 text-red-500 font-medium transition-colors';
        navAttendance.className = 'flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-cardHover hover:text-white transition-colors';
    } else {
        panelVerification.classList.add('hidden');
        panelAttendance.classList.remove('hidden');
        navAttendance.className = 'flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-500/20 text-red-500 font-medium transition-colors';
        navVerification.className = 'flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-cardHover hover:text-white transition-colors';
        loadAttendanceView();
    }
};

const attendanceDateInput = document.getElementById('attendance-date');
const attendanceList = document.getElementById('attendance-list');
const saveAttendanceBtn = document.getElementById('save-attendance-btn');

let allStudents = [];
let currentAttendance = [];

if (attendanceDateInput) attendanceDateInput.addEventListener('change', loadAttendanceData);

async function loadAttendanceView() {
    if (!attendanceDateInput.value) {
        attendanceDateInput.value = new Date().toISOString().split('T')[0];
    }
    if (allStudents.length === 0) {
        try {
            allStudents = await apiFetch('/admin/users');
        } catch (e) {
            console.error('Failed to load students', e);
        }
    }
    loadAttendanceData();
}

async function loadAttendanceData() {
    attendanceList.innerHTML = '<tr><td colspan="3" class="p-8 text-center text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i> Loading data...</td></tr>';
    const date = attendanceDateInput.value;
    try {
        currentAttendance = await apiFetch(`/admin/attendance?date=${date}`);
        renderAttendance();
    } catch (e) {
        attendanceList.innerHTML = `<tr><td colspan="3" class="p-8 text-center text-red-400">Error: ${e.message}</td></tr>`;
    }
}

function renderAttendance() {
    attendanceList.innerHTML = '';
    if (allStudents.length === 0) {
        attendanceList.innerHTML = '<tr><td colspan="3" class="p-8 text-center text-gray-500">No students registered yet.</td></tr>';
        return;
    }

    allStudents.forEach(student => {
        const record = currentAttendance.find(a => a.user && (a.user._id === student._id || a.user === student._id));
        const status = record ? record.status : 'none';

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-800/40 transition-colors group';

        tr.innerHTML = `
            <td class="p-4 font-medium text-white">${student.name}</td>
            <td class="p-4 text-gray-400 text-sm">${student.email}</td>
            <td class="p-4 text-center">
                <div class="inline-flex rounded-lg border border-gray-600 p-1 bg-darkBg">
                    <label class="cursor-pointer relative">
                        <input type="radio" name="att_${student._id}" value="present" class="peer sr-only" ${status === 'present' ? 'checked' : ''}>
                        <div class="px-3 py-1.5 text-sm rounded-md peer-checked:bg-secondary/20 peer-checked:text-secondary text-gray-500 font-medium transition-colors hover:text-gray-300">Present</div>
                    </label>
                    <label class="cursor-pointer relative">
                        <input type="radio" name="att_${student._id}" value="absent" class="peer sr-only" ${status === 'absent' ? 'checked' : ''}>
                        <div class="px-3 py-1.5 text-sm rounded-md peer-checked:bg-red-500/20 peer-checked:text-red-400 text-gray-500 font-medium transition-colors hover:text-gray-300">Absent</div>
                    </label>
                    <label class="cursor-pointer relative">
                        <input type="radio" name="att_${student._id}" value="late" class="peer sr-only" ${status === 'late' ? 'checked' : ''}>
                        <div class="px-3 py-1.5 text-sm rounded-md peer-checked:bg-accent/20 peer-checked:text-accent text-gray-500 font-medium transition-colors hover:text-gray-300">Late</div>
                    </label>
                    <label class="cursor-pointer relative">
                        <input type="radio" name="att_${student._id}" value="none" class="peer sr-only" ${status === 'none' ? 'checked' : ''}>
                        <div class="px-3 py-1.5 text-sm rounded-md peer-checked:bg-gray-700 text-gray-500 font-medium transition-colors hover:text-gray-300">None</div>
                    </label>
                </div>
            </td>
        `;
        attendanceList.appendChild(tr);
    });
}

window.saveAttendance = async function () {
    const date = attendanceDateInput.value;
    if (!date) return alert('Please select a date');

    saveAttendanceBtn.disabled = true;
    const ogHtml = saveAttendanceBtn.innerHTML;
    saveAttendanceBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';

    const records = [];
    allStudents.forEach(student => {
        const selected = document.querySelector(`input[name="att_${student._id}"]:checked`);
        if (selected) {
            records.push({ userId: student._id, status: selected.value });
        }
    });

    try {
        await apiFetch('/admin/attendance', { method: 'POST', body: JSON.stringify({ date, records }) });
        saveAttendanceBtn.innerHTML = '<i class="fas fa-check mr-2"></i> Saved!';
        saveAttendanceBtn.classList.replace('bg-secondary', 'bg-blue-500');
        setTimeout(() => {
            saveAttendanceBtn.innerHTML = ogHtml;
            saveAttendanceBtn.classList.replace('bg-blue-500', 'bg-secondary');
            saveAttendanceBtn.disabled = false;
        }, 2000);
    } catch (e) {
        alert(e.message);
        saveAttendanceBtn.innerHTML = ogHtml;
        saveAttendanceBtn.disabled = false;
    }
};
