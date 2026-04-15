// Ensure user is authenticated
if (!checkAuth()) {
    throw new Error('Unauthenticated');
}

const user = getUser();
let currentTabType = 'daily';
let allSubmissions = [];

// DOM Elements
const greetingEl = document.getElementById('greeting');
const dateEl = document.getElementById('current-date');
const avatarEl = document.getElementById('user-avatar');
const adminLink = document.getElementById('admin-link');

const tasksContainer = document.getElementById('tasks-container');
const tabs = document.querySelectorAll('.tab-btn');

const modal = document.getElementById('submit-modal');
const modalContent = document.getElementById('submit-modal-content');
const submissionForm = document.getElementById('submission-form');
const proofInput = document.getElementById('proof-input');
const modalTaskId = document.getElementById('modal-task-id');
const modalTaskTitle = document.getElementById('modal-task-title');
const modalError = document.getElementById('modal-error');
const modalSubmitBtn = document.getElementById('modal-submit-btn');

// Initialize Dashboard
async function initDashboard() {
    // Setup Header
    greetingEl.textContent = `Welcome back, ${user.name.split(' ')[0]}!`;
    dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    avatarEl.textContent = user.name.charAt(0).toUpperCase();

    if (user.role === 'admin') {
        adminLink.classList.remove('hidden');
        adminLink.classList.add('flex');
    }

    // Bind Tab clicks
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => {
                t.classList.remove('active', 'text-primary', 'border-b-2', 'border-primary');
                t.classList.add('text-gray-400');
            });
            const clicked = e.target;
            clicked.classList.remove('text-gray-400');
            clicked.classList.add('active', 'text-primary', 'border-b-2', 'border-primary');

            currentTabType = clicked.dataset.type;
            loadTasks();
        });
    });

    // Load initial data
    await loadMetrics();
    await loadTasks();
}

async function loadMetrics() {
    try {
        const userData = await apiFetch('/auth/me');
        document.getElementById('streak-count').textContent = `${userData.streak || 0} Days`;

        allSubmissions = await apiFetch('/submissions/me');

        const approvedCount = allSubmissions.filter(s => s.status === 'approved').length;
        const pendingCount = allSubmissions.filter(s => s.status === 'pending').length;

        document.getElementById('approved-count').textContent = approvedCount;
        document.getElementById('pending-count').textContent = pendingCount;
    } catch (error) {
        console.error('Failed to load metrics', error);
    }
}

async function loadTasks() {
    tasksContainer.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i> Loading data...</div>';

    if (currentTabType === 'attendance') {
        try {
            const records = await apiFetch('/auth/attendance');
            renderMyAttendance(records);
        } catch (error) {
            tasksContainer.innerHTML = `<div class="text-red-400 text-center py-8 bg-red-400/10 rounded-lg">Failed to load attendance. ${error.message}</div>`;
        }
        return;
    }

    if (currentTabType === 'leaderboard') {
        try {
            const leaders = await apiFetch('/users/leaderboard');
            renderLeaderboard(leaders);
        } catch (error) {
            tasksContainer.innerHTML = `<div class="text-red-400 text-center py-8 bg-red-400/10 rounded-lg">Failed to load leaderboard. ${error.message}</div>`;
        }
        return;
    }

    try {
        const tasks = await apiFetch(`/tasks?type=${currentTabType}`);

        if (tasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="text-center py-16">
                    <div class="inline-block p-5 rounded-full bg-gray-800 text-gray-500 mb-4 shadow-inner border border-gray-700">
                        <i class="fas fa-clipboard-check fa-2x"></i>
                    </div>
                    <h3 class="text-xl font-medium text-gray-300">No tasks found</h3>
                    <p class="text-gray-500 mt-2">Check back later or contact admin.</p>
                </div>
            `;
            return;
        }

        renderTasks(tasks);
    } catch (error) {
        tasksContainer.innerHTML = `<div class="text-red-400 text-center py-8 bg-red-400/10 rounded-lg">Failed to load tasks. ${error.message}</div>`;
    }
}

function renderTasks(tasks) {
    tasksContainer.innerHTML = '<div class="space-y-4"></div>';
    const wrapper = tasksContainer.querySelector('div');

    tasks.forEach(task => {
        const submission = allSubmissions.find(s => s.task._id === task._id || s.task === task._id);

        let statusBadge = '';
        let actionButton = '';

        if (!submission) {
            statusBadge = '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-gray-700 text-gray-300 border border-gray-600">Not Started</span>';
            actionButton = `<button onclick="openModal('${task._id}', '${task.title.replace(/'/g, "\\'")}')" class="px-4 py-2 bg-primary hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-primary/20 flex items-center"><i class="fas fa-upload mr-2"></i> Submit Proof</button>`;
        } else if (submission.status === 'pending') {
            statusBadge = '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30"><i class="fas fa-clock mr-1"></i> Pending Verification</span>';
            actionButton = `<button disabled class="px-4 py-2 bg-gray-700/50 text-gray-500 border border-gray-600 text-sm font-medium rounded-lg cursor-not-allowed flex items-center"><i class="fas fa-hourglass-half mr-2"></i> Under Review</button>`;
        } else if (submission.status === 'approved') {
            statusBadge = '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-secondary/20 text-secondary border border-secondary/30"><i class="fas fa-check mr-1"></i> Approved</span>';
            actionButton = `<button disabled class="px-4 py-2 bg-secondary/10 text-secondary border border-secondary/20 text-sm font-medium rounded-lg cursor-not-allowed flex items-center"><i class="fas fa-shield-check mr-2"></i> Verified</button>`;
        } else if (submission.status === 'rejected') {
            statusBadge = '<span class="px-3 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30"><i class="fas fa-times mr-1"></i> Rejected</span>';
            actionButton = `<button onclick="openModal('${task._id}', '${task.title.replace(/'/g, "\\'")}')" class="px-4 py-2 bg-accent hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center shadow-lg shadow-accent/20"><i class="fas fa-redo mr-2"></i> Resubmit</button>`;
        }

        let extraMeta = '';
        if (task.day) extraMeta += `<span class="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded inline-flex items-center ml-3"><i class="fas fa-calendar-day mr-1"></i> Day ${task.day}</span>`;
        if (task.deadline) extraMeta += `<span class="text-xs text-gray-400 ml-3 inline-flex items-center"><i class="far fa-calendar-alt mr-1"></i> ${new Date(task.deadline).toLocaleDateString()}</span>`;

        const feedbackHtml = (submission && submission.feedback) ?
            `<div class="mt-4 p-4 bg-gray-900/50 rounded-lg text-sm border-l-2 ${submission.status === 'rejected' ? 'border-red-500 text-red-300' : 'border-secondary text-emerald-300'} flex">
                <i class="fas fa-comment-dots mt-0.5 mr-3 text-lg opacity-70"></i>
                <div>
                    <strong class="block mb-1 opacity-80 uppercase text-xs tracking-wider">Admin Feedback</strong> 
                    ${submission.feedback}
                </div>
            </div>` : '';

        const card = document.createElement('div');
        card.className = 'bg-cardBg border border-gray-700/60 rounded-xl p-6 hover:border-gray-500 transition-colors group shadow-sm';
        card.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div class="flex-1">
                    <div class="flex flex-wrap items-center mb-2 gap-2">
                        <h4 class="text-lg font-bold text-white">${task.title}</h4>
                        ${extraMeta}
                    </div>
                    <p class="text-gray-400 text-sm mb-4 leading-relaxed">${task.description}</p>
                    <div class="flex items-center">
                        ${statusBadge}
                    </div>
                    ${feedbackHtml}
                </div>
                <div class="flex-shrink-0 w-full md:w-auto mt-2 md:mt-0">
                    ${actionButton}
                </div>
            </div>
        `;
        wrapper.appendChild(card);
    });
}

function openModal(taskId, title) {
    modalTaskId.value = taskId;
    modalTaskTitle.textContent = title;
    proofInput.value = '';
    const fileInput = document.getElementById('proof-file');
    if (fileInput) fileInput.value = '';
    modalError.classList.add('hidden');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeModal() {
    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

submissionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    modalSubmitBtn.disabled = true;
    modalSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Submitting...';
    modalError.classList.add('hidden');

    const fileInput = document.getElementById('proof-file');
    const file = fileInput ? fileInput.files[0] : null;
    const proofText = proofInput.value;

    if (!file && !proofText.trim()) {
        modalError.textContent = 'Please provide either a proof link/explanation or upload an image file.';
        modalError.classList.remove('hidden');
        modalSubmitBtn.disabled = false;
        modalSubmitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Submit Proof';
        return;
    }

    try {
        const formData = new FormData();
        formData.append('taskId', modalTaskId.value);
        if (proofText.trim()) {
            formData.append('proof', proofText.trim());
        }
        // Fallback dummy string if backend requires 'proof' but ONLY a file was uploaded. 
        // Backend actually doesn't require "proof" if req.file is present since we changed it.
        // But we'll just send the empty string anyway, FormData automatically makes it string 'undefined' if missing or handles it finely.
        
        if (file) {
            formData.append('proofFile', file);
        }

        await apiFetch('/submissions', {
            method: 'POST',
            body: formData
        });

        closeModal();
        await loadMetrics();
        loadTasks();
    } catch (error) {
        modalError.textContent = error.message;
        modalError.classList.remove('hidden');
    } finally {
        modalSubmitBtn.disabled = false;
        modalSubmitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Submit Proof';
    }
});

function renderMyAttendance(records) {
    if (records.length === 0) {
        tasksContainer.innerHTML = `
            <div class="text-center py-16">
                <div class="inline-block p-5 rounded-full bg-gray-800 text-gray-500 mb-4 shadow-inner border border-gray-700">
                    <i class="fas fa-calendar-times fa-2x"></i>
                </div>
                <h3 class="text-xl font-medium text-gray-300">No attendance records yet</h3>
                <p class="text-gray-500 mt-2">Your teacher has not marked your attendance yet.</p>
            </div>
        `;
        return;
    }

    const tableHTML = `
        <div class="overflow-x-auto rounded-xl border border-gray-700/60 shadow-sm">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-gray-800/80 text-gray-400 text-xs uppercase tracking-wider">
                        <th class="p-4 font-semibold">Date</th>
                        <th class="p-4 font-semibold">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-700/50 text-sm">
                    ${records.map(record => {
        let statusBadge = '';
        if (record.status === 'present') statusBadge = '<span class="px-2.5 py-1 text-xs font-semibold rounded inline-block bg-secondary/20 text-secondary border border-secondary/30">Present</span>';
        else if (record.status === 'absent') statusBadge = '<span class="px-2.5 py-1 text-xs font-semibold rounded inline-block bg-red-500/20 text-red-400 border border-red-500/30">Absent</span>';
        else if (record.status === 'late') statusBadge = '<span class="px-2.5 py-1 text-xs font-semibold rounded inline-block bg-accent/20 text-accent border border-accent/30">Late</span>';
        else statusBadge = '<span class="px-2.5 py-1 text-xs font-semibold rounded inline-block bg-gray-700 text-gray-300 border border-gray-600">None</span>';

        return `
                        <tr class="hover:bg-gray-800/40 transition-colors">
                            <td class="p-4 font-medium text-gray-200">
                                <i class="far fa-calendar-alt text-gray-500 mr-2"></i>
                                ${new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </td>
                            <td class="p-4">${statusBadge}</td>
                        </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    tasksContainer.innerHTML = tableHTML;
}

function renderLeaderboard(leaders) {
    if (leaders.length === 0) {
        tasksContainer.innerHTML = '<div class="text-center py-16 text-gray-500">No students on the board yet!</div>';
        return;
    }

    const html = `
        <div class="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden w-full max-w-2xl mx-auto mt-4 shadow-lg">
            <div class="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-center">
                <i class="fas fa-trophy text-yellow-500 mr-2 text-xl"></i>
                <h2 class="text-xl font-bold text-white">Top DevTrack Students</h2>
            </div>
            <div class="divide-y divide-gray-700/50">
                ${leaders.map((user, index) => {
                    let rankIcon = '#' + (index + 1);
                    if (index === 0) rankIcon = '<i class="fas fa-medal text-yellow-500 text-xl"></i>';
                    else if (index === 1) rankIcon = '<i class="fas fa-medal text-gray-300 text-xl"></i>';
                    else if (index === 2) rankIcon = '<i class="fas fa-medal text-yellow-700 text-xl"></i>';

                    return `
                    <div class="p-4 flex items-center justify-between hover:bg-gray-800/50 transition">
                        <div class="flex items-center">
                            <span class="w-10 text-center font-bold text-gray-400 mr-4">
                                ${rankIcon}
                            </span>
                            <div>
                                <h4 class="font-semibold text-gray-200">${user.name}</h4>
                                <p class="text-xs text-gray-500">${user.totalTasksCompleted} completed tasks</p>
                            </div>
                        </div>
                        <div class="text-right flex items-center bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
                            <span class="text-orange-400 font-bold mr-1.5">${user.streak}</span>
                            <span class="text-sm">🔥</span>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    tasksContainer.innerHTML = html;
}

// Start
initDashboard();
