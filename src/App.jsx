// src/App.jsx
import React from "react";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import awsExports from "./aws-exports";
import AgentReview from "./pages/AgentReview";

// Configure Amplify with your generated aws-exports.js
Amplify.configure(awsExports);

function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="min-h-screen bg-gray-100">
          <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm">
                👋 Hello, {user?.username || "User"}
              </span>
              <button
                onClick={signOut}
                className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm"
              >
                Sign out
              </button>
            </div>
          </header>
          <main className="p-6">
            <AgentReview />
          </main>
        </div>
      )}
    </Authenticator>
  );
}

export default App;
