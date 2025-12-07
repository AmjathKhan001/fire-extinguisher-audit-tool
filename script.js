// Global Variables
let extinguishers = [];
let currentSno = 1;

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
});

function initializeEventListeners() {
    // Add extinguisher button
    document.getElementById('addExtinguisherBtn').addEventListener('click', addExtinguisher);
    
    // Clear form button
    document.getElementById('clearFormBtn').addEventListener('click', clearForm);
    
    // Generate report button
    document.getElementById('generateReportBtn').addEventListener('click', generateReport);
    
    // Load sample data button
    document.getElementById('loadSampleBtn').addEventListener('click', loadSampleData);
    
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
    
    // Modal buttons
    document.getElementById('modalOkBtn').addEventListener('click', closeSuccessModal);
    document.getElementById('modalCancelBtn').addEventListener('click', closeConfirmModal);
    document.getElementById('modalConfirmBtn').addEventListener('click', executeConfirmedAction);
    
    // Close modals on X click
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            document.getElementById('successModal').style.display = 'none';
            document.getElementById('confirmModal').style.display = 'none';
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
    
    document.getElementById('privacyPolicy').addEventListener('click', function(e) {
        e.preventDefault();
        showSuccessModal('Privacy Policy', 'We value your privacy. This tool stores data locally in your browser and does not send any information to external servers.');
    });
    
    document.getElementById('termsOfUse').addEventListener('click', function(e) {
        e.preventDefault();
        showSuccessModal('Terms of Use', 'This tool is provided for informational purposes only. Always consult with certified fire safety professionals for official inspections.');
    });
    
    // Auto-save on input changes
    setupAutoSave();
}

function addExtinguisher() {
    // Get form values
    const location = document.getElementById('location').value.trim();
    const type = document.getElementById('extinguisherType').value;
    const brand = document.getElementById('brand').value.trim();
    const capacity = document.getElementById('capacity').value;
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    const installDate = document.getElementById('installationDate').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const status = document.getElementById('status').value;
    const areaType = document.getElementById('areaType').value;
    const trafficLevel = document.getElementById('trafficLevel').value;
    const remarks = document.getElementById('remarks').value.trim();
    
    // Get hazard classes
    const hazards = [];
    if (document.getElementById('hazardA').checked) hazards.push('Class A');
    if (document.getElementById('hazardB').checked) hazards.push('Class B');
    if (document.getElementById('hazardC').checked) hazards.push('Class C');
    if (document.getElementById('hazardD').checked) hazards.push('Class D');
    if (document.getElementById('hazardK').checked) hazards.push('Class K');
    
    // Validate required fields
    if (!location || !type || !capacity) {
        showSuccessModal('Validation Error', 'Please fill in all required fields: Location, Type, and Capacity.');
        return;
    }
    
    // Create extinguisher object
    const extinguisher = {
        sno: currentSno++,
        location,
        type,
        brand: brand || 'Not specified',
        capacity,
        quantity,
        installDate,
        expiryDate,
        status,
        areaType,
        trafficLevel,
        hazards: hazards.join(', '),
        remarks: remarks || 'No remarks'
    };
    
    // Add to array
    extinguishers.push(extinguisher);
    
    // Update table
    updateExtinguisherTable();
    
    // Update counters
    updateCounters();
    
    // Show success message
    showSuccessModal('Success!', 'Fire extinguisher added to the list successfully.');
    
    // Clear form for next entry (optional)
    // clearForm();
    
    // Save to localStorage
    saveToLocalStorage();
}

function updateExtinguisherTable() {
    const tableBody = document.getElementById('extinguisherTableBody');
    tableBody.innerHTML = '';
    
    extinguishers.forEach(ext => {
        const row = document.createElement('tr');
        row.className = 'fade-in';
        
        // Status badge
        let statusClass = 'status-good';
        if (ext.status === 'Needs Service' || ext.status === 'Expired') {
            statusClass = 'status-warning';
        } else if (ext.status === 'Damaged' || ext.status === 'Missing') {
            statusClass = 'status-danger';
        }
        
        row.innerHTML = `
            <td>${ext.sno}</td>
            <td>${ext.location}</td>
            <td>${ext.type}</td>
            <td>${ext.brand}</td>
            <td>${ext.capacity}</td>
            <td>${ext.quantity}</td>
            <td>${formatDate(ext.installDate)}</td>
            <td>${formatDate(ext.expiryDate)}</td>
            <td><span class="status-badge ${statusClass}">${ext.status}</span></td>
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
    const total = extinguishers.reduce((sum, ext) => sum + ext.quantity, 0);
    const good = extinguishers.filter(ext => ext.status === 'Good').reduce((sum, ext) => sum + ext.quantity, 0);
    const attention = extinguishers.filter(ext => ext.status !== 'Good').reduce((sum, ext) => sum + ext.quantity, 0);
    
    document.getElementById('totalCount').textContent = total;
    document.getElementById('previewTotal').textContent = total;
    document.getElementById('previewGood').textContent = good;
    document.getElementById('previewAttention').textContent = attention;
}

function clearForm() {
    document.getElementById('location').value = '';
    document.getElementById('extinguisherType').value = '';
    document.getElementById('brand').value = '';
    document.getElementById('capacity').value = '';
    document.getElementById('quantity').value = '1';
    document.getElementById('installationDate').value = '';
    document.getElementById('expiryDate').value = '';
    document.getElementById('status').value = 'Good';
    document.getElementById('areaType').value = '';
    document.getElementById('trafficLevel').value = 'Medium';
    document.getElementById('remarks').value = '';
    
    // Clear checkboxes
    document.querySelectorAll('.hazard-checkboxes input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
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

function deleteExtinguisher(sno) {
    showConfirmModal(
        'Delete Extinguisher',
        'Are you sure you want to delete this extinguisher from the list?',
        function() {
            extinguishers = extinguishers.filter(ext => ext.sno !== sno);
            updateExtinguisherTable();
            updateCounters();
            updateReportPreview();
            saveToLocalStorage();
        }
    );
}

function editExtinguisher(sno) {
    const ext = extinguishers.find(e => e.sno === sno);
    if (!ext) return;
    
    // Populate form with extinguisher data
    document.getElementById('location').value = ext.location;
    document.getElementById('extinguisherType').value = ext.type;
    document.getElementById('brand').value = ext.brand;
    document.getElementById('capacity').value = ext.capacity;
    document.getElementById('quantity').value = ext.quantity;
    document.getElementById('installationDate').value = ext.installDate;
    document.getElementById('expiryDate').value = ext.expiryDate;
    document.getElementById('status').value = ext.status;
    document.getElementById('areaType').value = ext.areaType;
    document.getElementById('trafficLevel').value = ext.trafficLevel;
    document.getElementById('remarks').value = ext.remarks;
    
    // Set hazard checkboxes
    const hazards = ext.hazards.split(', ');
    document.getElementById('hazardA').checked = hazards.includes('Class A');
    document.getElementById('hazardB').checked = hazards.includes('Class B');
    document.getElementById('hazardC').checked = hazards.includes('Class C');
    document.getElementById('hazardD').checked = hazards.includes('Class D');
    document.getElementById('hazardK').checked = hazards.includes('Class K');
    
    // Remove from list (will be re-added when saved)
    extinguishers = extinguishers.filter(e => e.sno !== sno);
    updateExtinguisherTable();
    updateCounters();
    
    showSuccessModal('Edit Mode', 'Extinguisher loaded for editing. Make your changes and click "Add Extinguisher" to save.');
}

function generateReport() {
    if (extinguishers.length === 0) {
        showSuccessModal('No Data', 'Please add at least one fire extinguisher before generating a report.');
        return;
    }
    
    updateReportPreview();
    
    // Scroll to report preview
    document.querySelector('.report-preview-section').scrollIntoView({ behavior: 'smooth' });
    
    showSuccessModal('Report Generated', 'Your fire extinguisher audit report has been generated successfully. Scroll down to view the preview.');
}

function updateReportPreview() {
    const accountName = document.getElementById('accountName').value || 'Not specified';
    const address = document.getElementById('address').value || 'Not specified';
    const auditDate = document.getElementById('auditDate').value || 'Not specified';
    const contactPerson = document.getElementById('contactPerson').value || 'Not specified';
    const contactDetails = document.getElementById('contactDetails').value || 'Not specified';
    
    // Update report header
    document.getElementById('reportAccountName').textContent = accountName;
    document.getElementById('reportAddress').textContent = address;
    document.getElementById('reportDate').textContent = formatDate(auditDate);
    document.getElementById('reportContact').textContent = `${contactPerson} (${contactDetails})`;
    
    // Generate report details
    let reportHTML = `
        <div class="report-summary">
            <h4>Executive Summary</h4>
            <p>Total Fire Extinguishers Audited: <strong>${extinguishers.length}</strong></p>
            <p>Total Quantity: <strong>${extinguishers.reduce((sum, ext) => sum + ext.quantity, 0)}</strong></p>
            <p>Audit Date: <strong>${formatDate(auditDate)}</strong></p>
        </div>
        
        <h4>Detailed Extinguisher List</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>S.No</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Qty</th>
                    <th>Install Date</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                    <th>Hazards</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    extinguishers.forEach(ext => {
        reportHTML += `
            <tr>
                <td>${ext.sno}</td>
                <td>${ext.location}</td>
                <td>${ext.type}</td>
                <td>${ext.capacity}</td>
                <td>${ext.quantity}</td>
                <td>${formatDate(ext.installDate)}</td>
                <td>${formatDate(ext.expiryDate)}</td>
                <td>${ext.status}</td>
                <td>${ext.hazards}</td>
            </tr>
        `;
    });
    
    reportHTML += `
            </tbody>
        </table>
        
        <h4>Recommendations</h4>
        <ul>
    `;
    
    // Generate recommendations based on status
    const needsAttention = extinguishers.filter(ext => ext.status !== 'Good');
    if (needsAttention.length === 0) {
        reportHTML += '<li>All fire extinguishers are in good condition.</li>';
    } else {
        needsAttention.forEach(ext => {
            reportHTML += `<li><strong>${ext.location}:</strong> ${ext.type} ${ext.capacity} - Requires ${ext.status.toLowerCase()}.</li>`;
        });
    }
    
    reportHTML += `
        </ul>
        
        <div class="report-footer">
            <p><strong>Audit Conducted By:</strong> ${contactPerson}</p>
            <p><strong>Signature:</strong> ___________________________________</p>
            <p><strong>Date:</strong> ${formatDate(auditDate)}</p>
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
                    location: 'Main Entrance Hall',
                    type: 'CM-Map 90',
                    brand: 'FireSafe',
                    capacity: '5 Kg',
                    quantity: 2,
                    installDate: '2023-01-15',
                    expiryDate: '2024-01-15',
                    status: 'Good',
                    areaType: 'Public Area',
                    trafficLevel: 'High',
                    hazards: 'Class A, Class B',
                    remarks: 'Properly mounted, easy access'
                },
                {
                    sno: 2,
                    location: 'Server Room',
                    type: 'CM-Clean Agent',
                    brand: 'CleanFire',
                    capacity: '2 Kg',
                    quantity: 1,
                    installDate: '2023-03-20',
                    expiryDate: '2024-03-20',
                    status: 'Good',
                    areaType: 'Server Room',
                    trafficLevel: 'Low',
                    hazards: 'Class C',
                    remarks: 'For electrical equipment protection'
                },
                {
                    sno: 3,
                    location: 'Kitchen',
                    type: 'Wet Chemical',
                    brand: 'KitchenSafe',
                    capacity: '6 Kg',
                    quantity: 1,
                    installDate: '2022-11-10',
                    expiryDate: '2023-11-10',
                    status: 'Expired',
                    areaType: 'Kitchen',
                    trafficLevel: 'Medium',
                    hazards: 'Class K',
                    remarks: 'NEEDS IMMEDIATE REPLACEMENT'
                },
                {
                    sno: 4,
                    location: 'Workshop Area',
                    type: 'CO2',
                    brand: 'IndustrialFire',
                    capacity: '5 Kg',
                    quantity: 3,
                    installDate: '2023-05-05',
                    expiryDate: '2024-05-05',
                    status: 'Good',
                    areaType: 'Workshop',
                    trafficLevel: 'Medium',
                    hazards: 'Class B, Class C',
                    remarks: 'Multiple units for coverage'
                },
                {
                    sno: 5,
                    location: 'Warehouse Storage',
                    type: 'Dry Powder',
                    brand: 'WarehousePro',
                    capacity: '9 Kg',
                    quantity: 2,
                    installDate: '2021-12-01',
                    expiryDate: '2022-12-01',
                    status: 'Needs Service',
                    areaType: 'Warehouse',
                    trafficLevel: 'Low',
                    hazards: 'Class A, Class B, Class C',
                    remarks: 'Pressure gauge shows low, requires servicing'
                }
            ];
            
            // Add sample data
            extinguishers = sampleExtinguishers;
            currentSno = sampleExtinguishers.length + 1;
            
            // Update UI
            updateExtinguisherTable();
            updateCounters();
            
            // Fill basic info
            document.getElementById('accountName').value = 'Sample Company Inc.';
            document.getElementById('address').value = '123 Safety Street, Firetown, FT 12345';
            document.getElementById('contactPerson').value = 'John Safety Officer';
            document.getElementById('contactDetails').value = 'john@safetycompany.com | (555) 123-4567';
            
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
    const headers = ['S.No', 'Location', 'Type', 'Brand', 'Capacity', 'Quantity', 'Install Date', 'Expiry Date', 'Status', 'Area Type', 'Traffic Level', 'Hazards', 'Remarks'];
    const rows = extinguishers.map(ext => [
        ext.sno,
        ext.location,
        ext.type,
        ext.brand,
        ext.capacity,
        ext.quantity,
        formatDate(ext.installDate),
        formatDate(ext.expiryDate),
        ext.status,
        ext.areaType,
        ext.trafficLevel,
        ext.hazards,
        ext.remarks
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
        
        const accountName = document.getElementById('accountName').value || 'Not specified';
        const address = document.getElementById('address').value || 'Not specified';
        const auditDate = document.getElementById('auditDate').value || 'Not specified';
        const contactPerson = document.getElementById('contactPerson').value || 'Not specified';
        
        doc.text(`Company: ${accountName}`, 20, 35);
        doc.text(`Address: ${address}`, 20, 42);
        doc.text(`Audit Date: ${formatDate(auditDate)}`, 20, 49);
        doc.text(`Audited By: ${contactPerson}`, 20, 56);
        
        // Add summary
        doc.setFontSize(14);
        doc.setTextColor(230, 57, 70);
        doc.text('Summary', 20, 70);
        
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        const total = extinguishers.reduce((sum, ext) => sum + ext.quantity, 0);
        const good = extinguishers.filter(ext => ext.status === 'Good').reduce((sum, ext) => sum + ext.quantity, 0);
        const attention = extinguishers.filter(ext => ext.status !== 'Good').reduce((sum, ext) => sum + ext.quantity, 0);
        
        doc.text(`Total Extinguishers: ${total}`, 20, 80);
        doc.text(`In Good Condition: ${good}`, 20, 87);
        doc.text(`Need Attention: ${attention}`, 20, 94);
        
        // Add table
        const tableData = extinguishers.map(ext => [
            ext.sno,
            ext.location.substring(0, 30), // Limit length for PDF
            ext.type,
            ext.capacity,
            ext.quantity,
            formatDate(ext.installDate),
            formatDate(ext.expiryDate),
            ext.status
        ]);
        
        doc.autoTable({
            startY: 100,
            head: [['S.No', 'Location', 'Type', 'Capacity', 'Qty', 'Install Date', 'Expiry Date', 'Status']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [40, 40, 40] },
            margin: { top: 100 }
        });
        
        // Add recommendations
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.setFontSize(14);
        doc.setTextColor(230, 57, 70);
        doc.text('Recommendations', 20, finalY);
        
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        
        let yPos = finalY + 10;
        const needsAttention = extinguishers.filter(ext => ext.status !== 'Good');
        
        if (needsAttention.length === 0) {
            doc.text('All fire extinguishers are in good condition.', 20, yPos);
            yPos += 10;
        } else {
            needsAttention.forEach((ext, index) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(`${index + 1}. ${ext.location}: ${ext.type} ${ext.capacity} - Requires ${ext.status.toLowerCase()}.`, 20, yPos);
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
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #e63946; padding-bottom: 20px; }
                .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; }
                @media print {
                    body { margin: 0; }
                }
            </style>
        </head>
        <body>
            ${printContent}
            <div class="footer">
                <p><strong>Printed:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                <p>Fire Extinguisher Audit Tool - https://firesafetytool.com</p>
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
    if (!dateString || dateString === 'Not specified') return 'Not specified';
    
    const date = new Date(dateString);
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
            contactDetails: document.getElementById('contactDetails').value
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
                document.getElementById('contactDetails').value = data.basicInfo.contactDetails || '';
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

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        addExtinguisher();
    }
    
    // Ctrl+P to print
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        printReport();
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        closeSuccessModal();
        closeConfirmModal();
    }
});

// Initialize tooltips
document.addEventListener('DOMContentLoaded', function() {
    // Add title attributes for better UX
    document.querySelectorAll('input, select, textarea').forEach(element => {
        if (!element.title && element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) {
                element.title = label.textContent;
            }
        }
    });
});

// Service Worker Registration (for PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    });
}