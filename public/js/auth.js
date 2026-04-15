const authForm = document.getElementById('auth-form');
const submitBtn = document.getElementById('submit-btn');
const errorMessage = document.getElementById('error-message');

// Check if user is already logged in
if (localStorage.getItem('token')) {
    const role = localStorage.getItem('role');
    if (role === 'admin') {
        window.location.href = '/admin.html';
    } else {
        window.location.href = '/index.html';
    }
}

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="animate-pulse">Loading...</span>';
    errorMessage.classList.add('hidden');

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Authentication failed');
        }

        // Store user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data._id);
        localStorage.setItem('role', data.role);
        localStorage.setItem('userName', data.name);

        // Redirect based on role
        if (data.role === 'admin') {
            window.location.href = '/admin.html';
        } else {
            window.location.href = '/index.html';
        }

    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.classList.remove('hidden');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    }
});

window.quickLogin = function (email, password) {
    document.getElementById('email').value = email;
    document.getElementById('password').value = password;
    submitBtn.click();
};
