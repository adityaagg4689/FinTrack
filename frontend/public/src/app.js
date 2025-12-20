// DFinance - Advanced Personal Finance Tracker
// Modern design with enhanced functionality

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://fintrack-40to.onrender.com';
    
    // Application state
    const state = {
        transactions: [],
        goals: [],
        budgets: [],
        categories: {
            income: [],
            expense: []
        },
        currentFilter: 'all',
        analytics: {
            summary: null,
            trends: null
        }
    };

    // DOM elements
    const elements = {
        form: document.getElementById('transaction-form'),
        typeSelect: document.getElementById('type'),
        categorySelect: document.getElementById('category'),
        dateInput: document.getElementById('date'),
        transactionList: document.getElementById('transaction-list'),
        goalsList: document.getElementById('goals-list'),
        goalModal: document.getElementById('goal-modal'),
        goalForm: document.getElementById('goal-form'),
        liveTime: document.getElementById('live-time'),
    };

    // Chart instances
    let categoryChartInstance = null;
    let monthlyChartInstance = null;

    // Tutorial system
    let currentTutorialStep = 0;
    let tutorialActive = false;
    const tutorialSteps = [
        {
            target: '#live-time',
            title: '⚡ Live Time',
            content: 'The time updates in real-time. Perfect for tracking how much time you spend managing your finances!',
            position: 'bottom'
        },
        {
            target: '#total-income',
            title: '💰 Total Income',
            content: 'Here you can see all your cumulative income. This value updates automatically with each new transaction.',
            position: 'bottom'
        },
        {
            target: '#total-expenses',
            title: '💸 Total Expenses',
            content: 'The total of all your expenses. Keep an eye on this to control your budget!',
            position: 'bottom'
        },
        {
            target: '#net-balance',
            title: '⚖️ Net Balance',
            content: 'Your net balance (income - expenses). Green if positive, red if negative.',
            position: 'bottom'
        },
        {
            target: '#month-savings',
            title: '📈 Monthly Savings',
            content: 'How much you saved this month. The goal is to keep this number positive!',
            position: 'bottom'
        },
        {
            target: '#transaction-form',
            title: '⚡ Add Transaction',
            content: 'Main form to add your income and expenses. Simply fill in the fields and click "ADD TRANSACTION".',
            position: 'right'
        },
        {
            target: '#type',
            title: '🔄 Transaction Type',
            content: 'Choose between "Expense" or "Income". Categories will change automatically based on your choice.',
            position: 'right'
        },
        {
            target: '#category',
            title: '📂 Categories',
            content: 'Select the appropriate category. Each category has its icon for easy identification.',
            position: 'right'
        },
        {
            target: '#payment_method',
            title: '💳 Payment Method',
            content: 'Indicate how you paid: cash, card, transfer, or even crypto!',
            position: 'right'
        },
        {
            target: '#goals-list',
            title: '🎯 Financial Goals',
            content: 'Set and track your savings goals. Add amounts to see your progress!',
            position: 'right'
        },
        {
            target: '#add-goal-btn',
            title: '➕ Add Goal',
            content: 'Click here to create a new financial goal with a target amount and deadline.',
            position: 'left'
        },
        {
            target: '#category-chart',
            title: '🍩 Category Chart',
            content: 'Visualize the breakdown of your expenses by category. Perfect for identifying where your money goes!',
            position: 'top'
        },
        {
            target: '#monthly-chart',
            title: '📊 Monthly Trends',
            content: 'Track the evolution of your income and expenses over the last 6 months. Ideal for detecting trends.',
            position: 'top'
        },
        {
            target: '#filter-all',
            title: '🔍 Transaction Filters',
            content: 'Filter your transactions by type: all, income only, or expenses only.',
            position: 'left'
        },
        {
            target: '#transaction-list',
            title: '📋 Transaction List',
            content: 'All your recent transactions are displayed here. You can edit or delete them with the buttons on the right.',
            position: 'top'
        }
    ];

    // Initialize application
    function initialize() {
        setupEventListeners();
        setupLiveTime();
        setDefaultDate();
        loadInitialData();
        setupChartDefaults();
        
        // Check if this is the first visit
        setTimeout(() => {
            if (!localStorage.getItem('dfinance_tutorial_completed')) {
                showWelcomeMessage();
            }
        }, 2000);
    }

    // Setup event listeners
    function setupEventListeners() {
        elements.form.addEventListener('submit', handleTransactionSubmit);
        elements.typeSelect.addEventListener('change', populateCategories);
        
        // Goal modal events
        document.getElementById('add-goal-btn').addEventListener('click', openGoalModal);
        document.getElementById('close-goal-modal').addEventListener('click', closeGoalModal);
        elements.goalForm.addEventListener('submit', handleGoalSubmit);
        
        // Filter buttons
        document.getElementById('filter-all').addEventListener('click', () => filterTransactions('all'));
        document.getElementById('filter-income').addEventListener('click', () => filterTransactions('income'));
        document.getElementById('filter-expense').addEventListener('click', () => filterTransactions('expense'));
        
        // Close modal on backdrop click
        elements.goalModal.addEventListener('click', (e) => {
            if (e.target === elements.goalModal) closeGoalModal();
        });
    }

    // Setup live time display
    function setupLiveTime() {
        function updateTime() {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            if (elements.liveTime) {
                elements.liveTime.textContent = timeString;
            }
        }
        updateTime();
        setInterval(updateTime, 1000);
    }

    // Set default date to today
    function setDefaultDate() {
        elements.dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Setup Chart.js defaults
    function setupChartDefaults() {
        Chart.defaults.color = '#ffffff';
        Chart.defaults.borderColor = '#404040';
        Chart.defaults.backgroundColor = 'rgba(255, 107, 0, 0.1)';
    }

    // Load initial data
    async function loadInitialData() {
        try {
            showLoadingState();
            await Promise.all([
                fetchCategories(),
                fetchTransactions(),
                fetchGoals(),
                fetchAnalytics()
            ]);
            populateCategories();
            renderAll();
            hideLoadingState();
        } catch (error) {
            console.error('Error loading initial data:', error);
            showNotification('Error loading data. Please refresh the page.', 'error');
        }
    }

    // API calls
    async function fetchCategories() {
        try {
            const [incomeRes, expenseRes] = await Promise.all([
                fetch(`${API_URL}/categories?type=income`),
                fetch(`${API_URL}/categories?type=expense`)
            ]);
            
            state.categories.income = await incomeRes.json();
            state.categories.expense = await expenseRes.json();
        } catch (error) {
            console.error('Error fetching categories:', error);
            // Fallback to default categories
            state.categories = {
                income: [
                    { name: 'Salary', icon: '💰' },
                    { name: 'Freelance', icon: '💻' },
                    { name: 'Investment', icon: '📈' },
                    { name: 'Gift', icon: '🎁' }
                ],
                expense: [
                    { name: 'Food & Groceries', icon: '🍕' },
                    { name: 'Transport', icon: '🚗' },
                    { name: 'Housing & Utilities', icon: '🏠' },
                    { name: 'Entertainment', icon: '🎬' },
                    { name: 'Health', icon: '🏥' },
                    { name: 'Shopping', icon: '🛍️' }
                ]
            };
        }
    }

    async function fetchTransactions() {
        try {
            const response = await fetch(`${API_URL}/transactions`);
            if (!response.ok) throw new Error('Failed to fetch transactions');
            state.transactions = await response.json();
        } catch (error) {
            console.error('Error fetching transactions:', error);
            showNotification('Error loading transactions', 'error');
        }
    }

    async function fetchGoals() {
        try {
            const response = await fetch(`${API_URL}/goals`);
            if (!response.ok) throw new Error('Failed to fetch goals');
            state.goals = await response.json();
        } catch (error) {
            console.error('Error fetching goals:', error);
            showNotification('Error loading goals', 'error');
        }
    }

    async function fetchAnalytics() {
        try {
            const [summaryRes, trendsRes] = await Promise.all([
                fetch(`${API_URL}/analytics/summary`),
                fetch(`${API_URL}/analytics/trends`)
            ]);
            
            state.analytics.summary = await summaryRes.json();
            state.analytics.trends = await trendsRes.json();
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    }

    // Form handlers
    async function handleTransactionSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(elements.form);
        const editId = elements.form.getAttribute('data-edit-id');
        
        const transactionData = {
            type: formData.get('type'),
            description: formData.get('description'),
            amount: parseFloat(formData.get('amount')),
            date: formData.get('date'),
            category: formData.get('category'),
            payment_method: formData.get('payment_method') || 'cash',
            notes: formData.get('notes') || ''
        };

        try {
            showLoadingButton(elements.form.querySelector('button[type="submit"]'));
            
            let response;
            if (editId) {
                response = await fetch(`${API_URL}/transactions/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transactionData)
                });
                
                if (response.ok) {
                    const updated = await response.json();
                    const index = state.transactions.findIndex(t => t.id == editId);
                    if (index !== -1) state.transactions[index] = updated;
                    showNotification('Transaction updated successfully!', 'success');
                }
            } else {
                response = await fetch(`${API_URL}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(transactionData)
                });
                
                if (response.ok) {
                    const saved = await response.json();
                    state.transactions.unshift(saved);
                    showNotification('Transaction added successfully!', 'success');
                }
            }

            if (!response.ok) throw new Error('Failed to save transaction');

            resetForm();
            renderAll();
            
        } catch (error) {
            console.error('Error saving transaction:', error);
            showNotification('Error saving transaction. Please try again.', 'error');
        } finally {
            hideLoadingButton(elements.form.querySelector('button[type="submit"]'));
        }
    }

    async function handleGoalSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(elements.goalForm);
        const goalData = {
            title: formData.get('title') || document.getElementById('goal-title').value,
            target_amount: parseFloat(formData.get('amount') || document.getElementById('goal-amount').value),
            target_date: formData.get('date') || document.getElementById('goal-date').value,
            category: 'General'
        };

        try {
            const response = await fetch(`${API_URL}/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(goalData)
            });

            if (!response.ok) throw new Error('Failed to create goal');

            const saved = await response.json();
            state.goals.unshift(saved);
            
            closeGoalModal();
            renderGoals();
            showNotification('Goal created successfully!', 'success');
            
        } catch (error) {
            console.error('Error creating goal:', error);
            showNotification('Error creating goal. Please try again.', 'error');
        }
    }

    // UI functions
    function populateCategories() {
        const type = elements.typeSelect.value;
        const categories = state.categories[type] || [];
        
        elements.categorySelect.innerHTML = categories
            .map(cat => `<option value="${cat.name}">${cat.icon || '📊'} ${cat.name}</option>`)
            .join('');
    }

    function resetForm() {
        elements.form.reset();
        elements.form.removeAttribute('data-edit-id');
        elements.form.querySelector('button[type="submit"]').innerHTML = '⚡ ADD TRANSACTION';
        setDefaultDate();
        populateCategories();
    }

    function renderAll() {
        renderSummary();
        renderTransactionList();
        renderGoals();
        renderCategoryChart();
        renderMonthlyChart();
    }

    function renderSummary() {
        const totalIncome = state.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const totalExpenses = state.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const netBalance = totalIncome - totalExpenses;
        
        // Calculate this month's savings
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyIncome = state.transactions
            .filter(t => {
                const date = new Date(t.date);
                return t.type === 'income' && 
                       date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const monthlyExpenses = state.transactions
            .filter(t => {
                const date = new Date(t.date);
                return t.type === 'expense' && 
                       date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear;
            })
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
        const monthlySavings = monthlyIncome - monthlyExpenses;

        // Update DOM
        document.getElementById('total-income').textContent = formatCurrency(totalIncome);
        document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);
        document.getElementById('net-balance').textContent = formatCurrency(netBalance);
        document.getElementById('month-savings').textContent = formatCurrency(monthlySavings);
        
        // Color coding
        const netBalanceElement = document.getElementById('net-balance');
        netBalanceElement.className = netBalance >= 0 ? 'text-3xl font-bold text-green-400 display-font' : 'text-3xl font-bold text-red-400 display-font';
        
        const monthSavingsElement = document.getElementById('month-savings');
        monthSavingsElement.className = monthlySavings >= 0 ? 'text-3xl font-bold text-blue-400 display-font' : 'text-3xl font-bold text-red-400 display-font';
    }

    function renderTransactionList() {
        const filteredTransactions = state.currentFilter === 'all' 
            ? state.transactions 
            : state.transactions.filter(t => t.type === state.currentFilter);

        if (filteredTransactions.length === 0) {
            elements.transactionList.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <span class="text-4xl">🏁</span>
                    <p class="mt-2">No ${state.currentFilter === 'all' ? '' : state.currentFilter + ' '}transactions yet. Start your financial journey!</p>
                </div>
            `;
            return;
        }

        elements.transactionList.innerHTML = filteredTransactions
            .slice(0, 20) // Limit to 20 recent transactions
            .map(transaction => {
                const isIncome = transaction.type === 'income';
                const amountColor = isIncome ? 'text-green-400' : 'text-red-400';
                const sign = isIncome ? '+' : '-';
                const bgColor = isIncome ? 'bg-green-500 bg-opacity-10' : 'bg-red-500 bg-opacity-10';
                const borderColor = isIncome ? 'border-green-500' : 'border-red-500';
                
                const formattedDate = new Date(transaction.date).toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric' 
                });

                const categoryIcon = getCategoryIcon(transaction.category, transaction.type);
                const paymentMethodIcon = getPaymentMethodIcon(transaction.payment_method);

                return `
                    <div class="transaction-card ${bgColor} border-l-4 ${borderColor} flex items-center justify-between p-4 hover:scale-[1.02] transition-all duration-300">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center ${bgColor} border ${borderColor}">
                                <span class="text-xl">${categoryIcon}</span>
                            </div>
                            <div>
                                <p class="font-semibold text-white text-lg">${transaction.description}</p>
                                <div class="flex items-center space-x-2 text-sm text-gray-400">
                                    <span>${formattedDate}</span>
                                    <span>•</span>
                                    <span>${transaction.category}</span>
                                    <span>•</span>
                                    <span>${paymentMethodIcon} ${transaction.payment_method?.replace('_', ' ') || 'cash'}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <p class="font-bold text-xl ${amountColor} display-font">${sign}${formatCurrency(Math.abs(transaction.amount))}</p>
                            <div class="flex space-x-2">
                                <button onclick="editTransaction(${transaction.id})" 
                                        class="p-2 bg-blue-500 bg-opacity-20 text-blue-400 rounded-lg hover:bg-opacity-30 transition-all"
                                        title="Edit Transaction">
                                    ✏️
                                </button>
                                <button onclick="deleteTransaction(${transaction.id})" 
                                        class="p-2 bg-red-500 bg-opacity-20 text-red-400 rounded-lg hover:bg-opacity-30 transition-all"
                                        title="Delete Transaction">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
    }

    function renderGoals() {
        if (state.goals.length === 0) {
            elements.goalsList.innerHTML = `
                <div class="text-center text-gray-400 py-4">
                    <span class="text-2xl">🎯</span>
                    <p class="mt-2 text-sm">No goals set. Click + to add your first goal!</p>
                </div>
            `;
            return;
        }

        elements.goalsList.innerHTML = state.goals.map(goal => {
            const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
            const isCompleted = progress >= 100;
            const statusColor = isCompleted ? 'text-green-400' : progress > 50 ? 'text-orange-500' : 'text-blue-400';
            
            const daysLeft = goal.target_date ? Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
            
            return `
                <div class="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-orange-500 transition-all">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-semibold text-white">${goal.title}</h4>
                        <div class="flex items-center space-x-2">
                            <span class="text-sm ${statusColor}">${Math.round(progress)}%</span>
                            <div class="flex space-x-1">
                                <button onclick="editGoal(${goal.id})" 
                                        class="p-1 bg-blue-500 bg-opacity-20 text-blue-400 rounded hover:bg-opacity-30 transition-all text-xs"
                                        title="Edit Goal">
                                    ✏️
                                </button>
                                <button onclick="deleteGoal(${goal.id})" 
                                        class="p-1 bg-red-500 bg-opacity-20 text-red-400 rounded hover:bg-opacity-30 transition-all text-xs"
                                        title="Delete Goal">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="goal-progress mb-3">
                        <div class="goal-progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <div class="flex justify-between text-sm text-gray-400">
                        <span>${formatCurrency(goal.current_amount)} / ${formatCurrency(goal.target_amount)}</span>
                        ${daysLeft !== null ? `<span>${daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}</span>` : ''}
                    </div>
                    ${!isCompleted ? `
                        <button onclick="addToGoal(${goal.id})" 
                                class="mt-2 w-full text-xs bg-orange-500 bg-opacity-20 text-orange-500 py-1 rounded hover:bg-opacity-30 transition-all">
                            + Add Funds
                        </button>
                    ` : `
                        <div class="mt-2 text-center">
                            <span class="text-green-400 text-sm font-semibold">🏆 Goal Achieved!</span>
                        </div>
                    `}
                </div>
            `;
        }).join('');
    }

    function renderCategoryChart() {
        const ctx = document.getElementById('category-chart').getContext('2d');
        
        const expenseData = state.transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
                return acc;
            }, {});

        const labels = Object.keys(expenseData);
        const data = Object.values(expenseData);
        
        // Enhanced orange color palette with better contrast
        const enhancedOrangePalette = [
            '#FF6B00',  // Bright main orange
            '#FF8C42',  // Coral orange
            '#FF4500',  // Red orange
            '#FFB347',  // Peach orange
            '#FF7F00',  // Pure orange
            '#FF9500',  // Golden orange
            '#FF5722',  // Deep orange
            '#FFAB00',  // Amber orange
            '#FF6F00',  // Dark orange
            '#FF8F65',  // Salmon orange
            '#FF3D00',  // Bright red orange
            '#FFA726',  // Light orange
            '#E65100',  // Burnt orange
            '#FFB74D',  // Pastel orange
            '#FF5C00',  // Intense orange
            '#FFCC80'   // Very light orange
        ];

        const chartData = {
            labels: labels.length > 0 ? labels : ['No expenses yet'],
            datasets: [{
                label: 'Expenses by Category',
                data: data.length > 0 ? data : [1],
                backgroundColor: enhancedOrangePalette.slice(0, Math.max(labels.length, 1)),
                borderColor: '#000000',
                borderWidth: 3,
                hoverOffset: 12,
                hoverBorderWidth: 4,
                hoverBorderColor: '#FFFFFF'
            }]
        };

        if (categoryChartInstance) {
            categoryChartInstance.data = chartData;
            categoryChartInstance.update();
        } else {
            categoryChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { 
                            position: 'bottom',
                            labels: {
                                color: '#ffffff',
                                font: { 
                                    size: 12,
                                    weight: 'bold'
                                },
                                padding: 15,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            titleColor: '#FF6B00',
                            bodyColor: '#ffffff',
                            borderColor: '#FF6B00',
                            borderWidth: 2,
                            cornerRadius: 12,
                            padding: 12,
                            titleFont: {
                                size: 14,
                                weight: 'bold'
                            },
                            bodyFont: {
                                size: 13
                            },
                            callbacks: {
                                label: function(context) {
                                    const percentage = ((context.parsed / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                                    return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
                                }
                            }
                        }
                    },
                    elements: {
                        arc: {
                            borderWidth: 3,
                            borderColor: '#000000',
                            hoverBorderWidth: 4,
                            hoverBorderColor: '#FFFFFF'
                        }
                    },
                    animation: {
                        animateRotate: true,
                        animateScale: true,
                        duration: 1500,
                        easing: 'easeOutQuart'
                    }
                }
            });
        }
    }

    function renderMonthlyChart() {
        const ctx = document.getElementById('monthly-chart').getContext('2d');
        
        // Get last 6 months of data
        const monthlyData = {};
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
            monthlyData[monthKey] = { income: 0, expense: 0 };
        }

        state.transactions.forEach(t => {
            const date = new Date(t.date);
            const monthKey = date.toLocaleString('default', { month: 'short', year: '2-digit' });
            
            if (monthlyData[monthKey]) {
                monthlyData[monthKey][t.type] += parseFloat(t.amount);
            }
        });

        const labels = Object.keys(monthlyData);
        const incomeData = labels.map(month => monthlyData[month].income);
        const expenseData = labels.map(month => monthlyData[month].expense);

        const chartData = {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: 'rgba(0, 255, 136, 0.3)',
                    borderColor: '#00FF88',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: 'rgba(255, 51, 102, 0.3)',
                    borderColor: '#FF3366',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true
                }
            ]
        };

        if (monthlyChartInstance) {
            monthlyChartInstance.data = chartData;
            monthlyChartInstance.update();
        } else {
            monthlyChartInstance = new Chart(ctx, {
                type: 'line',
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: '#404040' },
                            ticks: {
                                color: '#ffffff',
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        },
                        x: {
                            grid: { color: '#404040' },
                            ticks: { color: '#ffffff' }
                        }
                    },
                    plugins: {
                        legend: {
                            labels: { color: '#ffffff' }
                        },
                        tooltip: {
                            backgroundColor: '#1a1a1a',
                            titleColor: '#FF6B00',
                            bodyColor: '#ffffff',
                            borderColor: '#FF6B00',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Utility functions
    function formatCurrency(amount) {
        return new Intl.NumberFormat('de-DE', { 
            style: 'currency', 
            currency: 'EUR' 
        }).format(amount);
    }

    function getCategoryIcon(category, type) {
        const icons = {
            // Income icons
            'Salary': '💰',
            'Freelance': '💻',
            'Investment': '📈',
            'Gift': '🎁',
            // Expense icons
            'Food & Groceries': '🍕',
            'Transport': '🚗',
            'Housing & Utilities': '🏠',
            'Entertainment': '🎬',
            'Health': '🏥',
            'Shopping': '🛍️',
            'Education': '📚',
            'Technology': '💻'
        };
        return icons[category] || (type === 'income' ? '💰' : '💸');
    }

    function getPaymentMethodIcon(method) {
        const icons = {
            'cash': '💵',
            'credit_card': '💳',
            'debit_card': '💳',
            'bank_transfer': '🏦',
            'crypto': '₿'
        };
        return icons[method] || '💵';
    }

    function filterTransactions(type) {
        state.currentFilter = type;
        
        // Update filter buttons
        document.querySelectorAll('[id^="filter-"]').forEach(btn => {
            btn.classList.remove('bg-orange-500', 'bg-opacity-30', 'text-orange-500');
            btn.classList.add('bg-opacity-20');
        });
        
        const activeBtn = document.getElementById(`filter-${type}`);
        activeBtn.classList.add('bg-orange-500', 'bg-opacity-30', 'text-orange-500');
        
        renderTransactionList();
    }

    function openGoalModal() {
        elements.goalModal.classList.remove('hidden');
        document.getElementById('goal-title').focus();
    }

    function closeGoalModal() {
        elements.goalModal.classList.add('hidden');
        elements.goalForm.reset();
    }

    function showLoadingState() {
        // Add loading spinners or skeleton screens
        console.log('Loading...');
    }

    function hideLoadingState() {
        console.log('Loading complete');
    }

    function showLoadingButton(button) {
        button.disabled = true;
        button.innerHTML = '<div class="loading-spinner mx-auto"></div>';
    }

    function hideLoadingButton(button) {
        button.disabled = false;
        button.innerHTML = '⚡ ADD TRANSACTION';
    }

    function showNotification(message, type = 'info') {
        // Create or get notification container
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.className = 'fixed top-4 right-4 z-50 space-y-3 max-w-sm';
            document.body.appendChild(notificationContainer);
        }

        // Create notification element with enhanced styling
        const notification = document.createElement('div');
        notification.className = `p-4 rounded-xl shadow-2xl transform transition-all duration-500 border-2 ${
            type === 'success' ? 'bg-gradient-to-r from-green-600 to-green-500 border-green-400' :
            type === 'error' ? 'bg-gradient-to-r from-red-600 to-red-500 border-red-400' :
            type === 'warning' ? 'bg-gradient-to-r from-orange-600 to-orange-500 border-orange-500' :
            'bg-gradient-to-r from-blue-600 to-blue-500 border-blue-400'
        } text-white`;
        
        // Add backdrop blur and initial transform for animation
        notification.style.backdropFilter = 'blur(10px) saturate(180%)';
        notification.style.webkitBackdropFilter = 'blur(10px) saturate(180%)';
        notification.style.backgroundColor = type === 'success' ? 'rgba(34, 197, 94, 0.9)' :
                                           type === 'error' ? 'rgba(239, 68, 68, 0.9)' :
                                           type === 'warning' ? 'rgba(249, 115, 22, 0.9)' :
                                           'rgba(59, 130, 246, 0.9)';
        notification.style.transform = 'translateX(100%) scale(0.8)';
        notification.style.opacity = '0';
        
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    type === 'success' ? 'bg-green-400 bg-opacity-30' :
                    type === 'error' ? 'bg-red-400 bg-opacity-30' :
                    type === 'warning' ? 'bg-orange-500 bg-opacity-30' :
                    'bg-blue-400 bg-opacity-30'
                }">
                    <span class="text-lg">
                        ${type === 'success' ? '✅' :
                          type === 'error' ? '❌' :
                          type === 'warning' ? '⚠️' :
                          'ℹ️'}
                    </span>
                </div>
                <div class="flex-1">
                    <p class="font-semibold text-sm leading-relaxed">${message}</p>
                </div>
                <button onclick="removeNotification(this.parentElement.parentElement)" class="flex-shrink-0 text-white opacity-70 hover:opacity-100 transition-opacity">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"></path>
                    </svg>
                </button>
            </div>
        `;
        
        // Add to container (stack from top to bottom)
        notificationContainer.appendChild(notification);
        
        // Animate in with slide and scale effect
        setTimeout(() => {
            notification.style.transform = 'translateX(0) scale(1)';
            notification.style.opacity = '1';
        }, 100);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            removeNotification(notification);
        }, 4000);
    }

    // Helper function to remove notification with animation
    window.removeNotification = function(notification) {
        if (notification && notification.parentNode) {
            notification.style.transform = 'translateX(100%) scale(0.8)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                    
                    // Clean up container if empty
                    const container = document.getElementById('notification-container');
                    if (container && container.children.length === 0) {
                        container.remove();
                    }
                }
            }, 300);
        }
    };

    // Global functions for onclick handlers
    window.editTransaction = function(id) {
        const transaction = state.transactions.find(t => t.id === id);
        if (!transaction) return;

        elements.form.elements['type'].value = transaction.type;
        populateCategories();
        elements.form.elements['description'].value = transaction.description;
        elements.form.elements['amount'].value = transaction.amount;
        elements.form.elements['date'].value = transaction.date;
        elements.form.elements['category'].value = transaction.category;
        elements.form.elements['payment_method'].value = transaction.payment_method || 'cash';
        
        elements.form.setAttribute('data-edit-id', id);
        elements.form.querySelector('button[type="submit"]').innerHTML = '⚡ UPDATE TRANSACTION';
        
        // Scroll to form
        elements.form.scrollIntoView({ behavior: 'smooth' });
        showNotification('Transaction loaded for editing', 'info');
    };

    window.deleteTransaction = async function(id) {
        // Create custom confirmation modal
        const confirmModal = document.createElement('div');
        confirmModal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        confirmModal.innerHTML = `
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border-2 border-red-500 shadow-2xl max-w-md mx-4 text-center">
                <div class="text-5xl mb-4">🗑️</div>
                <h3 class="text-xl font-bold text-white mb-3">Delete Transaction</h3>
                <p class="text-gray-300 mb-6 leading-relaxed">
                    Are you sure you want to delete this transaction? This action is irreversible.
                </p>
                <div class="flex space-x-4 justify-center">
                    <button id="confirm-delete" class="px-6 py-3 bg-red-500 hover:bg-red-400 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 border border-red-400">
                        Yes, Delete
                    </button>
                    <button id="cancel-delete" class="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition-all duration-300 border border-gray-500">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmModal);
        
        return new Promise((resolve) => {
            document.getElementById('confirm-delete').addEventListener('click', async () => {
                confirmModal.remove();
                
                try {
                    const response = await fetch(`${API_URL}/transactions/${id}`, { 
                        method: 'DELETE' 
                    });
                    
                    if (!response.ok) throw new Error('Failed to delete transaction');
                    
                    state.transactions = state.transactions.filter(t => t.id !== id);
                    renderAll();
                    showNotification('Transaction deleted successfully', 'success');
                    
                } catch (error) {
                    console.error('Error deleting transaction:', error);
                    showNotification('Error during deletion. Please try again.', 'error');
                }
                resolve();
            });
            
            document.getElementById('cancel-delete').addEventListener('click', () => {
                confirmModal.remove();
                resolve();
            });
            
            // Close on backdrop click
            confirmModal.addEventListener('click', (e) => {
                if (e.target === confirmModal) {
                    confirmModal.remove();
                    resolve();
                }
            });
        });
    };

    window.addToGoal = async function(goalId) {
        const goal = state.goals.find(g => g.id === goalId);
        if (!goal) return;

        // Créer une modale personnalisée identique au style edit
        const addFundsModal = document.createElement('div');
        addFundsModal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        addFundsModal.innerHTML = `
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border-2 border-orange-500 shadow-2xl max-w-md mx-4 w-full">
                <div class="text-center mb-6">
                    <div class="text-4xl mb-2">💰</div>
                    <h3 class="text-xl font-bold text-white">Add Funds</h3>
                    <p class="text-gray-400 text-sm mt-2">${goal.title}</p>
                </div>
                <form id="add-funds-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-300 mb-2">Amount to Add</label>
                        <div class="relative">
                            <input type="number" id="funds-amount" step="0.01" min="0.01" 
                            class="w-full p-3 bg-gray-700 bg-opacity-80 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:outline-none relative z-10 backdrop-blur-sm" 
                            placeholder="0.00">
                        </div>
                    </div>
                    <div class="flex space-x-4 pt-4">
                        <button type="submit" class="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 border border-orange-500">
                            Add
                        </button>
                        <button type="button" id="cancel-add-funds" class="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold transition-all border border-gray-500">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(addFundsModal);
        document.getElementById('funds-amount').focus();

        // Gérer la soumission du formulaire
        document.getElementById('add-funds-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const amount = parseFloat(document.getElementById('funds-amount').value);
            if (!amount || amount <= 0) {
                showNotification('Please enter a valid amount', 'error');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/goals/${goalId}/progress`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: amount })
                });

                if (!response.ok) throw new Error('Failed to update goal progress');

                const updatedGoal = await response.json();
                const index = state.goals.findIndex(g => g.id === goalId);
                if (index !== -1) state.goals[index] = updatedGoal;
                
                addFundsModal.remove();
                renderGoals();
                showNotification(`${formatCurrency(amount)} added to goal`, 'success');
                
            } catch (error) {
                console.error('Error updating goal:', error);
                showNotification('Error during update', 'error');
            }
        });

        // Gérer l'annulation
        document.getElementById('cancel-add-funds').addEventListener('click', () => {
            addFundsModal.remove();
        });

        // Fermer la modale en cliquant à l'extérieur
        addFundsModal.addEventListener('click', (e) => {
            if (e.target === addFundsModal) {
                addFundsModal.remove();
            }
        });

        // Fermer avec Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                addFundsModal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    };

    window.editGoal = async function(goalId) {
        const goal = state.goals.find(g => g.id === goalId);
        if (!goal) return;

        // Create edit modal
        const editModal = document.createElement('div');
        editModal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        editModal.innerHTML = `
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border-2 border-orange-500 shadow-2xl max-w-md mx-4 w-full">
                <div class="text-center mb-6">
                    <div class="text-4xl mb-2">🎯</div>
                    <h3 class="text-xl font-bold text-white">Edit Goal</h3>
                </div>
                <form id="edit-goal-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-300 mb-2">Title</label>
                        <input type="text" id="edit-goal-title" value="${goal.title}" 
                               class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-300 mb-2">Target Amount</label>
                        <input type="number" id="edit-goal-amount" value="${goal.target_amount}" step="0.01" min="0"
                               class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-300 mb-2">Deadline</label>
                        <input type="date" id="edit-goal-date" value="${goal.target_date ? goal.target_date.split('T')[0] : ''}"
                               class="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:outline-none">
                    </div>
                    <div class="flex space-x-4 pt-4">
                        <button type="submit" class="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 border border-orange-500">
                            Save
                        </button>
                        <button type="button" id="cancel-edit-goal" class="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold transition-all border border-gray-500">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(editModal);
        document.getElementById('edit-goal-title').focus();

        document.getElementById('edit-goal-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updatedGoal = {
                title: document.getElementById('edit-goal-title').value,
                target_amount: parseFloat(document.getElementById('edit-goal-amount').value),
                target_date: document.getElementById('edit-goal-date').value,
                current_amount: goal.current_amount
            };

            try {
                const response = await fetch(`${API_URL}/goals/${goalId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedGoal)
                });

                if (!response.ok) throw new Error('Failed to update goal');

                const saved = await response.json();
                const index = state.goals.findIndex(g => g.id === goalId);
                if (index !== -1) state.goals[index] = saved;
                
                editModal.remove();
                renderGoals();
                showNotification('Goal modified successfully!', 'success');
                
            } catch (error) {
                console.error('Error updating goal:', error);
                showNotification('Error during modification', 'error');
            }
        });

        document.getElementById('cancel-edit-goal').addEventListener('click', () => {
            editModal.remove();
        });

        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) editModal.remove();
        });
    };

    window.deleteGoal = async function(goalId) {
        const goal = state.goals.find(g => g.id === goalId);
        if (!goal) return;

        // Create custom confirmation modal
        const confirmModal = document.createElement('div');
        confirmModal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        confirmModal.innerHTML = `
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border-2 border-red-500 shadow-2xl max-w-md mx-4 text-center">
                <div class="text-5xl mb-4">🗑️</div>
                <h3 class="text-xl font-bold text-white mb-3">Delete Goal</h3>
                <p class="text-gray-300 mb-2 font-semibold">"${goal.title}"</p>
                <p class="text-gray-400 mb-6 leading-relaxed text-sm">
                    Are you sure you want to delete this goal? This action is irreversible.
                </p>
                <div class="flex space-x-4 justify-center">
                    <button id="confirm-delete-goal" class="px-6 py-3 bg-red-500 hover:bg-red-400 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 border border-red-400">
                        Yes, Delete
                    </button>
                    <button id="cancel-delete-goal" class="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition-all duration-300 border border-gray-500">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmModal);

        document.getElementById('confirm-delete-goal').addEventListener('click', async () => {
            confirmModal.remove();
            
            try {
                const response = await fetch(`${API_URL}/goals/${goalId}`, { 
                    method: 'DELETE' 
                });
                
                if (!response.ok) throw new Error('Failed to delete goal');
                
                state.goals = state.goals.filter(g => g.id !== goalId);
                renderGoals();
                showNotification('Goal deleted successfully', 'success');
                
            } catch (error) {
                console.error('Error deleting goal:', error);
                showNotification('Error during deletion', 'error');
            }
        });
        
        document.getElementById('cancel-delete-goal').addEventListener('click', () => {
            confirmModal.remove();
        });
        
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) confirmModal.remove();
        });
    };

    // Initialize the application
    initialize();

    // Tutorial functions
    function startTutorial() {
        tutorialActive = true;
        currentTutorialStep = 0;
        createTutorialOverlay();
        showTutorialStep(currentTutorialStep);
        
        // Show tutorial start notification
        showNotification('🎓 Welcome to the DFinance guided tour!', 'info');
    }

    function createTutorialOverlay() {
        // Create overlay with blur effect
        const overlay = document.createElement('div');
        overlay.id = 'tutorial-overlay';
        overlay.className = 'fixed inset-0 z-40 transition-all duration-500';
        overlay.style.backdropFilter = 'blur(4px) brightness(0.4)';
        overlay.style.webkitBackdropFilter = 'blur(4px) brightness(0.4)';
        document.body.appendChild(overlay);

        // Create tutorial tooltip
        const tooltip = document.createElement('div');
        tooltip.id = 'tutorial-tooltip';
        tooltip.className = 'fixed z-50 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl p-6 shadow-2xl border border-orange-500 max-w-sm transition-all duration-500 transform';
        tooltip.innerHTML = `
            <div id="tutorial-content">
                <h3 id="tutorial-title" class="text-lg font-bold text-orange-400 mb-3"></h3>
                <p id="tutorial-text" class="text-gray-300 mb-4 leading-relaxed"></p>
                <div class="flex items-center justify-between">
                    <div id="tutorial-progress" class="text-xs text-gray-400"></div>
                    <div class="flex space-x-2">
                        <button id="tutorial-skip" class="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition-colors">
                            Skip
                        </button>
                        <button id="tutorial-prev" class="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-sm transition-colors">
                            ← Previous
                        </button>
                        <button id="tutorial-next" class="px-4 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors">
                            Next →
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(tooltip);

        // Add event listeners
        document.getElementById('tutorial-skip').addEventListener('click', endTutorial);
        document.getElementById('tutorial-prev').addEventListener('click', previousTutorialStep);
        document.getElementById('tutorial-next').addEventListener('click', nextTutorialStep);
        
        // Close tutorial on overlay click
        overlay.addEventListener('click', endTutorial);
    }

    function showTutorialStep(stepIndex) {
        const step = tutorialSteps[stepIndex];
        const target = document.querySelector(step.target);
        const tooltip = document.getElementById('tutorial-tooltip');
        
        if (!target || !tooltip) return;

        // Update tooltip content
        document.getElementById('tutorial-title').textContent = step.title;
        document.getElementById('tutorial-text').textContent = step.content;
        document.getElementById('tutorial-progress').textContent = `Step ${stepIndex + 1} of ${tutorialSteps.length}`;
        
        // Update button states
        const prevBtn = document.getElementById('tutorial-prev');
        const nextBtn = document.getElementById('tutorial-next');
        
        prevBtn.style.display = stepIndex === 0 ? 'none' : 'block';
        
        if (stepIndex === tutorialSteps.length - 1) {
            nextBtn.textContent = 'Finish 🎉';
            nextBtn.classList.add('bg-green-500', 'hover:bg-green-400');
            nextBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600');
        } else {
            nextBtn.textContent = 'Next →';
            nextBtn.classList.remove('bg-green-500', 'hover:bg-green-400');
            nextBtn.classList.add('bg-orange-500', 'hover:bg-orange-600');
        }

        // Highlight target element
        highlightElement(target);
        
        // Position tooltip
        positionTooltip(tooltip, target, step.position);
        
        // Scroll target into view
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function highlightElement(element) {
        // Remove previous highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        
        // Add highlight to current element
        element.classList.add('tutorial-highlight');
        
        // Add highlight styles if not already added
        if (!document.getElementById('tutorial-styles')) {
            const style = document.createElement('style');
            style.id = 'tutorial-styles';
            style.textContent = `
                .tutorial-highlight {
                    position: relative;
                    z-index: 45;
                    box-shadow: 0 0 0 4px rgba(255, 107, 0, 0.9), 0 0 30px rgba(255, 107, 0, 0.6), 0 0 60px rgba(255, 107, 0, 0.3);
                    border-radius: 12px;
                    animation: tutorialPulse 2.5s infinite;
                    backdrop-filter: none !important;
                    filter: brightness(1.2) contrast(1.1);
                    transform: scale(1.02);
                    transition: all 0.3s ease;
                }
                
                @keyframes tutorialPulse {
                    0%, 100% { 
                        box-shadow: 0 0 0 4px rgba(255, 107, 0, 0.9), 0 0 30px rgba(255, 107, 0, 0.6), 0 0 60px rgba(255, 107, 0, 0.3);
                        transform: scale(1.02);
                    }
                    50% { 
                        box-shadow: 0 0 0 8px rgba(255, 107, 0, 0.7), 0 0 40px rgba(255, 107, 0, 0.8), 0 0 80px rgba(255, 107, 0, 0.5);
                        transform: scale(1.04);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    function positionTooltip(tooltip, target, position) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const padding = 20;
        
        let top, left;
        
        switch (position) {
            case 'top':
                top = targetRect.top - tooltipRect.height - padding;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = targetRect.bottom + padding;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.left - tooltipRect.width - padding;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
                left = targetRect.right + padding;
                break;
            default:
                top = targetRect.bottom + padding;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        }
        
        // Ensure tooltip stays within viewport
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        if (left < padding) left = padding;
        if (left + tooltipRect.width > windowWidth - padding) {
            left = windowWidth - tooltipRect.width - padding;
        }
        if (top < padding) top = padding;
        if (top + tooltipRect.height > windowHeight - padding) {
            top = windowHeight - tooltipRect.height - padding;
        }
        
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.style.transform = 'scale(1)';
        tooltip.style.opacity = '1';
    }

    function nextTutorialStep() {
        if (currentTutorialStep < tutorialSteps.length - 1) {
            currentTutorialStep++;
            showTutorialStep(currentTutorialStep);
        } else {
            endTutorial();
        }
    }

    function previousTutorialStep() {
        if (currentTutorialStep > 0) {
            currentTutorialStep--;
            showTutorialStep(currentTutorialStep);
        }
    }

    function endTutorial() {
        tutorialActive = false;
        
        // Remove tutorial elements
        const overlay = document.getElementById('tutorial-overlay');
        const tooltip = document.getElementById('tutorial-tooltip');
        const styles = document.getElementById('tutorial-styles');
        
        if (overlay) overlay.remove();
        if (tooltip) tooltip.remove();
        if (styles) styles.remove();
        
        // Remove highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
        
        // Mark tutorial as completed
        localStorage.setItem('dfinance_tutorial_completed', 'true');
        
        showNotification('🎉 Guided tour completed! You now master DFinance!', 'success');
    }

    function showWelcomeMessage() {
        const welcomeModal = document.createElement('div');
        welcomeModal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
        welcomeModal.innerHTML = `
            <div class="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 border border-orange-500 shadow-2xl max-w-md mx-4 text-center">
                <div class="text-6xl mb-4">🏁</div>
                <h2 class="text-2xl font-bold text-white mb-4" style="font-family: 'Orbitron', monospace;">
                    Welcome to DFinance !
                </h2>
                <p class="text-gray-300 mb-6 leading-relaxed">
                    Your premium personal finance manager ! 
                    Would you like to explore all features with our interactive guided tour?
                </p>
                <div class="flex space-x-4 justify-center">
                    <button id="start-tour-btn" class="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2">
                        <span>🎓</span>
                        <span>Start Tour</span>
                    </button>
                    <button id="skip-tour-btn" class="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold transition-all duration-300">
                        Later
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(welcomeModal);
        
        // Add event listeners
        document.getElementById('start-tour-btn').addEventListener('click', () => {
            welcomeModal.remove();
            setTimeout(startTutorial, 500);
        });
        
        document.getElementById('skip-tour-btn').addEventListener('click', () => {
            welcomeModal.remove();
            localStorage.setItem('dfinance_tutorial_completed', 'true');
        });
        
        // Close on backdrop click
        welcomeModal.addEventListener('click', (e) => {
            if (e.target === welcomeModal) {
                welcomeModal.remove();
                localStorage.setItem('dfinance_tutorial_completed', 'true');
            }
        });
    }

    // Expose tutorial function globally
    window.startTutorial = startTutorial;
});
