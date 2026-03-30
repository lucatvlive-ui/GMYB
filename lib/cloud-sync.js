// ============================================
// 🌐 GMYB Cloud Sync System
// Firebase Firestore Integration für Multi-Device Support
// ============================================

// Firestore Collections Structure:
// users/{uid}/profile - User profile & stats
// users/{uid}/trainingPlans/{planId} - Training plans
// users/{uid}/workouts/{workoutId} - Daily workouts
// users/{uid}/exercises/{exerciseId} - Custom exercises
// users/{uid}/settings - User preferences

class CloudSyncManager {
    constructor() {
        this.uid = null;
        this.db = firebase.firestore();
        this.syncEnabled = true;
        this.syncInterval = 5000; // 5 seconds
        this.pendingChanges = [];
    }

    /**
     * Initialisiere CloudSync für eingeloggten User
     */
    async init(userUID) {
        this.uid = userUID;
        console.log('🌐 CloudSync initialized for user:', userUID);
        
        // Lade Daten von der Cloud
        await this.loadCloudData();
        
        // Starte Auto-Sync
        this.startAutoSync();
    }

    /**
     * Lade alle User-Daten von der Cloud
     */
    async loadCloudData() {
        if (!this.uid) {
            console.log('❌ No user logged in');
            return;
        }

        try {
            // Lade Profil-Daten
            await this.loadUserProfile();
            
            // Lade Trainingsplan
            await this.loadTrainingPlan();
            
            // Lade heutiges Workout
            await this.loadTodayWorkout();
            
            // Lade Custom Exercises
            await this.loadCustomExercises();
            
            console.log('✅ Cloud data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading cloud data:', error);
        }
    }

    /**
     * Lade User-Profil von Firestore
     */
    async loadUserProfile() {
        try {
            const userDoc = await this.db.collection('users').doc(this.uid).get();
            
            if (userDoc.exists) {
                const data = userDoc.data();
                
                // Speichere in SessionStorage für schnelleren Zugriff
                sessionStorage.setItem('userProfile', JSON.stringify(data));
                
                // Update UI falls vorhanden
                if (document.getElementById('user-level')) {
                    document.getElementById('user-level').textContent = `Level ${data.level || 1}`;
                }
                if (document.getElementById('user-points')) {
                    document.getElementById('user-points').textContent = `${data.points || 0} Pts`;
                }
                if (document.getElementById('user-streak')) {
                    document.getElementById('user-streak').textContent = `${data.streak || 0} Tage`;
                }
                
                console.log('✅ User profile loaded:', data);
            }
        } catch (error) {
            console.error('❌ Error loading user profile:', error);
        }
    }

    /**
     * Lade Trainingsplan von Firestore
     */
    async loadTrainingPlan() {
        try {
            const plansSnapshot = await this.db
                .collection('users')
                .doc(this.uid)
                .collection('trainingPlans')
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();
            
            if (!plansSnapshot.empty) {
                const plan = plansSnapshot.docs[0].data();
                
                // Speichere den Trainingsplan lokal
                localStorage.setItem('currentTrainingPlan', JSON.stringify(plan));
                localStorage.setItem('currentTrainingPlanId', plansSnapshot.docs[0].id);
                
                // Update UI wenn auf Trainingsplan-Seite
                if (window.location.pathname.includes('Trainingsplan')) {
                    this.displayTrainingPlan(plan);
                }
                
                console.log('✅ Training plan loaded:', plan.name);
            }
        } catch (error) {
            console.error('❌ Error loading training plan:', error);
        }
    }

    /**
     * Lade heutiges Workout von Firestore
     */
    async loadTodayWorkout() {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            const workoutSnapshot = await this.db
                .collection('users')
                .doc(this.uid)
                .collection('workouts')
                .where('date', '==', today)
                .get();
            
            if (!workoutSnapshot.empty) {
                const workout = workoutSnapshot.docs[0].data();
                
                // Speichere lokal
                localStorage.setItem('todayWorkout', JSON.stringify(workout));
                
                console.log('✅ Today workout loaded:', workout.exercises.length);
            }
        } catch (error) {
            console.error('❌ Error loading today workout:', error);
        }
    }

    /**
     * Lade Custom Exercises von Firestore
     */
    async loadCustomExercises() {
        try {
            const exercisesSnapshot = await this.db
                .collection('users')
                .doc(this.uid)
                .collection('exercises')
                .get();
            
            const exercises = [];
            exercisesSnapshot.forEach(doc => {
                exercises.push({ id: doc.id, ...doc.data() });
            });
            
            // Speichere lokal
            localStorage.setItem('customExercises', JSON.stringify(exercises));
            
            console.log('✅ Custom exercises loaded:', exercises.length);
        } catch (error) {
            console.error('❌ Error loading exercises:', error);
        }
    }

    /**
     * Speichere Trainingsplan in die Cloud
     */
    async saveTrainingPlan(planData) {
        if (!this.uid) return;
        
        try {
            const planId = localStorage.getItem('currentTrainingPlanId') || 'default-plan';
            
            await this.db
                .collection('users')
                .doc(this.uid)
                .collection('trainingPlans')
                .doc(planId)
                .set({
                    name: planData.name || 'Mein Trainingsplan',
                    exercises: planData.exercises || [],
                    description: planData.description || '',
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    createdAt: planData.createdAt || firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            
            console.log('✅ Training plan saved to cloud');
            return true;
        } catch (error) {
            console.error('❌ Error saving training plan:', error);
            this.pendingChanges.push({ type: 'trainingPlan', data: planData });
            return false;
        }
    }

    /**
     * Speichere Workout in die Cloud
     */
    async saveWorkout(workoutData) {
        if (!this.uid) return;
        
        try {
            const today = new Date().toISOString().split('T')[0];
            
            await this.db
                .collection('users')
                .doc(this.uid)
                .collection('workouts')
                .doc(today)
                .set({
                    date: today,
                    exercises: workoutData.exercises || [],
                    totalWeight: workoutData.totalWeight || 0,
                    totalReps: workoutData.totalReps || 0,
                    duration: workoutData.duration || 0,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            
            console.log('✅ Workout saved to cloud');
            return true;
        } catch (error) {
            console.error('❌ Error saving workout:', error);
            this.pendingChanges.push({ type: 'workout', data: workoutData });
            return false;
        }
    }

    /**
     * Speichere Custom Exercise in die Cloud
     */
    async saveCustomExercise(exerciseName) {
        if (!this.uid) return;
        
        try {
            await this.db
                .collection('users')
                .doc(this.uid)
                .collection('exercises')
                .add({
                    name: exerciseName,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    category: 'custom'
                });
            
            console.log('✅ Custom exercise saved:', exerciseName);
            return true;
        } catch (error) {
            console.error('❌ Error saving exercise:', error);
            return false;
        }
    }

    /**
     * Starte Auto-Sync (alle 5 Sekunden)
     */
    startAutoSync() {
        setInterval(() => {
            if (this.syncEnabled && this.pendingChanges.length > 0) {
                this.syncPendingChanges();
            }
        }, this.syncInterval);
    }

    /**
     * Synchronisiere ausstehende Änderungen
     */
    async syncPendingChanges() {
        const changes = [...this.pendingChanges];
        
        for (let change of changes) {
            try {
                if (change.type === 'trainingPlan') {
                    await this.saveTrainingPlan(change.data);
                } else if (change.type === 'workout') {
                    await this.saveWorkout(change.data);
                }
                
                // Entferne aus Pending
                this.pendingChanges = this.pendingChanges.filter(c => c !== change);
            } catch (error) {
                console.error('❌ Error syncing change:', error);
            }
        }
        
        if (this.pendingChanges.length === 0) {
            console.log('✅ All changes synced');
        }
    }

    /**
     * Stelle sicher dass Daten immer aktuell sind
     */
    async syncNow() {
        console.log('🔄 Syncing now...');
        await this.loadCloudData();
        await this.syncPendingChanges();
    }

    /**
     * Zeige Trainingsplan an
     */
    displayTrainingPlan(plan) {
        const exerciseList = document.getElementById('exercise-list');
        if (!exerciseList) return;
        
        exerciseList.innerHTML = '';
        
        if (plan.exercises && plan.exercises.length > 0) {
            plan.exercises.forEach(exercise => {
                const li = document.createElement('li');
                li.className = 'exercise-item';
                li.dataset.exercise = exercise;
                li.innerHTML = `
                    <span>${exercise}</span>
                    <button class="return-btn" onclick="addToTrainingPlan(this)">→</button>
                    <button class="delete-btn" onclick="deleteExercise(this)">🗑</button>
                `;
                exerciseList.appendChild(li);
            });
        }
    }

    /**
     * Deaktiviere Sync (z.B. wenn offline)
     */
    disableSync() {
        this.syncEnabled = false;
        console.log('⏸️  Sync disabled');
    }

    /**
     * Aktiviere Sync wieder
     */
    enableSync() {
        this.syncEnabled = true;
        console.log('▶️  Sync enabled');
        this.syncNow();
    }
}

// Globale Instanz
let cloudSync = null;

/**
 * Initialisiere die Cloud-Synchronisation nach Login
 */
function initCloudSync() {
    const uid = sessionStorage.getItem('userUID');
    if (uid && !cloudSync) {
        cloudSync = new CloudSyncManager();
        cloudSync.init(uid);
    }
}

/**
 * Hook in die bestehenden Funktionen um Cloud zu syncen
 */
function saveToCloud() {
    if (!cloudSync) return;
    
    const trainingData = {
        name: 'Mein Plan',
        exercises: getExercisesFromUI(),
        description: ''
    };
    
    cloudSync.saveTrainingPlan(trainingData);
}

function getExercisesFromUI() {
    const exerciseList = document.getElementById('training-list');
    if (!exerciseList) return [];
    
    const exercises = [];
    exerciseList.querySelectorAll('.training-item').forEach(item => {
        exercises.push(item.dataset.exercise);
    });
    
    return exercises;
}

// Starte CloudSync wenn Seite lädt und User eingeloggt ist
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initCloudSync();
    }, 1000);
});
