function addToTrainingPlan(button) {
    const exerciseItem = button.parentElement;
    const exerciseName = exerciseItem.dataset.exercise;
    
    // Remove from exercises list
    exerciseItem.remove();
    
    // Add to training plan
    const trainingList = document.getElementById('training-list');
    const newItem = document.createElement('li');
    newItem.className = 'training-item';
    newItem.dataset.exercise = exerciseName;
    newItem.innerHTML = `
        <span>${exerciseName}</span>
        <button class="remove-btn" onclick="removeFromTrainingPlan(this)">✕</button>
    `;
    trainingList.appendChild(newItem);
    
    // 🌐 Synchronisiere mit Cloud
    if (typeof cloudSync !== 'undefined' && cloudSync) {
        const exercises = getExercisesFromUI();
        cloudSync.saveTrainingPlan({ name: 'Mein Plan', exercises: exercises });
    }
}

function removeFromTrainingPlan(button) {
    const trainingItem = button.parentElement;
    const exerciseName = trainingItem.dataset.exercise;
    
    // Remove from training plan
    trainingItem.remove();
    
    // Add back to exercises list
    const exerciseList = document.getElementById('exercise-list');
    const newItem = document.createElement('li');
    newItem.className = 'exercise-item';
    newItem.dataset.exercise = exerciseName;
    newItem.innerHTML = `
        <span>${exerciseName}</span>
        <button class="return-btn" onclick="addToTrainingPlan(this)">→</button>
        <button class="delete-btn" onclick="deleteExercise(this)">🗑</button>
    `;
    exerciseList.appendChild(newItem);
    
    // 🌐 Synchronisiere mit Cloud
    if (typeof cloudSync !== 'undefined' && cloudSync) {
        const exercises = getExercisesFromUI();
        cloudSync.saveTrainingPlan({ name: 'Mein Plan', exercises: exercises });
    }
}

function deleteExercise(button) {
    const exerciseItem = button.parentElement;
    const exerciseName = exerciseItem.dataset.exercise;
    
    if (confirm(`Möchten Sie "${exerciseName}" wirklich löschen?`)) {
        exerciseItem.remove();
        
        // 🌐 Synchronisiere mit Cloud
        if (typeof cloudSync !== 'undefined' && cloudSync) {
            const exercises = getExercisesFromUI();
            cloudSync.saveTrainingPlan({ name: 'Mein Plan', exercises: exercises });
        }
    }
}

function addCustomExercise() {
    const input = document.getElementById('new-exercise-input');
    const exerciseName = input.value.trim();
    
    if (exerciseName === '') {
        alert('Bitte geben Sie einen Übungsnamen ein.');
        return;
    }
    
    // Add to exercises list
    const exerciseList = document.getElementById('exercise-list');
    const newItem = document.createElement('li');
    newItem.className = 'exercise-item';
    newItem.dataset.exercise = exerciseName;
    newItem.innerHTML = `
        <span>${exerciseName}</span>
        <button class="return-btn" onclick="addToTrainingPlan(this)">→</button>
        <button class="delete-btn" onclick="deleteExercise(this)">🗑</button>
    `;
    exerciseList.appendChild(newItem);
    
    // Clear the input field
    input.value = '';
}

// Workout Form Functions
function openWorkoutForm(element) {
    const exerciseName = element.dataset.exercise;
    document.getElementById('exercise-title').textContent = exerciseName;
    document.getElementById('workout-modal').style.display = 'block';
    
    // Reset form
    document.getElementById('weight-input').value = '';
    document.getElementById('no-weight-checkbox').checked = false;
    document.getElementById('reps-input').value = '';
    document.getElementById('bad-reps-input').value = '';
    document.getElementById('weight-input').disabled = false;
}

function closeWorkoutForm() {
    document.getElementById('workout-modal').style.display = 'none';
}

function toggleWeightInput() {
    const checkbox = document.getElementById('no-weight-checkbox');
    const weightInput = document.getElementById('weight-input');
    
    if (checkbox.checked) {
        weightInput.disabled = true;
        weightInput.value = '';
    } else {
        weightInput.disabled = false;
    }
}

function submitWorkoutForm(event) {
    event.preventDefault();
    
    const exerciseName = document.getElementById('exercise-title').textContent;
    const noWeightUsed = document.getElementById('no-weight-checkbox').checked;
    const weight = noWeightUsed ? 'Kein Gewicht' : document.getElementById('weight-input').value + ' kg';
    const reps = document.getElementById('reps-input').value;
    const badReps = document.getElementById('bad-reps-input').value;
    
    const workoutData = {
        exercise: exerciseName,
        weight: weight,
        reps: reps,
        badReps: badReps,
        timestamp: new Date().toISOString()
    };
    
    // Speichere im LocalStorage für schnellen Zugriff
    let todayWorkout = JSON.parse(localStorage.getItem('todayWorkout') || '{"exercises":[]}');
    todayWorkout.exercises = todayWorkout.exercises || [];
    todayWorkout.exercises.push(workoutData);
    localStorage.setItem('todayWorkout', JSON.stringify(todayWorkout));
    
    // 🌐 Synchronisiere mit Cloud
    if (typeof cloudSync !== 'undefined' && cloudSync) {
        cloudSync.saveWorkout(todayWorkout);
    }
    
    console.log('✅ Workout saved:', workoutData);
    alert(`${exerciseName}: ${weight}, ${reps} Wiederholungen, ${badReps} nicht sauber ausgefuehrt`);
    
    closeWorkoutForm();
}

// LOGIN SYSTEM FUNCTIONS WITH FIREBASE

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyC-D5LJHK6WvJmFjCrcTvpMTe-A7erU1yU",
    authDomain: "gmakesyoubetter.firebaseapp.com",
    projectId: "gmakesyoubetter",
    storageBucket: "gmakesyoubetter.firebasestorage.app",
    messagingSenderId: "473419703106",
    appId: "1:473419703106:web:2a73170ae06aeeaa76dedb",
    measurementId: "G-DKJQ078BNG"
};

// Initialize Firebase (check if already initialized)
let firebaseApp = null;
let auth = null;
let db = null;

function initFirebase() {
    try {
        if (!firebaseApp) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            db = firebase.firestore();
        }
    } catch (error) {
        console.log("Using local storage mode (Firebase not available)");
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', function() {
    initFirebase();
    const currentPage = window.location.pathname;
    if (!currentPage.includes('Login.html')) {
        checkUserSession();
        // Lade user stats wenn eingeloggt
        const uid = sessionStorage.getItem('userUID');
        if (uid) {
            loadUserStats();
            // Prüfe ob altes Workout vom Vortag gelöscht werden soll
            clearOldDayWorkout(uid);
        }
        // Lade Übungen für heute wenn auf Heutiges-Workout.html
        if (currentPage.includes('Heutiges-Workout.html')) {
            setTimeout(() => {
                loadTodayExercisesFromPlan();
                loadTodayWorkout();
            }, 500);
        }
    }
    // Pre-fill email if "remember me" was checked
    const savedEmail = localStorage.getItem('savedEmail');
    const rememberCheckbox = document.getElementById('remember');
    if (savedEmail && document.getElementById('email')) {
        document.getElementById('email').value = savedEmail;
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
    // Update user greeting on dashboard
    updateUserGreeting();
    // Aktualisiere Zeit/Datum
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000);
});

function checkUserSession() {
    const userSession = sessionStorage.getItem('userLoggedIn');
    if (!userSession) {
        window.location.href = 'Login.html';
    }
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    const errorMsg = document.getElementById('error-message');
    
    // Clear previous error
    errorMsg.classList.remove('show');
    errorMsg.textContent = '';
    
    // Validation
    if (!email || !password) {
        showError('Bitte füllen Sie alle Felder aus', errorMsg);
        return;
    }
    
    if (password.length < 3) {
        showError('Passwort muss mindestens 3 Zeichen lang sein', errorMsg);
        return;
    }
    
    // Try Firebase first, fall back to local storage
    if (auth) {
        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                sessionStorage.setItem('userLoggedIn', 'true');
                sessionStorage.setItem('currentUser', email);
                sessionStorage.setItem('userUID', user.uid);
                
                // Get user name from Firestore
                db.collection('users').doc(user.uid).get()
                    .then((doc) => {
                        if (doc.exists) {
                            sessionStorage.setItem('userName', doc.data().name || 'User');
                        }
                        if (remember) {
                            localStorage.setItem('savedEmail', email);
                        } else {
                            localStorage.removeItem('savedEmail');
                        }
                        // Lade user stats von Firebase
                        loadUserStats();
                        window.location.href = 'index.html';
                    });
            })
            .catch((error) => {
                // Fall back to local storage
                loginWithLocalStorage(email, password, remember, errorMsg);
            });
    } else {
        // Use local storage if Firebase not available
        loginWithLocalStorage(email, password, remember, errorMsg);
    }
}

function loginWithLocalStorage(email, password, remember, errorMsg) {
    const allUsers = JSON.parse(localStorage.getItem('gmybUsers') || '[]');
    const user = allUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
        sessionStorage.setItem('userLoggedIn', 'true');
        sessionStorage.setItem('currentUser', email);
        sessionStorage.setItem('userName', user.name || 'User');
        
        if (remember) {
            localStorage.setItem('savedEmail', email);
        } else {
            localStorage.removeItem('savedEmail');
        }
        
        window.location.href = 'index.html';
    } else {
        showError('Email oder Passwort ist ungültig', errorMsg);
    }
}

function showError(message, errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

function showSignup(event) {
    event.preventDefault();
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('signup-container').style.display = 'flex';
}

function showLogin(event) {
    event.preventDefault();
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('signup-container').style.display = 'none';
}

function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-password-confirm').value;
    const errorMsg = document.getElementById('signup-error-message');
    
    // Clear previous error
    errorMsg.classList.remove('show');
    errorMsg.textContent = '';
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showError('Bitte füllen Sie alle Felder aus', errorMsg);
        return;
    }
    
    if (password.length < 3) {
        showError('Passwort muss mindestens 3 Zeichen lang sein', errorMsg);
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwörter stimmen nicht überein', errorMsg);
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('Bitte geben Sie eine gültige Email ein', errorMsg);
        return;
    }
    
    // Try Firebase first, fall back to local storage
    if (auth) {
        firebase.auth().createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                
                // Save user data to Firestore
                db.collection('users').doc(user.uid).set({
                    name: name,
                    email: email,
                    level: 1,
                    points: 0,
                    workouts: 0,
                    streak: 0,
                    createdAt: new firebase.firestore.Timestamp.now()
                }).then(() => {
                    sessionStorage.setItem('userLoggedIn', 'true');
                    sessionStorage.setItem('currentUser', email);
                    sessionStorage.setItem('userName', name);
                    sessionStorage.setItem('userUID', user.uid);
                    // Lade user stats
                    loadUserStats();
                    window.location.href = 'index.html';
                });
            })
            .catch((error) => {
                if (error.code === 'auth/email-already-in-use') {
                    showError('Diese Email ist bereits registriert', errorMsg);
                } else {
                    // Fall back to local storage
                    signupWithLocalStorage(name, email, password, errorMsg);
                }
            });
    } else {
        // Use local storage if Firebase not available
        signupWithLocalStorage(name, email, password, errorMsg);
    }
}

function signupWithLocalStorage(name, email, password, errorMsg) {
    let allUsers = JSON.parse(localStorage.getItem('gmybUsers') || '[]');
    
    if (allUsers.some(u => u.email === email)) {
        showError('Diese Email ist bereits registriert', errorMsg);
        return;
    }
    
    const newUser = {
        name: name,
        email: email,
        password: password,
        createdAt: new Date().toISOString()
    };
    
    allUsers.push(newUser);
    localStorage.setItem('gmybUsers', JSON.stringify(allUsers));
    
    sessionStorage.setItem('userLoggedIn', 'true');
    sessionStorage.setItem('currentUser', email);
    sessionStorage.setItem('userName', name);
    
    window.location.href = 'index.html';
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Logout function
function logout() {
    if (auth) {
        firebase.auth().signOut().then(() => {
            sessionStorage.removeItem('userLoggedIn');
            sessionStorage.removeItem('currentUser');
            sessionStorage.removeItem('userName');
            sessionStorage.removeItem('userUID');
            window.location.href = 'Login.html';
        });
    } else {
        sessionStorage.removeItem('userLoggedIn');
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('userName');
        window.location.href = 'Login.html';
    }
}

function updateUserGreeting() {
    const userGreeting = document.getElementById('user-greeting');
    if (userGreeting) {
        const userName = sessionStorage.getItem('userName');
        if (userName) {
            userGreeting.textContent = `Willkommen, ${userName}!`;
        }
    }
}

// Google Sign-In Handler
function handleGoogleSignIn(response) {
    const token = response.credential;
    
    if (auth) {
        const credential = firebase.auth.GoogleAuthProvider.credential(null, token);
        firebase.auth().signInWithCredential(credential)
            .then((userCredential) => {
                const user = userCredential.user;
                sessionStorage.setItem('userLoggedIn', 'true');
                sessionStorage.setItem('currentUser', user.email);
                sessionStorage.setItem('userUID', user.uid);
                sessionStorage.setItem('userName', user.displayName || 'User');
                
                // Save user to Firestore if new
                db.collection('users').doc(user.uid).set({
                    name: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    createdAt: firebase.firestore.Timestamp.now()
                }, { merge: true });
                
                window.location.href = 'index.html';
            })
            .catch((error) => {
                console.error('Google sign-in error:', error);
                showError('Google-Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.', document.getElementById('error-message'));
            });
    } else {
        // Fallback: local storage
        const payload = JSON.parse(atob(token.split('.')[1]));
        sessionStorage.setItem('userLoggedIn', 'true');
        sessionStorage.setItem('currentUser', payload.email);
        sessionStorage.setItem('userName', payload.name || 'User');
        window.location.href = 'index.html';
    }
}

// ===== NAVIGATION FUNKTIONEN =====

function goToDashboard() {
    window.location.href = 'index.html';
}

function goToProfile() {
    window.location.href = 'Profil.html';
}

function goToTrainingplan() {
    window.location.href = 'Trainingsplan.html';
}

function goToWorkout() {
    window.location.href = 'Heutiges-Workout.html';
}

function goToHistory() {
    window.location.href = 'Historie.html';
}

// ===== TRAININGSPLAN FUNKTIONEN =====

let trainingPlan = [];

function addTrainingDay(event) {
    event.preventDefault();
    
    const day = document.getElementById('day-select').value;
    const name = document.getElementById('plan-name').value;
    const exercises = document.getElementById('exercises').value.split(',').map(e => e.trim());
    
    const planItem = {
        day: day,
        name: name,
        exercises: exercises,
        id: Date.now()
    };
    
    trainingPlan.push(planItem);
    displayTrainingPlan();
    
    document.getElementById('day-select').value = '';
    document.getElementById('plan-name').value = '';
    document.getElementById('exercises').value = '';
}

function displayTrainingPlan() {
    const list = document.getElementById('training-plan-list');
    if (!list) return;
    
    list.innerHTML = '';
    trainingPlan.forEach(item => {
        const html = `
            <div class="plan-item">
                <div class="plan-item-content">
                    <h4>${item.day}: ${item.name}</h4>
                    <p>${item.exercises.join(', ')}</p>
                </div>
                <button onclick="removeTrainingDay(${item.id})">Löschen</button>
            </div>
        `;
        list.innerHTML += html;
    });
}

function removeTrainingDay(id) {
    trainingPlan = trainingPlan.filter(p => p.id !== id);
    displayTrainingPlan();
}

function savePlan() {
    const uid = sessionStorage.getItem('userUID');
    if (!uid || !auth || !db) {
        alert('Fehler: nicht angemeldet');
        return;
    }
    
    db.collection('users').doc(uid).set({
        trainingPlan: trainingPlan,
        updatedAt: firebase.firestore.Timestamp.now()
    }, { merge: true })
    .then(() => {
        alert('Trainingsplan gespeichert!');
    })
    .catch(error => {
        console.error('Fehler:', error);
        alert('Fehler beim Speichern: ' + error.message);
    });
}

// ===== FUNKTIONEN FÜR TÄGLICHE ÜBUNGEN =====

function getTodayDayName() {
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const today = new Date().getDay();
    return days[today];
}

function loadTodayExercisesFromPlan() {
    const uid = sessionStorage.getItem('userUID');
    if (!uid || !db) {
        // Fallback wenn nicht eingeloggt - verwende lokale trainingPlan
        populateTodayExercisesDropdown(trainingPlan);
        return;
    }
    
    db.collection('users').doc(uid).get()
        .then(doc => {
            if (doc.exists && doc.data().trainingPlan) {
                populateTodayExercisesDropdown(doc.data().trainingPlan);
            } else {
                // Leere Liste wenn kein Plan gespeichert
                populateTodayExercisesDropdown([]);
            }
        })
        .catch(err => {
            console.log('Trainingsplan konnte nicht geladen werden:', err);
            // Fallback zu lokaler Liste
            populateTodayExercisesDropdown(trainingPlan);
        });
}

function populateTodayExercisesDropdown(plan) {
    const select = document.getElementById('exercise-select');
    if (!select) return;
    
    const todayName = getTodayDayName();
    
    // Finde den heutigen Tag im Plan
    const todayPlan = plan.find(p => p.day === todayName);
    
    // Leere das Dropdown
    select.innerHTML = '<option value="">-- Übung auswählen --</option>';
    
    if (todayPlan && todayPlan.exercises) {
        todayPlan.exercises.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise;
            option.textContent = exercise;
            select.appendChild(option);
        });
    } else {
        const option = document.createElement('option');
        option.disabled = true;
        option.textContent = `Keine Übungen für ${todayName} geplant`;
        select.appendChild(option);
    }
}

// ===== WORKOUT FUNKTIONEN =====

let todayExercises = [];

function loadTodayWorkout() {
    const uid = sessionStorage.getItem('userUID');
    if (!uid || !db) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    db.collection('workouts')
        .where('userId', '==', uid)
        .where('date', '==', today)
        .get()
        .then(querySnapshot => {
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                todayExercises = doc.data().exercises || [];
                displayTodayExercises();
            } else {
                todayExercises = [];
                displayTodayExercises();
            }
        })
        .catch(err => console.log('Heutiges Workout laden fehlgeschlagen:', err));
}

function addExercise(event) {
    event.preventDefault();
    
    const name = document.getElementById('exercise-select').value;
    const weight = document.getElementById('exercise-weight').value || 0;
    const reps = document.getElementById('exercise-reps').value;
    const sets = document.getElementById('exercise-sets').value;
    const notes = document.getElementById('exercise-notes').value;
    const badReps = document.getElementById('exercise-bad-reps').value || 0;
    
    if (!name || !reps || !sets) {
        alert('Bitte füllen Sie mindestens Übung, Wiederholungen und Sätze aus');
        return;
    }
    
    const exercise = {
        name: name,
        weight: parseFloat(weight),
        reps: parseInt(reps),
        sets: parseInt(sets),
        notes: notes,
        badReps: parseInt(badReps),
        id: Date.now()
    };
    
    todayExercises.push(exercise);
    displayTodayExercises();
    
    document.getElementById('exercise-select').value = '';
    document.getElementById('exercise-weight').value = '';
    document.getElementById('exercise-reps').value = '';
    document.getElementById('exercise-sets').value = '1';
    document.getElementById('exercise-notes').value = '';
    document.getElementById('exercise-bad-reps').value = '0';
}

function displayTodayExercises() {
    const list = document.getElementById('todays-exercises');
    if (!list) return;
    
    list.innerHTML = '';
    if (todayExercises.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #888;">Noch keine Übungen hinzugefügt</p>';
        return;
    }
    
    todayExercises.forEach(ex => {
        const goodReps = ex.reps - ex.badReps;
        const totalReps = ex.reps * ex.sets;
        const goodRepsTotal = goodReps * ex.sets;
        const badRepsTotal = ex.badReps * ex.sets;
        
        // Punkte berechnen: 1 Punkt pro gute Wiederholung, 0.5 Punkte pro schlechte
        const pointsGood = goodRepsTotal * 1;
        const pointsBad = badRepsTotal * 0.5;
        const totalPoints = pointsGood + pointsBad;
        
        const html = `
            <div class="exercise-card">
                <div class="exercise-content">
                    <h4>${ex.name}</h4>
                    <div class="exercise-stats">
                        <span>⚖️ ${ex.weight} kg</span>
                        <span>🔄 ${ex.reps} Reps</span>
                        <span>📦 ${ex.sets} Sätze</span>
                        ${ex.badReps > 0 ? `<span>❌ ${ex.badReps} nicht gut</span>` : ''}
                        <span style="background: #1a3a1a; border: 1px solid #4CAF50;">⭐ ${totalPoints.toFixed(1)} Punkte</span>
                    </div>
                    ${ex.notes ? `<div class="exercise-notes">${ex.notes}</div>` : ''}
                </div>
                <div style="display: flex; gap: 5px; flex-direction: column;">
                    <button class="exercise-delete" onclick="removeExercise(${ex.id})">Löschen</button>
                </div>
            </div>
        `;
        list.innerHTML += html;
    });
}

function removeExercise(id) {
    todayExercises = todayExercises.filter(e => e.id !== id);
    displayTodayExercises();
}

function clearTodayExercises() {
    if (todayExercises.length === 0) {
        alert('Keine Übungen zum Löschen vorhanden');
        return;
    }
    
    if (confirm('Möchten Sie wirklich ALLE Übungen von heute löschen?')) {
        todayExercises = [];
        displayTodayExercises();
        alert('✓ Alle Übungen gelöscht!');
    }
}

function saveWorkout() {
    const uid = sessionStorage.getItem('userUID');
    if (!uid || !auth || !db) {
        alert('Fehler: nicht angemeldet');
        return;
    }
    
    if (todayExercises.length === 0) {
        alert('Bitte fügen Sie mindestens eine Übung hinzu');
        return;
    }
    
    // Berechne Gesamtpunkte
    let totalPoints = 0;
    todayExercises.forEach(ex => {
        const goodReps = (ex.reps - ex.badReps) * ex.sets;
        const badReps = ex.badReps * ex.sets;
        const pointsGood = goodReps * 1;
        const pointsBad = badReps * 0.5;
        totalPoints += pointsGood + pointsBad;
    });
    
    const today = new Date().toISOString().split('T')[0];
    
    // Überprüfe ob Workout für heute bereits existiert
    db.collection('workouts')
        .where('userId', '==', uid)
        .where('date', '==', today)
        .get()
        .then(querySnapshot => {
            if (querySnapshot.empty) {
                // Neues Workout erstellen
                db.collection('workouts').add({
                    userId: uid,
                    date: today,
                    exercises: todayExercises,
                    points: totalPoints,
                    createdAt: firebase.firestore.Timestamp.now()
                })
                .then(() => {
                    alert(`✓ Workout gespeichert! +${totalPoints.toFixed(0)} Punkte!`);
                    // Erhöhe Workouts und füge Punkte hinzu
                    addPoints(totalPoints);
                    countUserWorkouts(uid);
                    // Aktualisiere die Workout-Historie
                    if (window.location.pathname.includes('Historie.html')) {
                        loadWorkoutHistory();
                    }
                    todayExercises = [];
                    displayTodayExercises();
                })
                .catch(error => {
                    console.error('Fehler:', error);
                    alert('Fehler beim Speichern: ' + error.message);
                });
            } else {
                // Workout aktualisieren - KEINE neuen Punkte hinzufügen
                const docId = querySnapshot.docs[0].id;
                db.collection('workouts').doc(docId).update({
                    exercises: todayExercises,
                    updatedAt: firebase.firestore.Timestamp.now()
                })
                .then(() => {
                    alert(`✓ Workout aktualisiert!`);
                    todayExercises = [];
                    displayTodayExercises();
                })
                .catch(error => {
                    console.error('Fehler:', error);
                    alert('Fehler beim Aktualisieren: ' + error.message);
                });
            }
        })
        .catch(error => {
            console.error('Fehler beim Überprüfen:', error);
        });
}

// Zähle die Anzahl der eindeutigen Trainingstage
function countUserWorkouts(uid) {
    db.collection('workouts')
        .where('userId', '==', uid)
        .get()
        .then(querySnapshot => {
            userStats.workouts = querySnapshot.size;
            saveUserStats();
            updateProfileDisplay();
        })
        .catch(err => console.log('Fehler beim Zählen der Workouts:', err));
}

// Lösche altes Workout vom Vortag (wenn keine neuen Übungen hinzugefügt wurden)
function clearOldDayWorkout(uid) {
    if (!db) return;
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Prüfe ob ein Workout von gestern existiert
    db.collection('workouts')
        .where('userId', '==', uid)
        .where('date', '==', yesterdayStr)
        .get()
        .then(querySnapshot => {
            // Lösche alte Workouts aus Session, aber nicht aus Firebase
            // Das Workout bleibt in der Historie
            sessionStorage.removeItem('todayExercises');
        })
        .catch(err => console.log('Fehler beim Überprüfen alten Workouts:', err));
}

// ===== PROFIL & RANKING FUNKTIONEN =====

let userStats = {
    level: 1,
    points: 0,
    workouts: 0,
    streak: 0
};

function loadUserStats() {
    const uid = sessionStorage.getItem('userUID');
    if (!uid || !db) return;
    
    db.collection('users').doc(uid).get()
        .then(doc => {
            if (doc.exists) {
                const data = doc.data();
                userStats.level = data.level || 1;
                userStats.points = data.points || 0;
                userStats.workouts = data.workouts || 0;
                userStats.streak = data.streak || 0;
                
                // Zähle auch die Workouts erneut um sicher zu gehen
                countUserWorkouts(uid);
                
                updateProfileDisplay();
            }
        })
        .catch(err => {
            console.log('User stats konnten nicht geladen werden:', err);
            countUserWorkouts(uid);
        });
}

function addPoints(points) {
    console.log('Addieren von', points, 'Punkten. Vorher:', userStats.points);
    userStats.points += points;
    
    // Levelaufstieg ist 100 Punkte = 1 Level
    if (userStats.points >= 100) {
        userStats.level++;
        userStats.points -= 100;
        alert('🎉 Level ' + userStats.level + ' erreicht!');
    }
    
    console.log('Nach Punkte-Update:', userStats);
    updateProfileDisplay();
    saveUserStats();
}

function updateProfile(event) {
    if (event) event.preventDefault();
    
    const uid = sessionStorage.getItem('userUID');
    if (!uid || !auth || !db) {
        alert('Fehler: nicht angemeldet');
        return;
    }
    
    const name = document.getElementById('edit-name')?.value;
    const email = document.getElementById('edit-email')?.value;
    const goal = document.getElementById('edit-goal')?.value;
    const weight = document.getElementById('edit-weight')?.value;
    
    const updates = {};
    if (name) {
        updates.name = name;
        sessionStorage.setItem('userName', name);
    }
    if (email) updates.email = email;
    if (goal) updates.dailyGoal = goal;
    if (weight) updates.weight = weight;
    updates.updatedAt = firebase.firestore.Timestamp.now();
    
    db.collection('users').doc(uid).set(updates, { merge: true })
    .then(() => {
        alert('Profil aktualisiert!');
    })
    .catch(error => {
        console.error('Fehler:', error);
        alert('Fehler: ' + error.message);
    });
}

function updateProfileDisplay() {
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileLevel = document.getElementById('profile-level');
    const profilePoints = document.getElementById('profile-points');
    const profileWorkouts = document.getElementById('profile-workouts');
    const profileStreak = document.getElementById('profile-streak');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const dashboardLevel = document.getElementById('dashboard-level');
    
    // Formularfelder füllen
    const editName = document.getElementById('edit-name');
    const editEmail = document.getElementById('edit-email');
    const editGoal = document.getElementById('edit-goal');
    const editWeight = document.getElementById('edit-weight');
    
    const userName = sessionStorage.getItem('userName') || 'User';
    const userEmail = sessionStorage.getItem('currentUser') || 'Email';
    
    if (profileName) profileName.textContent = userName;
    if (profileEmail) profileEmail.textContent = userEmail;
    if (editName) editName.value = userName;
    if (editEmail) editEmail.value = userEmail;
    
    if (profileLevel) profileLevel.textContent = userStats.level;
    if (profilePoints) profilePoints.textContent = userStats.points;
    if (profileWorkouts) profileWorkouts.textContent = userStats.workouts;
    if (profileStreak) profileStreak.textContent = userStats.streak;
    if (progressFill) progressFill.style.width = (userStats.points) + '%';
    if (progressText) progressText.textContent = userStats.points + ' / 100 Punkte';
    if (dashboardLevel) dashboardLevel.textContent = 'Lvl ' + userStats.level;
}

function saveUserStats() {
    const uid = sessionStorage.getItem('userUID');
    if (!uid || !auth || !db) return;
    
    db.collection('users').doc(uid).set({
        level: userStats.level,
        points: userStats.points,
        workouts: userStats.workouts,
        streak: userStats.streak,
        updatedAt: firebase.firestore.Timestamp.now()
    }, { merge: true })
    .then(() => {
        console.log('✓ User Stats gespeichert:', userStats);
        updateProfileDisplay();
    })
    .catch(err => console.error('Fehler beim Speichern der Stats:', err));
}

// ===== KALENDER FUNKTIONEN (Historie) =====

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let workoutHistory = {};

// Lade alle Workouts für den aktuellen Benutzer
function loadWorkoutHistory() {
    const uid = sessionStorage.getItem('userUID');
    if (!uid || !db) {
        console.log('Keine UID oder DB verfügbar');
        return;
    }
    
    db.collection('workouts')
        .where('userId', '==', uid)
        .get()
        .then(querySnapshot => {
            workoutHistory = {};
            console.log('Gesamte Workouts gefunden:', querySnapshot.size);
            
            querySnapshot.forEach(doc => {
                const data = doc.data();
                const dateStr = data.date;
                
                if (!workoutHistory[dateStr]) {
                    workoutHistory[dateStr] = [];
                }
                workoutHistory[dateStr].push(data);
            });
            
            console.log('Workout History:', workoutHistory);
            renderCalendar();
        })
        .catch(err => console.log('Fehler beim Laden der Workout-Historie:', err));
}

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    loadWorkoutHistory();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    loadWorkoutHistory();
}

function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const monthName = document.getElementById('calendar-month');
    
    if (!calendar || !monthName) return;
    
    const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                       'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    
    monthName.textContent = monthNames[currentMonth] + ' ' + currentYear;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    calendar.innerHTML = '';
    
    // Wochentags-Header
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.textContent = day;
        header.style.fontWeight = 'bold';
        header.style.textAlign = 'center';
        header.style.padding = '10px';
        header.style.color = '#888';
        calendar.appendChild(header);
    });
    
    // Tage
    for (let i = 0; i < firstDay - 1; i++) {
        const empty = document.createElement('div');
        calendar.appendChild(empty);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const today = new Date().toISOString().split('T')[0];
        if (dateStr === today) dayDiv.classList.add('today');
        
        if (workoutHistory[dateStr]) {
            dayDiv.classList.add('has-workout');
            dayDiv.innerHTML = `<span class="calendar-day-date">${day}</span><span class="calendar-day-count">${workoutHistory[dateStr].length} 🏋️</span>`;
        } else {
            dayDiv.innerHTML = `<span class="calendar-day-date">${day}</span>`;
        }
        
        dayDiv.onclick = () => selectDate(dateStr);
        calendar.appendChild(dayDiv);
    }
}

function selectDate(dateStr) {
    const selectedDate = document.getElementById('selected-date');
    const workoutsList = document.getElementById('workouts-list');
    
    if (!selectedDate || !workoutsList) return;
    
    selectedDate.textContent = dateStr;
    
    if (workoutHistory[dateStr]) {
        workoutsList.innerHTML = workoutHistory[dateStr].map(w => `
            <div class="workout-item">
                <h4>${w.date}</h4>
                <p>${w.exercises.map(e => `${e.name}: ${e.sets}x${e.reps} @ ${e.weight}kg`).join('<br>')}</p>
            </div>
        `).join('');
    } else {
        workoutsList.innerHTML = '<div class="no-workouts">Keine Workouts an diesem Tag</div>';
    }
}

// Initialize calendar on page load
window.addEventListener('load', function() {
    if (document.getElementById('calendar')) {
        const uid = sessionStorage.getItem('userUID');
        if (uid) {
            loadWorkoutHistory();
        } else {
            renderCalendar();
        }
    }
    updateProfileDisplay();
    // Lade Profilbild
    if (window.location.pathname.includes('Profil.html')) {
        loadProfileImage();
    }
});

// ===== TIMER FUNKTIONEN =====

let timerInterval = null;
let timerSeconds = 60;
let timerRunning = false;

function openTimerModal() {
    const modal = document.getElementById('timer-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
    resetTimer();
}

function closeTimerModal() {
    const modal = document.getElementById('timer-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    stopTimer();
}

function startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    
    timerInterval = setInterval(() => {
        timerSeconds--;
        updateTimerDisplay();
        
        if (timerSeconds <= 0) {
            stopTimer();
            playTimerAlert();
        }
    }, 1000);
}

function pauseTimer() {
    stopTimer();
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    timerRunning = false;
}

function resetTimer() {
    stopTimer();
    timerSeconds = parseInt(document.getElementById('timer-input')?.value) || 60;
    updateTimerDisplay();
}

function applyTimerSeconds() {
    const input = parseInt(document.getElementById('timer-input').value);
    if (input > 0 && input <= 3600) {
        timerSeconds = input;
        updateTimerDisplay();
    } else {
        alert('Bitte geben Sie eine Zahl zwischen 1 und 3600 ein');
    }
}

function updateTimerDisplay() {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    const display = document.getElementById('timer-display');
    if (display) {
        display.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }
}

function playTimerAlert() {
    // Einfacher Beep (alternativ: Audio-Datei laden)
    if ('vibrate' in navigator) {
        navigator.vibrate(200);
    }
    
    // Audio Beep:
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    alert('⏱️ Zeit abgelaufen!');
}

// ===== ZEIT/DATUM ANZEIGE =====

function updateTimeDisplay() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const dateTimeString = `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
    
    const displays = document.querySelectorAll('#date-time, #time-display');
    displays.forEach(display => {
        if (display) {
            display.textContent = dateTimeString;
        }
    });
}

function openCheatReportModal() {
    const modal = document.getElementById('cheat-report-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeCheatReportModal() {
    const modal = document.getElementById('cheat-report-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    // Clear form
    document.getElementById('report-username').value = '';
    document.getElementById('report-reason').value = '';
    document.getElementById('report-points').value = '50';
    document.getElementById('report-username-suggestions').style.display = 'none';
}

function searchCheatUsers() {
    const input = document.getElementById('report-username').value.toLowerCase();
    const suggestionsDiv = document.getElementById('report-username-suggestions');
    
    if (!input || input.length < 1) {
        suggestionsDiv.style.display = 'none';
        return;
    }
    
    if (!db) {
        return;
    }
    
    // Hole alle Benutzer
    db.collection('users')
        .get()
        .then(querySnapshot => {
            const matches = [];
            querySnapshot.forEach(doc => {
                const userName = (doc.data().name || '').toLowerCase();
                if (userName.includes(input)) {
                    matches.push({
                        displayName: doc.data().name,
                        userName: doc.data().name,
                        uid: doc.id
                    });
                }
            });
            
            // Zeige max 8 Vorschläge
            if (matches.length > 0) {
                suggestionsDiv.innerHTML = matches.slice(0, 8).map(m => 
                    `<div class="suggestion-item" onclick="selectCheatUser('${m.displayName}')" style="padding: 10px 15px; cursor: pointer; border-bottom: 1px solid #444; color: white;">
                        <strong>${m.displayName}</strong> <span style="color: #888; font-size: 12px;"></span>
                    </div>`
                ).join('');
                suggestionsDiv.style.display = 'block';
            } else {
                suggestionsDiv.innerHTML = '<div style="padding: 10px 15px; color: #888;">Keine Benutzer gefunden</div>';
                suggestionsDiv.style.display = 'block';
            }
        })
        .catch(err => console.log('Fehler beim Laden der Benutzer:', err));
}

function selectCheatUser(userName) {
    document.getElementById('report-username').value = userName;
    document.getElementById('report-username-suggestions').style.display = 'none';
}

function submitCheatReport(event) {
    event.preventDefault();
    
    const reporterEmail = sessionStorage.getItem('currentUser');
    const suspectedUsername = document.getElementById('report-username').value.trim();
    const reason = document.getElementById('report-reason').value.trim();
    const pointsToRemove = parseInt(document.getElementById('report-points').value);
    
    if (!reporterEmail || !suspectedUsername || !reason || !pointsToRemove) {
        alert('Bitte füllen Sie alle Felder aus');
        return;
    }
    
    if (!auth || !db) {
        alert('Fehler: Nicht verbunden mit der Datenbank');
        return;
    }
    
    // Suche nach ähnlichen Benutzernamen (Exact Match first, dann partial)
    db.collection('users')
        .get()
        .then(querySnapshot => {
            let foundUser = null;
            let foundUserDoc = null;
            const suspectedUsernameLower = suspectedUsername.toLowerCase();
            
            // Erst: Exakter Match
            querySnapshot.forEach(doc => {
                const userName = (doc.data().name || '').toLowerCase();
                if (userName === suspectedUsernameLower && !foundUser) {
                    foundUser = doc.data();
                    foundUserDoc = doc;
                }
            });
            
            // Falls kein exakter Match: Partial Match
            if (!foundUser) {
                querySnapshot.forEach(doc => {
                    const userName = (doc.data().name || '').toLowerCase();
                    if (userName.includes(suspectedUsernameLower) && !foundUser) {
                        foundUser = doc.data();
                        foundUserDoc = doc;
                    }
                });
            }
            
            if (!foundUser || !foundUserDoc) {
                alert(`Benutzer "${suspectedUsername}" nicht gefunden. Versuchen Sie einen anderen Namen.`);
                return;
            }
            
            const suspectedUID = foundUserDoc.id;
            const currentPoints = foundUser.points || 0;
            const newPoints = Math.max(0, currentPoints - pointsToRemove);
            
            // Update user points
            db.collection('users').doc(suspectedUID).update({
                points: newPoints
            });
            
            // Log report
            db.collection('cheat_reports').add({
                reportedBy: reporterEmail,
                reportedUser: foundUser.name,
                reportedUID: suspectedUID,
                reason: reason,
                pointsRemoved: pointsToRemove,
                timestamp: firebase.firestore.Timestamp.now(),
                previousPoints: currentPoints,
                newPoints: newPoints
            }).then(() => {
                alert(`✓ Bericht eingereicht!\n\n${foundUser.name} wurden ${pointsToRemove} Punkte abgezogen.\nJetztzeit: ${newPoints} Punkte`);
                closeCheatReportModal();
            }).catch(error => {
                console.error('Fehler beim Speichern des Berichts:', error);
                alert('Fehler: Bericht konnte nicht gespeichert werden');
            });
        })
        .catch(error => {
            console.error('Fehler bei der Suche:', error);
            alert('Fehler: Benutzer konnte nicht gefunden werden');
        });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('workout-modal');
    const cheatModal = document.getElementById('cheat-report-modal');
    
    if (event.target === modal) {
        closeWorkoutForm();
    }
    if (event.target === cheatModal) {
        closeCheatReportModal();
    }
}

// ===== PROFILBILD FUNKTIONEN =====

function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Prüfe Dateigröße (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('Datei ist zu groß. Maximum 2MB.');
        return;
    }
    
    // Prüfe Dateityp
    if (!file.type.startsWith('image/')) {
        alert('Bitte wählen Sie eine Bilddatei aus');
        return;
    }
    
    // Konvertiere zu Base64
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageData = e.target.result;
        
        // Speichere in SessionStorage und Display
        sessionStorage.setItem('userProfileImage', imageData);
        
        // Update Avatar Display
        const avatarImg = document.getElementById('profile-avatar-img');
        const avatarEmoji = document.getElementById('profile-avatar-emoji');
        
        if (avatarImg) {
            avatarImg.src = imageData;
            avatarImg.style.display = 'block';
        }
        if (avatarEmoji) {
            avatarEmoji.style.display = 'none';
        }
        
        // Speichere in Firebase wenn verbunden
        const uid = sessionStorage.getItem('userUID');
        if (uid && db) {
            db.collection('users').doc(uid).update({
                profileImage: imageData,
                updatedAt: firebase.firestore.Timestamp.now()
            }).then(() => {
                console.log('Profilbild gespeichert');
            }).catch(err => {
                console.error('Fehler beim Speichern des Profilbildes:', err);
                alert('Fehler beim Speichern des Profilbildes');
            });
        }
    };
    reader.readAsDataURL(file);
}

// Lade Profilbild beim Laden der Seite
function loadProfileImage() {
    const uid = sessionStorage.getItem('userUID');
    if (!uid || !db) {
        // Fallback: aus SessionStorage laden
        const savedImage = sessionStorage.getItem('userProfileImage');
        if (savedImage) {
            displayProfileImage(savedImage);
        }
        return;
    }
    
    db.collection('users').doc(uid).get()
        .then(doc => {
            if (doc.exists && doc.data().profileImage) {
                const imageData = doc.data().profileImage;
                sessionStorage.setItem('userProfileImage', imageData);
                displayProfileImage(imageData);
            }
        })
        .catch(err => console.log('Profilbild konnte nicht geladen werden:', err));
}

function displayProfileImage(imageData) {
    const avatarImg = document.getElementById('profile-avatar-img');
    const avatarEmoji = document.getElementById('profile-avatar-emoji');
    
    if (avatarImg) {
        avatarImg.src = imageData;
        avatarImg.style.display = 'block';
    }
    if (avatarEmoji) {
        avatarEmoji.style.display = 'none';
    }
}

// Rufe loadProfileImage auf wenn Profil geladen wird
window.addEventListener('DOMContentLoaded', function() {
    // Stelle sicher, dass Firebase initialisiert ist
    if (!db) {
        initFirebase();
    }
    
    if (window.location.pathname.includes('Profil.html')) {
        setTimeout(() => loadProfileImage(), 1000);
    }
    if (window.location.pathname.includes('Freunde.html')) {
        setTimeout(() => {
            if (!db) {
                console.error('❌ Firebase Firestore nicht initialisiert!');
                alert('Fehler: Firebase konnte nicht geladen werden. Bitte aktualisieren Sie die Seite.');
                return;
            }
            loadFriendsList();
            loadFriendRequests();
            loadActiveBattles();
        }, 500);
    }
});

// ===== FREUNDE-SYSTEM FUNKTIONEN =====

// DEBUG: Teste Freunde in Firebase
function debugFriends() {
    console.log('🔧 DEBUG GESTARTET');
    
    if (!db) {
        console.error('❌ Firebase Firestore ist null!');
        alert('FEHLER: Firebase Firestore nicht initialisiert!');
        initFirebase();
        setTimeout(() => debugFriends(), 1000);
        return;
    }
    
    const userUID = sessionStorage.getItem('userUID');
    console.log('📱 User UID aus SessionStorage:', userUID);
    
    if (!userUID) {
        alert('FEHLER: Keine User UID in SessionStorage! Du bist wahrscheinlich nicht angemeldet.');
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log('👤 Firebase Auth User:', user.uid);
                sessionStorage.setItem('userUID', user.uid);
                alert('INFO: User UID in Firebase Auth gefunden: ' + user.uid);
            } else {
                alert('FEHLER: Nicht in Firebase angemeldet!');
            }
        });
        return;
    }
    
    alert('✓ User UID gefunden: ' + userUID.substring(0, 8) + '...');
    
    // Zeige ALLE Freunde
    db.collection('friends').get().then(snap => {
        console.log('📊 ALLE Freunde in Firebase (' + snap.size + '):');
        snap.forEach(doc => {
            const data = doc.data();
            console.log('  ->', JSON.stringify(data, null, 2));
        });
        
        if (snap.size === 0) {
            alert('⚠️ KEINE Freunde in Firebase gefunden!');
            return;
        }
        
        // Zeige Freunde des aktuellen Users
        const myFriends = snap.docs.filter(doc => {
            const data = doc.data();
            return data.user1 === userUID || data.user2 === userUID;
        });
        
        console.log('👥 Freunde des aktuellen Users (' + myFriends.length + '):');
        myFriends.forEach(doc => {
            const data = doc.data();
            console.log('  ->', JSON.stringify(data, null, 2));
        });
        
        if (myFriends.length === 0) {
            alert('⚠️ Du hast KEINE Freunde! (Aber es gibt ' + snap.size + ' Freunde insgesamt)');
        } else {
            alert('✓ Du hast ' + myFriends.length + ' Freund(e)!\n\nSchau in der Console (F12) für Details.');
        }
    }).catch(err => {
        console.error('❌ Fehler beim Laden der Freunde:', err);
        alert('FEHLER beim Laden: ' + err.message);
    });
}

// Prüfe ob User angemeldet ist und laden die userUID neu
function ensureUserLoaded() {
    return new Promise((resolve) => {
        let userUID = sessionStorage.getItem('userUID');
        
        if (userUID) {
            resolve(userUID);
            return;
        }
        
        // Versuche von Firebase zu laden
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                sessionStorage.setItem('userUID', user.uid);
                db.collection('users').doc(user.uid).get()
                    .then((doc) => {
                        if (doc.exists) {
                            sessionStorage.setItem('userName', doc.data().name || 'User');
                        }
                        resolve(user.uid);
                    });
            } else {
                alert('Fehler: Du musst angemeldet sein!');
                window.location.href = 'Login.html';
                resolve(null);
            }
        });
    });
}

// Suche nach Benutzern
function searchFriend() {
    const searchInput = document.getElementById('friend-search-input');
    const query = searchInput.value.trim().toLowerCase();
    const resultsDiv = document.getElementById('friend-search-results');
    
    if (!query || query.length < 2) {
        resultsDiv.style.display = 'none';
        return;
    }
    
    if (!db) {
        console.error('❌ Firebase nicht initialisiert in searchFriend');
        alert('Firebase wird noch geladen. Bitte versuchen Sie es in einem Moment erneut.');
        return;
    }
    
    ensureUserLoaded().then(currentUserUID => {
        if (!currentUserUID) return;
        
        db.collection('users')
            .get()
            .then(querySnapshot => {
                const results = [];
                
                querySnapshot.forEach(doc => {
                    const docId = doc.id;
                    const userData = doc.data();
                    const userName = (userData.name || '').toLowerCase();
                    
                    // Gefundene Benutzer die nicht der aktuelle Benutzer sind
                    if (userName.includes(query) && docId !== currentUserUID) {
                        results.push({
                            uid: docId,
                            name: userData.name,
                            level: userData.level || 1,
                            points: userData.points || 0
                        });
                    }
                });
                
                if (results.length > 0) {
                    resultsDiv.innerHTML = results.map(user => `
                        <div class="search-result">
                            <div class="search-result-info">
                                <h4>${user.name}</h4>
                                <p>Level ${user.level} • ${user.points} Punkte</p>
                            </div>
                            <button class="btn-add" onclick="sendFriendRequest('${user.uid}', '${user.name}')">+ Hinzufügen</button>
                        </div>
                    `).join('');
                    resultsDiv.style.display = 'block';
                } else {
                    resultsDiv.innerHTML = '<div class="empty-message">Keine Benutzer gefunden</div>';
                    resultsDiv.style.display = 'block';
                }
            })
            .catch(err => {
                console.error('Fehler bei der Benutzersuche:', err);
                alert('Fehler bei der Suche');
            });
    });
}

// Sende Freund-Anfrage
function sendFriendRequest(targetUID, targetName) {
    if (!db) {
        console.error('❌ Firebase nicht initialisiert in sendFriendRequest');
        alert('Firebase wird noch geladen. Bitte versuchen Sie es in einem Moment erneut.');
        return;
    }
    
    ensureUserLoaded().then(currentUserUID => {
        if (!currentUserUID) return;
        
        const currentUserName = sessionStorage.getItem('userName');
        
        db.collection('friendRequests').add({
            from: currentUserUID,
            fromName: currentUserName,
            to: targetUID,
            toName: targetName,
            status: 'pending',
            createdAt: firebase.firestore.Timestamp.now()
        })
        .then(() => {
            alert(`✓ Freund-Anfrage an ${targetName} versendet!`);
            document.getElementById('friend-search-input').value = '';
            document.getElementById('friend-search-results').style.display = 'none';
        })
        .catch(err => {
            console.error('Fehler:', err);
            alert('Fehler beim Versenden der Anfrage');
        });
    });
}

// Lade Freund-Anfragen
// Lade Freund-Anfragen
function loadFriendRequests() {
    if (!db) {
        console.error('❌ Firebase nicht initialisiert in loadFriendRequests');
        setTimeout(() => loadFriendRequests(), 1000);
        return;
    }
    
    ensureUserLoaded().then(currentUserUID => {
        if (!currentUserUID) return;
        
        db.collection('friendRequests')
            .where('to', '==', currentUserUID)
            .where('status', '==', 'pending')
            .get()
            .then(querySnapshot => {
                const requestsDiv = document.getElementById('friend-requests');
                const countSpan = document.getElementById('request-count');
                
                countSpan.textContent = querySnapshot.size;
                
                if (querySnapshot.empty) {
                    requestsDiv.innerHTML = '<div class="empty-message">Keine offenen Anfragen</div>';
                    return;
                }
                
                requestsDiv.innerHTML = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return `
                        <div class="request-item">
                            <div class="request-info">
                                <h4>${data.fromName}</h4>
                                <p>Möchte dein Freund werden</p>
                            </div>
                            <div class="request-actions">
                                <button class="btn-accept" onclick="acceptFriendRequest('${doc.id}', '${data.from}', '${data.fromName}')">✓ Annehmen</button>
                                <button class="btn-reject" onclick="rejectFriendRequest('${doc.id}')">✕ Ablehnen</button>
                            </div>
                        </div>
                    `;
                }).join('');
            })
            .catch(err => console.error('Fehler beim Laden der Anfragen:', err));
    });
}

// Akzeptiere Freund-Anfrage
function acceptFriendRequest(requestID, friendUID, friendName) {
    if (!db) {
        console.error('❌ Firebase nicht initialisiert in acceptFriendRequest');
        alert('Firebase wird noch geladen. Bitte versuchen Sie es in einem Moment erneut.');
        return;
    }
    
    ensureUserLoaded().then(currentUserUID => {
        if (!currentUserUID) {
            alert('Fehler: Nicht angemeldet');
            return;
        }
        
        const currentUserName = sessionStorage.getItem('userName');
        console.log('Akzeptiere Anfrage:', { currentUserUID, friendUID, currentUserName, friendName });
        
        if (!currentUserName) {
            alert('Fehler: Benutzername nicht geladen');
            return;
        }
        
        // Aktualisiere die Anfrage
        db.collection('friendRequests').doc(requestID).update({
            status: 'accepted',
            acceptedAt: firebase.firestore.Timestamp.now()
        })
        .then(() => {
            console.log('Anfrage aktualisiert, füge zur Freundesliste hinzu...');
            
            // Füge zu beiden Freundeslisten hinzu
            return db.collection('friends').add({
                user1: currentUserUID,
                user2: friendUID,
                user1Name: currentUserName,
                user2Name: friendName,
                createdAt: firebase.firestore.Timestamp.now()
            });
        })
        .then(() => {
            console.log('✅ Zu Freundesliste hinzugefügt');
            alert(`✓ ${friendName} ist jetzt dein Freund!`);
            
            // Warte 500ms bevor die Liste neu geladen wird
            setTimeout(() => {
                console.log('Lade Listen neu...');
                loadFriendRequests();
                loadFriendsList();
            }, 500);
        })
        .catch(err => {
            console.error('❌ Fehler beim Akzeptieren der Anfrage:', err);
            alert('Fehler: ' + err.message);
        });
    });
}

// Lehne Freund-Anfrage ab
function rejectFriendRequest(requestID) {
    if (!db) {
        console.error('❌ Firebase nicht initialisiert in rejectFriendRequest');
        alert('Firebase wird noch geladen. Bitte versuchen Sie es in einem Moment erneut.');
        return;
    }
    
    db.collection('friendRequests').doc(requestID).update({
        status: 'rejected'
    })
    .then(() => {
        alert('Anfrage abgelehnt');
        loadFriendRequests();
    })
    .catch(err => {
        console.error('Fehler:', err);
        alert('Fehler beim Ablehnen der Anfrage');
    });
}

// Lade Freundesliste
function loadFriendsList() {
    if (!db) {
        console.error('❌ Firebase nicht initialisiert in loadFriendsList');
        alert('Fehler: Firebase ist noch nicht ready. Bitte warten Sie einen Moment...');
        // Versuche es nochmal nach 1 Sekunde
        setTimeout(() => loadFriendsList(), 1000);
        return;
    }
    
    ensureUserLoaded().then(currentUserUID => {
        if (!currentUserUID) {
            console.error('Kein User UID gefunden');
            alert('Fehler: Benutzer nicht angemeldet');
            return;
        }
        
        console.log('🔍 Lade Freundesliste für:', currentUserUID);
        
        Promise.all([
            db.collection('friends')
                .where('user1', '==', currentUserUID)
                .get(),
            db.collection('friends')
                .where('user2', '==', currentUserUID)
                .get()
        ]).then(([querySnapshot1, querySnapshot2]) => {
            console.log('📊 user1 Ergebnisse:', querySnapshot1.size);
            console.log('📊 user2 Ergebnisse:', querySnapshot2.size);
            
            const friendsList = document.getElementById('friends-list');
            if (!friendsList) {
                console.error('❌ friends-list Element nicht gefunden!');
                alert('Fehler: UI-Element nicht gefunden');
                return;
            }
            
            const countSpan = document.getElementById('friends-count');
            
            let allFriends = [];
            
            querySnapshot1.forEach(doc => {
                const data = doc.data();
                console.log('👤 Freund (als user1):', data);
                allFriends.push({
                    id: doc.id,
                    uid: data.user2,
                    name: data.user2Name
                });
            });
            
            querySnapshot2.forEach(doc => {
                const data = doc.data();
                console.log('👤 Freund (als user2):', data);
                allFriends.push({
                    id: doc.id,
                    uid: data.user1,
                    name: data.user1Name
                });
            });
            
            console.log('📈 Total Freunde gefunden:', allFriends.length);
            if (countSpan) countSpan.textContent = allFriends.length;
            
            if (allFriends.length === 0) {
                friendsList.innerHTML = '<div class="empty-message">Keine Freunde noch. Füge jemanden hinzu!</div>';
                console.log('⚠️ Keine Freunde vorhanden');
                return;
            }
            
            alert('✓ ' + allFriends.length + ' Freunde gefunden!');
            
            // Lade User-Daten für jeden Freund - mit Promise.all
            const friendPromises = allFriends.map((friend, idx) => {
                console.log('Lade User-Daten für Freund', idx+1, 'Name:', friend.name, 'UID:', friend.uid);
                return db.collection('users').doc(friend.uid).get()
                    .then(doc => {
                        if (doc.exists) {
                            const userData = doc.data();
                            console.log('✅ User-Daten geladen:', userData);
                            
                            const level = userData.level || 1;
                            const points = userData.points || 0;
                            const workouts = userData.workouts || 0;
                            const friendName = friend.name || 'Unbekannt';
                            
                            console.log('HTML wird generiert für:', friendName);
                            
                            return `<div class="friend-item" style="padding: 15px; background: #2a2a2a; border-radius: 8px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;"><div class="friend-info"><h4 style="margin: 0 0 8px 0; color: #fff;">` + friendName + `</h4><div class="friend-stats" style="color: #aaa; font-size: 14px;"><span>🎖️ Level ` + level + `</span><br><span>⭐ ` + points + ` Punkte</span><br><span>💪 ` + workouts + ` Workouts</span></div></div><div class="friend-actions" style="display: flex; gap: 8px;"><button class="btn-battle" onclick="openBattleModal('` + friend.uid + `', '` + friendName + `')" style="padding: 8px 12px; background: #FF6B35; color: white; border: none; border-radius: 6px; cursor: pointer;">⚔️ Battle</button><button class="btn-remove" onclick="removeFriend('` + friend.id + `')" style="padding: 8px 12px; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer;">✕</button></div></div>`;
                        } else {
                            console.warn('⚠️ User-Dokument nicht gefunden für:', friend.uid);
                            return '';
                        }
                    })
                    .catch(err => {
                        console.error('❌ Fehler beim Laden des Freunds:', friend.uid, err);
                        return '';
                    });
            });
            
            Promise.all(friendPromises).then(friendsHTMLArray => {
                console.log('🎉 Alle Freunde-Daten geladen, Anzahl:', friendsHTMLArray.length);
                console.log('Array Inhalt:', friendsHTMLArray);
                const html = friendsHTMLArray.filter(h => h && h.length > 0).join('');
                console.log('✅ Finales HTML länge:', html.length);
                
                if (html && html.length > 0) {
                    friendsList.innerHTML = html;
                    console.log('✅ HTML in friendsList eingefügt');
                } else {
                    friendsList.innerHTML = '<div class="empty-message" style="padding: 20px; text-align: center; color: #aaa;">Fehler beim Laden der Freunde-Daten</div>';
                    console.log('⚠️ HTML war leer, Fehler-Nachricht angezeigt');
                }
            }).catch(err => {
                console.error('❌ Fehler bei Promise.all:', err);
                friendsList.innerHTML = '<div class="empty-message" style="padding: 20px; text-align: center; color: red;">Fehler: ' + err.message + '</div>';
                alert('Fehler beim Laden: ' + err.message);
            });
        }).catch(err => {
            console.error('❌ Fehler beim Laden der Freunde-Sammlung:', err);
            alert('Fehler beim Laden der Freunde: ' + err.message);
        });
    });
}

// Entferne Freund
function removeFriend(friendshipID) {
    if (!db) {
        console.error('❌ Firebase nicht initialisiert in removeFriend');
        alert('Firebase wird noch geladen. Bitte versuchen Sie es in einem Moment erneut.');
        return;
    }
    
    if (confirm('Möchtest du diesen Freund wirklich entfernen?')) {
        db.collection('friends').doc(friendshipID).delete()
            .then(() => {
                alert('Freund entfernt');
                loadFriendsList();
            })
            .catch(err => {
                console.error('Fehler:', err);
                alert('Fehler beim Entfernen des Freunds');
            });
    }
}

// ===== BATTLE-SYSTEM FUNKTIONEN =====

let currentBattleOpponent = null;

function openBattleModal(opponentUID, opponentName) {
    currentBattleOpponent = {
        uid: opponentUID,
        name: opponentName
    };
    
    document.getElementById('battle-opponent').textContent = opponentName;
    document.getElementById('battle-modal').style.display = 'flex';
}

function closeBattleModal() {
    document.getElementById('battle-modal').style.display = 'none';
    currentBattleOpponent = null;
}

function startBattle() {
    if (!currentBattleOpponent) {
        alert('Fehler: Keine Gegner ausgewählt');
        return;
    }
    
    if (!db) {
        console.error('❌ Firebase nicht initialisiert in startBattle');
        alert('Firebase wird noch geladen. Bitte versuchen Sie es in einem Moment erneut.');
        return;
    }
    
    ensureUserLoaded().then(currentUserUID => {
        if (!currentUserUID) return;
        
        const duration = parseInt(document.getElementById('battle-duration').value);
        const title = document.getElementById('battle-title').value.trim();
        const description = document.getElementById('battle-description').value.trim();
        
        if (!title) {
            alert('Bitte gib einen Titel für das Battle ein');
            return;
        }
        
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration);
        
        db.collection('battles').add({
            player1: currentUserUID,
            player1Name: sessionStorage.getItem('userName'),
            player2: currentBattleOpponent.uid,
            player2Name: currentBattleOpponent.name,
            title: title,
            description: description,
            status: 'active',
            duration: duration,
            startDate: firebase.firestore.Timestamp.fromDate(startDate),
            endDate: firebase.firestore.Timestamp.fromDate(endDate),
            player1StartPoints: userStats.points || 0,
            player2StartPoints: 0,
            createdAt: firebase.firestore.Timestamp.now()
        })
        .then((docRef) => {
            // Lade auch Gegner-Stats
            db.collection('users').doc(currentBattleOpponent.uid).get()
                .then(doc => {
                    if (doc.exists) {
                        const opponentData = doc.data();
                        db.collection('battles').doc(docRef.id).update({
                            player2StartPoints: opponentData.points || 0
                        });
                    }
                });
            
            alert(`✓ Battle gegen ${currentBattleOpponent.name} gestartet! 🎉`);
            closeBattleModal();
            loadActiveBattles();
        })
        .catch(err => {
            console.error('Fehler:', err);
            alert('Fehler beim Starten des Battle');
        });
    });
}

// Lade aktive Battles
function loadActiveBattles() {
    if (!db) {
        console.error('❌ Firebase nicht initialisiert in loadActiveBattles');
        setTimeout(() => loadActiveBattles(), 1000);
        return;
    }
    
    ensureUserLoaded().then(currentUserUID => {
        if (!currentUserUID) return;
        
        const today = new Date().toISOString().split('T')[0];
        
        db.collection('battles')
            .where('status', '==', 'active')
            .get()
            .then(querySnapshot => {
                const battlesDiv = document.getElementById('active-battles');
                const battles = [];
                
                querySnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.player1 === currentUserUID || data.player2 === currentUserUID) {
                        battles.push({
                            id: doc.id,
                            ...data
                        });
                    }
                });
                
                if (battles.length === 0) {
                    battlesDiv.innerHTML = '<div class="empty-message">Keine aktiven Battles</div>';
                    return;
                }
                
                battlesDiv.innerHTML = battles.map(battle => {
                    const isPlayer1 = battle.player1 === currentUserUID;
                    const opponent = isPlayer1 ? battle.player2Name : battle.player1Name;
                    const endDate = new Date(battle.endDate.toDate());
                    const daysLeft = Math.max(0, Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24)));
                    
                    return `
                        <div class="battle-item">
                            <div class="battle-info">
                                <h4>⚔️ ${battle.title}</h4>
                                <p><strong>vs ${opponent}</strong></p>
                                <p>${battle.description}</p>
                                <p style="color: #4CAF50; margin-top: 8px;">Endet in ${daysLeft} Tagen</p>
                            </div>
                            <div class="battle-actions">
                                <button class="btn-view" onclick="viewBattleDetails('${battle.id}')">📊 Details</button>
                            </div>
                        </div>
                    `;
                }).join('');
            })
            .catch(err => console.error('Fehler beim Laden der Battles:', err));
    });
}

function viewBattleDetails(battleID) {
    ensureUserLoaded().then(currentUserUID => {
        if (!currentUserUID) return;
        
        db.collection('battles').doc(battleID).get()
            .then(doc => {
                if (doc.exists) {
                    const battle = doc.data();
                    const isPlayer1 = battle.player1 === currentUserUID;
                    const opponent = isPlayer1 ? battle.player2Name : battle.player1Name;
                    const playerPoints = isPlayer1 ? userStats.points || 0 : 0;
                    const pointsGained = playerPoints - (isPlayer1 ? battle.player1StartPoints : battle.player2StartPoints);
                    
                    alert(`⚔️ ${battle.title}\n\nGegner: ${opponent}\n\nDeine Punkte Anfang: ${isPlayer1 ? battle.player1StartPoints : battle.player2StartPoints}\nDeine Punkte jetzt: ${playerPoints}\nGewonnen: ${pointsGained}\n\nEndet: ${new Date(battle.endDate.toDate()).toLocaleDateString('de-DE')}`);
                }
            })
            .catch(err => console.error('Fehler:', err));
    });
}

