const enquiryForm = document.getElementById('enquiryForm');
const saveButton = document.getElementById('saveBtn');
const tableBody = document.getElementById('enquiryTableBody');
const editIdInput = document.getElementById('editId');
const formTitle = document.getElementById('form-title');
const logoutBtn = document.getElementById('logoutBtn');

const API_URL = 'http://localhost:3000';

// Helper function: Headers mein token automatically lagane ke liye
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Aap logged in nahi hain! Pehle login karein.");
        window.location.href = 'auth.html';
        return null;
    }
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Page Load hone par token check karna aur data load karna
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'auth.html'; // Agar token nahi hai to auth page bhej do
    } else {
        loadEnquiries();
    }
});

// Load Enquiries
async function loadEnquiries() {
    const headers = getAuthHeaders();
    if (!headers) return;

    try {
        const response = await fetch(`${API_URL}/enquiries`, {
            method: 'GET',
            headers: headers
        });
        
        if (response.status === 401 || response.status === 403) {
            alert("Session expired! Dubara login karein.");
            localStorage.removeItem('token');
            window.location.href = 'auth.html';
            return;
        }

        const data = await response.json();
        tableBody.innerHTML = ''; // Table khali karein

        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.user_id}</td>
                <td>${item.user_name}</td>
                <td>${item.user_email}</td>
                <td>${item.user_phone}</td>
                <td>${item.user_message}</td>
                <td>
                    <a href="#" class="btn-edit" onclick="editEnquiry(${item.user_id}, '${item.user_name}', '${item.user_email}', '${item.user_phone}', '${item.user_message}')">Edit</a> 
                    <a href="#" class="btn-delete" onclick="deleteEnquiry(${item.user_id})">Delete</a>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Data load karne mein masla:", error);
    }
}

// Form Submit (Insert OR Update)
enquiryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = editIdInput.value; 
    const Name = document.getElementById('name').value;
    const Email = document.getElementById('email').value;
    const Phone = document.getElementById('phone').value;
    const Message = document.getElementById('message').value;

    if (!Name || !Email || !Phone || !Message) {
        alert("Please fill all the fields!");
        return;
    }

    const formData = { Name, Email, Phone, Message };
    const headers = getAuthHeaders();
    if (!headers) return;

    saveButton.disabled = true;

    try {
        let response;
        if (id) {
            // UPDATE
            response = await fetch(`${API_URL}/update/${id}`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(formData)
            });
        } else {
            // INSERT
            response = await fetch(`${API_URL}/insert`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(formData)
            });
        }

        const result = await response.json();

        if (result.success) {
            alert(id ? "Updated Successfully!" : "Saved Successfully!");
            resetForm();
            loadEnquiries(); 
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error("Server error:", error);
    } finally {
        saveButton.disabled = false;
    }
});

// Delete Function
async function deleteEnquiry(id) {
    if (confirm("Are you sure you want to delete this enquiry?")) {
        const headers = getAuthHeaders();
        if (!headers) return;

        try {
            const response = await fetch(`${API_URL}/delete/${id}`, {
                method: 'DELETE',
                headers: headers
            });
            const result = await response.json();
            if (result.success) {
                loadEnquiries(); 
            } else {
                alert("Could not delete: " + result.message);
            }
        } catch (error) {
            console.error("Delete error:", error);
        }
    }
}

// Edit Button Click handler
function editEnquiry(id, name, email, phone, message) {
    formTitle.innerText = "Update Enquiry";
    saveButton.innerText = "Update";
    
    editIdInput.value = id;
    document.getElementById('name').value = name;
    document.getElementById('email').value = email;
    document.getElementById('phone').value = phone;
    document.getElementById('message').value = message;
}

function resetForm() {
    enquiryForm.reset();
    editIdInput.value = '';
    formTitle.innerText = "Enquiry Form";
    saveButton.innerText = "Save";
}

// Logout Functionality
if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token'); // Token clear karein
        window.location.href = 'auth.html'; // Login page par bhejein
    });
}