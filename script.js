const habitContainer = document.getElementById('habitContainer');
const getSuggestionsBtn = document.getElementById('getSuggestions');
const userGoal = document.getElementById('userGoal');
const leaderboardContainer = document.getElementById('leaderboardContainer');

let userHabits = [];
let username = "User";

// New Feature Variables for Daily Tracking
const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Stores habits completed for each day (Index 0 = Mon, Index 6 = Sun)
let dailyProgress = [0, 0, 0, 0, 0, 0, 0]; 

// =================================================================
// 1. SECURE API CALL FUNCTION
// =================================================================
async function getAISuggestions(goal) {
  // CRITICAL FIX: This URL must point to your running Node.js server!
  const API_ENDPOINT = "http://localhost:3000/api/suggestions"; 

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ goal: goal }) 
    });
    
    if (!response.ok) {
      const error = await response.json();
      alert(`Server Error: ${error.error}. Check your terminal for errors (like 429).`); 
      return [];
    }

    const data = await response.json();
    return data.habits; 
    
  } catch (error) {
    alert("Connection Error: Could not reach the server at http://localhost:3000. Make sure your server.js is running!");
    console.error("Fetch Error:", error);
    return [];
  }
}

// =================================================================
// 2. HABIT LIST LOADING AND CLICK LOGIC
// =================================================================
function loadHabits() {
  habitContainer.innerHTML = '';
  // Reset daily progress to 0 when loading a new list of habits
  dailyProgress = [0, 0, 0, 0, 0, 0, 0]; 
  updateChart(); 
  
  if (userHabits.length === 0) {
     habitContainer.innerHTML = '<li>No habits suggested. Try a different goal or check the server status.</li>';
     return;
  }
  
  userHabits.forEach((habit, index) => {
    const li = document.createElement('li');
    li.textContent = habit;
    
    li.addEventListener('click', () => {
      li.classList.toggle('completed');
      
      updateDailyProgress();
      
      updateChart(); 
      sendNotification(`Completed: ${habit}`);
      updateLeaderboard();
    });
    habitContainer.appendChild(li);
  });
}

// =================================================================
// 3. DAILY PROGRESS LOGIC
// =================================================================
function updateDailyProgress() {
    // getDay() returns 0 for Sunday, 1 for Monday, etc. Adjust to 0 for Monday.
    const today = new Date().getDay();
    const todayIndex = (today === 0) ? 6 : today - 1; 

    const completedCount = document.querySelectorAll('li.completed').length;
    
    // Set today's entry to the current total count of completed habits
    dailyProgress[todayIndex] = completedCount;
    
    console.log(`Updated progress for ${daysOfWeek[todayIndex]}: ${dailyProgress[todayIndex]}`);
}


// =================================================================
// 4. BUTTON EVENT LISTENER
// =================================================================
getSuggestionsBtn.addEventListener('click', async () => {
  const goal = userGoal.value.trim();
  if (!goal) return alert("Please enter a goal!");
  
  getSuggestionsBtn.textContent = 'Loading...'; 
  getSuggestionsBtn.disabled = true;

  try {
    userHabits = await getAISuggestions(goal);
    loadHabits();
  } catch (e) {
    console.error("AI Request Failed:", e);
  } finally {
    getSuggestionsBtn.textContent = 'Get AI Suggestions'; 
    getSuggestionsBtn.disabled = false;
  }
});


// =================================================================
// 5. CHART AND LEADERBOARD LOGIC
// =================================================================
const ctx = document.getElementById('progressChart').getContext('2d');
let progressChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: daysOfWeek,
    datasets: [{
      label: 'Habits Completed',
      data: dailyProgress, 
      backgroundColor: '#008080'
    }]
  },
  options: {
    responsive: true,
    scales: { 
      y: { 
        beginAtZero: true, 
        stepSize: 1,
        max: Math.max(5, userHabits.length + 1)
      } 
    }
  }
});

function updateChart() {
    progressChart.data.datasets[0].data = dailyProgress; 
    progressChart.options.scales.y.max = Math.max(5, userHabits.length + 1);
    progressChart.update();
}

function sendNotification(message) {
  if (Notification.permission === "granted") {
    new Notification("Better Life Tracker", { body: message });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission();
  }
}

let leaderboard = [];

function updateLeaderboard() {
  const completed = document.querySelectorAll('li.completed').length;
  const existing = leaderboard.find(u => u.name === username);
  
  if (existing) existing.score = completed;
  else leaderboard.push({ name: username, score: completed });

  leaderboard.sort((a,b) => b.score - a.score);
  leaderboardContainer.innerHTML = '';
  
  leaderboard.forEach(u => {
    const li = document.createElement('li');
    li.textContent = `${u.name}: ${u.score} points`;
    leaderboardContainer.appendChild(li);
  });
}

// Load default habits on page load
userHabits = ["Drink 2 glasses of water immediately upon waking", "Walk for 15 minutes outdoors", "Read 10 pages of a book"];
loadHabits();