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

// Expense array
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// Select category
categoryElements.forEach((cat) => {
  cat.addEventListener("click", function () {
        // Set the hidden input value to the clicked category's text (e.g. Food, Transport)
        hiddenCategoryInput.value = this.querySelector("h4").innerText;
        // Highlight selected category
        categoryElements.forEach(c => c.classList.remove('selected'));  
        cat.classList.add('selected');  
        // Save category for local use
        selectedCategory = hiddenCategoryInput.value;
   });
});


// Add expense 
if (submitBtn) {
submitBtn.addEventListener('click', () => {
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;

    if (!description || isNaN(amount) || !selectedCategory || !date) {
        alert("Please fill all fields and select a category.");
        return;
    }

    // set hidden field before submit
    hiddenCategoryInput.value = selectedCategory;

    // let form actually submit to Flask
    document.querySelector("form").submit();

    const expense = {
        id: Date.now(),
        description,
        amount,
        category: selectedCategory,
        date
    };

    expenses.push(expense);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    clearForm();
    renderExpenses();
    updateTotal();
    updateCharts();
}); } else {
     console.error("submitBtn not found in HTML!");
}

//Clear the form
function clearForm() {
    descriptionInput.value = '';
    amountInput.value = '';
    dateInput.value = '';
    selectedCategory = null;
    categoryElements.forEach(c => c.classList.remove('selected'));
}

// Render recent expenses
function renderExpenses() {
    expenseList.innerHTML = '';
    if (expenses.length === 0) {
        expenseList.innerHTML = '<h5>No Expense Added</h5>';
        return;
    }

    const lastExpenses = expenses.slice(-5).reverse();

    lastExpenses.forEach(exp => {
        const div = document.createElement('div');
        div.classList.add('expense-item');
        div.innerHTML = 
            `<p><strong>${exp.description}</strong> - ₹${exp.amount.toFixed(2)}</p>
            <small>${exp.category} | ${exp.date}</small>`
        ;
        expenseList.appendChild(div);
    });
}

// Update total
function updateTotal() {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    totalDisplay.textContent = `₹ ${total.toFixed(2)}`;
}

// Update charts
function updateCharts() {
    const dates = expenses.map(e => e.date);
    const amounts = expenses.map(e => e.amount);

    if (expenseChart) expenseChart.destroy();
    if (categoryChart) categoryChart.destroy();

    // ---- Function for Line Chart ----
    function renderLineChart() {
        fetch("/date-data")
            .then(res => res.json())
            .then(data => {
                const ctx = document.getElementById("ExpenseChart").getContext("2d");
                new Chart(ctx, {
                    type: "line",
                    data: {
                        labels: data.dates,
                        datasets: [{
                            label: "Expenses Over Time",
                            data: data.amounts,
                            fill: false,
                            borderColor: "blue",
                            tension: 0.2
                        }]
                    },
                    options: { responsive: true,
                    plugins: {
                        legend: {
                            labels: {
                                color: "black"  // legend text color
                            }
                        }
                    },
                    scales: {
                        x: { ticks: { color: "black" } },  // date labels
                        y: { ticks: { color: "black" } }   // number labels
                    }
                     }
                });
            });
    }

  // ---- Function for Pie Chart ----
    function renderPieChart() {
        fetch("/category-data")
            .then(res => res.json())
            .then(data => {
                const ctx = document.getElementById("categoryChart").getContext("2d");
                new Chart(ctx, {
                    type: "doughnut",
                    data: {
                        labels: data.categories,
                        datasets: [{
                            data: data.amounts,
                            backgroundColor: [
                                '#FF6384', '#4cd96a', '#ef6d10',
                                '#4BC0C0', '#9966FF', '#949089'
                            ]
                        }]
                    },
                    options: { responsive: true ,
                         plugins:{
                            legend:{
                                labels:{
                                    color:"black" //category names
                                }
                            }
                        }
                    }
                });
            });
    }

    // ---- Run only on relevant page ----
    if (document.getElementById("ExpenseChart")) {
        renderLineChart();
    }

    if (document.getElementById("categoryChart")) {
        renderPieChart();
    }
}
   
// Clear All Button
const clearBtn = document.getElementById('clearAll');

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to delete all expenses?")) {
                localStorage.removeItem('expenses');
                expenses = [];
                renderExpenses();
                updateTotal();
                updateCharts();
            }
        });
    }


// Initialize
    renderExpenses();
    updateTotal();
    updateCharts();
    

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  // Toggle the "active" class
  sidebar.classList.toggle("active");
  /* Slide in/out
  if (sidebar.style.left === "0px") {
    sidebar.style.left = "-250px";
  } else {
    sidebar.style.left = "0px";
  }*/
}
// (optional) bind toggle to button
    const toggleBtn = document.querySelector(".toggle-btn");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", toggleSidebar);
    }
});
