# Firebase Setup Guide for GMYB

## ✅ Current Status
Registration now works with **local storage** (data saved in your browser). 

To save data **online in the cloud**, follow these steps to set up Firebase.

---

## 🚀 Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a Project"**
3. Name it: `gmakesyoubetter`
4. Click **Continue** → **Create Project**
5. Wait for it to load, then click **Continue**

---

## 🔑 Step 2: Get Your Firebase Credentials

1. In Firebase Console, click the **Web icon** (looks like `</>``)
2. Register app name: `GMYB-Web`
3. Copy the entire config object that looks like:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_KEY_HERE",
  authDomain: "YOUR_DOMAIN.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## 📝 Step 3: Enable Authentication

1. In Firebase Console, go to **Build** → **Authentication**
2. Click **Get Started**
3. Click on **Email/Password**
4. Toggle **Enable** 
5. Click **Save**

---

## 🗄️ Step 4: Create Firestore Database

1. Go to **Build** → **Firestore Database**
2. Click **Create Database**
3. Select **Start in Production Mode**
4. Choose region: **Europe (e.g., europe-west1)**
5. Click **Create**

6. Once created, go to **Rules** tab
7. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

8. Click **Publish**

---

## 🔧 Step 5: Update Your Code

1. Open `lib/script.js`
2. Find the `firebaseConfig` object (around line 3)
3. Replace it with **your** Firebase credentials from Step 2
4. Save the file

---

## ✅ Testing

1. Open `Login.html` in your browser
2. Test **"Registrieren"** (Register)
3. Check [Firebase Console](https://console.firebase.google.com/) → **Authentication** to see your new users
4. Check **Firestore** to see your user data saved online

---

## 🎉 Done!

Your app now saves data online. Users can log in from any device!

## Fallback

If you don't set up Firebase, the system still works locally using browser storage.

---

### Need Help?
Check the browser console (F12 → Console) for any errors.
