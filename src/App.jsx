// src/App.jsx
import React, { useState } from "react";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

import awsExports from "./aws-exports";
import AgentReview from "./pages/AgentReview";
import Payments from "./pages/Payments";
import Sidebar from "./components/Sidebar";

// Configure Amplify with your generated aws-exports.js
Amplify.configure(awsExports);

function App() {
  const [currentPage, setCurrentPage] = useState("agent-review");

  const navigation = [
    {
      id: "agent-review",
      name: "Agent Review",
      icon: "👤",
      component: <AgentReview />
    },
    {
      id: "payments",
      name: "Payments",
      icon: "💳",
      component: <Payments />
    }
  ];

  const currentPageData = navigation.find(page => page.id === currentPage);

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="min-h-screen bg-gray-100">
          {/* Sidebar - Fixed positioned */}
          <Sidebar
            navigation={navigation}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            user={user}
            signOut={signOut}
          />

          {/* Main content - Account for sidebar width with ml-64 */}
          <main className="ml-64 min-h-screen flex flex-col">
            <header className="bg-white shadow-sm border-b p-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                {currentPageData?.name}
              </h2>
            </header>
                     
            <div className="flex-1 p-6">
              {currentPageData?.component}
            </div>
          </main>
        </div>
      )}
    </Authenticator>
  );
}

export default App;