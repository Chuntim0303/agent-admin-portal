import React, { useEffect, useState } from "react";

// Agent interface
export interface Agent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
}

// Your Lambda API endpoint
const API_BASE = "https://vnq7qic97e.execute-api.ap-southeast-1.amazonaws.com/dev/retrieve";

const AgentReview: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(API_BASE)
      .then(res => res.json())
      .then((data: Agent[]) => {
        const agentsWithStatus: Agent[] = data.map(agent => ({
          ...agent,
          status: "pending", // default status
        }));
        setAgents(agentsWithStatus);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching agents:", err);
        setLoading(false);
      });
  }, []);

  const handleAction = (agentId: number, action: "approve" | "reject") => {
    setAgents(prev =>
      prev.map(a =>
        a.id === agentId
          ? { ...a, status: action === "approve" ? "approved" : "rejected" }
          : a
      )
    );

    // Optional: call your backend to update DB and create Cognito account
    /*
    fetch(`https://your-api/users/${action}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ id: agentId })
    }).catch(err => console.error(`Error on ${action}:`, err));
    */
  };

  if (loading) return <p className="text-center mt-8">Loading agents...</p>;

  return (
    <div className="max-w-3xl mx-auto mt-8 space-y-4">
      <h2 className="text-2xl font-bold mb-4 text-center">Agent Review</h2>
      {agents.length === 0 ? (
        <p className="text-center">No agents available</p>
      ) : (
        agents.map(agent => (
          <div
            key={agent.id}
            className={`p-4 border rounded flex justify-between items-center bg-white shadow ${
              agent.status === "approved"
                ? "border-green-500"
                : agent.status === "rejected"
                ? "border-red-500"
                : ""
            }`}
          >
            <div>
              <p className="font-semibold">
                {agent.first_name} {agent.last_name}
              </p>
              <p className="text-sm text-gray-500">{agent.email}</p>
              {agent.status !== "pending" && (
                <p
                  className={`mt-1 text-sm font-bold ${
                    agent.status === "approved" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {agent.status.toUpperCase()}
                </p>
              )}
            </div>
            {agent.status === "pending" && (
              <div className="space-x-2">
                <button
                  onClick={() => handleAction(agent.id, "approve")}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(agent.id, "reject")}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default AgentReview;
