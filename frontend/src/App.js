import React, { useState, useRef } from "react";
import axios from "axios";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  FileText, 
  CreditCard, 
  PenTool, 
  Upload, 
  Send, 
  Loader2
} from "lucide-react";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";

const SpotlightCard = ({ children, className = "" }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`glass-card ${className}`}
      style={{ "--x": `${position.x}px`, "--y": `${position.y}px` }}
    >
      <div className="spotlight" />
      {children}
    </div>
  );
};

function App() {
  const [file, setFile] = useState(null);
  const [activeMode, setActiveMode] = useState("study");
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  
  const [flashcards, setFlashcards] = useState([]);
  const [topics, setTopics] = useState([]);
  const [mockExam, setMockExam] = useState("");

  const uploadFile = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API_BASE}/upload`, formData);
      setDbReady(true);
      fetchInitialData();
      setResponse("Welcome! Your document is ready. I've analyzed the syllabus and identified key topics for you.");
    } catch (error) {
      setResponse("Error uploading PDF.");
    } finally {
      setUploading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/topics`);
      const data = res.data.topics;
      setTopics(data.topics || []);
    } catch (e) { console.error(e); }
  };

  const askQuestion = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/ask?query=${encodeURIComponent(query)}`);
      setResponse(res.data.answer);
    } catch (error) {
      setResponse("Error getting answer.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    setLoading(true);
    setActiveMode("flashcards");
    try {
      const res = await axios.get(`${API_BASE}/flashcards`);
      const data = res.data.flashcards;
      setFlashcards(Array.isArray(data) ? data : (data.flashcards || []));
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleGenerateMockExam = async () => {
    setLoading(true);
    setActiveMode("mock-exam");
    try {
      const res = await axios.get(`${API_BASE}/mock-exam`);
      setMockExam(res.data.exam);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  return (
    <div className="app-container">
      <div className="bg-grid" />
      <div className="bg-noise" />

      {/* Sidebar Navigation */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="sidebar"
      >
        <div className="sidebar-logo">ExamMaster AI</div>
        
        <nav>
          <NavItem 
            active={activeMode === 'study'} 
            onClick={() => setActiveMode("study")}
            icon={<BookOpen size={20} />}
            label="Study Assistant"
          />
          <NavItem 
            active={activeMode === 'topics'} 
            onClick={() => setActiveMode("topics")}
            icon={<FileText size={20} />}
            label="Topic Tracker"
          />
          <NavItem 
            active={activeMode === 'flashcards'} 
            onClick={() => dbReady ? handleGenerateFlashcards() : alert("Upload PDF first")}
            icon={<CreditCard size={20} />}
            label="Flashcards"
          />
          <NavItem 
            active={activeMode === 'mock-exam'} 
            onClick={() => dbReady ? handleGenerateMockExam() : alert("Upload PDF first")}
            icon={<PenTool size={20} />}
            label="Mock Exam"
          />
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <SpotlightCard className="sidebar-upload">
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
              {dbReady ? "✅ Dataset Active" : "📂 Ready for PDF"}
            </p>
            <input 
              type="file" 
              style={{ display: 'none' }} 
              id="file-upload" 
              onChange={(e) => setFile(e.target.files[0])}
            />
            <motion.label 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              htmlFor="file-upload" 
              className="btn btn-secondary" 
              style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Upload size={14} />
              {file ? file.name.substring(0, 15) + "..." : "Select PDF"}
            </motion.label>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn" 
              style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}
              onClick={uploadFile}
              disabled={!file || uploading}
            >
              {uploading ? <Loader2 className="animate-spin" size={14} /> : "Initialize AI"}
            </motion.button>
          </SpotlightCard>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="main-content" style={{ zIndex: 10 }}>
        <AnimatePresence mode="wait">
          {activeMode === "study" && (
            <motion.div 
              key="study"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="answer-section"
            >
              <header className="header" style={{ textAlign: 'left' }}>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Study Assistant
                </motion.h1>
                <p>AI-powered reasoning on your course material.</p>
              </header>

              <SpotlightCard className="chat-section" style={{ height: '65vh' }}>
                <div className="response-area">
                  {loading ? (
                    <div className="response-placeholder">
                      <Loader2 className="animate-spin" size={40} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                      <p>Deep reasoning in progress...</p>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="answer-content"
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {response || "System initialized. Waiting for prompt..."}
                      </ReactMarkdown>
                    </motion.div>
                  )}
                </div>

                <div className="chat-input-wrapper">
                  <input
                    type="text"
                    className="chat-input"
                    placeholder="Ask anything about the document..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && askQuestion()}
                  />
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn" 
                    style={{ width: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={askQuestion}
                  >
                    <Send size={18} />
                  </motion.button>
                </div>
              </SpotlightCard>
            </motion.div>
          )}

          {activeMode === "topics" && (
            <motion.div 
              key="topics"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="topics-section"
            >
              <header className="header" style={{ textAlign: 'left' }}>
                <h1>Topic Tracker</h1>
                <p>Automated syllabus breakdown for structured learning.</p>
              </header>
              <SpotlightCard>
                <div className="topic-list">
                  {topics.length > 0 ? topics.map((topic, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={i} 
                      className="topic-item"
                    >
                      <input type="checkbox" />
                      <span>{topic}</span>
                    </motion.div>
                  )) : (
                    <p className="response-placeholder">Upload a document to extract chapters.</p>
                  )}
                </div>
              </SpotlightCard>
            </motion.div>
          )}

          {activeMode === "flashcards" && (
            <motion.div 
              key="flashcards"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="flashcards-section"
            >
              <header className="header" style={{ textAlign: 'left' }}>
                <h1>Active Recall Cards</h1>
                <p>Spaced repetition simulator built from your PDF.</p>
              </header>
              <div className="flashcards-grid">
                {loading ? (
                  <div className="response-placeholder" style={{ gridColumn: '1/-1' }}>
                    <Loader2 className="animate-spin" size={40} />
                  </div>
                ) : flashcards.map((card, i) => (
                  <Flashcard key={i} front={card.front} back={card.back} index={i} />
                ))}
              </div>
            </motion.div>
          )}

          {activeMode === "mock-exam" && (
            <motion.div 
              key="exam"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="exam-section"
            >
              <header className="header" style={{ textAlign: 'left' }}>
                <h1>Mock Exam</h1>
                <p>Simulated testing environment with instant feedback potential.</p>
              </header>
              <SpotlightCard className="response-area" style={{ minHeight: '65vh' }}>
                {loading ? (
                   <div className="response-placeholder">
                    <Loader2 className="animate-spin" size={40} />
                    <p>Generating exam papers...</p>
                  </div>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {mockExam}
                  </ReactMarkdown>
                )}
              </SpotlightCard>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

const NavItem = ({ active, onClick, icon, label }) => (
  <motion.div 
    whileHover={{ x: 5 }}
    className={`nav-item ${active ? 'active' : ''}`}
    onClick={onClick}
  >
    {icon}
    <span>{label}</span>
  </motion.div>
);

function Flashcard({ front, back, index }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      className="flashcard-container" 
      onClick={() => setFlipped(!flipped)}
    >
      <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
        <div className="flashcard-front">
          <div className="card-badge">Question</div>
          <p>{front}</p>
        </div>
        <div className="flashcard-back">
          <div className="card-badge" style={{ background: 'var(--accent)' }}>Answer</div>
          <p>{back}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default App;