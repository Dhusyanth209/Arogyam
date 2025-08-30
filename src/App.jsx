import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, getDocs, updateDoc, query, where, orderBy } from 'firebase/firestore';

// Main App component
export default function App() {
  // State variables for Firebase services and user data
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  // State variables for the chatbot
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');

  // Get the application ID from the environment
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

  useEffect(() => {
    // This useEffect initializes Firebase and handles authentication.
    const initializeFirebase = async () => {
      try {
        const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
        if (!firebaseConfig || Object.keys(firebaseConfig).length === 0) {
          console.error("Firebase config is not defined.");
          setLoading(false);
          return;
        }

        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const authInstance = getAuth(app);

        setDb(firestore);
        setAuth(authInstance);

        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
        if (initialAuthToken) {
          await signInWithCustomToken(authInstance, initialAuthToken);
        } else {
          await signInAnonymously(authInstance);
        }
      } catch (e) {
        console.error("Error initializing Firebase:", e);
        setLoading(false);
      }
    };

    initializeFirebase();
  }, []);

  useEffect(() => {
    // This effect listens for authentication state changes and sets the user ID.
    if (auth) {
      const unsubscribeAuth = auth.onAuthStateChanged(user => {
        if (user) {
          setUserId(user.uid);
          setLoading(false);
          // Greet the user from the bot
          setChatMessages([
            {
              text: "Hello, I am your healthcare assistant. How can I help you today?",
              sender: "bot",
            },
          ]);
        } else {
          setUserId(null);
          setLoading(false);
        }
      });
      return () => unsubscribeAuth();
    }
  }, [auth]);

  // Function to handle sending a new message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!userMessage.trim()) return;

    // Add user's message to chat
    const newUserMessage = { text: userMessage, sender: "user" };
    setChatMessages((prevMessages) => [...prevMessages, newUserMessage]);

    // Simple bot response logic
    const botResponseText = getBotResponse(userMessage);
    const newBotMessage = { text: botResponseText, sender: "bot" };
    setChatMessages((prevMessages) => [...prevMessages, newBotMessage]);

    // Clear the input field
    setUserMessage('');
  };

  // Simple function to get a bot response based on user input
  const getBotResponse = (message) => {
    const greetings = ["hello", "hi", "hey", "greetings"];
    const lowerCaseMessage = message.toLowerCase();

    if (greetings.some(g => lowerCaseMessage.includes(g))) {
      return "Hello! I am here to assist you with your fund request.";
    } else {
      return "I can help with fund requests. Please let me know if you need to create a new request.";
    }
  };

  // Show a loading indicator while Firebase is initializing
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3">Loading application...</span>
      </div>
    );
  }

  // Render the main application UI
  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-gray-100">
      <div className="w-full max-w-2xl bg-gray-800 text-white p-6 rounded-t-2xl flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944c-1.255 0-2.51.139-3.72.416M6.924 18.22C4.168 16.572 2 13.568 2 10.5a10 10 0 0110-10c2.973 0 5.761 1.093 7.844 2.923" />
          </svg>
          <h1 className="text-2xl font-semibold">FundFinder</h1>
        </div>
        {userId && (
            <span className="text-sm font-mono text-gray-300">ID: {userId}</span>
        )}
      </div>
      
      {/* Main chat interface */}
      <div className="w-full max-w-2xl p-6 bg-white rounded-b-2xl shadow-lg flex flex-col h-[70vh]">
        {/* Chat messages display area */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-lg bg-gray-50 mb-4">
          {chatMessages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-xl shadow-md ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        {/* User input form */}
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 transform rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
