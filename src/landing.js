import React, { useState, useEffect, useCallback } from 'react';
import logo from '../src/image/landing-image.png'; 

function Landing() {
  const [currentView, setCurrentView] = useState('landing');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeFilter, setActiveFilter] = useState('dashboard'); 

  // Form states
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [escalationType, setEscalationType] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter states
  const [serviceTypeFilter, setServiceTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Chatbot states
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  const userEmail = 'nnamaniuchenna8@gmail.com';
  const userName = 'Uchenna Ikenna Nnamani';

  const fetchData = useCallback(async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'userEmail': userEmail,
          'userName': userName,
          ...options.headers
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    const endpoint = 'https://sathservicedesk-sathservicedesk-staging-dpdaa2a3dkd7e7as.eastus2-01.azurewebsites.net/get-requests';
    try {
      const data = await fetchData(endpoint);
      setRequests(data.requests);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await fetchData('https://sathservicedesk-sathservicedesk-staging-dpdaa2a3dkd7e7as.eastus2-01.azurewebsites.net/get-categories');
      setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setSubmissionStatus({ type: 'error', message: 'Failed to load categories.' });
    }
  }, [fetchData]);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await fetchData('https://sathservicedesk-sathservicedesk-staging-dpdaa2a3dkd7e7as.eastus2-01.azurewebsites.net/conversations');
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, [fetchData]);

  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchRequests();
      fetchCategories();
      fetchConversations();
    }
  }, [currentView, fetchRequests, fetchCategories, fetchConversations]);

  const handleCreateRequestSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
  try {
  // Remove the assignment if not needed
  await fetchData(
    'https://sathservicedesk-sathservicedesk-staging-dpdaa2a3dkd7e7as.eastus2-01.azurewebsites.net/create-request',
    {
      method: 'POST',
      body: JSON.stringify({
        subject,
        content,
        category,
        priority,
        escalation_type: escalationType
      })
    }
  );

      setSubmissionStatus({ type: 'success', message: 'Request successfully created!' });
    
      setSubject('');
      setContent('');
      setCategory('');
      setPriority('');
      setEscalationType('');
   
      fetchRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      setSubmissionStatus({ type: 'error', message: error.message || 'Failed to create request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    
    const newUserMessage = {
      sender: 'user',
      content: userInput,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsChatLoading(true);
    
    try {
      const data = await fetchData(
        'https://sathservicedesk-sathservicedesk-staging-dpdaa2a3dkd7e7as.eastus2-01.azurewebsites.net/bot',
        {
          method: 'POST',
          body: JSON.stringify({
            user: userInput
          })
        }
      );
      
      const botMessage = {
        sender: 'bot',
        content: data.response || "I'm sorry, I couldn't process your request.",
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, botMessage]);
      fetchConversations(); 
    } catch (error) {
      console.error('Error sending message to bot:', error);
      const errorMessage = {
        sender: 'bot',
        content: "Sorry, I'm having trouble responding right now. Please try again later.",
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const startNewConversation = () => {
    setChatMessages([]);
    setActiveConversation(null);
  };

  const deleteConversation = async (conversationId) => {
    try {
      await fetchData(
        `https://sathservicedesk-sathservicedesk-staging-dpdaa2a3dkd7e7as.eastus2-01.azurewebsites.net/delete-conversation/${conversationId}`,
        {
          method: 'DELETE'
        }
      );
      fetchConversations();
      if (activeConversation === conversationId) {
        startNewConversation();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesServiceType = serviceTypeFilter ? request.service_type === serviceTypeFilter : true;
    const matchesStatus = statusFilter ? request.status === statusFilter : true;
    const matchesPriority = priorityFilter ? request.priority === priorityFilter : true;
    return matchesServiceType && matchesStatus && matchesPriority;
  });

  const resetFilters = () => {
    setServiceTypeFilter('');
    setStatusFilter('');
    setPriorityFilter('');
  };

  const UserDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Dashboard Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
            <div className="bg-black text-white px-4 py-2 rounded-md font-bold text-sm shadow-md">
  KOOLBOKS
</div>
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
                <button 
                  onClick={() => setActiveFilter('dashboard')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    activeFilter === 'dashboard' 
                      ? 'bg-white shadow text-blue-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveFilter('requests')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    activeFilter === 'requests' 
                      ? 'bg-white shadow text-blue-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  My Requests
                </button>
              </div>
            </div>
            <button 
              onClick={() => setCurrentView('landing')}
              className="text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeFilter === 'dashboard' ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {userName.split(' ')[0]}!</h1>
              <p className="text-gray-600">Here's what's happening with your service requests.</p>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Service Overview */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Service Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-700">Active Services</span>
                    <span className="font-medium text-blue-600 bg-white px-3 py-1 rounded-full shadow-sm">
                      {requests.filter(r => r.status === 'open').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-gray-700">Pending Requests</span>
                    <span className="font-medium text-yellow-600 bg-white px-3 py-1 rounded-full shadow-sm">
                      {requests.filter(r => r.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-gray-700">Completed</span>
                    <span className="font-medium text-green-600 bg-white px-3 py-1 rounded-full shadow-sm">
                      {requests.filter(r => r.status === 'closed').length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button 
                    onClick={() => setActiveFilter('requests')}
                    className="w-full flex items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
                  >
                    <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    View Service History
                  </button>
                  <button 
                    onClick={() => {
                      setActiveFilter('requests');
                      document.getElementById('create-request-modal').showModal();
                    }}
                    className="w-full flex items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
                  >
                    <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Request New Service
                  </button>
                  <button 
                    onClick={() => setChatbotOpen(true)}
                    className="w-full flex items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
                  >
                    <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Chat with Support
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {requests.slice(0, 3).map((request, index) => (
                    <div key={index} className="flex items-start">
                      <div className={`flex-shrink-0 h-3 w-3 mt-1.5 rounded-full ${
                        request.status === 'open' ? 'bg-green-500' : 
                        request.status === 'closed' ? 'bg-gray-400' : 
                        'bg-yellow-500'
                      }`}></div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{request.subject}</p>
                        <p className="text-xs text-gray-500">
                          {request.status} • {new Date(request.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Requests</h1>
                <p className="text-gray-600">View and manage your service requests</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button 
                  onClick={() => document.getElementById('create-request-modal').showModal()}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create New Request
                </button>
                <button 
                  onClick={() => setChatbotOpen(true)}
                  className="bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-medium px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Support Chat
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-6 border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
              <div className="flex flex-wrap items-center gap-4">
                <div className="w-full sm:w-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                  <select 
                    value={serviceTypeFilter}
                    onChange={(e) => setServiceTypeFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="service request">Service Request</option>
                    <option value="Incident">Incident</option>
                  </select>
                </div>
                <div className="w-full sm:w-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="w-full sm:w-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <button 
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 mt-6 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-red-500">{error}</td>
                      </tr>
                    ) : filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="mt-2 text-sm font-medium">No requests match your filters</p>
                          <button 
                            onClick={resetFilters}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            Clear all filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map(request => (
                        <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">MNTRQ00{request.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{request.subject}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              request.status === 'open' ? 'bg-green-100 text-green-800' : 
                              request.status === 'closed' ? 'bg-gray-100 text-gray-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                              request.priority === 'high' ? 'bg-red-100 text-red-800' : 
                              request.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {request.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(request.created_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Request Modal */}
      <dialog id="create-request-modal" className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Create New Request</h3>
          <button 
            onClick={() => document.getElementById('create-request-modal').close()}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {submissionStatus && (
          <div className={`mb-4 p-3 rounded-lg ${
            submissionStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center">
              {submissionStatus.type === 'success' ? (
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {submissionStatus.message}
            </div>
          </div>
        )}

        <form onSubmit={handleCreateRequestSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Brief description of your request"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.category}>{cat.category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Escalation Type *</label>
              <select
                value={escalationType}
                onChange={(e) => setEscalationType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select type</option>
                <option value="incident">Incident</option>
                <option value="service request">Service Request</option>
              </select>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
              rows="5"
              required
              placeholder="Please provide detailed information about your request..."
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => document.getElementById('create-request-modal').close()}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </dialog>

      {/* Chatbot Modal */}
      {chatbotOpen && (
        <div className="fixed bottom-4 right-4 w-full max-w-md bg-white rounded-xl shadow-2xl z-50 flex flex-col border border-gray-200 overflow-hidden">
          <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-t-xl">
            <h3 className="font-medium flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Support Assistant
            </h3>
            <div className="flex space-x-2">
              <button 
                onClick={() => setChatbotOpen(false)}
                className="text-gray-200 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-4 h-96 overflow-y-auto bg-gray-50">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center max-w-xs">
                  <svg className="mx-auto h-10 w-10 text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <h4 className="font-medium text-gray-700 mb-1">How can I help you today?</h4>
                  <p className="text-sm">Ask me anything about your service requests or IT issues.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {chatMessages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl shadow-sm ${
                        message.sender === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1 text-right">
                        {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 px-4 py-3 rounded-xl rounded-bl-none border border-gray-200 shadow-sm">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="border-t p-4 bg-white">
            <form onSubmit={handleChatSubmit} className="flex space-x-3">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isChatLoading}
              />
              <button
                type="submit"
                disabled={isChatLoading || !userInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
          
          {/* Conversation history sidebar */}
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 transform -translate-x-full p-4 overflow-y-auto shadow-lg rounded-l-xl">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Conversations
              </h4>
              <button 
                onClick={startNewConversation}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New
              </button>
            </div>
            
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No previous conversations</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {conversations.map(conversation => (
                  <li key={conversation.id} className="group">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => (conversation.id)}
                        className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${
                          activeConversation === conversation.id 
                            ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <p className="truncate">{conversation.subject || `Conversation ${conversation.id}`}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {conversation.last_message_time ? 
                            new Date(conversation.last_message_time).toLocaleDateString() : 
                            'No messages'}
                        </p>
                      </button>
                      <button
                        onClick={() => deleteConversation(conversation.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 ml-2 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="bg-black text-white px-4 py-2 rounded-md font-bold text-sm shadow-md">
  KOOLBOKS
</div>
            <div className="text-xs text-gray-600 font-medium tracking-widest">
              LIFE IS KOOL
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iIzAwMCIgY3g9IjIwIiBjeT0iMjAiIHI9IjEuNSIvPjwvZz48L3N2Zz4=')]"></div>
        </div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center min-h-[80vh] py-12">
            {/* Left Content */}
            <div className="w-full lg:w-1/2 mb-12 lg:mb-0">
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100 max-w-lg mx-auto lg:mx-0">
                <h1 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  Unified Service <span className="text-blue-600">Management</span>
                </h1>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Streamline your IT and business services with our comprehensive service desk solution. Get the support you need, when you need it.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => setCurrentView('dashboard')}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Get Started
                  </button>
                  <button 
                    onClick={() => setCurrentView('dashboard')}
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-medium px-8 py-3 rounded-lg transition-colors duration-300"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>

            {/* Right Image Area */}
            <div className="w-full lg:w-1/2">
              <div className="relative max-w-md mx-auto lg:mx-0 lg:ml-auto">
                {/* Replace this div with your actual image */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border-8 border-white transform rotate-1">
                  <div className="aspect-w-16 aspect-h-9 bg-gradient-to-br from-blue-100 to-blue-200">
                    {/* Placeholder for your image - replace with <img> tag */}
                  <img src={logo} alt="" srcset="" />
                  </div>
                  <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-md border border-gray-200">
                    <div className="flex items-center">
                      <div className="bg-green-500 rounded-full p-2 mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">24/7 Support</p>
                        <p className="text-xs text-gray-500">Always available</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-100 rounded-full opacity-50"></div>
                <div className="absolute bottom-0 -left-10 w-20 h-20 bg-yellow-100 rounded-full opacity-50"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return currentView === 'landing' ? <LandingPage /> : <UserDashboard />;
}

export default Landing;