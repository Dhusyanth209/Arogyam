<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Arogyam - Document Uploader</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body {
      font-family: 'Inter', sans-serif;
      background-color: #f3f4f6;
    }
  </style>
</head>
<body class="bg-gray-100 p-8 min-h-screen flex items-center justify-center">

  <div class="w-full max-w-lg bg-white p-8 rounded-lg shadow-xl">
    <h1 class="text-3xl font-bold text-center text-gray-800 mb-6">Upload Report</h1>
    <div class="mb-4">
      <label class="block text-gray-700 text-sm font-semibold mb-2" for="file-input">
        Select your document:
      </label>
      <input type="file" id="file-input" class="w-full text-sm text-gray-500
        file:mr-4 file:py-2 file:px-4
        file:rounded-full file:border-0
        file:text-sm file:font-semibold
        file:bg-blue-50 file:text-blue-700
        hover:file:bg-blue-100" />
    </div>
    <button id="upload-btn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition-colors">
      Upload Document
    </button>

    <div id="upload-status" class="mt-6 text-center text-sm font-medium"></div>
  </div>

  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
    import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
    import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

    // ✅ Replace these with your actual Firebase config values
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const storage = getStorage(app);

    let userId = null;

    // ✅ Ensure anonymous sign-in completes before proceeding
    async function ensureAuth() {
      if (!auth.currentUser) {
        const result = await signInAnonymously(auth);
        userId = result.user.uid;
      } else {
        userId = auth.currentUser.uid;
      }
    }

    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadStatus = document.getElementById('upload-status');

    const uploadDocument = async (file) => {
      const storageRef = ref(storage, `documents/${userId}/${file.name}`);
      try {
        uploadStatus.innerText = `Uploading...`;
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        return url;
      } catch (e) {
        console.error("Error uploading file: ", e);
        return null;
      }
    };

    uploadBtn.addEventListener('click', async () => {
      const file = fileInput.files[0];
      if (!file) {
        uploadStatus.innerText = 'Please select a file first.';
        return;
      }

      await ensureAuth();

      const fileUrl = await uploadDocument(file);
      if (fileUrl) {
        uploadStatus.innerHTML = `✅ File uploaded successfully!<br><a href="${fileUrl}" target="_blank" class="text-blue-600 underline">${fileUrl}</a>`;
      } else {
        uploadStatus.innerText = '❌ Error uploading file. Please try again.';
      }
    });
  </script>
</body>
</html>