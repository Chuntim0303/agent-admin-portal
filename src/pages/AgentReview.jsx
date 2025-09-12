import React, { useEffect, useState, useMemo } from "react";

// Your Lambda API endpoint
const API_BASE = "https://ruthz37va6.execute-api.ap-southeast-1.amazonaws.com/dev";

const AgentReview = () => {
  // State management
  const [agents, setAgents] = useState([]);
  const [salesSupport, setSalesSupport] = useState([]);
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
  
  // Status change modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusChangeAgent, setStatusChangeAgent] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusChangeReason, setStatusChangeReason] = useState('');
  
  // Agreement modal state
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [agreementAgent, setAgreementAgent] = useState(null);
  const [agreementSending, setAgreementSending] = useState(false);
  
  // Approval with PDF modal state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAgent, setApprovalAgent] = useState(null);
  const [approvalPdfFile, setApprovalPdfFile] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  
  // Filter states - UPDATED: search is now separate
  const [searchTerm, setSearchTerm] = useState(""); // NEW: Separate search
  const [filters, setFilters] = useState({
    application_status: "",
    account_status: "",
    gender: "",
    user_type: "",
    sales_support_id: "",
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
    { key: 'referred_by', label: 'Referred By', type: 'text', required: false },
    { key: 'sales_support_id', label: 'Sales Support', type: 'sales_support_select', required: false }
  ];

  // Generate view presets with fixed sales support IDs 1, 2, 3
  const viewPresets = useMemo(() => {
    const baseViews = [
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
        name: "unassigned",
        description: "Unassigned",
        filters: { sales_support_id: "unassigned" },
        icon: "📋",
        color: "bg-gray-500"
      }
    ];

    // Add fixed sales support views for IDs 1, 2, 3
    const salesSupportViews = [
      {
        name: "sales_support_1",
        description: salesSupport.find(ss => ss.id === 1)?.name || "Sales Support 1",
        filters: { sales_support_id: "1" },
        icon: "👤",
        color: "bg-purple-500"
      },
      {
        name: "sales_support_2", 
        description: salesSupport.find(ss => ss.id === 2)?.name || "Sales Support 2",
        filters: { sales_support_id: "2" },
        icon: "👤",
        color: "bg-indigo-500"
      },
      {
        name: "sales_support_3",
        description: salesSupport.find(ss => ss.id === 3)?.name || "Sales Support 3", 
        filters: { sales_support_id: "3" },
        icon: "👤",
        color: "bg-teal-500"
      }
    ];

    return [...baseViews, ...salesSupportViews];
  }, [salesSupport]);

  // Column configuration - UPDATED: sales support moved to front
  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'sales_support_name', label: 'Sales Support', sortable: true }, // MOVED TO FRONT
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
    { key: 'account_status', label: 'Account Status', sortable: true },
    { key: 'agreement_sent', label: 'Agreement Status', sortable: true },
    { key: 'agreement_url', label: 'Agreement URL', sortable: false },
    { key: 'icfront_s3', label: 'IC Front', sortable: false },
    { key: 'icback_s3', label: 'IC Back', sortable: false }
  ];

  // Load data
  useEffect(() => {
    Promise.all([fetchAgents(), fetchSalesSupport()]);
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

  const fetchSalesSupport = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/sales-support`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSalesSupport(data);
    } catch (error) {
      console.error("Error fetching sales support:", error);
    }
  };

  // Apply view preset - UPDATED: search is separate
  const applyView = (viewName) => {
    setCurrentView(viewName);
    const view = viewPresets.find(v => v.name === viewName);
    
    // Reset all filters first
    const resetFilters = {
      application_status: "",
      account_status: "",
      gender: "",
      user_type: "",
      sales_support_id: "",
      date_range: ""
    };
    
    if (view && view.filters) {
      setFilters({ ...resetFilters, ...view.filters });
    } else {
      setFilters(resetFilters);
    }
    
    setShowQuickViews(false);
  };

  // Reset all filters - UPDATED: includes search
  const resetFilters = () => {
    setSearchTerm(""); // NEW: Reset search
    setFilters({
      application_status: "",
      account_status: "",
      gender: "",
      user_type: "",
      sales_support_id: "",
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

  // Filtered agents - UPDATED: search is separate from filters
  const filteredAgents = useMemo(() => {
    let filtered = agents.filter(agent => {
      // Search filter - now separate
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        const searchableFields = [
          agent.full_name,
          agent.email,
          agent.agent_code || "",
          agent.national_id,
          agent.phone,
          agent.sales_support_name || ""
        ];
        
        const matchesSearch = searchableFields.some(field => 
          field?.toLowerCase().includes(searchTermLower)
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

      // Gender filter
      if (filters.gender && filters.gender !== agent.gender) {
        return false;
      }

      // User type filter
      if (filters.user_type && filters.user_type !== agent.user_type) {
        return false;
      }

      // Sales support filter
      if (filters.sales_support_id) {
        if (filters.sales_support_id === "unassigned") {
          if (agent.sales_support_id) return false;
        } else {
          if (filters.sales_support_id != agent.sales_support_id) return false;
        }
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
  }, [agents, searchTerm, filters, sortConfig]); // UPDATED: includes searchTerm

  // Get unique values for filter dropdowns
  const getUniqueValues = (field) => {
    const values = agents
      .map(agent => agent[field])
      .filter(Boolean);
    return [...new Set(values)].sort();
  };

  // Calculate counts for each view - UPDATED for new views
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
        case "unassigned":
          return !agent.sales_support_id;
        default:
          // Handle sales support specific views
          if (viewName.startsWith('sales_support_')) {
            const salesSupportId = viewName.replace('sales_support_', '');
            return agent.sales_support_id && agent.sales_support_id.toString() === salesSupportId;
          }
          return false;
      }
    }).length;
  };

  // PDF file conversion helper
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Approval modal functions
  const openApprovalModal = (agent) => {
    setApprovalAgent(agent);
    setApprovalPdfFile(null);
    setApprovalNotes('Application approved');
    setShowApprovalModal(true);
  };

  const closeApprovalModal = () => {
    setShowApprovalModal(false);
    setApprovalAgent(null);
    setApprovalPdfFile(null);
    setApprovalNotes('');
    setApprovalLoading(false);
  };

  const handlePdfFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file only.');
        event.target.value = '';
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size must be less than 10MB.');
        event.target.value = '';
        return;
      }
      setApprovalPdfFile(file);
    }
  };

  // Handle approval with PDF upload
  const handleApprovalWithPdf = async () => {
    if (!approvalPdfFile) {
      alert('Please select a PDF file to upload.');
      return;
    }

    setApprovalLoading(true);

    try {
      // Convert PDF to base64
      const base64Pdf = await convertFileToBase64(approvalPdfFile);
      
      const requestPayload = {
        id: approvalAgent.id,
        reviewed_by: "admin",
        application_notes: approvalNotes,
        agreement_pdf: base64Pdf,
        agreement_filename: approvalPdfFile.name
      };

      // Update UI immediately for better UX
      setAgents(prev =>
        prev.map(a =>
          a.id === approvalAgent.id
            ? { 
                ...a, 
                application_status: "approved",
                account_status: "active",
                agreement_sent: 1,
                reviewed_at: new Date().toISOString(),
                reviewed_by: "admin"
              }
            : a
        )
      );

      // Call backend API
      const response = await fetch(`${API_BASE}/admin/agents/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error("Failed to approve agent");
      }

      const result = await response.json();
      console.log("Agent approved successfully with PDF:", result);

      closeApprovalModal();
      alert("Agent approved successfully and agreement PDF uploaded!");

    } catch (error) {
      console.error("Error approving agent with PDF:", error);
      
      // Revert UI changes on error
      setAgents(prev =>
        prev.map(a =>
          a.id === approvalAgent.id
            ? { ...a, application_status: "pending" }
            : a
        )
      );
      
      alert("Failed to approve agent. Please try again.");
    } finally {
      setApprovalLoading(false);
    }
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
    
    const requestPayload = {
      id: editingAgent.id,
      ...editFormData,
      updated_by: "admin"
    };

    try {
      // Update UI immediately for better UX
      setAgents(prev =>
        prev.map(a =>
          a.id === editingAgent.id
            ? { 
                ...a, 
                ...editFormData,
                sales_support_name: editFormData.sales_support_id ? 
                  salesSupport.find(ss => ss.id == editFormData.sales_support_id)?.name : null,
                updated_at: new Date().toISOString() 
              }
            : a
        )
      );

      // Call backend API
      const response = await fetch(`${API_BASE}/admin/agents/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to update agent";
        try {
          const errorJson = JSON.parse(errorText);
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
      
      // Update the agents state with the response data
      setAgents(prev =>
        prev.map(a =>
          a.id === editingAgent.id
            ? result.agent || { 
                ...a, 
                ...editFormData,
                sales_support_name: editFormData.sales_support_id ? 
                  salesSupport.find(ss => ss.id == editFormData.sales_support_id)?.name : null,
                updated_at: new Date().toISOString() 
              }
            : a
        )
      );
      
      closeEditModal();
      alert("Agent updated successfully!");

    } catch (error) {
      console.error("Error updating agent:", error);
      
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
    }
  };

  // Status change modal functions
  const openStatusModal = (agent) => {
    setStatusChangeAgent(agent);
    setNewStatus(agent.application_status);
    setStatusChangeReason('');
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setStatusChangeAgent(null);
    setNewStatus('');
    setStatusChangeReason('');
  };

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === statusChangeAgent.application_status) {
      alert('Please select a different status.');
      return;
    }

    if (!statusChangeReason.trim()) {
      alert('Please provide a reason for the status change.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/agents/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: statusChangeAgent.id,
          status: newStatus,
          reason: statusChangeReason,
          updated_by: "admin"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const result = await response.json();
      
      // Update UI
      setAgents(prev =>
        prev.map(a =>
          a.id === statusChangeAgent.id
            ? { ...a, application_status: newStatus, updated_at: new Date().toISOString() }
            : a
        )
      );

      closeStatusModal();
      alert('Status updated successfully!');

    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  // Agreement modal functions
  const openAgreementModal = (agent) => {
    setAgreementAgent(agent);
    setShowAgreementModal(true);
  };

  const closeAgreementModal = () => {
    setShowAgreementModal(false);
    setAgreementAgent(null);
    setAgreementSending(false);
  };

  const handleSendAgreement = async () => {
    setAgreementSending(true);

    try {
      const response = await fetch(`${API_BASE}/admin/agents/send-agreement`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: agreementAgent.id,
          sent_by: "admin"
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send agreement');
      }

      const result = await response.json();
      
      // Update agreement_sent status in UI
      setAgents(prev =>
        prev.map(a =>
          a.id === agreementAgent.id
            ? { ...a, agreement_sent: 1, updated_at: new Date().toISOString() }
            : a
        )
      );
      
      closeAgreementModal();
      alert(`Agreement sent successfully! (${result.file_type || 'PDF document'})`);

    } catch (error) {
      console.error('Error sending agreement:', error);
      alert('Failed to send agreement. Please try again.');
    } finally {
      setAgreementSending(false);
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

  // Handle approve/reject actions (simple approval without PDF)
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

  // Agreement download handler
  const handleAgreementDownload = async (agent) => {
    if (!agent.agreement_url) {
      alert('No agreement available for download.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/agents/agreement-download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: agent.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }

      const result = await response.json();
      
      // Open download URL in new tab
      window.open(result.download_url, '_blank');

    } catch (error) {
      console.error('Error downloading agreement:', error);
      alert('Failed to download agreement. Please try again.');
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
      'Sales Support': agent.sales_support_name || 'Unassigned',
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
      'Application Status': agent.application_status || '',
      'Account Status': agent.account_status || '',
      'Agreement Sent': agent.agreement_sent || 0,
      'Agreement URL': agent.agreement_url || '',
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

  // Render agreement status badge
  const getAgreementStatusBadge = (agreementSent, agreementUrl) => {
    if (agreementSent === 1) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ Sent
        </span>
      );
    } else if (agreementUrl) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          📄 Uploaded
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⏳ Pending
        </span>
      );
    }
  };

  // Get agreement button style based on status
  const getAgreementButtonStyle = (agreementSent) => {
    if (agreementSent === 1) {
      return "inline-flex items-center px-3 py-1.5 border border-green-300 text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors";
    } else {
      return "inline-flex items-center px-3 py-1.5 border border-yellow-300 text-xs font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors";
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getAccountStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'suspended':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Get sales support badge
  const getSalesSupportBadge = (salesSupportName) => {
    if (!salesSupportName) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Unassigned
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {salesSupportName}
      </span>
    );
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
            {/* Search Input - NOW OUTSIDE FILTERS */}
            <div className="flex-1 min-w-80">
              <input
                type="text"
                placeholder="Search agents (name, email, agent code, sales support...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

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

            {/* Filters Dropdown - UPDATED: removed search */}
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
                Filters
                <span className="ml-2 text-xs">▼</span>
              </button>
              
              {showFiltersDropdown && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto">
                  <div className="p-4">
                    <div className="space-y-4">
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

                      {/* Account Status */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Account Status
                        </label>
                        <select
                          value={filters.account_status}
                          onChange={(e) => setFilters(prev => ({ ...prev, account_status: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">All Account Status</option>
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>

                      {/* Sales Support Filter */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Sales Support
                        </label>
                        <select
                          value={filters.sales_support_id}
                          onChange={(e) => setFilters(prev => ({ ...prev, sales_support_id: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">All Sales Support</option>
                          <option value="unassigned">Unassigned</option>
                          {salesSupport.map(ss => (
                            <option key={ss.id} value={ss.id}>{ss.name}</option>
                          ))}
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
              onClick={() => Promise.all([fetchAgents(), fetchSalesSupport()])}
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
              {searchTerm && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  Search: "{searchTerm}"
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* All Modals - keeping existing modal code unchanged */}
      {/* Approval with PDF Modal */}
      {showApprovalModal && approvalAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Approve Agent with Agreement</h3>
                <button
                  onClick={closeApprovalModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  disabled={approvalLoading}
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Agent: <span className="font-semibold">{approvalAgent.full_name}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Email: <span className="font-semibold">{approvalAgent.email}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Agreement PDF: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={approvalLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum file size: 10MB</p>
                  {approvalPdfFile && (
                    <p className="text-sm text-green-600 mt-1">
                      Selected: {approvalPdfFile.name} ({(approvalPdfFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Application Notes:
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Application notes..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    disabled={approvalLoading}
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">What will happen:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Agent status will be set to "Approved"</li>
                    <li>• Cognito user account will be created</li>
                    <li>• PDF agreement will be uploaded to S3</li>
                    <li>• Agreement URL will be saved to database</li>
                    <li>• Agreement status will be marked as "Sent"</li>
                    <li>• Email with credentials will be sent to agent</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeApprovalModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  disabled={approvalLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprovalWithPdf}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                  disabled={approvalLoading || !approvalPdfFile}
                >
                  {approvalLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Approving...
                    </>
                  ) : (
                    'Approve with PDF'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && statusChangeAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Change Application Status</h3>
                <button
                  onClick={closeStatusModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Agent: <span className="font-semibold">{statusChangeAgent.full_name}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Current Status: <span className={getStatusBadge(statusChangeAgent.application_status)}>{statusChangeAgent.application_status}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status: <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Status Change: <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={statusChangeReason}
                    onChange={(e) => setStatusChangeReason(e.target.value)}
                    placeholder="Please provide a reason for this status change..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeStatusModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusChange}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={!newStatus || !statusChangeReason.trim() || newStatus === statusChangeAgent.application_status}
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agreement Modal */}
      {showAgreementModal && agreementAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Send Agreement</h3>
                <button
                  onClick={closeAgreementModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  disabled={agreementSending}
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Agent: <span className="font-semibold">{agreementAgent.full_name}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Email: <span className="font-semibold">{agreementAgent.email}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Current Status: <span className={getStatusBadge(agreementAgent.application_status)}>{agreementAgent.application_status}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Agreement Status: {getAgreementStatusBadge(agreementAgent.agreement_sent, agreementAgent.agreement_url)}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">What will happen:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• PDF agreement will be generated using the official template</li>
                    <li>• Agent's information will be populated in the agreement</li>
                    <li>• Document will be stored in S3</li>
                    <li>• Email with agreement link will be sent to the agent</li>
                    <li>• Agent will be able to download and review the agreement</li>
                    <li>• Agreement status will be marked as "Sent"</li>
                    {agreementAgent?.application_status === "pending" && (
                      <li className="font-medium">• Agreement sent for review before final approval decision</li>
                    )}
                    {agreementAgent?.application_status === "approved" && (
                      <li className="font-medium">• Agent can sign and return the agreement</li>
                    )}
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeAgreementModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  disabled={agreementSending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendAgreement}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                  disabled={agreementSending}
                >
                  {agreementSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Agreement'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal - with sales support selection */}
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
                    ) : field.type === 'sales_support_select' ? (
                      <select
                        value={editFormData[field.key] || ''}
                        onChange={(e) => handleEditFormChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={editLoading}
                      >
                        <option value="">Select Sales Support</option>
                        {salesSupport.map(ss => (
                          <option key={ss.id} value={ss.id}>
                            {ss.name}
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
                    <span className="font-medium">Account Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      editingAgent.account_status === 'active' ? 'bg-green-100 text-green-800' :
                      editingAgent.account_status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {editingAgent.account_status || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Current Sales Support:</span>
                    <span className="ml-2">{getSalesSupportBadge(editingAgent.sales_support_name)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Agreement Status:</span>
                    <span className="ml-2">{getAgreementStatusBadge(editingAgent.agreement_sent, editingAgent.agreement_url)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>
                    <span className="ml-2">{new Date(editingAgent.created_at).toLocaleDateString()}</span>
                  </div>
                  {editingAgent.agreement_url && (
                    <div>
                      <span className="font-medium">Agreement:</span>
                      <button
                        onClick={() => handleAgreementDownload(editingAgent)}
                        className="ml-2 text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        Download PDF
                      </button>
                    </div>
                  )}
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
                : "No agents match your current search or filters."
              }
            </p>
            {(agents.length > 0 || searchTerm) && (
              <button
                onClick={resetFilters}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Clear all filters and search
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
                        className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.width} ${
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-96 sticky right-0 bg-gray-50">
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
                          {column.key === 'icfront_s3' || column.key === 'icback_s3' || column.key === 'agreement_url' ? (
                            renderS3Link(agent[column.key])
                          ) : column.key === 'agreement_sent' ? (
                            getAgreementStatusBadge(agent.agreement_sent, agent.agreement_url)
                          ) : column.key === 'sales_support_name' ? (
                            getSalesSupportBadge(agent.sales_support_name)
                          ) : column.key === 'address' || column.key === 'addr_line2' ? (
                            <span title={agent[column.key] || ""}>
                              {truncateText(agent[column.key])}
                            </span>
                          ) : column.key === 'account_status' ? (
                            <span className={getAccountStatusBadge(agent[column.key])}>
                              {agent[column.key] || 'Unknown'}
                            </span>
                          ) : (
                            <span className={column.key === 'id' ? 'font-medium' : ''}>
                              {agent[column.key] || "N/A"}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium sticky right-0 bg-inherit">
                        <div className="flex flex-wrap gap-2">
                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(agent)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            title="Edit Agent Profile"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          
                          {/* Status Change Button */}
                          <button
                            onClick={() => openStatusModal(agent)}
                            className="inline-flex items-center px-3 py-1.5 border border-indigo-300 text-xs font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            title="Change Status"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Status
                          </button>

                          {/* Agreement Button */}
                          {(agent.application_status === "pending" || agent.application_status === "approved") && (
                            <button
                              onClick={() => openAgreementModal(agent)}
                              className={getAgreementButtonStyle(agent.agreement_sent)}
                              title="Send Agreement"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Agreement
                            </button>
                          )}
                          
                          {/* Approve/Reject buttons - Only for pending agents */}
                          {agent.application_status === "pending" && (
                            <>
                              <button
                                onClick={() => openApprovalModal(agent)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                title="Approve Agent with PDF"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Approve
                              </button>
                              <button
                                onClick={() => openRejectionModal(agent.id)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                title="Reject Agent"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject
                              </button>
                            </>
                          )}
                          
                          {/* Status display for non-pending agents */}
                          {agent.application_status !== "pending" && (
                            <span className={getStatusBadge(agent.application_status)}>
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