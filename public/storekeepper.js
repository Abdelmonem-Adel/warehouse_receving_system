
window.onload = () => {
    auth.checkAuth(['storekeeper']);
    const user = auth.getUser();
    if(user) {
        document.getElementById('skNameSpan').innerText = user.name;
    }
    fetchStatus();
};

const skId = auth.getUser()?.id;
let currentReceiptId = null;

async function fetchStatus() {
    try {
        const res = await auth.fetchWithAuth(`/api/storekeepers/${skId}/status`);
        if(!res) return;
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Status fetch failed:', res.status, errorText);
            return;
        }

        const data = await res.json();
        if (data.activeReceiptId) {
            currentReceiptId = data.activeReceiptId;
        }
        updateUI(data.storekeeper, data.currentJob);
    } catch (err) {
        console.error('FetchStatus Error:', err);
    }
}

function updateUI(sk, job) {
    const statusSpan = document.getElementById('statusSpan');
    const jobInfo = document.getElementById('jobInfo');
    
    // Update status text
    if (sk.status === 'available') {
        statusSpan.innerText = '🟢 متاح';
        statusSpan.className = 'font-bold text-green-600';
    } else if (sk.status === 'break') {
        statusSpan.innerText = '☕ استراحة';
        statusSpan.className = 'font-bold text-orange-600';
    } else { // busy
        statusSpan.innerText = '🔴 مشغول';
        statusSpan.className = 'font-bold text-red-500';
    }
    
    // Show/hide job info and controls based on status
    if (sk.status === 'busy') {
        if (currentReceiptId) {
            document.getElementById('completionSection').classList.remove('hidden');
            document.getElementById('submitReceiptBtn').disabled = true;

            const dockBtn = document.getElementById('dockOnlyBtn');
            const fullBtn = document.getElementById('fullCompleteBtn');
            const itemsInput = document.getElementById('receiptTotalItems');

            // Reset visibility
            dockBtn.classList.add('hidden');
            fullBtn.classList.remove('hidden'); 
            itemsInput.classList.remove('hidden');
            fullBtn.innerHTML = 'كلو خلص <br><span class="text-xs opacity-80">(الدوك فاضي + أنا متاح)</span>';

            if (job && job.dock) {
                // If we still have a dock, show BOTH buttons
                dockBtn.classList.remove('hidden');
            } else {
                // Dock is already released, only show full finish
                dockBtn.classList.add('hidden');
                fullBtn.innerHTML = 'انهاء الاستلامه <br><span class="text-xs opacity-80">(أنا متاح الآن)</span>';
            }
        }

        if (job) {
            // Show job info
            jobInfo.classList.remove('hidden');
            document.getElementById('currentCompany').innerText = job.companyName || 'Unknown';
            document.getElementById('currentInvoice').innerText = job.poNumber || job.invoiceNumber || '-';
            
            if (job.dock) {
                document.getElementById('currentDock').innerText = 'Dock ' + (job.dock.number || '-');
            } else {
                document.getElementById('currentDock').innerText = 'تم تحرير الدوك';
            }
        }
    } else {
        // Hide job info and completion section
        jobInfo.classList.add('hidden');
        document.getElementById('completionSection').classList.add('hidden');
        document.getElementById('submitReceiptBtn').disabled = false;
        currentReceiptId = null; 
    }
}

window.finishJob = async (mode) => {
    if (!confirm('هل أنت متأكد؟')) return;
    
    try {
        await auth.fetchWithAuth(`/api/storekeepers/${skId}/finish`, { 
            method: 'POST',
            body: JSON.stringify({ mode })
        });
        fetchStatus();
    } catch (err) {
        alert(err.message || 'فشل إنهاء الاستلام');
    }
};

window.toggleBreak = async (status) => {
    try {
        const res = await auth.fetchWithAuth(`/api/storekeepers/${skId}/status`, {
            method: 'POST',
            body: JSON.stringify({ status })
        });
        if(res && res.ok) {
            fetchStatus();
        } else {
            const d = await res.json();
            alert(d.message || 'Error updating status');
        }
    } catch (e) {
        console.error(e);
        alert('Network Error');
    }
};

window.resumeWork = async () => {
    try {
        const res = await auth.fetchWithAuth(`/api/storekeepers/${skId}/resume`, { method: 'POST' });
        if(res && res.ok) {
            fetchStatus();
        } else {
            const err = await res.json();
            alert('Error resuming: ' + (err.message || res.statusText));
        }
    } catch(e) { 
        console.error(e); 
        alert('Network Error'); 
    }
};

async function createReceipt() {
    const companyName = document.getElementById('receiptCompanyName').value.trim();
    const dockNumber = document.getElementById('receiptDockNumber').value.trim();
    const poNumber = document.getElementById('receiptPoNumber').value.trim();
    const truckType = document.getElementById('receiptTruckType').value;

    if (!companyName || !dockNumber || !poNumber || !truckType) {
        alert('⚠️ يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    try {
        const res = await auth.fetchWithAuth('/api/receipts', {
            method: 'POST',
            body: JSON.stringify({ companyName, dockNumber, poNumber, truckType })
        });

        if (res && res.ok) {
            const receipt = await res.json();
            currentReceiptId = receipt._id;
            
            // Update UI State
            document.getElementById('completionSection').classList.remove('hidden');
            document.getElementById('submitReceiptBtn').disabled = true;
            
            alert('✅ تم البدء. من فضلك أدخل عدد القطع عند الانتهاء.');
            fetchStatus(); 
        } else if (res) {
            const data = await res.json();
            alert(data.message || 'فشل البدء');
        }
    } catch (e) {
        alert('Network Error: ' + e.message);
    }
}

async function completeReceipt(mode) {
    if (!currentReceiptId) {
        alert('لا توجد استلامة نشطة');
        return;
    }

    const totalItems = document.getElementById('receiptTotalItems').value;
    if (mode === 'full' && (!totalItems || totalItems <= 0)) {
        alert('⚠️ يجب إدخال عدد القطع أولاً');
        return;
    }

    if (!confirm('هل أنت متأكد؟')) return;

    try {
        const res = await auth.fetchWithAuth(`/api/receipts/${currentReceiptId}/complete`, {
            method: 'PUT',
            body: JSON.stringify({ totalItems, mode })
        });

        if (res && res.ok) {
            alert('✅ تم الحفظ بنجاح');
            
            // Reset UI
            if (mode === 'full') {
                document.getElementById('receiptForm').reset();
                document.getElementById('receiptTotalItems').value = '';
                document.getElementById('completionSection').classList.add('hidden');
                document.getElementById('submitReceiptBtn').disabled = false;
                currentReceiptId = null;
            }
            
            fetchStatus();
        } else if (res) {
            const data = await res.json();
            alert(data.message || 'فشل إنهاء الاستلامة');
        }
    } catch (e) {
        alert('Network Error: ' + e.message);
    }
}

// Auto-refresh status every 3 seconds
setInterval(() => {
    if(auth.isLoggedIn()) fetchStatus();
}, 3000);
