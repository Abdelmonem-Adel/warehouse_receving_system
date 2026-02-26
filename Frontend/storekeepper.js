
window.onload = () => {
    auth.checkAuth(['storekeeper']);
    const user = auth.getUser();
    if (user) {
        document.getElementById('skNameSpan').innerText = user.name;
    }
    fetchStatus();
};

const skId = auth.getUser()?.id;
let currentReceiptId = null;

async function fetchStatus() {
    try {
        const res = await auth.fetchWithAuth(`/api/storekeepers/${skId}/status`);
        if (!res) return;

        if (!res.ok) {
            const errorText = await res.text();
            console.error('Status fetch failed:', res.status, errorText);
            return;
        }

        const data = await res.json();

        // Security check: If the user ID in memory doesn't match the one in localStorage
        const currentLocalUser = auth.getUser();
        if (currentLocalUser && currentLocalUser.id !== skId) {
            alert(i18n.t('session_changed_alert') || 'Session changed. Page will reload.');
            window.location.reload();
            return;
        }

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
        statusSpan.innerText = i18n.t('status_available');
        statusSpan.className = 'font-bold text-green-600';
    } else if (sk.status === 'break') {
        statusSpan.innerText = i18n.t('status_break');
        statusSpan.className = 'font-bold text-orange-600';
    } else { // busy
        statusSpan.innerText = i18n.t('status_busy');
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
            dockBtn.classList.remove('hidden'); // Show dock empty button by default
            fullBtn.classList.remove('hidden');
            if (itemsInput) itemsInput.classList.remove('hidden');
            fullBtn.innerHTML = `${i18n.t('all_done')} <br><span class="text-xs opacity-80">${i18n.t('dock_empty_sk_busy')}</span>`;

            if (job && job.dock) {
                // If we still have a dock, show BOTH buttons
                dockBtn.classList.remove('hidden');
            } else if (job) {
                // Dock is already released, only show full finish
                dockBtn.classList.add('hidden');
                fullBtn.innerHTML = `${i18n.t('finish_receipt')} <br><span class="text-xs opacity-80">${i18n.t('sk_available_now')}</span>`;
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
                document.getElementById('currentDock').innerText = i18n.t('dock_released');
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
    if (!confirm(i18n.t('alert_confirm'))) return;

    try {
        await auth.fetchWithAuth(`/api/storekeepers/${skId}/finish`, {
            method: 'POST',
            body: JSON.stringify({ mode })
        });
        fetchStatus();
    } catch (err) {
        alert(err.message || i18n.t('error_finish_failed'));
    }
};

window.toggleBreak = async (status) => {
    try {
        const res = await auth.fetchWithAuth(`/api/storekeepers/${skId}/status`, {
            method: 'POST',
            body: JSON.stringify({ status })
        });
        if (res && res.ok) {
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
        if (res && res.ok) {
            fetchStatus();
        } else {
            const err = await res.json();
            alert('Error resuming: ' + (err.message || res.statusText));
        }
    } catch (e) {
        console.error(e);
        alert('Network Error');
    }
};

async function createReceipt() {
    const companyName = document.getElementById('receiptCompanyName').value.trim();
    const dockNumber = document.getElementById('receiptDockNumber').value.trim();
    const poNumber = document.getElementById('receiptPoNumber').value.trim();
    const truckType = document.getElementById('receiptTruckType').value;
    const category = document.getElementById('receiptCategory').value;

    if (!companyName || !dockNumber || !poNumber || !truckType || !category) {
        alert(i18n.t('alert_fill_required'));
        return;
    }

    try {
        const res = await auth.fetchWithAuth('/api/receipts', {
            method: 'POST',
            body: JSON.stringify({ companyName, dockNumber, poNumber, truckType, category })
        });

        if (res && res.ok) {

            const receipt = await res.json();
            currentReceiptId = receipt._id;


            // Update UI State
            document.getElementById('completionSection').classList.remove('hidden');
            document.getElementById('submitReceiptBtn').disabled = true;

            alert(i18n.t('alert_start_success'));
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
        alert(i18n.t('alert_no_active_receipt'));
        return;
    }

    const totalItems = document.getElementById('receiptTotalItems')?.value || 0;
    const cartonNumber = document.getElementById('receiptCartonNumber')?.value || 0;
    const truckNumber = document.getElementById('receiptTruckNumber')?.value || 1;
    const skuNumber = document.getElementById('receiptSKUNumber')?.value || 0;
    const palletNumber = document.getElementById('receiptpalletNumber')?.value || 0;
    const comment = document.getElementById('receiptComment')?.value || "Auto-completed";

    // Validation
    if (mode === 'full' && (totalItems < 0)) { // Removed strict check for totalItems and comment
        alert(i18n.t('alert_enter_items'));
        return;
    }

    if (!confirm(i18n.t('alert_confirm'))) return;

    try {
        const res = await auth.fetchWithAuth(`/api/receipts/${currentReceiptId}/complete`, {
            method: 'PUT',
            body: JSON.stringify({
                totalItems,
                cartonNumber,
                truckNumber,
                skuNumber,
                palletNumber,
                comment,
                mode
            })
        });

        if (res && res.ok) {
            alert(i18n.t('alert_save_success'));

            // Reset UI
            if (mode === 'full') {
                document.getElementById('receiptForm').reset();
                document.getElementById('receiptTotalItems') && (document.getElementById('receiptTotalItems').value = '');
                document.getElementById('receiptCartonNumber') && (document.getElementById('receiptCartonNumber').value = '');
                document.getElementById('receiptTruckNumber') && (document.getElementById('receiptTruckNumber').value = '');
                document.getElementById('receiptSKUNumber') && (document.getElementById('receiptSKUNumber').value = '');
                document.getElementById('receiptpalletNumber') && (document.getElementById('receiptpalletNumber').value = '');
                document.getElementById('receiptComment') && (document.getElementById('receiptComment').value = '');
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
    if (auth.isLoggedIn()) fetchStatus();
}, 3000);
