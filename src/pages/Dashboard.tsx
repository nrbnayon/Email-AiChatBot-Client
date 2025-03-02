import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  Mail,
  LogOut,
  RefreshCw,
  Info,
  ChevronDown,
  X,
  Check,
  Sparkles,
  Inbox,
  AlertCircle,
} from "lucide-react";

interface Email {
  id: string;
  date: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
}

interface AIModel {
  id: string;
  name: string;
  developer: string;
  contextWindow: string;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [model, setModel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showEmailDetails, setShowEmailDetails] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(
    "llama-3.1-8b-instant"
  );
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);

  // Define API URL based on environment
  const API_URL =
    import.meta.env.VITE_NODE_ENV === "production"
      ? import.meta.env.VITE_LIVE_API_URL ||
        "https://email-ai-chat-bot-server.vercel.app"
      : import.meta.env.VITE_BASE_API_URL ||
        "https://email-ai-chat-bot-server.vercel.app";

  // Configure axios defaults
  useEffect(() => {
    // Set up axios with token from localStorage
    const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    // Fetch emails on component mount
    fetchEmails();

    // Fetch available AI models
    fetchModels();
  }, []);

  // Fetch available AI models
  const fetchModels = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/api/ai/models`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setAvailableModels(response.data.models);
      }
    } catch (error) {
      console.error("Error fetching AI models:", error);
    }
  };

  const fetchEmails = async (provider?: string) => {
    try {
      setEmailsLoading(true);
      setError(null);
      console.log("Starting email fetch...");

      // Get token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      console.log("Provider:", provider);
      if (provider) {
        setActiveProvider(provider);
      } else if (!activeProvider) {
        if (user?.authProvider) {
          setActiveProvider(user.authProvider);
        } else if (user?.googleAccessToken) {
          setActiveProvider("google");
        } else if (user?.microsoftAccessToken) {
          setActiveProvider("microsoft");
        } else {
          // Fallback
          setActiveProvider("google");
        }
      }

      let response;
      const currentProvider = provider || activeProvider || user?.authProvider;

      if (currentProvider === "google") {
        response = await axios.get(`${API_URL}/api/emails/gmail`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else if (currentProvider === "microsoft") {
        response = await axios.get(`${API_URL}/api/emails/outlook`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        throw new Error("Unknown auth provider");
      }

      if (response.data.success) {
        setEmails(response.data.emails || []);
        console.log(`Loaded ${response.data.emails?.length || 0} emails`);
      } else {
        throw new Error(response.data.message || "Failed to fetch emails");
      }
    } catch (err: any) {
      console.error("Error fetching emails:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch emails. Please try again."
      );
    } finally {
      setEmailsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setResponse("");
      setModel("");

      // Get token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Prepare email data with limited body content to reduce payload size
      const emailsForQuery = emails.map((email) => ({
        id: email.id,
        date: email.date,
        from: email.from,
        to: email.to,
        subject: email.subject,
        snippet: email.snippet,
        // Limit body size to prevent payload issues
        body: email.body?.substring(0, 1000) || "",
      }));

      // Use axios with better error handling
      const response = await axios.post(
        `${API_URL}/api/ai/query`,
        {
          query: query.trim(),
          emails: emailsForQuery,
          model: selectedModel,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 60000, // 60 second timeout
        }
      );

      if (response.data.success) {
        setResponse(response.data.response);
        setModel(response.data.model || selectedModel);
        console.log("Query processed successfully");
      } else {
        throw new Error(response.data.message || "Unknown error occurred");
      }
    } catch (err: any) {
      console.error("Error processing query:", err);
      // Get the detailed error message from the response if available
      const errorMessage =
        err.response?.data?.message || err.response?.data?.error || err.message;
      setError(`Failed to process your query: ${errorMessage}`);
      console.log("Error details:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  // Show email details
  const handleShowEmailDetails = (email: Email) => {
    setSelectedEmail(email);
    setShowEmailDetails(true);
  };

  // Get model name by ID
  const getModelName = (modelId: string): string => {
    const model = availableModels.find((m) => m.id === modelId);
    return model ? model.name : modelId;
  };

  // Check if user has Google authentication
  const hasGoogleAuth =
    !!user?.googleAccessToken || user?.authProvider === "google";

  // Check if user has Microsoft authentication
  const hasMicrosoftAuth =
    !!user?.microsoftAccessToken || user?.authProvider === "microsoft";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Mail className="h-8 w-8 text-indigo-600 mr-2" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Email AI Assistant
            </h1>
          </div>
          <div className="flex items-center">
            <span className="mr-4 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {user?.name || "User"} ({user?.email || "Not logged in"})
            </span>
            <button
              onClick={logout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          {/* Email status */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {emailsLoading
                  ? "Loading emails..."
                  : `${emails.length} Emails loaded`}
              </h2>
              <p className="text-sm text-gray-500">From the last 2 months</p>
            </div>

            {/* Email provider toggle buttons */}
            <div className="flex space-x-2">
              {/* Show Gmail button if user has Google access token */}
              {(user?.googleAccessToken || hasGoogleAuth) && (
                <button
                  onClick={() => fetchEmails("google")}
                  disabled={emailsLoading}
                  className={`inline-flex items-center px-3 py-2 border text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ${
                    activeProvider === "google"
                      ? "bg-indigo-600 text-white border-transparent"
                      : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                  }`}
                >
                  <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24">
                    <path
                      d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.79-1.677-4.184-2.702-6.735-2.702-5.522 0-10 4.478-10 10s4.478 10 10 10c8.396 0 10.249-7.85 9.426-11.748l-9.426 0.082z"
                      fill={activeProvider === "google" ? "#ffffff" : "#4285F4"}
                    />
                  </svg>
                  Gmail
                </button>
              )}

              {/* Show Outlook button if user has Microsoft access token */}
              {(user?.microsoftAccessToken || hasMicrosoftAuth) && (
                <button
                  onClick={() => fetchEmails("microsoft")}
                  disabled={emailsLoading}
                  className={`inline-flex items-center px-3 py-2 border text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ${
                    activeProvider === "microsoft"
                      ? "bg-indigo-600 text-white border-transparent"
                      : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                  }`}
                >
                  <svg className="h-4 w-4 mr-1" viewBox="0 0 23 23">
                    <path
                      fill={
                        activeProvider === "microsoft" ? "#f3f3f3" : "#f3f3f3"
                      }
                      d="M0 0h23v23H0z"
                    />
                    <path
                      fill={
                        activeProvider === "microsoft" ? "#f35325" : "#f35325"
                      }
                      d="M1 1h10v10H1z"
                    />
                    <path
                      fill={
                        activeProvider === "microsoft" ? "#81bc06" : "#81bc06"
                      }
                      d="M12 1h10v10H12z"
                    />
                    <path
                      fill={
                        activeProvider === "microsoft" ? "#05a6f0" : "#05a6f0"
                      }
                      d="M1 12h10v10H1z"
                    />
                    <path
                      fill={
                        activeProvider === "microsoft" ? "#ffba08" : "#ffba08"
                      }
                      d="M12 12h10v10H12z"
                    />
                  </svg>
                  Outlook
                </button>
              )}

              <button
                onClick={() => fetchEmails()}
                disabled={emailsLoading}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${
                    emailsLoading ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Query form */}
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col space-y-4">
                {/* Model selector */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select AI Model
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowModelDropdown(!showModelDropdown)}
                      className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm flex justify-between items-center"
                    >
                      <span>{getModelName(selectedModel)}</span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>

                    {showModelDropdown && (
                      <div
                        className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
                        style={{
                          maxHeight: "200px",
                          overflowY: "auto",
                          scrollbarWidth: "thin",
                          scrollbarColor: "#d1d5db #f3f4f6",
                        }}
                      >
                        {availableModels.map((model) => (
                          <div
                            key={model.id}
                            className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 ${
                              selectedModel === model.id ? "bg-indigo-50" : ""
                            }`}
                            onClick={() => {
                              setSelectedModel(model.id);
                              setShowModelDropdown(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{model.name}</span>
                              <span className="text-xs text-gray-500">
                                {model.developer} • {model.contextWindow}
                              </span>
                            </div>
                            {selectedModel === model.id && (
                              <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                                <Check className="h-4 w-4 text-indigo-600" />
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Query input */}
                <div>
                  <label
                    htmlFor="query"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Your Question
                  </label>
                  <div className="flex">
                    <input
                      id="query"
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask anything about your emails..."
                      className="flex-1 block w-full rounded-md sm:text-sm border border-gray-300 p-4 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={loading || emailsLoading}
                    />
                    <button
                      type="submit"
                      disabled={loading || emailsLoading || !query.trim()}
                      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-1" />
                          Ask
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Response area */}
          {(response || loading || error) && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-gray-900">Response</h3>
                {model && (
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                    Model: {getModelName(model)}
                  </span>
                )}
              </div>

              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  <span className="ml-2 text-sm text-gray-600">
                    Processing your query...
                  </span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {response && (
                <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
                  <p className="text-gray-800 whitespace-pre-line">
                    {response}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Email list */}
          <div className="px-6 py-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Recent Emails
            </h3>
            <div className="overflow-y-auto max-h-60 rounded-md border border-gray-200">
              {emailsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
                  <span className="ml-2 text-sm text-gray-600">
                    Loading emails...
                  </span>
                </div>
              ) : emails.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {emails.slice(0, 5).map((email) => (
                    <li
                      key={email.id}
                      className="py-3 px-4 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <div className="flex justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {email.subject || "(No Subject)"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            From: {email.from} •{" "}
                            {new Date(email.date).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {email.snippet || "(No preview available)"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleShowEmailDetails(email)}
                          className="ml-2 text-indigo-600 hover:text-indigo-800 self-start"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-8 text-center">
                  <Inbox className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No emails loaded yet</p>
                  <button
                    onClick={() => fetchEmails()}
                    className="mt-2 inline-flex items-center px-3 py-1 text-xs font-medium text-indigo-700 hover:text-indigo-900"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Example queries */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Example queries
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                "When was my last meeting?",
                "Find emails from my boss",
                "Summarize my recent project discussions",
                "What's the deadline for my current project?",
                "Find all emails about budget",
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(example)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Email details modal */}
      {showEmailDetails && selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedEmail.subject || "(No Subject)"}
                </h3>
                <button
                  onClick={() => setShowEmailDetails(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4 bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">From:</span>{" "}
                  {selectedEmail.from}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">To:</span> {selectedEmail.to}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Date:</span>{" "}
                  {new Date(selectedEmail.date).toLocaleString()}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close modals */}
      {(showModelDropdown || showEmailDetails) && (
        <div
          className="fixed inset-0 z-40"
          onClick={(e) => {
            e.stopPropagation();
            setShowModelDropdown(false);
            if (showEmailDetails) {
              // Don't close email details when clicking inside the modal
              if (!(e.target as Element).closest(".bg-white")) {
                setShowEmailDetails(false);
              }
            }
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
