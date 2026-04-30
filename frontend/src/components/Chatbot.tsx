"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am WisdomBot. How can I help you understand Artificial Wisdom today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Show greeting pop-up shortly after entering the site
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen) {
        setShowGreeting(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowGreeting(false); // Hide greeting when opened
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message to UI immediately
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'assistant', content: "I'm having trouble connecting to my servers right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      
      {/* Floating Greeting Bubble */}
      {showGreeting && !isOpen && (
        <div 
          className="glass animate-fade"
          style={{ 
            marginBottom: '15px', 
            padding: '12px 20px', 
            borderRadius: '20px', 
            borderBottomRightRadius: '4px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
          onClick={toggleChat}
        >
          <span style={{ fontSize: '1.2rem' }}>👋</span>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Hello!! Do you want some help?</span>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowGreeting(false); }}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: '5px', display: 'flex', alignItems: 'center' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="glass animate-fade"
          style={{ 
            width: '350px', 
            height: '500px', 
            maxHeight: '80vh',
            marginBottom: '20px', 
            borderRadius: '24px', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            border: '1px solid var(--glass-border)'
          }}
        >
          {/* Chat Header */}
          <div style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'var(--primary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={18} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>WisdomBot</h3>
                <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span> Online
                </span>
              </div>
            </div>
            <button onClick={toggleChat} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px' }}>
              <X size={20} />
            </button>
          </div>

          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: '10px', alignItems: 'flex-end' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={14} color="var(--primary)" />
                  </div>
                )}
                
                <div style={{ 
                  background: msg.role === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
                  padding: '12px 16px', 
                  borderRadius: '16px',
                  borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                  borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                  maxWidth: '80%',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  color: msg.role === 'user' ? 'white' : '#cbd5e1'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                 <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={14} color="var(--primary)" />
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '16px', borderBottomLeftRadius: '4px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                    <span className="dot-typing" style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></span>
                    <span className="dot-typing" style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></span>
                    <span className="dot-typing" style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></span>
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Artificial Wisdom..."
                style={{ flex: 1, padding: '12px 15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                style={{ 
                  background: input.trim() && !isLoading ? 'var(--primary)' : 'rgba(255,255,255,0.1)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '50%', 
                  width: '42px', 
                  height: '42px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  transition: 'background 0.2s'
                }}
              >
                <Send size={18} style={{ marginLeft: '2px' }} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button 
        onClick={toggleChat}
        style={{ 
          width: '60px', 
          height: '60px', 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
          border: 'none', 
          color: 'white', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)',
          transition: 'transform 0.2s',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)'
        }}
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
      </button>

      {/* Animation Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}} />
    </div>
  );
}
