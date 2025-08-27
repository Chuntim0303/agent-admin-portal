// src/App.tsx
import React from "react";
import AgentReview from "./pages/AgentReview";

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
      </header>
      <main className="p-6">
        <AgentReview />
      </main>
    </div>
  );
};

export default App;
