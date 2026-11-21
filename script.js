const TX_STORAGE_KEY = "pet_transactions_v2";
const BUDGET_STORAGE_KEY = "pet_monthly_budget_v2";
const THEME_STORAGE_KEY = "pet_theme_v2";

const CATEGORY_ICONS = {
  Food: "🍔",
  Travel: "✈️",
  Shopping: "🛍️",
  Bills: "🧾",
  Salary: "💼",
  Other: "📌"
};

let transactions = JSON.parse(localStorage.getItem(TX_STORAGE_KEY)) || [];
let monthlyBudget = Number(localStorage.getItem(BUDGET_STORAGE_KEY)) || 10000;
let currentTheme = localStorage.getItem(THEME_STORAGE_KEY) || "light";

// DOM Elements
const htmlRoot = document.documentElement;
const themeToggleBtn = document.getElementById("themeToggleBtn");
const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

const balanceEl = document.getElementById("balanceAmount");
const incomeEl = document.getElementById("incomeAmount");
const expenseEl = document.getElementById("expenseAmount");

const budgetForm = document.getElementById("budgetForm");
const monthlyBudgetInput = document.getElementById("monthlyBudgetInput");
const budgetSummaryText = document.getElementById("budgetSummaryText");
const budgetProgressBar = document.getElementById("budgetProgressBar");
const budgetPercentText = document.getElementById("budgetPercentText");
const budgetRemainingText = document.getElementById("budgetRemainingText");

const searchInput = document.getElementById("searchInput");
const filterTypeSelect = document.getElementById("filterType");
const filterCategorySelect = document.getElementById("filterCategory");
const sortSelect = document.getElementById("sortSelect");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const loadSampleBtn = document.getElementById("loadSampleBtn");

const transactionListEl = document.getElementById("transactionList");
const transactionCountEl = document.getElementById("transactionCount");

const transactionForm = document.getElementById("transactionForm");
const formHeading = document.getElementById("formHeading");
const editIdInput = document.getElementById("editId");
const txTitleInput = document.getElementById("txTitle");
const txAmountInput = document.getElementById("txAmount");
const txTypeSelect = document.getElementById("txType");
const txCategorySelect = document.getElementById("txCategory");
const txDateInput = document.getElementById("txDate");
const txNoteInput = document.getElementById("txNote");
const submitTxBtn = document.getElementById("submitTxBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const titleErrorEl = document.getElementById("titleError");
const amountErrorEl = document.getElementById("amountError");
const dateErrorEl = document.getElementById("dateError");

const monthlySummaryContainer = document.getElementById("monthlySummaryContainer");
const categoryBreakdownContainer = document.getElementById("categoryBreakdownContainer");
const clearAllDataBtn = document.getElementById("clearAllDataBtn");
const toastEl = document.getElementById("toast");

let toastTimer = null;

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2600);
}

function applyTheme(theme) {
  currentTheme = theme;
  htmlRoot.setAttribute("data-theme", theme);
  themeToggleBtn.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

themeToggleBtn.addEventListener("click", () => {
  applyTheme(currentTheme === "light" ? "dark" : "light");
});

function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(value);
}

function saveToStorage() {
  localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(transactions));
  localStorage.setItem(BUDGET_STORAGE_KEY, String(monthlyBudget));
}

function switchPage(pageName) {
  pages.forEach((page) => {
    page.classList.toggle("active", page.id === `page-${pageName}`);
  });

  navButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.page === pageName);
  });

  if (pageName === "reports") {
    renderReports();
  }
}

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => switchPage(btn.dataset.page));
});

// Form Validation
function clearValidationErrors() {
  titleErrorEl.textContent = "";
  amountErrorEl.textContent = "";
  dateErrorEl.textContent = "";
}

function validateTransactionForm() {
  clearValidationErrors();
  let isValid = true;

  if (!txTitleInput.value.trim()) {
    titleErrorEl.textContent = "Please enter a transaction title.";
    isValid = false;
  }

  const amount = Number(txAmountInput.value);
  if (!txAmountInput.value || Number.isNaN(amount) || amount <= 0) {
    amountErrorEl.textContent = "Amount must be greater than ₹0.";
    isValid = false;
  }

  if (!txDateInput.value) {
    dateErrorEl.textContent = "Please select a valid date.";
    isValid = false;
  }

  return isValid;
}

function resetTransactionForm() {
  transactionForm.reset();
  editIdInput.value = "";
  formHeading.textContent = "Add New Transaction";
  submitTxBtn.textContent = "Save Transaction";
  cancelEditBtn.classList.add("hidden");
  txDateInput.valueAsDate = new Date();
  clearValidationErrors();
}

transactionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateTransactionForm()) return;

  const isEditing = Boolean(editIdInput.value);
  const txObject = {
    id: editIdInput.value || String(Date.now()),
    title: txTitleInput.value.trim(),
    amount: Number(txAmountInput.value),
    type: txTypeSelect.value,
    category: txCategorySelect.value,
    date: txDateInput.value,
    note: txNoteInput.value.trim()
  };

  if (isEditing) {
    transactions = transactions.map((item) =>
      item.id === editIdInput.value ? txObject : item
    );
    showToast("Transaction updated!");
  } else {
    transactions.unshift(txObject);
    showToast("Transaction added!");
  }

  saveToStorage();
  resetTransactionForm();
  renderAll();
  switchPage("home");
});

cancelEditBtn.addEventListener("click", () => {
  resetTransactionForm();
  switchPage("home");
});

// Edit & Delete
transactionListEl.addEventListener("click", (event) => {
  const editBtn = event.target.closest("[data-edit-id]");
  const deleteBtn = event.target.closest("[data-delete-id]");

  if (editBtn) {
    const target = transactions.find((item) => item.id === editBtn.dataset.editId);
    if (!target) return;

    editIdInput.value = target.id;
    txTitleInput.value = target.title;
    txAmountInput.value = target.amount;
    txTypeSelect.value = target.type;
    txCategorySelect.value = target.category;
    txDateInput.value = target.date;
    txNoteInput.value = target.note;

    formHeading.textContent = "Edit Transaction";
    submitTxBtn.textContent = "Update Transaction";
    cancelEditBtn.classList.remove("hidden");
    clearValidationErrors();
    switchPage("add");
  }

  if (deleteBtn) {
    transactions = transactions.filter((item) => item.id !== deleteBtn.dataset.deleteId);
    saveToStorage();
    renderAll();
    showToast("Transaction deleted.");
  }
});

// Budget Form
budgetForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const newBudget = Number(monthlyBudgetInput.value);
  if (Number.isNaN(newBudget) || newBudget <= 0) {
    showToast("Enter a valid budget greater than ₹0.");
    return;
  }
  monthlyBudget = newBudget;
  monthlyBudgetInput.value = "";
  saveToStorage();
  renderSummaryAndBudget();
  showToast(`Monthly budget set to ${formatINR(monthlyBudget)}`);
});

// Load Sample Demo Data
loadSampleBtn.addEventListener("click", () => {
  const today = new Date().toISOString().slice(0, 10);
  const sampleData = [
    { id: "s1", title: "Monthly Stipend", amount: 18000, type: "income", category: "Salary", date: today, note: "Bank transfer" },
    { id: "s2", title: "Groceries & Fruits", amount: 1450, type: "expense", category: "Food", date: today, note: "UPI payment" },
    { id: "s3", title: "Metro & Cab Pass", amount: 850, type: "expense", category: "Travel", date: today, note: "Daily commute" },
    { id: "s4", title: "Wi-Fi & Electricity", amount: 1900, type: "expense", category: "Bills", date: today, note: "Monthly utility" },
    { id: "s5", title: "Headphones", amount: 2200, type: "expense", category: "Shopping", date: today, note: "Online order" }
  ];

  transactions = [...sampleData, ...transactions];
  saveToStorage();
  renderAll();
  showToast("Sample transactions loaded!");
});

// Filter & Sort
function getFilteredAndSortedTransactions() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedType = filterTypeSelect.value;
  const selectedCategory = filterCategorySelect.value;
  const sortMode = sortSelect.value;

  const filtered = transactions.filter((tx) => {
    const matchesQuery =
      !query ||
      tx.title.toLowerCase().includes(query) ||
      tx.note.toLowerCase().includes(query) ||
      tx.category.toLowerCase().includes(query);

    const matchesType = selectedType === "all" || tx.type === selectedType;
    const matchesCategory =
      selectedCategory === "all" || tx.category === selectedCategory;

    return matchesQuery && matchesType && matchesCategory;
  });

  return filtered.sort((a, b) => {
    if (sortMode === "newest") return b.date.localeCompare(a.date);
    if (sortMode === "oldest") return a.date.localeCompare(b.date);
    if (sortMode === "highest") return b.amount - a.amount;
    if (sortMode === "lowest") return a.amount - b.amount;
    return 0;
  });
}

searchInput.addEventListener("input", renderTransactionList);
filterTypeSelect.addEventListener("change", renderTransactionList);
filterCategorySelect.addEventListener("change", renderTransactionList);
sortSelect.addEventListener("change", renderTransactionList);

function renderSummaryAndBudget() {
  const totalIncome = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = totalIncome - totalExpense;

  balanceEl.textContent = formatINR(balance);
  incomeEl.textContent = formatINR(totalIncome);
  expenseEl.textContent = formatINR(totalExpense);

  const rawPercent = monthlyBudget > 0 ? (totalExpense / monthlyBudget) * 100 : 0;
  const clampedWidth = Math.min(Math.max(rawPercent, 0), 100);
  const remaining = monthlyBudget - totalExpense;

  budgetSummaryText.textContent = `Spent ${formatINR(totalExpense)} of ${formatINR(monthlyBudget)} budget`;
  budgetProgressBar.style.width = `${clampedWidth}%`;
  budgetPercentText.textContent = `${rawPercent.toFixed(1)}% used`;
  budgetRemainingText.textContent =
    remaining >= 0
      ? `${formatINR(remaining)} remaining`
      : `Exceeded by ${formatINR(Math.abs(remaining))}`;

  budgetProgressBar.classList.remove("warning", "danger");
  if (rawPercent >= 100) {
    budgetProgressBar.classList.add("danger");
  } else if (rawPercent >= 75) {
    budgetProgressBar.classList.add("warning");
  }
}

function renderTransactionList() {
  const items = getFilteredAndSortedTransactions();
  transactionCountEl.textContent = `${items.length} item${items.length === 1 ? "" : "s"}`;

  if (items.length === 0) {
    transactionListEl.innerHTML = `<p class="empty-state">No transactions found. Click <strong>+ Add Transaction</strong> or <strong>Load Sample Data</strong>.</p>`;
    return;
  }

  transactionListEl.innerHTML = items
    .map((tx) => {
      const sign = tx.type === "income" ? "+" : "-";
      const icon = CATEGORY_ICONS[tx.category] || "📌";
      return `
        <div class="tx-item">
          <div class="tx-main">
            <div class="tx-title-row">
              <strong>${escapeHtml(tx.title)}</strong>
              <span class="tx-cat">${icon} ${escapeHtml(tx.category)}</span>
            </div>
            <span class="tx-sub">
              ${escapeHtml(tx.date)}${tx.note ? ` • ${escapeHtml(tx.note)}` : ""}
            </span>
          </div>

          <div class="tx-right">
            <span class="tx-amount ${tx.type}">${sign}${formatINR(tx.amount)}</span>
            <div class="tx-actions">
              <button type="button" class="btn btn-outline btn-small" data-edit-id="${tx.id}">Edit</button>
              <button type="button" class="btn btn-outline btn-small" data-delete-id="${tx.id}">Delete</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderReports() {
  const monthMap = {};
  const categoryMap = {};
  let totalExpense = 0;

  transactions.forEach((tx) => {
    const monthKey = tx.date ? tx.date.slice(0, 7) : "Unknown";
    if (!monthMap[monthKey]) {
      monthMap[monthKey] = { income: 0, expense: 0 };
    }
    monthMap[monthKey][tx.type] += tx.amount;

    if (tx.type === "expense") {
      categoryMap[tx.category] = (categoryMap[tx.category] || 0) + tx.amount;
      totalExpense += tx.amount;
    }
  });

  const months = Object.keys(monthMap).sort().reverse();
  if (months.length === 0) {
    monthlySummaryContainer.innerHTML = `<p class="empty-state">No monthly data yet.</p>`;
  } else {
    monthlySummaryContainer.innerHTML = months
      .map(
        (m) => `
        <div class="report-row">
          <strong>${m}</strong>
          <span>
            <span class="income">+${formatINR(monthMap[m].income)}</span> |
            <span class="expense">-${formatINR(monthMap[m].expense)}</span>
          </span>
        </div>
      `
      )
      .join("");
  }

  const categories = Object.keys(categoryMap).sort(
    (a, b) => categoryMap[b] - categoryMap[a]
  );

  if (categories.length === 0) {
    categoryBreakdownContainer.innerHTML = `<p class="empty-state">No expense breakdown yet.</p>`;
  } else {
    categoryBreakdownContainer.innerHTML = categories
      .map((cat) => {
        const spent = categoryMap[cat];
        const share = totalExpense > 0 ? ((spent / totalExpense) * 100).toFixed(1) : 0;
        const icon = CATEGORY_ICONS[cat] || "📌";
        return `
          <div class="cat-bar-card">
            <div class="cat-bar-top">
              <strong>${icon} ${escapeHtml(cat)} (${share}%)</strong>
              <span class="expense">${formatINR(spent)}</span>
            </div>
            <div class="cat-bar-track">
              <div class="cat-bar-fill" style="width: ${share}%;"></div>
            </div>
          </div>
        `;
      })
      .join("");
  }
}

exportCsvBtn.addEventListener("click", () => {
  if (transactions.length === 0) {
    showToast("No transactions to export.");
    return;
  }

  const headers = ["ID", "Title", "Amount", "Type", "Category", "Date", "Note"];
  const rows = transactions.map((tx) =>
    [
      tx.id,
      `"${tx.title.replace(/"/g, '""')}"`,
      tx.amount,
      tx.type,
      `"${tx.category.replace(/"/g, '""')}"`,
      tx.date,
      `"${tx.note.replace(/"/g, '""')}"`
    ].join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "personal-expense-tracker.csv";
  link.click();
  URL.revokeObjectURL(url);
  showToast("CSV file downloaded!");
});

clearAllDataBtn.addEventListener("click", () => {
  if (!confirm("Delete all saved transactions and reset budget?")) return;
  transactions = [];
  monthlyBudget = 10000;
  saveToStorage();
  renderAll();
  renderReports();
  switchPage("home");
  showToast("All data reset.");
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderAll() {
  renderSummaryAndBudget();
  renderTransactionList();
}

// Init
applyTheme(currentTheme);
txDateInput.valueAsDate = new Date();
renderAll();