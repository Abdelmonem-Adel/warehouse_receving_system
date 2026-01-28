// Check Auth on Load
        window.onload = () => {
            auth.checkAuth(['admin']);
        };

        let isEditing = false;

        async function fetchUsers() {
            const res = await auth.fetchWithAuth('/api/users');
            if(!res) return;
            const users = await res.json();
            const tbody = document.getElementById('usersList');
            tbody.innerHTML = users.map(u => `
                <tr class="border-b transition hover:bg-gray-50">
                    <td class="p-2">
                        <div class="font-bold">${u.name}</div>
                        <div class="text-xs text-gray-500">@${u.username}</div>
                    </td>
                    <td class="p-2"><span class="bg-gray-200 px-2 rounded text-xs">${u.role}</span></td>
                    <td class="p-2 text-sm">${u.status || '-'}</td>
                    <td class="p-2 flex gap-2">
                        <button onclick='editUser(${JSON.stringify(u)})' class="text-blue-500 hover:text-blue-700 font-bold text-sm">تعديل</button>
                        <button onclick="deleteUser('${u._id}')" class="text-red-500 hover:text-red-700 font-bold text-sm">حذف</button>
                    </td>
                </tr>
            `).join('');
        }

        function editUser(user) {
            isEditing = true;
            document.getElementById('formTitle').innerText = 'تعديل بيانات المستخدم';
            document.getElementById('submitBtn').innerText = 'حفظ التعديلات';
            document.getElementById('cancelBtn').classList.remove('hidden');
            
            document.getElementById('userId').value = user._id;
            document.getElementById('name').value = user.name;
            document.getElementById('username').value = user.username;
            document.getElementById('password').value = ''; // Don't show password
            document.getElementById('role').value = user.role;
        }

        function resetForm() {
            isEditing = false;
            document.getElementById('formTitle').innerText = 'اضافة مستخدم جديد';
            document.getElementById('submitBtn').innerText = 'إضافة';
            document.getElementById('cancelBtn').classList.add('hidden');
            document.getElementById('userForm').reset();
            document.getElementById('userId').value = '';
        }

        async function deleteUser(id) {
            if(!confirm('هل أنت متأكد من الحذف النهائي؟')) return;
            try {
                await auth.fetchWithAuth('/api/users/' + id, { method: 'DELETE' });
                fetchUsers();
            } catch (e) { console.error(e); }
        }

        document.getElementById('userForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('userId').value;
            const data = {
                name: document.getElementById('name').value,
                username: document.getElementById('username').value,
                role: document.getElementById('role').value,
            };
            const pwd = document.getElementById('password').value;
            if(pwd) data.password = pwd;

            try {
                if(isEditing) {
                    await auth.fetchWithAuth('/api/users/' + id, {
                        method: 'PUT',
                        body: JSON.stringify(data)
                    });
                } else {
                    await auth.fetchWithAuth('/api/users', {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                }
                resetForm();
                fetchUsers();
            } catch (err) {
                alert('Error');
            }
        });

        // Auto Refresh Users List?
        fetchUsers();
        setInterval(fetchUsers, 5000);