/* global chrome */
import React, { useState, useEffect, useRef } from 'react';
import './sidepanel.css';

const OPERATIONS = [
  { id: 'summarize', label: 'Summarize', color: '#5ccb95' },
  { id: 'explain', label: 'Explain', color: '#52a9ff' },
  { id: 'suggest', label: 'Suggest', color: '#f7d060' },
  { id: 'extract', label: 'Extract', color: '#9c7cf3' },
  { id: 'mapper', label: 'Concept Mapper', color: '#ff6b6b' },
  { id: 'factcheck', label: 'Fact Check', color: '#e06c75' },
];

export default function SidePanel() {
  const [messages, setMessages] = useState([{ role: 'ai', content: 'Select text on the page and choose an action below.' }]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOp, setSelectedOp] = useState(OPERATIONS[0]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const clickOut = (e) => dropdownRef.current && !dropdownRef.current.contains(e.target) && setIsOpen(false);
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  const processRequest = async () => {
    setLoading(true);
    try {
      // 1. Get selected text from the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const [{ result: selectedText }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection().toString(),
      });

      if (!selectedText) {
        setMessages(prev => [...prev, { role: 'ai', content: '⚠️ Please select some text on the webpage first.' }]);
        setLoading(false);
        return;
      }

      // Add user message to UI
      setMessages(prev => [...prev, { role: 'user', content: `${selectedOp.label}: "${selectedText.substring(0, 50)}..."` }]);

      // 2. Call your Backend
      const response = await fetch('http://localhost:8080/api/research/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: selectedText, operation: selectedOp.id })
      });

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      
      const data = await response.text();
      setMessages(prev => [...prev, { role: 'ai', content: data }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: `❌ Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`container ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Header */}
      <header>
        <h3>AiBrowse <span>Research</span></h3>
        <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </header>

      {/* Chat Area */}
      <div className="chat-area">
        {messages.map((msg, i) => (
          <div key={i} className={`bubble ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {loading && <div className="bubble ai loading">Analyzing...</div>}
      </div>

      {/* Custom Bottom Bar */}
      <div className="bottom-bar">
        <div className="custom-dropdown" ref={dropdownRef}>
          <div className="trigger" onClick={() => setIsOpen(!isOpen)} style={{ borderColor: selectedOp.color }}>
            <span style={{ color: selectedOp.color }}>{selectedOp.label}</span>
            <span className="arrow">▼</span>
          </div>

          {isOpen && (
            <ul className="menu">
              {OPERATIONS.map(op => (
                <li key={op.id} onClick={() => { setSelectedOp(op); setIsOpen(false); }} style={{ color: op.color }}>
                  {op.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <button className="send-btn" onClick={processRequest} disabled={loading}>
          {loading ? '...' : 'Run Action'}
        </button>
      </div>
    </div>
  );
}


import ReactDOM from 'react-dom/client';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SidePanel />
  </React.StrictMode>
);