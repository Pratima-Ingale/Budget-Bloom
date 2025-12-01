document.addEventListener('DOMContentLoaded', () => {
    console.log("JS File Loaded!");

    // DOM elements
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const categoryElements = document.querySelectorAll('.category');
    const dateInput = document.querySelector('input[type="date"]');
    const submitBtn = document.getElementById('submit');
    const expenseList = document.getElementById('expenseList');
    const totalDisplay = document.querySelector('#GraphInfo h3:nth-child(2)');
    const hiddenCategoryInput = document.getElementById('selectedCategory');
    let selectedCategory = null;

    // Charts
    let expenseChart;
    let categoryChart;

    // Select category
    if (categoryElements.length > 0) {
        categoryElements.forEach((cat) => {
            cat.addEventListener("click", function () {
                hiddenCategoryInput.value = this.querySelector("h4").innerText;
                categoryElements.forEach(c => c.classList.remove('selected'));
                cat.classList.add('selected');
                selectedCategory = hiddenCategoryInput.value;
                console.log("Selected category:", selectedCategory);
            });
        });
    }

    // Add expense
    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            const description = descriptionInput.value.trim();
            const amount = parseFloat(amountInput.value);
            const date = dateInput.value;

            if (!description || isNaN(amount) || !selectedCategory || !date) {
                alert("Please fill all fields and select a category.");
                return;
            }

            hiddenCategoryInput.value = selectedCategory;
            console.log("Submitting form with data:", { description, amount, category: selectedCategory, date });
        });
    } else {
        console.error("submitBtn not found in HTML!");
    }

    // Clear form
    function clearForm() {
        if (descriptionInput) descriptionInput.value = '';
        if (amountInput) amountInput.value = '';
        if (dateInput) dateInput.value = '';
        selectedCategory = null;
        if (hiddenCategoryInput) hiddenCategoryInput.value = '';
        categoryElements.forEach(c => c.classList.remove('selected'));
    }

    // Render recent expenses (fetch from server)
    function renderExpenses() {
        if (!expenseList) return;
        console.log("Fetching recent expenses...");
        fetch("/recent-data")
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                console.log("Recent data received:", data);
                expenseList.innerHTML = '';
                const expenses = data.expenses || [];
                if (expenses.length === 0) {
                    expenseList.innerHTML = '<h5>No Expense Added</h5>';
                    return;
                }
                expenses.forEach(exp => {
                    const div = document.createElement('div');
                    div.classList.add('expense-item');
                    div.innerHTML = 
                        `<p><strong>${exp.description}</strong> - ₹${exp.amount.toFixed(2)}</p>
                        <small>${exp.category} | ${exp.date}</small>`;
                    expenseList.appendChild(div);
                });
            })
            .catch(err => {
                console.error('Recent expenses fetch error:', err);
                expenseList.innerHTML = '<h5>Error loading expenses. Check console.</h5>';
            });
    }

    // Update total (fetch from server)
    function updateTotal() {
        if (!totalDisplay) return;
        console.log("Fetching total...");
        fetch("/total")
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                console.log("Total received:", data);
                totalDisplay.textContent = `₹ ${data.total.toFixed(2)}`;
            })
            .catch(err => {
                console.error('Total fetch error:', err);
                totalDisplay.textContent = '₹ 0.00';
            });
    }

    // Update charts (same as before, with logs)
    function updateCharts() {
        console.log("Updating charts...");

        // Line Chart

        function renderLineChart() {
            const canvas = document.getElementById("ExpenseChart");
            if (!canvas) {
                console.error("Canvas 'ExpenseChart' not found!");
                return;
            }
            console.log("Rendering line chart...");
            fetch("/date-data")
                .then(res => {
                    console.log("Date data status:", res.status);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    console.log("Date data:", data);
                    const ctx = canvas.getContext("2d");
                    if (expenseChart) expenseChart.destroy();
                    expenseChart = new Chart(ctx, {
                        type: "line",
                        data: {
                            labels: data.dates || [],
                            datasets: [{
                                label: "Expenses Over Time",
                                data: data.amounts || [],
                                fill: false,
                                borderColor: "blue",
                                tension: 0.2
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                title: { 
                                    display: (data.dates || []).length === 0, 
                                    text: 'No data. Add expenses.'
                                },
                                legend:{
                                    labels:{
                                       color:"black" //legend text color
                                    }
                                }
                            },
                            scales:{
                                 x: { ticks: { color: "black" } }, // dates
                                 y: { ticks: { color: "black" } }  // amounts
                            }
                        }
                    });
                    console.log("Line chart created!");
                })
                .catch(err => console.error('Line chart error:', err));
        }

        // Doughnut Chart
    
        function renderPieChart() {
            const canvas = document.getElementById("categoryChart");
            if (!canvas) {
                console.error("Canvas 'categoryChart' not found!");
                return;
            }
            console.log("Rendering pie chart...");
            fetch("/category-data")
                .then(res => {
                    console.log("Category data status:", res.status);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    console.log("Category data:", data);
                    const ctx = canvas.getContext("2d");
                    if (categoryChart) categoryChart.destroy();
                    categoryChart = new Chart(ctx, {
                        type: "doughnut",
                        data: {
                            labels: data.categories || [],
                            datasets: [{
                                data: data.amounts || [],
                                backgroundColor: ['#FF6384', '#4cd96a', '#ef6d10', '#4BC0C0', '#9966FF', '#949089']
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                title: { 
                                    display: (data.categories || []).length === 0,
                                    text: 'No data. Add expenses.'
                                },
                                 legend: {
                                    labels: {
                                        color: "black"   // category names
                                    }
                                }
                            }
                        }
                    });
                    console.log("Pie chart created!");
                })
                .catch(err => console.error('Pie chart error:', err));
        }

        renderLineChart();
        renderPieChart();
    }

    // Clear All Button (now clears DB via new route; add if needed)
    const clearBtn = document.getElementById('clearAll');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm("Are you sure? This deletes ALL data from DB!")) {
                fetch("/clear-all", { method: 'POST' })  // Add this route if you want full clear
                    .then(() => {
                        renderExpenses();
                        updateTotal();
                        updateCharts();
                    })
                    .catch(err => console.error('Clear error:', err));
            }
        });
    }

    // Toggle Sidebar (unchanged)
    function toggleSidebar() {
        const sidebar = document.getElementById("sidebar");
        if (sidebar) {
            sidebar.classList.toggle("active");
            console.log("Sidebar toggled!");
        } else {
            console.error("Sidebar not found!");
        }
    }

    const toggleBtn = document.querySelector(".toggle-btn");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", toggleSidebar);
        console.log("Toggle button bound!");
    } else {
        console.error("Toggle button not found!");
    }

    // Initialize
    renderExpenses();
    updateTotal();
    updateCharts();
    clearForm();
});
