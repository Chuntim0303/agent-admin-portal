import React, { useEffect, useState, useMemo } from "react";

// Enhanced Agent interface with all database columns
export interface Agent {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string;
  national_id: string;
  application_status: "pending" | "approved" | "rejected";
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  application_notes: string | null;
  documents: string | null;
  bank_account_info: string | null;
  cognito_user_id: string | null;
  cognito_username: string | null;
  user_type: string;
  hierarchy_level: number;
  account_status: "active" | "inactive" | "suspended";
  last_login: string | null;
  agent_code: string | null;
  tier: "bronze" | "silver" | "gold" | "platinum";
  commission_rate: number;
  territory: string | null;
  specializations: string | null;
  certification_level: "basic" | "intermediate" | "advanced" | "expert";
  certification_expiry: string | null;
  performance_metrics: string | null;
  created_at: string;
  updated_at: string;
}

// Filter interface
interface Filters {
  search: string;
  application_status: string;
  account_status: string;
  tier: string;
  territory: string;
  certification_level: string;
  date_range: string;
  user_type: string;
}

// View preset interface
interface ViewPreset {
  name: string;
  description: string;
  filters: Partial<Filters>;
  icon: string;
  color: string;
}

// Your Lambda API endpoint
const API_BASE = "https://vnq7qic97e.execute-api.ap-southeast-1.amazonaws.com/dev";

const AgentReview: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<string>("all");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  // Filter states
  const [filters, setFilters] = useState<Filters>({
    search: "",
    application_status: "",
    account_status: "",
    tier: "",
    territory: "",
    certification_level: "",
    date_range: "",
    user_type: ""
  });

  // Predefined view presets
  const viewPresets: ViewPreset[] = [
    {
      name: "all",
      description: "All Agents",
      filters: {},
      icon: "👥",
      color: "bg-blue-500"
    },
    {
      name: "pending",
      description: "Pending Review",
      filters: { application_status: "pending" },
      icon: "⏳",
      color: "bg-yellow-500"
    },
    {
      name: "approved",
      description: "Approved",
      filters: { application_status: "approved" },
      icon: "✅",
      color: "bg-green-500"
    },
    {
      name: "rejected",
      description: "Rejected",
      filters: { application_status: "rejected" },
      icon: "❌",
      color: "bg-red-500"
    },
    {
      name: "active",
      description: "Active Agents",
      filters: { account_status: "active" },
      icon: "🟢",
      color: "bg-emerald-500"
    },
    {
      name: "high_tier",
      description: "Gold & Platinum",
      filters: { tier: "gold,platinum" },
      icon: "🏆",
      color: "bg-purple-500"
    },
    {
      name: "recent",
      description: "Last 7 Days",
      filters: { date_range: "7days" },
      icon: "📅",
      color: "bg-indigo-500"
    },
    {
      name: "need_attention",
      description: "Need Review",
      filters: { application_status: "pending" },
      icon: "🔍",
      color: "bg-orange-500"
    }
  ];

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/admin/agents`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Agent[] = await response.json();
      setAgents(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching agents:", error);
      setLoading(false);
    }
  };

  // Apply view preset
  const applyView = (viewName: string): void => {
    setCurrentView(viewName);
    const view = viewPresets.find(v => v.name === viewName);
    if (view) {
      setFilters(prev => ({ ...prev, ...view.filters }));
    }
  };

  // Reset all filters
  const resetFilters = (): void => {
    setFilters({
      search: "",
      application_status: "",
      account_status: "",
      tier: "",
      territory: "",
      certification_level: "",
      date_range: "",
      user_type: ""
    });
    setCurrentView("all");
  };

  // Filtered agents based on current filters
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      // Search filter - searches across multiple fields
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableFields = [
          agent.first_name,
          agent.last_name,
          agent.email,
          agent.agent_code || "",
          agent.national_id,
          agent.phone
        ];
        
        const matchesSearch = searchableFields.some(field => 
          field?.toLowerCase().includes(searchTerm)
        );
        
        if (!matchesSearch) return false;
      }

      // Application status filter
      if (filters.application_status && filters.application_status !== agent.application_status) {
        return false;
      }

      // Account status filter
      if (filters.account_status && filters.account_status !== agent.account_status) {
        return false;
      }

      // Tier filter (supports multiple values)
      if (filters.tier) {
        const allowedTiers = filters.tier.split(',');
        if (!allowedTiers.includes(agent.tier)) {
          return false;
        }
      }

      // Territory filter
      if (filters.territory && agent.territory !== filters.territory) {
        return false;
      }

      // Certification level filter
      if (filters.certification_level && filters.certification_level !== agent.certification_level) {
        return false;
      }

      // User type filter
      if (filters.user_type && filters.user_type !== agent.user_type) {
        return false;
      }

      // Date range filter
      if (filters.date_range) {
        const now = new Date();
        const agentDate = new Date(agent.created_at);
        let daysAgo = 0;
        
        switch (filters.date_range) {
          case "7days":
            daysAgo = 7;
            break;
          case "30days":
            daysAgo = 30;
            break;
          case "90days":
            daysAgo = 90;
            break;
          default:
            break;
        }
        
        if (daysAgo > 0) {
          const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
          if (agentDate < cutoffDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [agents, filters]);

  // Get unique values for filter dropdowns
  const getUniqueValues = (field: keyof Agent): string[] => {
    const values = agents
      .map(agent => agent[field])
      .filter(Boolean) as string[];
    return [...new Set(values)].sort();
  };

  // Calculate counts for each view
  const getViewCount = (viewName: string): number => {
    if (viewName === "all") return agents.length;
    
    return agents.filter(agent => {
      switch (viewName) {
        case "pending":
          return agent.application_status === "pending";
        case "approved":
          return agent.application_status === "approved";
        case "rejected":
          return agent.application_status === "rejected";
        case "active":
          return agent.account_status === "active";
        case "high_tier":
          return agent.tier === "gold" || agent.tier === "platinum";
        case "recent":
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return new Date(agent.created_at) > weekAgo;
        case "need_attention":
          return agent.application_status === "pending";
        default:
          return false;
      }
    }).length;
  };

  const handleAction = async (agentId: number, action: "approve" | "reject"): Promise<void> => {
    try {
      // Update UI immediately for better UX
      setAgents(prev =>
        prev.map(a =>
          a.id === agentId
            ? { 
                ...a, 
                application_status: action === "approve" ? "approved" : "rejected",
                reviewed_at: new Date().toISOString(),
                reviewed_by: "admin"
              }
            : a
        )
      );

      // Call backend API
      const endpoint = action === "approve" ? "approve" : "reject";
      const response = await fetch(`${API_BASE}/admin/agents/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          id: agentId,
          reviewed_by: "admin",
          notes: action === "approve" ? "Application approved" : "Application rejected",
          rejection_reason: action === "reject" ? "Did not meet requirements" : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} agent`);
      }

      const result = await response.json();
      console.log(`Agent ${action}ed successfully:`, result);

    } catch (error) {
      console.error(`Error ${action}ing agent:`, error);
      // Revert UI changes on error
      setAgents(prev =>
        prev.map(a =>
          a.id === agentId
            ? { ...a, application_status: "pending" }
            : a
        )
      );
      alert(`Failed to ${action} agent. Please try again.`);
    }
  };

  // Bulk approve action
  const handleBulkApprove = (): void => {
    const pendingAgents = filteredAgents.filter(a => a.application_status === 'pending');
    if (pendingAgents.length === 0) {
      alert('No pending applications to process.');
      return;
    }
    
    if (confirm(`Approve all ${pendingAgents.length} pending applications?`)) {
      pendingAgents.forEach(agent => handleAction(agent.id, 'approve'));
    }
  };

  // Export to CSV
  const exportToCSV = (): void => {
    const csvData = filteredAgents.map(agent => ({
      ID: agent.id,
      'First Name': agent.first_name,
      'Last Name': agent.last_name,
      Email: agent.email,
      Phone: agent.phone,
      'Application Status': agent.application_status,
      'Account Status': agent.account_status,
      Tier: agent.tier,
      'Agent Code': agent.agent_code || '',
      Territory: agent.territory || '',
      'Commission Rate': agent.commission_rate,
      'Created At': agent.created_at
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => 
        Object.values(row).map(val => `"${val}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agents-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: Agent["application_status"]): string => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-semibold";
    switch (status) {
      case "approved":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "rejected":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
    }
  };

  const getAccountStatusBadge = (status: Agent["account_status"]): string => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-semibold";
    switch (status) {
      case "active":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "suspended":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getTierBadge = (tier: Agent["tier"]): string => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-semibold";
    switch (tier) {
      case "platinum":
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case "gold":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "silver":
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-orange-100 text-orange-800`;
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const truncateText = (text: string | null, maxLength: number = 30): string => {
    if (!text) return "N/A";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Agent Management Dashboard</h2>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showFilters 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔍 {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            🔄 Reset
          </button>
          <button
            onClick={fetchAgents}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Quick View Tabs */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Views</h3>
        <div className="flex flex-wrap gap-3">
          {viewPresets.map((view) => {
            const count = getViewCount(view.name);
            const isActive = currentView === view.name;

            return (
              <button
                key={view.name}
                onClick={() => applyView(view.name)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive
                    ? `${view.color} text-white shadow-md transform scale-105`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                }`}
              >
                <span className="text-lg">{view.icon}</span>
                <span>{view.description}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                  isActive 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                🔍 Search
              </label>
              <input
                type="text"
                placeholder="Name, email, agent code..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Application Status */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                📋 Application Status
              </label>
              <select
                value={filters.application_status}
                onChange={(e) => setFilters(prev => ({ ...prev, application_status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">⏳ Pending</option>
                <option value="approved">✅ Approved</option>
                <option value="rejected">❌ Rejected</option>
              </select>
            </div>

            {/* Account Status */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                👤 Account Status
              </label>
              <select
                value={filters.account_status}
                onChange={(e) => setFilters(prev => ({ ...prev, account_status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Accounts</option>
                <option value="active">🟢 Active</option>
                <option value="inactive">⚫ Inactive</option>
                <option value="suspended">🔴 Suspended</option>
              </select>
            </div>

            {/* Tier */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                🏆 Tier
              </label>
              <select
                value={filters.tier}
                onChange={(e) => setFilters(prev => ({ ...prev, tier: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Tiers</option>
                <option value="bronze">🥉 Bronze</option>
                <option value="silver">🥈 Silver</option>
                <option value="gold">🥇 Gold</option>
                <option value="platinum">💎 Platinum</option>
              </select>
            </div>

            {/* Territory */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                🗺️ Territory
              </label>
              <select
                value={filters.territory}
                onChange={(e) => setFilters(prev => ({ ...prev, territory: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Territories</option>
                {getUniqueValues('territory').map(territory => (
                  <option key={territory} value={territory}>{territory}</option>
                ))}
              </select>
            </div>

            {/* Certification Level */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                🎓 Certification
              </label>
              <select
                value={filters.certification_level}
                onChange={(e) => setFilters(prev => ({ ...prev, certification_level: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                <option value="basic">📚 Basic</option>
                <option value="intermediate">📖 Intermediate</option>
                <option value="advanced">📘 Advanced</option>
                <option value="expert">🎓 Expert</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                📅 Date Range
              </label>
              <select
                value={filters.date_range}
                onChange={(e) => setFilters(prev => ({ ...prev, date_range: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Time</option>
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
              </select>
            </div>

            {/* User Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                👥 User Type
              </label>
              <select
                value={filters.user_type}
                onChange={(e) => setFilters(prev => ({ ...prev, user_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {getUniqueValues('user_type').map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary and Actions */}
      <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Showing <span className="font-bold text-blue-600">{filteredAgents.length}</span> of{' '}
            <span className="font-bold">{agents.length}</span> agents
            {currentView !== "all" && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                📊 {viewPresets.find(v => v.name === currentView)?.description}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            disabled={filteredAgents.length === 0}
          >
            📊 Export CSV
          </button>
          
          <button
            onClick={handleBulkApprove}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            disabled={filteredAgents.filter(a => a.application_status === 'pending').length === 0}
          >
            ✅ Bulk Approve ({filteredAgents.filter(a => a.application_status === 'pending').length})
          </button>
        </div>
      </div>
      
      {/* Table or Empty State */}
      {filteredAgents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No agents found</h3>
          <p className="text-gray-500 mb-6">
            {agents.length === 0 
              ? "No agents have been registered yet." 
              : "No agents match your current filters."
            }
          </p>
          {agents.length > 0 && (
            <button
              onClick={resetFilters}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-max w-full table-auto">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-16">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">First Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">Last Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">DOB</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">National ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">App Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">Submitted At</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">Reviewed At</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">Reviewed By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">Rejection Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">Notes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">Documents</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">Bank Info</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">User Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-20">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">Account Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">Last Login</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">Agent Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-20">Tier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">Commission</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">Territory</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">Specializations</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">Cert Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-24">Cert Expiry</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">Created At</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">Updated At</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32 sticky right-0 bg-gray-50">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAgents.map((agent, index) => (
                  <tr 
                    key={agent.id} 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{agent.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{agent.first_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{agent.last_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{agent.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{agent.phone || "N/A"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900" title={agent.address || ""}>
                      {truncateText(agent.address)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(agent.date_of_birth)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{agent.national_id || "N/A"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={getStatusBadge(agent.application_status)}>
                        {agent.application_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDateTime(agent.submitted_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDateTime(agent.reviewed_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{agent.reviewed_by || "N/A"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900" title={agent.rejection_reason || ""}>
                      {truncateText(agent.rejection_reason)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900" title={agent.application_notes || ""}>
                      {truncateText(agent.application_notes)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900" title={agent.documents || ""}>
                      {truncateText(agent.documents)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900" title={agent.bank_account_info || ""}>
                      {truncateText(agent.bank_account_info)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{agent.user_type}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{agent.hierarchy_level}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={getAccountStatusBadge(agent.account_status)}>
                        {agent.account_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDateTime(agent.last_login)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">{agent.agent_code || "N/A"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={getTierBadge(agent.tier)}>
                        {agent.tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{(agent.commission_rate * 100).toFixed(2)}%</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{agent.territory || "N/A"}</td>
                    <td className="px-4 py-3 text-sm text-gray-900" title={agent.specializations || ""}>
                      {truncateText(agent.specializations)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{agent.certification_level}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(agent.certification_expiry)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDateTime(agent.created_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDateTime(agent.updated_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium sticky right-0 bg-inherit">
                      {agent.application_status === "pending" ? (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleAction(agent.id, "approve")}
                            className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors text-xs font-semibold"
                            title="Approve Agent"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => handleAction(agent.id, "reject")}
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors text-xs font-semibold"
                            title="Reject Agent"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          {agent.application_status === "approved" ? "✓ Done" : "✗ Done"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 py-4">
        Last updated: {new Date().toLocaleString()} • Showing {filteredAgents.length} of {agents.length} agents
      </div>
    </div>
  );
};

export default AgentReview;