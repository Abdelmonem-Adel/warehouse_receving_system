window.onload = () => {
             auth.checkAuth(['supervisor']);
             fetchData();
        };

        let docks = [];

        let storekeepers = [];
        const supervisorName = auth.getUser()?.name || 'Unknown';
        
        let allCompletedReceipts = []; // Store all history for filtering

        async function fetchData() {
            // Removed /api/history and updated resources
            const [skRes, dockRes, receiptRes] = await Promise.all([
                auth.fetchWithAuth('/api/storekeepers'),
                auth.fetchWithAuth('/api/docks'),
                auth.fetchWithAuth('/api/receipts')
            ]);
            
            if(!skRes || !dockRes || !receiptRes) return;
            
            const serverSKs = await skRes.json();
            docks = await dockRes.json();
            const receipts = await receiptRes.json();
            
            // Renders
            renderDocks(docks);
            renderActiveReceipts(receipts.filter(r => r.status === 'in-progress'));
            
            // Store and Render History
            allCompletedReceipts = receipts.filter(r => r.status === 'completed');
            renderHistoryReceipts(allCompletedReceipts);
            
            updateDropdowns(docks, serverSKs);

            // Directly render SK Status List
            storekeepers = serverSKs;
            renderSKStatus();
        }

        // --- NEW: Docks Render ---
        function renderDocks(docks) {
            const container = document.getElementById('docksGrid');
            container.innerHTML = docks.map(dock => {
                const isAvailable = dock.status === 'available';
                return `
                <div class="border-2 rounded p-2 text-center text-sm ${isAvailable ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'} relative">
                    <h3 class="font-bold">Dock ${dock.number}</h3>
                    <p class="text-xs font-semibold mb-1">${isAvailable ? 'متاح' : 'مشغول'}</p>
                    ${dock.currentShipment ? `
                        <div class="text-xs text-gray-800 bg-white bg-opacity-50 rounded p-1">
                            <span class="block font-bold truncate" title="${dock.currentShipment.companyName}">${dock.currentShipment.companyName}</span>
                        </div>
                    ` : ''}
                </div>
                `;
            }).join('');
        }

        // --- NEW: Active Receipts Render ---
        function renderActiveReceipts(receipts) {
            const el = document.getElementById('activeList');
            const countEl = document.getElementById('inProgressCount');
            countEl.textContent = receipts.length;

            if(receipts.length === 0) {
               el.innerHTML = '<div class="col-span-1 md:col-span-2 text-center text-gray-500 py-4">لا توجد استلامات جارية</div>';
               return;
            }
            
            el.innerHTML = receipts.map(r => `
                <div class="border border-green-200 bg-green-50 rounded p-3 shadow-sm relative">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold text-gray-800">${r.companyName}</h3>
                        <span class="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full">جاري</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-xs text-gray-700">
                        <div><span class="text-gray-500">الرصيف:</span> <b>${r.dockNumber?.number || r.dockNumber || '-'}</b></div>
                        <div><span class="text-gray-500">الأمين:</span> <b>${r.keeperName}</b></div>
                        <div><span class="text-gray-500">PO:</span> ${r.poNumber || '-'}</div>
                        <div><span class="text-gray-500">القطع:</span> ${r.totalItems || '-'}</div>
                    </div>
                    <div class="mt-2 text-[10px] text-gray-500 text-left">
                        بدأ: ${new Date(r.startedAt).toLocaleTimeString('ar-EG')}
                    </div>
                </div>
            `).join('');
        }

        // --- NEW: History/Completed Receipts Render ---
        function renderHistoryReceipts(receipts) {
            const el = document.getElementById('historyList');
            const countEl = document.getElementById('completedCount');
            countEl.textContent = receipts.length;

            if(receipts.length === 0) {
                 el.innerHTML = '<div class="text-center text-gray-500 py-4">لا توجد استلامات منتهية حديثاً</div>';
                 return;
            }

            // If not filtered (no inputs set), and > 10, show only top 10. 
            // Check if any filter is active
            const hasFilter = document.getElementById('historySearch')?.value || 
                              document.getElementById('dateFrom')?.value || 
                              document.getElementById('dateTo')?.value;
            
            const limit = hasFilter ? receipts.length : 10;
            
            el.innerHTML = receipts.slice(0, limit).map(r => `
                <div class="border-b border-gray-100 py-2 hover:bg-gray-50 flex flex-wrap justify-between items-center gap-2">
                    <div class="w-full md:w-auto">
                        <div class="font-bold text-gray-800 text-sm">${r.companyName}</div>
                        <div class="text-xs text-blue-600">Dock ${r.dockNumber?.number || r.dockNumber || '-'} | ${r.keeperName}</div>
                    </div>
                    <div class="flex gap-4 text-xs text-gray-600">
                         <div class="text-center">
                            <span class="block text-gray-400 text-[10px]">القطع</span>
                            <span class="font-bold">${r.totalItems}</span>
                        </div>
                        <div class="text-center">
                            <span class="block text-gray-400 text-[10px]">المدة</span>
                            <span class="font-bold">${r.durationMinutes || 0} د</span>
                        </div>
                        <div class="text-center">
                            <span class="block text-gray-400 text-[10px]">انتهى</span>
                            <span class="font-bold">${new Date(r.endedAt).toLocaleTimeString('ar-EG')}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        function updateDropdowns(docks, sks) {
             /* 
                We only need dropdowns for Transfer Modal now.
             */

             // Populate all dock/sk selects (assign + transfer)
             const selects = ['transDockSelect'];
             selects.forEach(id => {
                 const el = document.getElementById(id);
                 if(!el) return;
                 const val = el.value;
                 el.innerHTML = docks.map(d => `<option value="${d._id}">Dock ${d.number} (${d.status})</option>`).join('');
                 if(val) el.value = val;
             });
 
             const skSelects = ['transSkSelect'];
             skSelects.forEach(id => {
                 const el = document.getElementById(id);
                 if(!el) return;
                 const val = el.value;
                 el.innerHTML = sks.map(s => `<option value="${s._id}">${s.name} (${s.status})</option>`).join('');
                 if(val) el.value = val;
             });
        }

        window.toggleManualModal = () => document.getElementById('manualModal').classList.toggle('hidden');
        window.toggleTransferModal = () => document.getElementById('transferModal').classList.toggle('hidden');
        
        // --- NEW: Render Storekeeper Status List ---
        function renderSKStatus() {
            const el = document.getElementById('skList');
            if(storekeepers.length === 0) {
                el.innerHTML = '<div class="text-center text-gray-500">لا يوجد أمناء</div>';
                return;
            }

            // Sort: Available > Break > Busy > Others
            const priority = { 'available': 1, 'break': 2, 'busy': 3, 'other': 4 };
            const sorted = storekeepers.sort((a,b) => (priority[a.status] || 4) - (priority[b.status] || 4));

            el.innerHTML = sorted.map(s => {
                let badgeClass = 'bg-gray-100 text-gray-800';
                let statusText = s.status;
                
                if(s.status === 'available') {
                    badgeClass = 'bg-green-100 text-green-800 border-green-200';
                    statusText = 'متاح 🟢';
                } else if(s.status === 'busy') {
                    badgeClass = 'bg-red-100 text-red-800 border-red-200';
                    statusText = 'مشغول 🔴';
                } else if(s.status === 'break') {
                    badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                    statusText = 'استراحة ☕';
                }

                return `
                <div class="flex items-center justify-between p-3 border rounded shadow-sm bg-white">
                    <div class="flex flex-col">
                        <span class="font-bold text-gray-700">${s.name}</span>
                        <span class="text-xs text-gray-500">@${s.username}</span>
                    </div>
                    <span class="px-2 py-1 rounded text-xs font-bold border ${badgeClass}">
                        ${statusText}
                    </span>
                </div>
                `;
            }).join('');
        }

        window.toggleTransferModal = () => document.getElementById('transferModal').classList.toggle('hidden');

        // Submit Transfer
        document.getElementById('transferForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const d = {
                supervisorName,
                dockId: document.getElementById('transDockSelect').value,
                storekeeperId: document.getElementById('transSkSelect').value
            };
            try {
                const res = await auth.fetchWithAuth('/api/supervisor/transfer', { method: 'POST', body: JSON.stringify(d) });
                if(res && res.ok) { alert('تم النقل بنجاح'); toggleTransferModal(); fetchData(); }
                else alert('Error');
            } catch(err) { console.error(err); }
        });

        // fetchData call moved to window.onload with checkAuth
        setInterval(() => {
            if(auth.isLoggedIn()) fetchData();
        }, 10000); // Increased interval to avoid wiping search results too often while typing

        // --- NEW: Filter & Export Features (Updated with Date & PO) ---

        function getFilteredData() {
            const query = document.getElementById('historySearch').value.toLowerCase();
            const dateFromVal = document.getElementById('dateFrom').value;
            const dateToVal = document.getElementById('dateTo').value;

            // Parse Dates (start of day / end of day)
            const dateFrom = dateFromVal ? new Date(dateFromVal) : null;
            if(dateFrom) dateFrom.setHours(0,0,0,0);
            
            const dateTo = dateToVal ? new Date(dateToVal) : null;
            if(dateTo) dateTo.setHours(23,59,59,999);

            return allCompletedReceipts.filter(r => {
                // 1. Text Search (Company, Keeper, Dock, PO)
                const matchesText = 
                    r.companyName.toLowerCase().includes(query) || 
                    r.keeperName.toLowerCase().includes(query) ||
                    (r.dockNumber && r.dockNumber.toString().includes(query)) ||
                    (r.poNumber && r.poNumber.toString().toLowerCase().includes(query));
                
                if(!matchesText) return false;

                // 2. Date Range Check (based on endedAt)
                const rDate = new Date(r.endedAt);
                if (dateFrom && rDate < dateFrom) return false;
                if (dateTo && rDate > dateTo) return false;

                return true;
            });
        }

        function filterHistory() {
            const filtered = getFilteredData();
            // Pass true to force showing all results of the filter
            renderHistoryReceipts(filtered, true); 
        }

        function exportToExcel() {
            if (typeof XLSX === 'undefined') {
                alert('عذراً، مكتبة Excel لم يتم تحميلها بشكل صحيح. يرجى تحديث الصفحة.');
                return;
            }

            try {
                const dataSource = getFilteredData();

                if(dataSource.length === 0) {
                    alert('لا توجد بيانات للتصدير');
                    return;
                }

                // Format data for Excel
                const data = dataSource.map(r => ({
                    "الشركة": r.companyName,
                    "رصيف": r.dockNumber?.number || r.dockNumber || 'N/A',
                    "أمين المخزن": r.keeperName,
                    "عدد القطع": r.totalItems || 0,
                    "رقم الـ PO": r.poNumber || '',
                    "بداية الاستلام": new Date(r.startedAt).toLocaleString('ar-EG'),
                    "نهاية الاستلام": new Date(r.endedAt).toLocaleString('ar-EG'),
                    "المدة (دقيقة)": r.durationMinutes || 0
                }));

                const ws = XLSX.utils.json_to_sheet(data, {rtl: true});
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "History");
                XLSX.writeFile(wb, `Supervisor_History_${new Date().toISOString().slice(0,10)}.xlsx`);
            } catch (error) {
                console.error("Export Error:", error);
                alert('حدث خطأ أثناء التصدير: ' + error.message);
            }
        }