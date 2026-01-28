


document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                if (res.ok) {
                    const data = await res.json();
                    
                    
                    // Store Token and User
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    const role = data.user.role;
                    if (role === 'admin') window.location.href = 'admin.html';
                    else if (role === 'supervisor') window.location.href = 'supervisor.html';
                    else if (role === 'gate') window.location.href = 'gate.html';
                    else if (role === 'storekeeper') window.location.href = 'storekeeper.html';
                } else {
                    document.getElementById('errorMsg').classList.remove('hidden');
                }
            } catch (err) {
                console.error(err);
            }
        });