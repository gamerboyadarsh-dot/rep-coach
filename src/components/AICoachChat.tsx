import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Paperclip, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { sendChatMessageToCoach, type ChatMessage, fileToBase64 } from '../lib/genAI';

export function AICoachChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hey there! I'm RepCoach AI. Ask me about exercises, upload a workout plan PDF, or send a form check photo!" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;

    let attachmentData;
    if (selectedFile) {
      const base64 = await fileToBase64(selectedFile);
      attachmentData = {
        data: base64,
        mimeType: selectedFile.type,
        fileName: selectedFile.name
      };
    }

    const newUserMsg: ChatMessage = {
      role: 'user',
      text: input,
      attachment: attachmentData
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setSelectedFile(null);
    setIsTyping(true);

    // Gemini API requires the history to start with a 'user' role.
    // Our local messages array starts with a hardcoded 'model' greeting, so we skip it.
    const apiHistory = messages.slice(1);

    const reply = await sendChatMessageToCoach(
      apiHistory, // history without the first model greeting
      newUserMsg.text,
      newUserMsg.attachment ? { data: newUserMsg.attachment.data, mimeType: newUserMsg.attachment.mimeType } : undefined
    );

    setMessages(prev => [...prev, { role: 'model', text: reply }]);
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-indigo-500 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-indigo-600 transition-transform ${isOpen ? 'scale-0' : 'scale-100 hover:scale-110'} z-40`}
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 w-96 h-[500px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right z-50 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2 text-white font-semibold">
            <MessageCircle className="text-indigo-400" size={20} />
            AI Coach
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl p-3 ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'}`}>
                {msg.attachment && (
                  <div className="mb-2 p-2 bg-black/20 rounded-lg flex items-center gap-2 text-xs">
                    {msg.attachment.mimeType.startsWith('image') ? <ImageIcon size={14} className="shrink-0" /> : <FileText size={14} className="shrink-0" />}
                    <span className="truncate">{msg.attachment.fileName || 'Attachment'}</span>
                  </div>
                )}
                {msg.text && <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</p>}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 rounded-xl rounded-bl-none p-4 flex gap-1">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Selected File Preview */}
        {selectedFile && (
          <div className="px-4 py-2 bg-slate-800 border-t border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-300 overflow-hidden">
              {selectedFile.type.startsWith('image') ? <ImageIcon size={16} className="text-indigo-400 shrink-0"/> : <FileText size={16} className="text-indigo-400 shrink-0"/>}
              <span className="truncate">{selectedFile.name}</span>
            </div>
            <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-red-400">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 bg-slate-800 border-t border-slate-700">
          <div className="flex items-end gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1 pr-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg, image/png, application/pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
                e.target.value = ''; // reset
              }}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-indigo-400 transition-colors shrink-0"
              title="Attach Image or PDF"
            >
              <Paperclip size={20} />
            </button>
            <textarea
              className="flex-1 bg-transparent text-white text-sm resize-none outline-none py-2 px-1 min-h-[40px] max-h-[120px]"
              placeholder="Ask me anything..."
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button 
              onClick={handleSend}
              disabled={isTyping || (!input.trim() && !selectedFile)}
              className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors shrink-0 mb-0.5"
            >
              {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
