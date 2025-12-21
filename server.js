import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Phone, 
  MapPin, 
  MessageSquare, 
  AlertTriangle, 
  User, 
  Settings, 
  Plus, 
  Trash2, 
  Navigation,
  Lock,
  Menu,
  X,
  Send,
  Loader2,
  CheckCircle,
  Siren
} from 'lucide-react';

/* --- CONFIGURATION ---
  The app will attempt to call your local backend. 
  If it fails, it falls back to mock data for demonstration.
*/
const API_BASE_URL = 'http://localhost:3000/api';

/* --- COMPONENTS --- */

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }) => {
  const baseStyles = "px-4 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-rose-600 text-white shadow-lg shadow-rose-200 hover:bg-rose-700 disabled:bg-rose-300",
    secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:bg-gray-100",
    danger: "bg-red-600 text-white shadow-lg shadow-red-200 hover:bg-red-700 animate-pulse-slow",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100"
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, name, type = "text", value, onChange, placeholder, required = false }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
    />
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
    {children}
  </div>
);

/* --- MAIN APP COMPONENT --- */

export default function RakshaApp() {
  const [token, setToken] = useState(localStorage.getItem('raksha_token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('raksha_user') || 'null'));
  const [activeTab, setActiveTab] = useState('home');
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Helper for API calls with Demo Mode fallback
  const apiCall = async (endpoint, method = 'GET', body = null) => {
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Try actual fetch
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
      });

      if (!response.ok) {
        // If 404/500 and we suspect server is down, switch to demo mode logic below
        // otherwise throw specific error
        if (response.status === 404 || response.status === 500) throw new Error("Server Error");
        const errData = await response.json();
        throw new Error(errData.message || 'Request failed');
      }

      const data = await response.json();
      setLoading(false);
      return data;

    } catch (error) {
      console.warn("API Call Failed, attempting fallback/demo mode", error);
      
      // --- DEMO MODE MOCK RESPONSES ---
      // This allows the UI to work in the preview environment without the backend
      setDemoMode(true);
      setLoading(false);
      
      await new Promise(r => setTimeout(r, 600)); // Simulate network delay

      if (endpoint === '/login') {
        if (body.email === 'test@raksha.com') return { token: 'mock-jwt', user_id: '1', message: 'Demo Login' };
        throw new Error("Invalid demo credentials (use test@raksha.com)");
      }
      if (endpoint === '/register') return { message: 'Registered (Demo)', user_id: '1' };
      if (endpoint === '/contacts' && method === 'GET') {
        return [
          { contact_id: 1, contact_name: "Mom", contact_phone: "9876543210", relationship_type: "Parent" },
          { contact_id: 2, contact_name: "Rahul (Brother)", contact_phone: "9123456789", relationship_type: "Sibling" }
        ];
      }
      if (endpoint === '/contacts' && method === 'POST') return { message: 'Contact Added (Demo)', contact_id: Math.random() };
      if (endpoint.includes('/contacts/') && method === 'DELETE') return { message: 'Deleted (Demo)' };
      if (endpoint === '/panic') return { message: "SOS Alert Triggered!", alert_id: 123, notified_contacts: 2 };
      if (endpoint === '/panic/resolve') return { message: "Alert Resolved" };
      if (endpoint === '/chat') return { answer: "This is a demo response from the Legal AI. In a real scenario, I would analyze your legal question using Gemini 1.5 Flash." };
      if (endpoint === '/generate-safe-route') return { path: [{id: 1, latitude: 28.6, longitude: 77.2, weight: 1}, {id: 2, latitude: 28.7, longitude: 77.3, weight: 2}] };
      
      // If we are here, it's a real error
      if (!demoMode) showToast("Backend unreachable. Switched to Demo Mode.", "error");
      return {}; 
    }
  };

  /* --- AUTHENTICATION --- */
  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    try {
      const data = await apiCall('/login', 'POST', { email, password });
      setToken(data.token);
      setUser({ email, id: data.user_id });
      localStorage.setItem('raksha_token', data.token);
      localStorage.setItem('raksha_user', JSON.stringify({ email, id: data.user_id }));
      showToast("Welcome back!");
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const body = Object.fromEntries(formData);
    
    try {
      await apiCall('/register', 'POST', body);
      showToast("Registration successful! Please login.");
      setActiveTab('login'); // Switch to login view
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.clear();
    setActiveTab('home');
  };

  /* --- VIEWS --- */

  if (!token) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4 font-sans">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur">
          <div className="text-center mb-8">
            <div className="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-rose-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Raksha</h1>
            <p className="text-gray-500">Women Safety & Empowerment</p>
            {demoMode && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full mt-2 inline-block">Demo Mode Active</span>}
          </div>

          {activeTab === 'register' ? (
            <form onSubmit={handleRegister}>
              <Input name="name" label="Full Name" placeholder="Jane Doe" required />
              <Input name="email" label="Email" type="email" placeholder="jane@example.com" required />
              <Input name="phone_number" label="Phone" placeholder="+91 98765 43210" required />
              <Input name="password" label="Password" type="password" required />
              <Button type="submit" variant="primary" className="w-full mb-4">Create Account</Button>
              <p className="text-center text-sm text-gray-600">
                Already have an account? <button type="button" onClick={() => setActiveTab('login')} className="text-rose-600 font-semibold hover:underline">Login</button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <Input name="email" label="Email" type="email" placeholder="test@raksha.com" required />
              <Input name="password" label="Password" type="password" placeholder="******" required />
              <Button type="submit" variant="primary" className="w-full mb-4">Login</Button>
              <p className="text-center text-sm text-gray-600">
                New to Raksha? <button type="button" onClick={() => setActiveTab('register')} className="text-rose-600 font-semibold hover:underline">Register</button>
              </p>
            </form>
          )}
        </Card>
      </div>
    );
  }

  // Authenticated Layout
  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-xl text-white transform transition-all animate-in fade-in slide-in-from-top-4 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-rose-600" />
            <span className="font-bold text-lg text-gray-800">Raksha</span>
          </div>
          <div className="flex items-center gap-3">
             {demoMode && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded border">Demo</span>}
            <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {activeTab === 'home' && (
          <HomeScreen 
            user={user} 
            apiCall={apiCall} 
            showToast={showToast} 
            demoMode={demoMode}
          />
        )}
        {activeTab === 'contacts' && <ContactsScreen apiCall={apiCall} showToast={showToast} />}
        {activeTab === 'map' && <MapScreen apiCall={apiCall} />}
        {activeTab === 'chat' && <LegalChatScreen apiCall={apiCall} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe">
        <div className="max-w-md mx-auto flex justify-around p-2">
          <NavButton icon={Shield} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavButton icon={MapPin} label="Route" active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
          <NavButton icon={Siren} label="Contacts" active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} />
          <NavButton icon={MessageSquare} label="Legal AI" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
        </div>
      </nav>
    </div>
  );
}

/* --- SUB-SCREENS --- */

function HomeScreen({ user, apiCall, showToast, demoMode }) {
  const [sosActive, setSosActive] = useState(false);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    // Get location on mount for tracking
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation({ latitude, longitude });
          // Quietly update location to server
          apiCall('/location', 'POST', { latitude, longitude }).catch(() => {}); 
        },
        (err) => console.error("Location access denied")
      );
    }
  }, []);

  const triggerSOS = async () => {
    try {
      const res = await apiCall('/panic', 'POST');
      setSosActive(true);
      showToast(`SOS SENT! Notified ${res.notified_contacts?.length || 0} contacts.`, 'error');
    } catch (err) {
      showToast("Failed to trigger SOS", 'error');
    }
  };

  const resolveSOS = async () => {
    try {
      await apiCall('/panic/resolve', 'POST');
      setSosActive(false);
      showToast("SOS Resolved. Stay safe.");
    } catch (err) {
      showToast("Failed to resolve SOS", 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-rose-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">Hi, {user.email?.split('@')[0]}</h2>
          <p className="text-rose-100 opacity-90">You are protected by Raksha.</p>
        </div>
        <Shield className="absolute -bottom-4 -right-4 w-32 h-32 text-white opacity-10" />
      </div>

      {/* SOS Button Area */}
      <div className="flex flex-col items-center justify-center py-8">
        <button
          onClick={sosActive ? resolveSOS : triggerSOS}
          className={`
            relative w-48 h-48 rounded-full flex flex-col items-center justify-center
            transition-all duration-300 shadow-xl
            ${sosActive 
              ? 'bg-green-500 shadow-green-200 animate-pulse' 
              : 'bg-red-600 shadow-red-200 hover:scale-105 active:scale-95'
            }
          `}
        >
          {sosActive ? (
            <>
              <CheckCircle className="w-16 h-16 text-white mb-2" />
              <span className="text-white font-bold text-lg">I AM SAFE</span>
            </>
          ) : (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-white opacity-20 animate-ping" />
              <AlertTriangle className="w-16 h-16 text-white mb-2" />
              <span className="text-white font-bold text-2xl">SOS</span>
              <span className="text-red-100 text-xs mt-1">TAP FOR HELP</span>
            </>
          )}
        </button>
        <p className="text-gray-500 text-sm mt-6 text-center max-w-xs">
          {sosActive 
            ? "Alert is active. Your live location is being shared with trusted contacts and police."
            : "Pressing SOS will instantly share your live location with trusted contacts."
          }
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg"><Phone className="w-5 h-5 text-blue-600"/></div>
          <div>
            <div className="font-bold text-gray-800">112</div>
            <div className="text-xs text-gray-500">National Helpline</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-lg"><Siren className="w-5 h-5 text-orange-600"/></div>
          <div>
            <div className="font-bold text-gray-800">1091</div>
            <div className="text-xs text-gray-500">Women Helpline</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactsScreen({ apiCall, showToast }) {
  const [contacts, setContacts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await apiCall('/contacts');
      setContacts(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const addContact = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await apiCall('/contacts', 'POST', Object.fromEntries(formData));
      showToast("Contact added");
      setShowAddForm(false);
      loadContacts();
    } catch (err) {
      showToast("Failed to add contact", "error");
    }
  };

  const deleteContact = async (id) => {
    try {
      await apiCall(`/contacts/${id}`, 'DELETE');
      setContacts(prev => prev.filter(c => c.contact_id !== id));
      showToast("Contact removed");
    } catch (err) {
      showToast("Failed to delete", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-gray-800">Trusted Contacts</h2>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-rose-100 text-rose-600 p-2 rounded-lg hover:bg-rose-200 transition-colors"
        >
          {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {showAddForm && (
        <Card className="animate-in slide-in-from-top-4">
          <h3 className="font-semibold mb-4 text-gray-700">Add New Contact</h3>
          <form onSubmit={addContact}>
            <Input name="contact_name" label="Name" placeholder="Mom" required />
            <Input name="contact_phone" label="Phone Number" placeholder="+91..." required />
            <Input name="relationship_type" label="Relationship" placeholder="Parent/Sibling/Friend" required />
            <Button type="submit" className="w-full">Save Contact</Button>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {contacts.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <User className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No contacts added yet.</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div key={contact.contact_id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 w-10 h-10 rounded-full flex items-center justify-center text-purple-600 font-bold">
                  {contact.contact_name[0]}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{contact.contact_name}</h4>
                  <p className="text-xs text-gray-500">{contact.relationship_type} • {contact.contact_phone}</p>
                </div>
              </div>
              <button 
                onClick={() => deleteContact(contact.contact_id)}
                className="text-gray-400 hover:text-red-500 p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LegalChatScreen({ apiCall }) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am your legal assistant. I can help you understand your rights and laws related to women safety in India. Ask me anything.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const data = await apiCall('/chat', 'POST', { question: userMsg });
      setMessages(prev => [...prev, { role: 'bot', text: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I'm having trouble connecting to the legal database right now." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="bg-white p-4 rounded-t-2xl shadow-sm border-b border-gray-100">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-rose-600" />
          Legal Assistant (AI)
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-rose-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'}
            `}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-2 bg-white border-t border-gray-200">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about legal rights..."
            className="w-full pl-4 pr-12 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-rose-600 rounded-full text-white disabled:opacity-50 disabled:bg-gray-400 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

function MapScreen({ apiCall }) {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);

  // Mock inputs for the graph routing since we don't have a real map UI
  const handleGetRoute = async () => {
    setLoading(true);
    try {
      // In a real app, these IDs would come from clicking markers on a map
      const data = await apiCall('/generate-safe-route', 'POST', { startId: 1, endId: 5 });
      setRoute(data.path);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <MapPin className="w-6 h-6 text-rose-600" />
        Safe Route Finder
      </h2>
      
      <Card>
        <div className="space-y-4">
          <div className="flex gap-2 items-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <Navigation className="w-4 h-4 text-blue-600" />
            <p>Finds the safest path avoiding high-crime zones using graph algorithms.</p>
          </div>

          {/* Simulated Map Visualizer */}
          <div className="aspect-video bg-gray-100 rounded-lg relative overflow-hidden flex items-center justify-center border border-gray-200">
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-400 to-transparent"></div>
             
             {loading ? (
               <div className="flex flex-col items-center gap-2">
                 <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
                 <span className="text-xs text-gray-500">Calculating safety weights...</span>
               </div>
             ) : route ? (
               <div className="text-center p-4">
                 <div className="text-green-600 font-bold mb-2">Safe Path Found!</div>
                 <div className="flex items-center justify-center gap-2 text-sm text-gray-600 flex-wrap">
                   <span className="bg-white px-2 py-1 rounded shadow-sm border">Start</span>
                   {route.map((node, i) => (
                     <React.Fragment key={i}>
                       <span className="text-gray-300">→</span>
                       <span className="bg-green-50 px-2 py-1 rounded shadow-sm border border-green-100 text-green-700 text-xs">
                         Zone {node.id}
                       </span>
                     </React.Fragment>
                   ))}
                   <span className="text-gray-300">→</span>
                   <span className="bg-white px-2 py-1 rounded shadow-sm border">Dest</span>
                 </div>
               </div>
             ) : (
               <div className="text-gray-400 text-sm">Select destination to view safe route</div>
             )}
          </div>

          <Button onClick={handleGetRoute} className="w-full">
            Find Safest Route
          </Button>
        </div>
      </Card>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-3">Nearby Safe Zones</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="bg-green-100 p-2 rounded-lg">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-sm">City Police Station #{i}</div>
                <div className="text-xs text-gray-500">0.8 km away • High Safety Rating</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const NavButton = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full py-1 transition-colors ${active ? 'text-rose-600' : 'text-gray-400 hover:text-gray-600'}`}
  >
    <Icon className={`w-6 h-6 mb-1 ${active ? 'fill-current' : ''}`} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);
