// Global Variables
let extinguishers = [];
let currentSno = 1;
let currentStep = 1;

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('auditDate').value = today;
    
    // Set expiry date to 1 year from today
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    document.getElementById('expiryDate').value = nextYear.toISOString().split('T')[0];
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Load any saved data from localStorage
    loadSavedData();
    
    // Set up search functionality
    setupSearchFunctionality();
});

function initializeEventListeners() {
    // Step navigation
    document.getElementById('nextToStep2').addEventListener('click', () => goToStep(2));
    document.getElementById('skipBasicBtn').addEventListener('click', () => goToStep(2));
    
    document.getElementById('nextToStep3').addEventListener('click', () => goToStep(3));
    document.getElementById('backToStep1').addEventListener('click', () => goToStep(1));
    
    document.getElementById('nextToStep4').addEventListener('click', () => goToStep(4));
    document.getElementById('backToStep2').addEventListener('click', () => goToStep(2));
    
    document.getElementById('backToStep3').addEventListener('click', () => goToStep(3));
    document.getElementById('addToAuditBtn').addEventListener('click', addExtinguisherFromReview);
    document.getElementById('addAndNewBtn').addEventListener('click', addExtinguisherAndStartNew);
    
    // New Audit button
    document.getElementById('newAuditBtn').addEventListener('click', startNewAudit);
    
    // Clear list button
    document.getElementById('clearListBtn').addEventListener('click', function() {
        showConfirmModal(
            'Clear All Items',
            'Are you sure you want to clear all extinguishers from the list? This action cannot be undone.',
            clearAllExtinguishers
        );
    });
    
    // Export list button
    document.getElementById('exportListBtn').addEventListener('click', exportToCSV);
    
    // Print button
    document.getElementById('printBtn').addEventListener('click', printReport);
    
    // Export PDF button
    document.getElementById('exportBtn').addEventListener('click', exportToPDF);
    
    // Generate report button
    document.getElementById('generateReportBtn').addEventListener('click', generateReport);
    
    // Load sample data button
    document.getElementById('loadSampleBtn').addEventListener('click', loadSampleData);
    
    // Modal buttons
    document.getElementById('modalOkBtn').addEventListener('click', closeSuccessModal);
    document.getElementById('modalCancelBtn').addEventListener('click', closeConfirmModal);
    document.getElementById('modalConfirmBtn').addEventListener('click', executeConfirmedAction);
    
    // Close modals on X click
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Legal modal links
    document.querySelectorAll('.legal-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const modalId = this.getAttribute('data-modal');
            if (modalId === 'privacy') {
                document.getElementById('privacyPolicyModal').style.display = 'flex';
            } else if (modalId === 'terms') {
                document.getElementById('termsModal').style.display = 'flex';
            } else if (modalId === 'affiliate') {
                document.getElementById('affiliateModal').style.display = 'flex';
            } else if (modalId === 'disclaimer') {
                document.getElementById('disclaimerModal').style.display = 'flex';
            }
        });
    });
    
    // Footer links
    document.getElementById('backToTop').addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    document.getElementById('printGuide').addEventListener('click', function(e) {
        e.preventDefault();
        showSuccessModal('Printing Guide', 'For best results, use landscape orientation and check "Background graphics" in print settings.');
    });
    
    document.getElementById('contactSupport').addEventListener('click', function(e) {
        e.preventDefault();
        showSuccessModal('Contact Support', 'For support, please email: support@firesafetytool.com');
    });
    
    // Auto-save on input changes
    setupAutoSave();
    
    // Update review when any form field changes
    document.querySelectorAll('#step1 input, #step1 textarea').forEach(input => {
        input.addEventListener('change', updateReviewFromStep1);
    });
    
    document.querySelectorAll('#step2 input, #step2 select, #step2 textarea').forEach(input => {
        input.addEventListener('change', updateReviewFromStep2);
    });
    
    document.querySelectorAll('#step3 input:not(.hazard-checkboxes input), #step3 select, #step3 textarea').forEach(input => {
        input.addEventListener('change', updateReviewFromStep3);
    });
    
    // Update review when hazard checkboxes change
    document.querySelectorAll('.hazard-option input').forEach(cb => {
        cb.addEventListener('change', updateReviewFromStep3);
    });
    
    // Update recommended type based on area type and hazards
    document.getElementById('areaType').addEventListener('change', updateRecommendedType);
    
    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            document.getElementById('extinguisherSearchResults').style.display = 'none';
            document.getElementById('capacitySearchResults').style.display = 'none';
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+Enter to proceed to next step
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            if (currentStep < 4) {
                goToStep(currentStep + 1);
            } else if (currentStep === 4) {
                addExtinguisherFromReview();
            }
        }
        
        // Ctrl+P to print
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            printReport();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

function setupSearchFunctionality() {
    const extinguisherNameInput = document.getElementById('extinguisherName');
    const capacityInput = document.getElementById('capacity');
    const extinguisherResults = document.getElementById('extinguisherSearchResults');
    const capacityResults = document.getElementById('capacitySearchResults');
    
    // Get unique capacities
    const uniqueCapacities = getUniqueCapacities();
    
    // Populate capacity suggestions
    capacityResults.innerHTML = uniqueCapacities.map(capacity => 
        `<div class="search-result-item" onclick="selectCapacity('${capacity}')">${capacity}</div>`
    ).join('');
    
    // Extinguisher name search
    extinguisherNameInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query.length < 2) {
            extinguisherResults.style.display = 'none';
            return;
        }
        
        const results = searchFireExtinguishers(query);
        
        if (results.length > 0) {
            extinguisherResults.innerHTML = results.map(ext => {
                const displayText = `${ext.name} - ${ext.type} - ${ext.body} - ${ext.operating} - ${ext.agent} - ${ext.agentName} - ${ext.capacity}`;
                const highlightedText = displayText.replace(new RegExp(query, 'gi'), match => `<span class="highlight">${match}</span>`);
                
                return `<div class="search-result-item" onclick="selectExtinguisher(${JSON.stringify(ext).replace(/"/g, '&quot;')})">
                    ${highlightedText}
                </div>`;
            }).join('');
            
            extinguisherResults.style.display = 'block';
        } else {
            extinguisherResults.style.display = 'none';
        }
    });
    
    // Capacity search
    capacityInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        
        if (query.length < 1) {
            capacityResults.style.display = 'none';
            return;
        }
        
        const filteredCapacities = uniqueCapacities.filter(capacity => 
            capacity.toLowerCase().includes(query)
        );
        
        if (filteredCapacities.length > 0) {
            capacityResults.innerHTML = filteredCapacities.map(capacity => {
                const highlighted = capacity.replace(new RegExp(query, 'gi'), match => `<span class="highlight">${match}</span>`);
                return `<div class="search-result-item" onclick="selectCapacity('${capacity}')">${highlighted}</div>`;
            }).join('');
            
            capacityResults.style.display = 'block';
        } else {
            capacityResults.style.display = 'none';
        }
    });
    
    // Focus management
    extinguisherNameInput.addEventListener('focus', function() {
        if (this.value.length >= 2) {
            extinguisherResults.style.display = 'block';
        }
    });
    
    capacityInput.addEventListener('focus', function() {
        capacityResults.style.display = 'block';
    });
}

function selectExtinguisher(extinguisher) {
    autoFillExtinguisherDetails(extinguisher);
    updateReviewFromStep2();
}

function selectCapacity(capacity) {
    document.getElementById('capacity').value = capacity;
    document.getElementById('capacitySearchResults').style.display = 'none';
    updateReviewFromStep2();
}

function goToStep(step) {
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
        return;
    }
    
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(stepEl => {
        stepEl.classList.remove('active');
    });
    
    // Show target step
    document.getElementById(`step${step}`).classList.add('active');
    
    // Update navigation steps
    document.querySelectorAll('.nav-step').forEach((navStep, index) => {
        navStep.classList.remove('active', 'completed');
        if (index + 1 === step) {
            navStep.classList.add('active');
        } else if (index + 1 < step) {
            navStep.classList.add('completed');
        }
    });
    
    // Update review if going to step 4
    if (step === 4) {
        updateReviewSummary();
    }
    
    currentStep = step;
    
    // Scroll to form section
    document.querySelector('.audit-form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            const accountName = document.getElementById('accountName').value.trim();
            const address = document.getElementById('address').value.trim();
            const auditDate = document.getElementById('auditDate').value;
            const contactPerson = document.getElementById('contactPerson').value.trim();
            
            if (!accountName || !address || !auditDate || !contactPerson) {
                showSuccessModal('Required Fields', 'Please fill in all required fields (marked with *) in Basic Information.');
                return false;
            }
            break;
            
        case 2:
            const location = document.getElementById('location').value.trim();
            const extinguisherName = document.getElementById('extinguisherName').value.trim();
            const extinguisherType = document.getElementById('extinguisherType').value;
            const capacity = document.getElementById('capacity').value;
            const quantity = document.getElementById('quantity').value;
            const expiryDate = document.getElementById('expiryDate').value;
            const status = document.getElementById('status').value;
            
            if (!location || !extinguisherName || !extinguisherType || !capacity || !quantity || !expiryDate || !status) {
                showSuccessModal('Required Fields', 'Please fill in all required fields (marked with *) in Extinguisher Details.');
                return false;
            }
            break;
            
        case 3:
            const areaType = document.getElementById('areaType').value;
            const hasHazards = document.querySelectorAll('.hazard-option input:checked').length > 0;
            
            if (!areaType) {
                showSuccessModal('Required Fields', 'Please select the Area Type in Hazard Assessment.');
                return false;
            }
            
            if (!hasHazards) {
                const proceed = confirm('No hazard classes selected. Are you sure you want to continue?');
                if (!proceed) return false;
            }
            break;
    }
    
    return true;
}

function startNewAudit() {
    showConfirmModal(
        'Start New Audit',
        'Are you sure you want to start a new audit? All unsaved changes will be lost.',
        function() {
            // Clear all data
            extinguishers = [];
            currentSno = 1;
            
            // Clear form
            document.getElementById('accountName').value = '';
            document.getElementById('address').value = '';
            document.getElementById('auditDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('contactPerson').value = '';
            document.getElementById('contactPhone').value = '';
            document.getElementById('contactEmail').value = '';
            
            // Reset to step 1
            goToStep(1);
            
            // Update UI
            updateExtinguisherTable();
            updateCounters();
            updateReportPreview();
            
            // Clear localStorage
            localStorage.removeItem('fireExtinguisherAudit');
            
            showSuccessModal('New Audit Started', 'You can now begin a new fire extinguisher audit.');
        }
    );
}

function updateReviewFromStep1() {
    document.getElementById('reviewCompany').textContent = document.getElementById('accountName').value || '-';
    document.getElementById('reviewAddress').textContent = document.getElementById('address').value || '-';
    
    const contactPerson = document.getElementById('contactPerson').value;
    const contactPhone = document.getElementById('contactPhone').value;
    const contactEmail = document.getElementById('contactEmail').value;
    
    let contactInfo = contactPerson || '-';
    if (contactPhone) contactInfo += ` | ${contactPhone}`;
    if (contactEmail) contactInfo += ` | ${contactEmail}`;
    
    document.getElementById('reviewContact').textContent = contactInfo;
}

function updateReviewFromStep2() {
    document.getElementById('reviewLocation').textContent = document.getElementById('location').value || '-';
    document.getElementById('reviewName').textContent = document.getElementById('extinguisherName').value || '-';
    document.getElementById('reviewType').textContent = document.getElementById('extinguisherType').value || '-';
    document.getElementById('reviewCapacity').textContent = document.getElementById('capacity').value || '-';
    document.getElementById('reviewQuantity').textContent = document.getElementById('quantity').value || '1';
    document.getElementById('reviewStatus').textContent = document.getElementById('status').value || '-';
    document.getElementById('reviewExpiry').textContent = formatDate(document.getElementById('expiryDate').value) || '-';
    
    const recommend = document.getElementById('recommendReplacement').checked;
    document.getElementById('reviewRecommend').textContent = recommend ? 'Yes' : 'No';
}

function updateReviewFromStep3() {
    document.getElementById('reviewAreaType').textContent = document.getElementById('areaType').value || '-';
    document.getElementById('reviewRiskLevel').textContent = document.getElementById('riskLevel').value || '-';
    
    // Get selected hazards
    const selectedHazards = Array.from(document.querySelectorAll('.hazard-option input:checked'))
        .map(cb => cb.value)
        .join(', ');
    
    document.getElementById('reviewHazards').textContent = selectedHazards || 'None selected';
    
    // Update remarks
    const hazardDesc = document.getElementById('hazardDescription').value;
    const hazardRemarks = document.getElementById('hazardRemarks').value;
    let remarks = '';
    
    if (hazardDesc) remarks += hazardDesc;
    if (hazardRemarks) remarks += (remarks ? '\n' : '') + hazardRemarks;
    
    document.getElementById('reviewRemarks').textContent = remarks || '-';
}

function updateRecommendedType() {
    const areaType = document.getElementById('areaType').value;
    const selectedHazards = Array.from(document.querySelectorAll('.hazard-option input:checked'))
        .map(cb => cb.value);
    
    let recommendedType = '';
    
    if (areaType === 'Kitchen' || selectedHazards.includes('Class K')) {
        recommendedType = 'KITCHEN';
    } else if (selectedHazards.includes('Class C')) {
        recommendedType = 'CO2';
    } else if (selectedHazards.includes('Class B') && !selectedHazards.includes('Class A')) {
        recommendedType = 'FOAM';
    } else if (selectedHazards.length > 0) {
        recommendedType = 'ABC / DCP';
    }
    
    if (recommendedType) {
        document.getElementById('recommendedType').value = recommendedType;
    }
}

function updateReviewSummary() {
    updateReviewFromStep1();
    updateReviewFromStep2();
    updateReviewFromStep3();
}

function addExtinguisherFromReview() {
    // Get all form values
    const extinguisherData = {
        // Basic Info
        accountName: document.getElementById('accountName').value.trim(),
        address: document.getElementById('address').value.trim(),
        auditDate: document.getElementById('auditDate').value,
        contactPerson: document.getElementById('contactPerson').value.trim(),
        contactPhone: document.getElementById('contactPhone').value.trim(),
        contactEmail: document.getElementById('contactEmail').value.trim(),
        
        // Extinguisher Details
        sno: currentSno++,
        location: document.getElementById('location').value.trim(),
        extinguisherName: document.getElementById('extinguisherName').value.trim(),
        type: document.getElementById('extinguisherType').value,
        bodyType: document.getElementById('bodyType').value,
        operatingType: document.getElementById('operatingType').value,
        fireAgentType: document.getElementById('fireAgentType').value,
        fireAgentName: document.getElementById('fireAgentName').value.trim(),
        capacity: document.getElementById('capacity').value,
        quantity: parseInt(document.getElementById('quantity').value) || 1,
        brand: document.getElementById('brand').value.trim(),
        serialNumber: document.getElementById('serialNumber').value.trim(),
        installDate: document.getElementById('installationDate').value,
        expiryDate: document.getElementById('expiryDate').value,
        status: document.getElementById('status').value,
        recommendReplacement: document.getElementById('recommendReplacement').checked,
        extinguisherRemarks: document.getElementById('extinguisherRemarks').value.trim(),
        
        // Hazard Assessment
        areaType: document.getElementById('areaType').value,
        trafficLevel: document.getElementById('trafficLevel').value,
        hazards: Array.from(document.querySelectorAll('.hazard-option input:checked'))
            .map(cb => cb.value)
            .join(', '),
        hazardDescription: document.getElementById('hazardDescription').value.trim(),
        recommendedType: document.getElementById('recommendedType').value,
        riskLevel: document.getElementById('riskLevel').value,
        hazardRemarks: document.getElementById('hazardRemarks').value.trim()
    };
    
    // Validate required fields
    if (!extinguisherData.location || !extinguisherData.extinguisherName || !extinguisherData.capacity) {
        showSuccessModal('Validation Error', 'Please fill in all required fields: Location, Extinguisher Name, and Capacity.');
        goToStep(2);
        return;
    }
    
    if (!extinguisherData.areaType) {
        showSuccessModal('Validation Error', 'Please select Area Type in Hazard Assessment.');
        goToStep(3);
        return;
    }
    
    // Add to array
    extinguishers.push(extinguisherData);
    
    // Update table and counters
    updateExtinguisherTable();
    updateCounters();
    
    // Show success message
    showSuccessModal('Success!', 'Fire extinguisher added to the audit list successfully.');
    
    // Save to localStorage
    saveToLocalStorage();
}

function addExtinguisherAndStartNew() {
    addExtinguisherFromReview();
    
    // Clear form for next entry (keep basic info)
    document.getElementById('location').value = '';
    document.getElementById('extinguisherName').value = '';
    document.getElementById('extinguisherType').value = '';
    document.getElementById('bodyType').value = '';
    document.getElementById('operatingType').value = '';
    document.getElementById('fireAgentType').value = '';
    document.getElementById('fireAgentName').value = '';
    document.getElementById('capacity').value = '';
    document.getElementById('quantity').value = '1';
    document.getElementById('brand').value = '';
    document.getElementById('serialNumber').value = '';
    document.getElementById('installationDate').value = '';
    document.getElementById('expiryDate').value = '';
    document.getElementById('status').value = 'Good';
    document.getElementById('recommendReplacement').checked = false;
    document.getElementById('extinguisherRemarks').value = '';
    
    // Reset hazard assessment
    document.getElementById('areaType').value = '';
    document.getElementById('trafficLevel').value = 'Medium';
    document.querySelectorAll('.hazard-option input').forEach(cb => {
        cb.checked = false;
    });
    document.getElementById('hazardDescription').value = '';
    document.getElementById('recommendedType').value = '';
    document.getElementById('riskLevel').value = 'Medium';
    document.getElementById('hazardRemarks').value = '';
    
    // Go back to step 2
    goToStep(2);
}

function updateExtinguisherTable() {
    const tableBody = document.getElementById('extinguisherTableBody');
    tableBody.innerHTML = '';
    
    extinguishers.forEach(ext => {
        const row = document.createElement('tr');
        row.className = 'fade-in';
        
        // Status badge
        let statusClass = 'status-good';
        if (ext.status === 'Needs Service' || ext.status === 'Expired' || ext.status === 'Not Accessible') {
            statusClass = 'status-warning';
        } else if (ext.status === 'Damaged' || ext.status === 'Missing') {
            statusClass = 'status-danger';
        }
        
        // Risk badge
        let riskClass = 'risk-' + (ext.riskLevel || 'Medium').toLowerCase();
        
        // Prepare extinguisher display name
        const extinguisherDisplay = ext.extinguisherName.length > 30 ? 
            ext.extinguisherName.substring(0, 30) + '...' : ext.extinguisherName;
        
        row.innerHTML = `
            <td>${ext.sno}</td>
            <td>${ext.location}</td>
            <td>${extinguisherDisplay}</td>
            <td>${ext.capacity}</td>
            <td>${ext.quantity}</td>
            <td><span class="status-badge ${statusClass}">${ext.status}</span></td>
            <td>${formatDate(ext.expiryDate)}</td>
            <td><span class="risk-badge ${riskClass}">${ext.riskLevel || 'Medium'}</span></td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editExtinguisher(${ext.sno})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteExtinguisher(${ext.sno})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function updateCounters() {
    const totalItems = extinguishers.length;
    const totalQuantity = extinguishers.reduce((sum, ext) => sum + ext.quantity, 0);
    const attentionCount = extinguishers.filter(ext => 
        ext.status !== 'Good' && ext.status !== 'Not Accessible'
    ).reduce((sum, ext) => sum + ext.quantity, 0);
    
    document.getElementById('totalCount').textContent = totalItems;
    document.getElementById('totalQuantity').textContent = totalQuantity;
    document.getElementById('attentionCount').textContent = attentionCount;
    
    document.getElementById('previewTotal').textContent = totalQuantity;
    document.getElementById('previewGood').textContent = totalQuantity - attentionCount;
    document.getElementById('previewAttention').textContent = attentionCount;
}

function deleteExtinguisher(sno) {
    showConfirmModal(
        'Delete Extinguisher',
        'Are you sure you want to delete this extinguisher from the list?',
        function() {
            extinguishers = extinguishers.filter(ext => ext.sno !== sno);
            updateExtinguisherTable();
            updateCounters();
            saveToLocalStorage();
        }
    );
}

function editExtinguisher(sno) {
    const ext = extinguishers.find(e => e.sno === sno);
    if (!ext) return;
    
    // Populate basic info if not already set
    if (!document.getElementById('accountName').value) {
        document.getElementById('accountName').value = ext.accountName || '';
        document.getElementById('address').value = ext.address || '';
        document.getElementById('auditDate').value = ext.auditDate || '';
        document.getElementById('contactPerson').value = ext.contactPerson || '';
        document.getElementById('contactPhone').value = ext.contactPhone || '';
        document.getElementById('contactEmail').value = ext.contactEmail || '';
    }
    
    // Populate extinguisher details
    document.getElementById('location').value = ext.location || '';
    document.getElementById('extinguisherName').value = ext.extinguisherName || '';
    document.getElementById('extinguisherType').value = ext.type || '';
    document.getElementById('bodyType').value = ext.bodyType || '';
    document.getElementById('operatingType').value = ext.operatingType || '';
    document.getElementById('fireAgentType').value = ext.fireAgentType || '';
    document.getElementById('fireAgentName').value = ext.fireAgentName || '';
    document.getElementById('capacity').value = ext.capacity || '';
    document.getElementById('quantity').value = ext.quantity || 1;
    document.getElementById('brand').value = ext.brand || '';
    document.getElementById('serialNumber').value = ext.serialNumber || '';
    document.getElementById('installationDate').value = ext.installDate || '';
    document.getElementById('expiryDate').value = ext.expiryDate || '';
    document.getElementById('status').value = ext.status || 'Good';
    document.getElementById('recommendReplacement').checked = ext.recommendReplacement || false;
    document.getElementById('extinguisherRemarks').value = ext.extinguisherRemarks || '';
    
    // Populate hazard assessment
    document.getElementById('areaType').value = ext.areaType || '';
    document.getElementById('trafficLevel').value = ext.trafficLevel || 'Medium';
    
    // Set hazard checkboxes
    const hazards = ext.hazards ? ext.hazards.split(', ') : [];
    document.querySelectorAll('.hazard-option input').forEach(cb => {
        cb.checked = hazards.includes(cb.value);
    });
    
    document.getElementById('hazardDescription').value = ext.hazardDescription || '';
    document.getElementById('recommendedType').value = ext.recommendedType || '';
    document.getElementById('riskLevel').value = ext.riskLevel || 'Medium';
    document.getElementById('hazardRemarks').value = ext.hazardRemarks || '';
    
    // Remove from list (will be re-added when saved)
    extinguishers = extinguishers.filter(e => e.sno !== sno);
    updateExtinguisherTable();
    updateCounters();
    
    // Go to step 2
    goToStep(2);
    
    showSuccessModal('Edit Mode', 'Extinguisher loaded for editing. Make your changes and proceed through the steps to save.');
}

function clearAllExtinguishers() {
    extinguishers = [];
    currentSno = 1;
    updateExtinguisherTable();
    updateCounters();
    updateReportPreview();
    saveToLocalStorage();
    showSuccessModal('Cleared', 'All extinguishers have been removed from the list.');
}

function generateReport() {
    if (extinguishers.length === 0) {
        showSuccessModal('No Data', 'Please add at least one fire extinguisher before generating a report.');
        return;
    }
    
    updateReportPreview();
    
    // Scroll to report section
    document.getElementById('reportSection').scrollIntoView({ behavior: 'smooth' });
    
    showSuccessModal('Report Generated', 'Your fire extinguisher audit report has been generated successfully.');
}

function updateReportPreview() {
    if (extinguishers.length === 0) {
        document.querySelector('.report-details').innerHTML = `
            <p class="no-data">No audit data available. Please add extinguishers and generate a report.</p>
        `;
        return;
    }
    
    // Use first extinguisher's basic info (all should be same)
    const firstExt = extinguishers[0];
    
    document.getElementById('reportAccountName').textContent = firstExt.accountName || 'Not specified';
    document.getElementById('reportAddress').textContent = firstExt.address || 'Not specified';
    document.getElementById('reportDate').textContent = formatDate(firstExt.auditDate) || 'Not specified';
    document.getElementById('reportContact').textContent = firstExt.contactPerson || 'Not specified';
    
    // Generate report details
    let reportHTML = `
        <div class="report-executive">
            <h4>Executive Summary</h4>
            <div class="summary-grid">
                <div class="summary-box">
                    <span class="summary-title">Total Extinguishers</span>
                    <span class="summary-number">${extinguishers.length}</span>
                </div>
                <div class="summary-box">
                    <span class="summary-title">Total Quantity</span>
                    <span class="summary-number">${extinguishers.reduce((sum, ext) => sum + ext.quantity, 0)}</span>
                </div>
                <div class="summary-box">
                    <span class="summary-title">Good Condition</span>
                    <span class="summary-number" style="color: #28a745;">${extinguishers.filter(ext => ext.status === 'Good').length}</span>
                </div>
                <div class="summary-box">
                    <span class="summary-title">Needs Attention</span>
                    <span class="summary-number" style="color: #dc3545;">${extinguishers.filter(ext => ext.status !== 'Good').length}</span>
                </div>
            </div>
        </div>
        
        <h4>Detailed Audit Report</h4>
        <div class="report-table-container">
            <table class="report-table">
                <thead>
                    <tr>
                        <th>S.No</th>
                        <th>Location</th>
                        <th>Extinguisher</th>
                        <th>Capacity</th>
                        <th>Qty</th>
                        <th>Status</th>
                        <th>Expiry Date</th>
                        <th>Risk Level</th>
                        <th>Recommendation</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    extinguishers.forEach(ext => {
        const recommendation = ext.recommendReplacement ? 'Replace/Add' : 'OK';
        reportHTML += `
            <tr>
                <td>${ext.sno}</td>
                <td>${ext.location}</td>
                <td>${ext.extinguisherName}</td>
                <td>${ext.capacity}</td>
                <td>${ext.quantity}</td>
                <td><span class="status-badge status-${ext.status === 'Good' ? 'good' : 'warning'}">${ext.status}</span></td>
                <td>${formatDate(ext.expiryDate)}</td>
                <td><span class="risk-badge risk-${(ext.riskLevel || 'Medium').toLowerCase()}">${ext.riskLevel || 'Medium'}</span></td>
                <td>${recommendation}</td>
            </tr>
        `;
    });
    
    reportHTML += `
                </tbody>
            </table>
        </div>
        
        <h4>Key Findings & Recommendations</h4>
        <div class="findings">
    `;
    
    // Generate findings
    const needsAttention = extinguishers.filter(ext => ext.status !== 'Good');
    const recommendedReplacements = extinguishers.filter(ext => ext.recommendReplacement);
    
    if (needsAttention.length === 0 && recommendedReplacements.length === 0) {
        reportHTML += '<p><strong>✓ All fire extinguishers are in good working condition.</strong></p>';
    } else {
        reportHTML += '<ul class="findings-list">';
        
        if (needsAttention.length > 0) {
            reportHTML += `<li><strong>Extinguishers Needing Attention (${needsAttention.length}):</strong>`;
            needsAttention.forEach(ext => {
                reportHTML += `<br>• ${ext.location}: ${ext.extinguisherName} - ${ext.status}`;
            });
            reportHTML += '</li>';
        }
        
        if (recommendedReplacements.length > 0) {
            reportHTML += `<li><strong>Recommended for Replacement/Addition (${recommendedReplacements.length}):</strong>`;
            recommendedReplacements.forEach(ext => {
                reportHTML += `<br>• ${ext.location}: ${ext.extinguisherName}`;
            });
            reportHTML += '</li>';
        }
        
        reportHTML += '</ul>';
    }
    
    // High risk areas
    const highRisk = extinguishers.filter(ext => (ext.riskLevel || 'Medium') === 'High' || (ext.riskLevel || 'Medium') === 'Critical');
    if (highRisk.length > 0) {
        reportHTML += `<p><strong>High Risk Areas Identified:</strong> ${highRisk.map(e => e.location).join(', ')}</p>`;
    }
    
    reportHTML += `
        </div>
        
        <div class="report-footer">
            <div class="signature-section">
                <div class="signature-box">
                    <p><strong>Audit Conducted By:</strong></p>
                    <p class="signature-line">${firstExt.contactPerson || '_________________'}</p>
                </div>
                <div class="signature-box">
                    <p><strong>Date:</strong></p>
                    <p>${formatDate(firstExt.auditDate)}</p>
                </div>
            </div>
            <div class="report-notes">
                <p><strong>Note:</strong> This report is generated by Fire Extinguisher Audit Tool. Regular inspections are recommended as per NFPA 10 standards.</p>
            </div>
        </div>
    `;
    
    document.querySelector('.report-details').innerHTML = reportHTML;
}

function loadSampleData() {
    showConfirmModal(
        'Load Sample Data',
        'This will replace any existing data with sample fire extinguisher records. Continue?',
        function() {
            // Clear existing data
            extinguishers = [];
            currentSno = 1;
            
            // Sample data
            const sampleExtinguishers = [
                {
                    sno: 1,
                    accountName: 'Sample Manufacturing Company Inc.',
                    address: '123 Industrial Estate, Safety City, SC 12345',
                    auditDate: new Date().toISOString().split('T')[0],
                    contactPerson: 'John Safety Manager',
                    contactPhone: '(555) 987-6543',
                    contactEmail: 'john.safety@samplecompany.com',
                    
                    location: 'Main Production Floor',
                    extinguisherName: 'ABC / DCP - PORTABLE - MILD STEEL - STORE PRESSURE - POWDER - MAP 90% - 9 KG',
                    type: 'PORTABLE',
                    bodyType: 'MILD STEEL',
                    operatingType: 'STORE PRESSURE',
                    fireAgentType: 'POWDER',
                    fireAgentName: 'MAP 90%',
                    capacity: '9 KG',
                    quantity: 3,
                    brand: 'FireSafe Pro',
                    serialNumber: 'FSP-2023-001',
                    installDate: '2023-03-15',
                    expiryDate: '2024-03-15',
                    status: 'Good',
                    recommendReplacement: false,
                    extinguisherRemarks: 'Properly mounted near exit',
                    
                    areaType: 'Manufacturing',
                    trafficLevel: 'Medium',
                    hazards: 'Class A, Class B, Class C',
                    hazardDescription: 'Production area with machinery and flammable materials',
                    recommendedType: 'ABC / DCP',
                    riskLevel: 'High',
                    hazardRemarks: 'Regular inspection required due to high risk'
                },
                {
                    sno: 2,
                    accountName: 'Sample Manufacturing Company Inc.',
                    address: '123 Industrial Estate, Safety City, SC 12345',
                    auditDate: new Date().toISOString().split('T')[0],
                    contactPerson: 'John Safety Manager',
                    contactPhone: '(555) 987-6543',
                    contactEmail: 'john.safety@samplecompany.com',
                    
                    location: 'Electrical Control Room',
                    extinguisherName: 'CO2 - PORTABLE - MILD STEEL - STORE PRESSURE - GAS - CO2 - 4.5 KG',
                    type: 'PORTABLE',
                    bodyType: 'MILD STEEL',
                    operatingType: 'STORE PRESSURE',
                    fireAgentType: 'GAS',
                    fireAgentName: 'CO2',
                    capacity: '4.5 KG',
                    quantity: 1,
                    brand: 'ElectricalSafe',
                    serialNumber: 'ES-2023-002',
                    installDate: '2023-05-20',
                    expiryDate: '2024-05-20',
                    status: 'Good',
                    recommendReplacement: false,
                    extinguisherRemarks: 'For electrical equipment protection',
                    
                    areaType: 'Electrical Room',
                    trafficLevel: 'Low',
                    hazards: 'Class C',
                    hazardDescription: 'Critical electrical control panels',
                    recommendedType: 'CO2',
                    riskLevel: 'Critical',
                    hazardRemarks: 'Critical area - monthly inspection required'
                },
                {
                    sno: 3,
                    accountName: 'Sample Manufacturing Company Inc.',
                    address: '123 Industrial Estate, Safety City, SC 12345',
                    auditDate: new Date().toISOString().split('T')[0],
                    contactPerson: 'John Safety Manager',
                    contactPhone: '(555) 987-6543',
                    contactEmail: 'john.safety@samplecompany.com',
                    
                    location: 'Staff Kitchen',
                    extinguisherName: 'KITCHEN (K/F CLASS) - PORTABLE - STAINLESS STEEL - STORE PRESSURE - KITCHEN - WET CHEMICAL - 6 LTR',
                    type: 'PORTABLE',
                    bodyType: 'STAINLESS STEEL',
                    operatingType: 'STORE PRESSURE',
                    fireAgentType: 'KITCHEN',
                    fireAgentName: 'WET CHEMICAL',
                    capacity: '6 LTR',
                    quantity: 1,
                    brand: 'KitchenGuard',
                    serialNumber: 'KG-2022-003',
                    installDate: '2022-11-10',
                    expiryDate: '2023-11-10',
                    status: 'Expired',
                    recommendReplacement: true,
                    extinguisherRemarks: 'EXPIRED - NEEDS IMMEDIATE REPLACEMENT',
                    
                    areaType: 'Kitchen',
                    trafficLevel: 'Medium',
                    hazards: 'Class K, Class A',
                    hazardDescription: 'Cooking area with deep fryers and flammable oils',
                    recommendedType: 'KITCHEN',
                    riskLevel: 'High',
                    hazardRemarks: 'Expired extinguisher - replace immediately with wet chemical type'
                }
            ];
            
            // Add sample data
            extinguishers = sampleExtinguishers;
            currentSno = sampleExtinguishers.length + 1;
            
            // Fill basic info
            document.getElementById('accountName').value = 'Sample Manufacturing Company Inc.';
            document.getElementById('address').value = '123 Industrial Estate, Safety City, SC 12345';
            document.getElementById('auditDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('contactPerson').value = 'John Safety Manager';
            document.getElementById('contactPhone').value = '(555) 987-6543';
            document.getElementById('contactEmail').value = 'john.safety@samplecompany.com';
            
            // Update UI
            updateExtinguisherTable();
            updateCounters();
            
            showSuccessModal('Sample Data Loaded', 'Sample fire extinguisher data has been loaded. You can now generate a report or modify the data as needed.');
        }
    );
}

function exportToCSV() {
    if (extinguishers.length === 0) {
        showSuccessModal('No Data', 'There is no data to export. Please add extinguishers first.');
        return;
    }
    
    // Create CSV content
    const headers = ['S.No', 'Location', 'Extinguisher Name', 'Type', 'Body Type', 'Operating Type', 'Fire Agent Type', 'Fire Agent Name', 'Capacity', 'Quantity', 'Brand', 'Serial Number', 'Install Date', 'Expiry Date', 'Status', 'Recommend Replacement', 'Area Type', 'Traffic Level', 'Hazards', 'Risk Level', 'Remarks'];
    const rows = extinguishers.map(ext => [
        ext.sno,
        ext.location,
        ext.extinguisherName,
        ext.type,
        ext.bodyType,
        ext.operatingType,
        ext.fireAgentType,
        ext.fireAgentName,
        ext.capacity,
        ext.quantity,
        ext.brand,
        ext.serialNumber,
        formatDate(ext.installDate),
        formatDate(ext.expiryDate),
        ext.status,
        ext.recommendReplacement ? 'Yes' : 'No',
        ext.areaType,
        ext.trafficLevel,
        ext.hazards,
        ext.riskLevel,
        ext.extinguisherRemarks
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `fire_extinguisher_audit_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccessModal('CSV Exported', 'Your fire extinguisher data has been exported to CSV file.');
}

async function exportToPDF() {
    if (extinguishers.length === 0) {
        showSuccessModal('No Data', 'There is no data to export. Please add extinguishers first.');
        return;
    }
    
    try {
        // Load jsPDF dynamically
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Add title
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text('FIRE EXTINGUISHER AUDIT REPORT', 105, 20, { align: 'center' });
        
        // Add company info
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        
        const firstExt = extinguishers[0];
        
        doc.text(`Company: ${firstExt.accountName || 'Not specified'}`, 20, 35);
        doc.text(`Address: ${firstExt.address || 'Not specified'}`, 20, 42);
        doc.text(`Audit Date: ${formatDate(firstExt.auditDate) || 'Not specified'}`, 20, 49);
        doc.text(`Audited By: ${firstExt.contactPerson || 'Not specified'}`, 20, 56);
        
        // Add summary
        doc.setFontSize(14);
        doc.setTextColor(230, 57, 70);
        doc.text('Summary', 20, 70);
        
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        const total = extinguishers.reduce((sum, ext) => sum + ext.quantity, 0);
        const good = extinguishers.filter(ext => ext.status === 'Good').reduce((sum, ext) => sum + ext.quantity, 0);
        const attention = extinguishers.filter(ext => ext.status !== 'Good').reduce((sum, ext) => sum + ext.quantity, 0);
        const replacements = extinguishers.filter(ext => ext.recommendReplacement).length;
        
        doc.text(`Total Extinguishers: ${total}`, 20, 80);
        doc.text(`In Good Condition: ${good}`, 20, 87);
        doc.text(`Need Attention: ${attention}`, 20, 94);
        doc.text(`Recommended Replacements: ${replacements}`, 20, 101);
        
        // Add table
        const tableData = extinguishers.map(ext => [
            ext.sno,
            ext.location.substring(0, 20),
            ext.extinguisherName.substring(0, 25),
            ext.capacity,
            ext.quantity,
            ext.status,
            formatDate(ext.expiryDate),
            ext.recommendReplacement ? 'Yes' : 'No'
        ]);
        
        doc.autoTable({
            startY: 110,
            head: [['S.No', 'Location', 'Extinguisher', 'Capacity', 'Qty', 'Status', 'Expiry', 'Replace']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [40, 40, 40] },
            margin: { top: 110 }
        });
        
        // Add recommendations
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(14);
        doc.setTextColor(230, 57, 70);
        doc.text('Key Findings', 20, finalY);
        
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        
        let yPos = finalY + 10;
        const needsAttention = extinguishers.filter(ext => ext.status !== 'Good');
        
        if (needsAttention.length === 0) {
            doc.text('• All fire extinguishers are in good working condition.', 20, yPos);
            yPos += 10;
        } else {
            needsAttention.forEach((ext, index) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(`• ${ext.location}: ${ext.extinguisherName.substring(0, 30)} - ${ext.status}`, 20, yPos);
                yPos += 10;
            });
        }
        
        // Add replacement recommendations
        const recommendedReplacements = extinguishers.filter(ext => ext.recommendReplacement);
        if (recommendedReplacements.length > 0) {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.setFontSize(14);
            doc.setTextColor(230, 57, 70);
            doc.text('Recommended Actions', 20, yPos);
            yPos += 10;
            
            doc.setFontSize(11);
            doc.setTextColor(80, 80, 80);
            
            recommendedReplacements.forEach(ext => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(`• Replace/Add at ${ext.location}: ${ext.extinguisherName.substring(0, 30)}`, 20, yPos);
                yPos += 10;
            });
        }
        
        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
            doc.text('Generated by Fire Extinguisher Audit Tool', 105, 292, { align: 'center' });
        }
        
        // Save the PDF
        doc.save(`fire_extinguisher_audit_${new Date().toISOString().split('T')[0]}.pdf`);
        
        showSuccessModal('PDF Exported', 'Your fire extinguisher audit report has been exported as PDF.');
    } catch (error) {
        console.error('PDF export error:', error);
        showSuccessModal('Export Error', 'There was an error generating the PDF. Please try again.');
    }
}

function printReport() {
    if (extinguishers.length === 0) {
        showSuccessModal('No Data', 'There is no data to print. Please add extinguishers first.');
        return;
    }
    
    // Update report preview before printing
    updateReportPreview();
    
    // Create print window content
    const printContent = document.getElementById('reportPreview').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Fire Extinguisher Audit Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1, h2, h3, h4 { color: #333; }
                .report-header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #e63946; padding-bottom: 20px; }
                .report-header h3 { font-size: 24px; margin-bottom: 20px; }
                .report-meta { text-align: left; margin-top: 20px; }
                .report-meta p { margin: 5px 0; }
                .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
                .summary-box { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #dee2e6; }
                .summary-title { display: block; font-size: 12px; color: #6c757d; margin-bottom: 5px; }
                .summary-number { display: block; font-size: 24px; font-weight: bold; color: #e63946; }
                .report-table-container { overflow-x: auto; margin: 30px 0; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #dee2e6; padding: 8px; text-align: left; }
                th { background-color: #343a40; color: white; }
                .status-badge, .risk-badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; display: inline-block; }
                .status-good { background-color: #d4edda; color: #155724; }
                .status-warning { background-color: #fff3cd; color: #856404; }
                .risk-low { background-color: #d4edda; color: #155724; }
                .risk-medium { background-color: #fff3cd; color: #856404; }
                .risk-high { background-color: #f8d7da; color: #721c24; }
                .findings { margin: 30px 0; }
                .findings-list { margin-left: 20px; }
                .signature-section { display: flex; justify-content: space-between; margin-top: 50px; }
                .signature-box { width: 45%; }
                .signature-line { border-bottom: 1px solid #333; margin-top: 20px; padding-bottom: 5px; }
                .report-notes { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${printContent}
            <div class="report-notes">
                <p><strong>Note:</strong> This report is generated automatically. Regular fire extinguisher inspections are required by NFPA 10 standards.</p>
                <p>Printed: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            </div>
        </body>
        </html>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    updateExtinguisherTable(); // Restore table functionality
}

// Modal Functions
function showSuccessModal(title, message) {
    document.getElementById('successMessage').textContent = message;
    document.querySelector('#successModal h3').textContent = title;
    document.getElementById('successModal').style.display = 'flex';
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

let confirmedAction = null;

function showConfirmModal(title, message, action) {
    confirmedAction = action;
    document.getElementById('confirmMessage').textContent = message;
    document.querySelector('#confirmModal h3').textContent = title;
    document.getElementById('confirmModal').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    confirmedAction = null;
}

function executeConfirmedAction() {
    if (confirmedAction) {
        confirmedAction();
    }
    closeConfirmModal();
}

// Utility Functions
function formatDate(dateString) {
    if (!dateString || dateString === 'Not specified' || dateString === '-') return '-';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// LocalStorage Functions
function saveToLocalStorage() {
    const data = {
        extinguishers,
        currentSno,
        basicInfo: {
            accountName: document.getElementById('accountName').value,
            address: document.getElementById('address').value,
            auditDate: document.getElementById('auditDate').value,
            contactPerson: document.getElementById('contactPerson').value,
            contactPhone: document.getElementById('contactPhone').value,
            contactEmail: document.getElementById('contactEmail').value
        }
    };
    
    localStorage.setItem('fireExtinguisherAudit', JSON.stringify(data));
}

function loadSavedData() {
    const saved = localStorage.getItem('fireExtinguisherAudit');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            extinguishers = data.extinguishers || [];
            currentSno = data.currentSno || 1;
            
            if (data.basicInfo) {
                document.getElementById('accountName').value = data.basicInfo.accountName || '';
                document.getElementById('address').value = data.basicInfo.address || '';
                document.getElementById('auditDate').value = data.basicInfo.auditDate || '';
                document.getElementById('contactPerson').value = data.basicInfo.contactPerson || '';
                document.getElementById('contactPhone').value = data.basicInfo.contactPhone || '';
                document.getElementById('contactEmail').value = data.basicInfo.contactEmail || '';
            }
            
            updateExtinguisherTable();
            updateCounters();
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }
}

function setupAutoSave() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('change', saveToLocalStorage);
    });
}

// Add report preview styles
const style = document.createElement('style');
style.textContent = `
    .report-executive { margin: 1.5rem 0; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 1rem 0; }
    .summary-box { background: #f8f9fa; padding: 1rem; border-radius: var(--border-radius); text-align: center; border: 1px solid #dee2e6; }
    .summary-title { display: block; font-size: 0.85rem; color: var(--gray-medium); margin-bottom: 0.5rem; }
    .summary-number { display: block; font-size: 1.25rem; font-weight: 700; color: var(--primary-color); }
    .report-table-container { overflow-x: auto; margin: 1rem 0; }
    .report-table { width: 100%; border-collapse: collapse; }
    .report-table th { background: var(--dark-color); color: white; padding: 0.75rem; font-size: 0.85rem; }
    .report-table td { padding: 0.75rem; border-bottom: 1px solid var(--gray-light); font-size: 0.85rem; }
    .report-table tr:nth-child(even) { background: var(--light-color); }
    .findings { background: var(--light-color); padding: 1.5rem; border-radius: var(--border-radius); margin: 1rem 0; }
    .findings-list { margin-left: 1.5rem; }
    .findings-list li { margin-bottom: 0.5rem; }
    .signature-section { display: flex; justify-content: space-between; margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid var(--gray-light); }
    .signature-box { width: 45%; }
    .signature-line { border-bottom: 1px solid var(--gray-dark); margin-top: 1.5rem; padding-bottom: 0.5rem; min-height: 1.5rem; }
    .report-notes { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--gray-light); font-size: 0.85rem; color: var(--gray-medium); }
`;
document.head.appendChild(style);
