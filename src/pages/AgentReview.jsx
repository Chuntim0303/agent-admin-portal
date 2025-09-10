import React, { useEffect, useState, useMemo } from "react";

// Your Lambda API endpoint
const API_BASE = "https://ruthz37va6.execute-api.ap-southeast-1.amazonaws.com/dev";

const AgentReview = () => {
  // State management
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("all");
  const [showQuickViews, setShowQuickViews] = useState(false);
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // Rejection modal state
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionAgentId, setRejectionAgentId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [applicationNotes, setApplicationNotes] = useState('');
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    application_status: "",
    gender: "",
    user_type: "",
    date_range: ""
  });

  // Predefined rejection reasons
  const rejectionReasons = [
    'Incomplete documentation',
    'Invalid identification documents',
    'Insufficient experience/qualifications',
    'Failed background check',
    'Duplicate application',
    'Does not meet minimum requirements',
    'Invalid contact information',
    'Missing required certifications',
    'Application submitted incorrectly'
  ];

  // Editable fields configuration
  const editableFields = [
    { key: 'full_name', label: 'Full Name', type: 'text', required: true },
    { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female'], required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Phone', type: 'text', required: true },
    { key: 'national_id', label: 'National ID', type: 'text', required: true },
    { key: 'address', label: 'Address', type: 'text', required: false },
    { key: 'addr_line2', label: 'Address Line 2', type: 'text', required: false },
    { key: 'city', label: 'City', type: 'text', required: false },
    { key: 'state', label: 'State', type: 'text', required: false },
    { key: 'postcode', label: 'Postcode', type: 'text', required: false },
    { key: 'tax', label: 'Tax', type: 'text', required: false },
    { key: 'bank', label: 'Bank', type: 'text', required: false },
    { key: 'account', label: 'Account', type: 'text', required: false },
    { key: 'agent_code', label: 'Agent Code', type: 'text', required: false },
    { key: 'user_type', label: 'User Type', type: 'text', required: false },
    { key: 'upline_email', label: 'Upline Email', type: 'email', required: false },
    { key: 'referred_by', label: 'Referred By', type: 'text', required: false }
  ];

  // View presets with professional icons
  const viewPresets = [
    {
      name: "all",
      description: "All Agents",
      filters: {},
      icon: "▣",
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
      icon: "✓",
      color: "bg-green-500"
    },
    {
      name: "rejected",
      description: "Rejected",
      filters: { application_status: "rejected" },
      icon: "✗",
      color: "bg-red-500"
    },
    {
      name: "male",
      description: "Male Agents",
      filters: { gender: "male" },
      icon: "♂",
      color: "bg-indigo-500"
    },
    {
      name: "female",
      description: "Female Agents",
      filters: { gender: "female" },
      icon: "♀",
      color: "bg-pink-500"
    },
    {
      name: "recent",
      description: "Last 7 Days",
      filters: { date_range: "7days" },
      icon: "📅",
      color: "bg-purple-500"
    }
  ];

  // Column configuration
  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'full_name', label: 'Full Name', sortable: true },
    { key: 'gender', label: 'Gender', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'national_id', label: 'National ID', sortable: true },
    { key: 'address', label: 'Address', sortable: false },
    { key: 'addr_line2', label: 'Address Line 2', sortable: false },
    { key: 'city', label: 'City', sortable: true },
    { key: 'state', label: 'State', sortable: true },
    { key: 'postcode', label: 'Postcode', sortable: true },
    { key: 'tax', label: 'Tax', sortable: true },
    { key: 'bank', label: 'Bank', sortable: true },
    { key: 'account', label: 'Account', sortable: true },
    { key: 'agent_code', label: 'Agent Code', sortable: true },
    { key: 'user_type', label: 'User Type', sortable: true },
    { key: 'upline_email', label: 'Upline Email', sortable: true },
    { key: 'referred_by', label: 'Referred By', sortable: true },
    { key: 'icfront_s3', label: 'IC Front', sortable: false },
    { key: 'icback_s3', label: 'IC Back', sortable: false }
  ];

  // Load agents data
  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/admin/agents`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error("Error fetching agents:", error);
      alert("Failed to fetch agents data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Apply view preset
  const applyView = (viewName) => {
    setCurrentView(viewName);
    const view = viewPresets.find(v => v.name === viewName);
    
    // Reset all filters first
    const resetFilters = {
      search: "",
      application_status: "",
      gender: "",
      user_type: "",
      date_range: ""
    };
    
    if (view && view.filters) {
      setFilters({ ...resetFilters, ...view.filters });
    } else {
      setFilters(resetFilters);
    }
    
    setShowQuickViews(false);
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      search: "",
      application_status: "",
      gender: "",
      user_type: "",
      date_range: ""
    });
    setCurrentView("all");
    setSortConfig({ key: null, direction: 'asc' });
  };

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filtered agents based on current filters
  const filteredAgents = useMemo(() => {
    let filtered = agents.filter(agent => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableFields = [
          agent.full_name,
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

      // Gender filter
      if (filters.gender && filters.gender !== agent.gender) {
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

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Handle null/undefined values
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';
        
        // Convert to lowercase for string comparison
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [agents, filters, sortConfig]);

  // Get unique values for filter dropdowns
  const getUniqueValues = (field) => {
    const values = agents
      .map(agent => agent[field])
      .filter(Boolean);
    return [...new Set(values)].sort();
  };

  // Calculate counts for each view
  const getViewCount = (viewName) => {
    if (viewName === "all") return agents.length;
    
    return agents.filter(agent => {
      switch (viewName) {
        case "pending":
          return agent.application_status === "pending";
        case "approved":
          return agent.application_status === "approved";
        case "rejected":
          return agent.application_status === "rejected";
        case "male":
          return agent.gender === "male";
        case "female":
          return agent.gender === "female";
        case "recent":
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return new Date(agent.created_at) > weekAgo;
        default:
          return false;
      }
    }).length;
  };

  // Edit modal functions
  const openEditModal = (agent) => {
    setEditingAgent(agent);
    
    // Initialize form data with current agent data
    const formData = {};
    editableFields.forEach(field => {
      formData[field.key] = agent[field.key] || '';
    });
    setEditFormData(formData);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingAgent(null);
    setEditFormData({});
    setEditLoading(false);
  };

  const handleEditFormChange = (fieldKey, value) => {
    setEditFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const validateEditForm = () => {
    const requiredFields = editableFields.filter(field => field.required);
    
    for (const field of requiredFields) {
      if (!editFormData[field.key] || editFormData[field.key].trim() === '') {
        alert(`${field.label} is required.`);
        return false;
      }
    }

    // Email validation
    const emailFields = editableFields.filter(field => field.type === 'email');
    for (const field of emailFields) {
      const email = editFormData[field.key];
      if (email && email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          alert(`Please enter a valid ${field.label.toLowerCase()}.`);
          return false;
        }
      }
    }

    return true;
  };

  const handleEditSubmit = async () => {
    if (!validateEditForm()) {
      return;
    }

    setEditLoading(true);
    
    // Log the form data being submitted
    console.log("=== EDIT AGENT DEBUG ===");
    console.log("Editing Agent ID:", editingAgent.id);
    console.log("Original Agent Data:", editingAgent);
    console.log("Form Data to Submit:", editFormData);
    
    const requestPayload = {
      id: editingAgent.id,
      ...editFormData,
      updated_by: "admin"
    };
    console.log("Full Request Payload:", requestPayload);
    console.log("API Endpoint:", `${API_BASE}/admin/agents/update`);

    try {
      // Update UI immediately for better UX
      setAgents(prev =>
        prev.map(a =>
          a.id === editingAgent.id
            ? { ...a, ...editFormData, updated_at: new Date().toISOString() }
            : a
        )
      );

      console.log("Making PUT request to update agent...");

      // Call backend API
      const response = await fetch(`${API_BASE}/admin/agents/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload)
      });

      console.log("Response Status:", response.status);
      console.log("Response Headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response Error Text:", errorText);
        
        let errorMessage = "Failed to update agent";
        try {
          const errorJson = JSON.parse(errorText);
          console.error("Parsed Error JSON:", errorJson);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
          if (errorJson.errors && Array.isArray(errorJson.errors)) {
            errorMessage += "\nValidation errors: " + errorJson.errors.join(", ");
          }
        } catch (parseError) {
          console.error("Failed to parse error response as JSON:", parseError);
        }
        
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }

      const result = await response.json();
      console.log("Agent updated successfully - Response:", result);
      console.log("Updated Agent Data:", result.agent);
      
      // Update the agents state with the response data
      setAgents(prev =>
        prev.map(a =>
          a.id === editingAgent.id
            ? result.agent || { ...a, ...editFormData, updated_at: new Date().toISOString() }
            : a
        )
      );
      
      closeEditModal();
      alert("Agent updated successfully!");

    } catch (error) {
      console.error("=== ERROR UPDATING AGENT ===");
      console.error("Error Type:", error.constructor.name);
      console.error("Error Message:", error.message);
      console.error("Error Stack:", error.stack);
      console.error("Full Error Object:", error);
      
      // Revert UI changes on error
      setAgents(prev =>
        prev.map(a =>
          a.id === editingAgent.id
            ? editingAgent // Revert to original data
            : a
        )
      );
      
      alert(`Failed to update agent: ${error.message}`);
    } finally {
      setEditLoading(false);
      console.log("=== END EDIT AGENT DEBUG ===");
    }
  };

  // Rejection modal functions
  const openRejectionModal = (agentId) => {
    setRejectionAgentId(agentId);
    setRejectionReason('');
    setApplicationNotes('');
    setShowRejectionModal(true);
  };

  const closeRejectionModal = () => {
    setShowRejectionModal(false);
    setRejectionAgentId(null);
    setRejectionReason('');
    setApplicationNotes('');
  };

  const handleRejection = async () => {
    if (!rejectionReason) {
      alert('Please select a rejection reason.');
      return;
    }

    await handleAction(rejectionAgentId, 'reject', rejectionReason, applicationNotes);
    closeRejectionModal();
  };

  // Handle approve/reject actions
  const handleAction = async (agentId, action, rejectionReasonText = null, notes = '') => {
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
          rejection_reason: action === "reject" ? rejectionReasonText : undefined,
          application_notes: action === "reject" ? notes : "Application approved"
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

  // Export to CSV
  const exportToCSV = () => {
    if (filteredAgents.length === 0) {
      alert('No data to export');
      return;
    }

    const csvData = filteredAgents.map(agent => ({
      ID: agent.id,
      'Full Name': agent.full_name || '',
      Gender: agent.gender || '',
      Email: agent.email || '',
      Phone: agent.phone || '',
      'National ID': agent.national_id || '',
      Address: agent.address || '',
      'Address Line 2': agent.addr_line2 || '',
      City: agent.city || '',
      State: agent.state || '',
      Postcode: agent.postcode || '',
      Tax: agent.tax || '',
      Bank: agent.bank || '',
      Account: agent.account || '',
      'Agent Code': agent.agent_code || '',
      'User Type': agent.user_type || '',
      'Upline Email': agent.upline_email || '',
      'Referred By': agent.referred_by || '',
      'IC Front S3': agent.icfront_s3 || '',
      'IC Back S3': agent.icback_s3 || ''
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

  // Helper functions
  const truncateText = (text, maxLength = 30) => {
    if (!text) return "N/A";
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <span className="text-gray-300 ml-1">↕</span>;
    }
    return sortConfig.direction === 'asc' ? 
      <span className="text-blue-500 ml-1">↑</span> : 
      <span className="text-blue-500 ml-1">↓</span>;
  };

  const renderS3Link = (s3Url) => {
    if (!s3Url) return "N/A";
    
    if (s3Url.startsWith('http://') || s3Url.startsWith('https://')) {
      return (
        <a 
          href={s3Url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline text-sm"
          title="Click to view document"
        >
          View Document
        </a>
      );
    }
    
    return truncateText(s3Url);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-full px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Agent Management Dashboard</h1>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
          
          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Views Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowQuickViews(!showQuickViews)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  showQuickViews 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">▦</span>
                Quick Views
                <span className="ml-2 text-xs">▼</span>
              </button>
              
              {showQuickViews && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border z-50 max-h-80 overflow-y-auto">
                  {viewPresets.map((view) => {
                    const count = getViewCount(view.name);
                    const isActive = currentView === view.name;

                    return (
                      <button
                        key={view.name}
                        onClick={() => applyView(view.name)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          isActive ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm">{view.icon}</span>
                          <span className={`font-medium ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                            {view.description}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          isActive 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filters Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  showFiltersDropdown 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">⚙</span>
                Show Filters
                <span className="ml-2 text-xs">▼</span>
              </button>
              
              {showFiltersDropdown && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto">
                  <div className="p-4">
                    <div className="space-y-4">
                      {/* Search */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Search
                        </label>
                        <input
                          type="text"
                          placeholder="Name, email, agent code..."
                          value={filters.search}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>

                      {/* Application Status */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Application Status
                        </label>
                        <select
                          value={filters.application_status}
                          onChange={(e) => setFilters(prev => ({ ...prev, application_status: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>

                      {/* Gender */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Gender
                        </label>
                        <select
                          value={filters.gender}
                          onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">All Genders</option>
                          {getUniqueValues('gender').map(gender => (
                            <option key={gender} value={gender}>{gender}</option>
                          ))}
                        </select>
                      </div>

                      {/* User Type */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          User Type
                        </label>
                        <select
                          value={filters.user_type}
                          onChange={(e) => setFilters(prev => ({ ...prev, user_type: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">All Types</option>
                          {getUniqueValues('user_type').map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      {/* Date Range */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Date Range
                        </label>
                        <select
                          value={filters.date_range}
                          onChange={(e) => setFilters(prev => ({ ...prev, date_range: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">All Time</option>
                          <option value="7days">Last 7 days</option>
                          <option value="30days">Last 30 days</option>
                          <option value="90days">Last 90 days</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
                      <button
                        onClick={() => setShowFiltersDropdown(false)}
                        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          resetFilters();
                          setShowFiltersDropdown(false);
                        }}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Export CSV */}
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              disabled={filteredAgents.length === 0}
            >
              <span className="mr-2">↓</span>
              Export CSV
            </button>

            {/* Reset */}
            <button
              onClick={resetFilters}
              className="flex items-center px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <span className="mr-2">↺</span>
              Reset
            </button>

            {/* Refresh */}
            <button
              onClick={fetchAgents}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              <span className="mr-2">↻</span>
              Refresh
            </button>
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Showing <span className="font-bold text-blue-600">{filteredAgents.length}</span> of{' '}
                <span className="font-bold">{agents.length}</span> agents
              </div>
              {currentView !== "all" && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {viewPresets.find(v => v.name === currentView)?.description}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                Edit Agent Profile - {editingAgent.full_name} (ID: {editingAgent.id})
              </h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                disabled={editLoading}
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editableFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {field.type === 'select' ? (
                      <select
                        value={editFormData[field.key] || ''}
                        onChange={(e) => handleEditFormChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={editLoading}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options?.map(option => (
                          <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={editFormData[field.key] || ''}
                        onChange={(e) => handleEditFormChange(field.key, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        disabled={editLoading}
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={editFormData[field.key] || ''}
                        onChange={(e) => handleEditFormChange(field.key, e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={editLoading}
                      />
                    )}
                  </div>
                ))}
              </div>
              
              {/* Non-editable fields for reference */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Read-only Information:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Application Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      editingAgent.application_status === 'approved' ? 'bg-green-100 text-green-800' :
                      editingAgent.application_status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {editingAgent.application_status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>
                    <span className="ml-2">{new Date(editingAgent.created_at).toLocaleDateString()}</span>
                  </div>
                  {editingAgent.icfront_s3 && (
                    <div>
                      <span className="font-medium">IC Front:</span>
                      <span className="ml-2">{renderS3Link(editingAgent.icfront_s3)}</span>
                    </div>
                  )}
                  {editingAgent.icback_s3 && (
                    <div>
                      <span className="font-medium">IC Back:</span>
                      <span className="ml-2">{renderS3Link(editingAgent.icback_s3)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={closeEditModal}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                disabled={editLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                disabled={editLoading}
              >
                {editLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Agent'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md relative">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Reject Application</h3>
                <button
                  onClick={closeRejectionModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Please select a reason for rejection: <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
                    {rejectionReasons.map((reason) => (
                      <label key={reason} className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="radio"
                          name="rejectionReason"
                          value={reason}
                          checked={rejectionReason === reason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Application Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Notes (Optional):
                  </label>
                  <textarea
                    value={applicationNotes}
                    onChange={(e) => setApplicationNotes(e.target.value)}
                    placeholder="Add any additional notes about this rejection..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeRejectionModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejection}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={!rejectionReason}
                >
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="px-6 py-4">
        {filteredAgents.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
            <div className="text-6xl mb-4">📋</div>
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
          <div className="bg-white shadow-lg rounded-lg overflow-hidden relative">            
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-300px)]">
              <table className="min-w-max w-full table-auto">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {columns.map((column) => (
                      <th 
                        key={column.key}
                        className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32 ${
                          column.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
                        }`}
                        onClick={() => column.sortable && handleSort(column.key)}
                      >
                        <div className="flex items-center">
                          {column.label}
                          {column.sortable && getSortIcon(column.key)}
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-64 sticky right-0 bg-gray-50">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAgents.map((agent, index) => (
                    <tr 
                      key={agent.id} 
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                    >
                      {columns.map((column) => (
                        <td key={column.key} className="px-4 py-3 text-sm text-gray-900">
                          {column.key === 'icfront_s3' || column.key === 'icback_s3' ? (
                            renderS3Link(agent[column.key])
                          ) : column.key === 'address' || column.key === 'addr_line2' ? (
                            <span title={agent[column.key] || ""}>
                              {truncateText(agent[column.key])}
                            </span>
                          ) : (
                            <span className={column.key === 'id' ? 'font-medium' : ''}>
                              {agent[column.key] || "N/A"}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium sticky right-0 bg-inherit">
                        <div className="flex space-x-1">
                          {/* Edit Button - Available for all agents */}
                          <button
                            onClick={() => openEditModal(agent)}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-xs font-semibold"
                            title="Edit Agent Profile"
                          >
                            ✏ Edit
                          </button>
                          
                          {/* Approve/Reject buttons - Only for pending agents */}
                          {agent.application_status === "pending" && (
                            <>
                              <button
                                onClick={() => handleAction(agent.id, "approve")}
                                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors text-xs font-semibold"
                                title="Approve Agent"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => openRejectionModal(agent.id)}
                                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors text-xs font-semibold"
                                title="Reject Agent"
                              >
                                ✗ Reject
                              </button>
                            </>
                          )}
                          
                          {/* Status display for non-pending agents */}
                          {agent.application_status !== "pending" && (
                            <span className="text-gray-400 text-xs">
                              {agent.application_status === "approved" ? "✓ Approved" : "✗ Rejected"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Click outside handlers for dropdowns */}
      {(showQuickViews || showFiltersDropdown) && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => {
            setShowQuickViews(false);
            setShowFiltersDropdown(false);
          }}
        />
      )}
    </div>
  );
};

export default AgentReview;