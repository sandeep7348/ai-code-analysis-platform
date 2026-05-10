import React, { useState, useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { analyzeApi } from '../services/api';
import { useAnalysisStore } from '../hooks/useStore';

const MODES = [
  { key: 'review', label: '🔍 Review', color: '#7F77DD' },
  { key: 'explain', label: '💡 Explain', color: '#1D9E75' },
  { key: 'refactor', label: '✨ Refactor', color: '#BA7517' },
  { key: 'test', label: '🧪 Generate Tests', color: '#D85A30' },
  { key: 'performance', label: '⚡ Performance', color: '#FF6B9D' }
];

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'PHP'];

export default function EditorPage() {
  const { code, mode, language, result, loading, chatHistory, setCode, setMode, setLanguage, setResult, setLoading, addChat, resetChat } = useAnalysisStore();
  const [chatInput, setChatInput] = useState('');
  const chatRef = useRef(null);
  const analyzeRef = useRef(null);

  const activeMode = MODES.find(m => m.key === mode);

  // Memoize code change handler for responsive cursor
  const handleCodeChange = useCallback((val) => {
    setCode(val || '');
  }, [setCode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter / Cmd+Enter: Run analysis
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        analyzeRef.current?.();
      }
      // Ctrl+Shift+1-4: Switch mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        const modeIndex = parseInt(e.key) - 1;
        if (modeIndex >= 0 && modeIndex < MODES.length) {
          e.preventDefault();
          setMode(MODES[modeIndex].key);
          toast.success(`Mode: ${MODES[modeIndex].label}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const analyze = async () => {
    if (!code.trim()) { toast.error('Paste some code first!'); return; }
    setLoading(true);
    resetChat();
    setResult(null);
    try {
      const { data } = await analyzeApi.analyze(code, mode, language);
      setResult(data);
      addChat('user', `[Code Analysis: ${mode}/${language}]`);
      addChat('assistant', JSON.stringify(data.result));
      if (data.cached) toast.success('Result loaded from cache ⚡');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // Store analyze function in ref for keyboard shortcuts
  useEffect(() => {
    analyzeRef.current = analyze;
  }, [code, mode, language]);

  const sendChat = async () => {
    if (!chatInput.trim() || !result) return;
    const question = chatInput.trim();
    setChatInput('');
    addChat('user', question);

    try {
      const history = chatHistory.filter(h => typeof h.content === 'string');
      const { data } = await analyzeApi.chat(question, history, language);
      addChat('assistant', data.answer);
      setTimeout(() => chatRef.current?.scrollTo(0, 99999), 100);
    } catch {
      toast.error('Chat failed');
    }
  };

  const renderResult = () => {
    if (!result) return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555', gap: '12px' }}>
        <span style={{ fontSize: '48px' }}>✦</span>
        <p style={{ fontSize: '14px' }}>Run an analysis to see AI feedback here</p>
      </div>
    );

    const r = result.result;

    if (mode === 'review' && r.score !== undefined) {
      return (
        <div style={{ overflowY: 'auto', height: '100%', padding: '1rem' }}>
          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#1a1a24', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              border: `4px solid ${r.score >= 75 ? '#1D9E75' : r.score >= 50 ? '#BA7517' : '#D85A30'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: 800, color: '#e8e8f0'
            }}>{r.score}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Quality Score</div>
              <div style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>{r.summary}</div>
              {result.cached && <span style={{ fontSize: '11px', background: '#1D9E7520', color: '#1D9E75', padding: '2px 8px', borderRadius: '4px', marginTop: '6px', display: 'inline-block' }}>⚡ Cached</span>}
            </div>
          </div>

          {/* Metrics */}
          {r.metrics && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {[['Readability', r.metrics.readability, '#7F77DD'], ['Testability', r.metrics.testability, '#1D9E75'], ['Complexity', r.metrics.complexity, '#BA7517']].map(([label, val, color]) => (
                <div key={label} style={{ background: '#1a1a24', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color }}>{val}</div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Issues */}
          {r.issues?.length > 0 && (
            <Section title={`⚠️ Issues (${r.issues.length})`} color="#D85A30">
              {r.issues.map((issue, i) => (
                <Block key={i} color="#D85A30">
                  <strong>{issue.title}</strong>
                  <span style={{ display: 'block', color: '#888', marginTop: '4px', fontSize: '12px' }}>{issue.detail}</span>
                  <span style={{ fontSize: '10px', background: '#D85A3020', color: '#D85A30', padding: '1px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>{issue.severity}</span>
                </Block>
              ))}
            </Section>
          )}

          {/* Positives */}
          {r.positives?.length > 0 && (
            <Section title="✅ Strengths" color="#1D9E75">
              {r.positives.map((p, i) => <Block key={i} color="#1D9E75">{p}</Block>)}
            </Section>
          )}

          {/* Suggestions */}
          {r.suggestions?.length > 0 && (
            <Section title="💡 Suggestions" color="#BA7517">
              {r.suggestions.map((s, i) => <Block key={i} color="#BA7517">{s}</Block>)}
            </Section>
          )}
        </div>
      );
    }

    if (mode === 'performance' && r.score !== undefined) {
      return (
        <div style={{ overflowY: 'auto', height: '100%', padding: '1rem' }}>
          {/* Performance Score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#1a1a24', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              border: `4px solid ${r.score >= 75 ? '#1D9E75' : r.score >= 50 ? '#FF6B9D' : '#D85A30'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: 800, color: '#e8e8f0'
            }}>{r.score}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Performance Score</div>
              <div style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>{r.summary}</div>
              {result.cached && <span style={{ fontSize: '11px', background: '#1D9E7520', color: '#1D9E75', padding: '2px 8px', borderRadius: '4px', marginTop: '6px', display: 'inline-block' }}>⚡ Cached</span>}
            </div>
          </div>

          {/* Complexity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
            <div style={{ background: '#1a1a24', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>TIME COMPLEXITY</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FF6B9D', fontFamily: 'monospace' }}>{r.timeComplexity || 'N/A'}</div>
            </div>
            <div style={{ background: '#1a1a24', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>SPACE COMPLEXITY</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FF6B9D', fontFamily: 'monospace' }}>{r.spaceComplexity || 'N/A'}</div>
            </div>
          </div>

          {/* Performance Metrics */}
          {r.metrics && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {[['Efficiency', r.metrics.efficiency, '#FF6B9D'], ['Scalability', r.metrics.scalability, '#1D9E75'], ['Memory', r.metrics.memoryUsage, '#BA7517']].map(([label, val, color]) => (
                <div key={label} style={{ background: '#1a1a24', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 800, color }}>{val}</div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Bottlenecks */}
          {r.bottlenecks?.length > 0 && (
            <Section title={`🔴 Bottlenecks (${r.bottlenecks.length})`} color="#D85A30">
              {r.bottlenecks.map((bottleneck, i) => (
                <Block key={i} color="#D85A30">
                  <strong>{bottleneck.title}</strong>
                  <span style={{ display: 'block', color: '#888', marginTop: '4px', fontSize: '12px' }}>{bottleneck.detail}</span>
                  <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '10px', background: '#D85A3020', color: '#D85A30', padding: '1px 6px', borderRadius: '4px' }}>Impact: {bottleneck.impact}</span>
                    {bottleneck.lineNumbers && <span style={{ fontSize: '10px', background: '#3a3a4a', color: '#aaa', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>Line: {bottleneck.lineNumbers}</span>}
                  </div>
                </Block>
              ))}
            </Section>
          )}

          {/* Optimizations */}
          {r.optimizations?.length > 0 && (
            <Section title={`✅ Optimizations (${r.optimizations.length})`} color="#1D9E75">
              {r.optimizations.map((opt, i) => (
                <Block key={i} color="#1D9E75">
                  <strong>{opt.suggestion}</strong>
                  <span style={{ display: 'block', color: '#888', marginTop: '4px', fontSize: '12px' }}>{opt.expectedImprovement}</span>
                  <span style={{ fontSize: '10px', background: '#1D9E7520', color: '#1D9E75', padding: '1px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>Difficulty: {opt.difficulty}</span>
                </Block>
              ))}
            </Section>
          )}

          {/* Code Suggestions with Complexity Comparison */}
          {r.codeSuggestions?.length > 0 && (
            <Section title={`⚡ Code Optimizations (${r.codeSuggestions.length})`} color="#7F77DD">
              {r.codeSuggestions.map((suggestion, i) => (
                <div key={i} style={{ background: '#1a1a24', borderRadius: '12px', padding: '14px', marginBottom: '12px', borderLeft: '4px solid #7F77DD' }}>
                  {/* Issue Title */}
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#e8e8f0', marginBottom: '8px' }}>
                    {suggestion.issue}
                  </div>

                  {/* Complexity Comparison */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ background: '#0f0f13', borderRadius: '8px', padding: '8px', borderLeft: '3px solid #D85A30' }}>
                      <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>ORIGINAL</div>
                      <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 800, color: '#D85A30' }}>
                        {suggestion.originalComplexity}
                      </div>
                    </div>
                    <div style={{ background: '#0f0f13', borderRadius: '8px', padding: '8px', borderLeft: '3px solid #1D9E75' }}>
                      <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>OPTIMIZED</div>
                      <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 800, color: '#1D9E75' }}>
                        {suggestion.optimizedComplexity}
                      </div>
                    </div>
                  </div>

                  {/* Improvement Badge */}
                  <div style={{ 
                    display: 'inline-block',
                    background: 'linear-gradient(135deg, #7F77DD20 0%, #1D9E7520 100%)',
                    border: '1px solid #7F77DD',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#7F77DD'
                  }}>
                    ⬇️ {suggestion.improvementPercent}% faster
                  </div>

                  {/* Code Comparison */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', fontWeight: 600 }}>❌ Original Code:</div>
                    <div style={{ 
                      background: '#0f0f13', 
                      borderRadius: '6px', 
                      padding: '8px 10px', 
                      fontSize: '12px', 
                      color: '#999', 
                      fontFamily: 'monospace',
                      maxHeight: '120px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      borderLeft: '3px solid #D85A30'
                    }}>
                      {suggestion.originalCode}
                    </div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', fontWeight: 600 }}>✅ Optimized Code:</div>
                    <div style={{ 
                      background: '#0f0f13', 
                      borderRadius: '6px', 
                      padding: '8px 10px', 
                      fontSize: '12px', 
                      color: '#ccc', 
                      fontFamily: 'monospace',
                      maxHeight: '120px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      borderLeft: '3px solid #1D9E75'
                    }}>
                      {suggestion.optimizedCode}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div style={{ fontSize: '12px', color: '#aaa', lineHeight: 1.5, marginBottom: '8px' }}>
                    <span style={{ color: '#888', fontWeight: 600 }}>Why:</span> {suggestion.explanation}
                  </div>

                  {/* Difficulty */}
                  <span style={{ 
                    fontSize: '10px', 
                    background: suggestion.difficulty === 'easy' ? '#1D9E7520' : suggestion.difficulty === 'medium' ? '#BA751720' : '#D85A3020', 
                    color: suggestion.difficulty === 'easy' ? '#1D9E75' : suggestion.difficulty === 'medium' ? '#BA7517' : '#D85A30', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    Difficulty: {suggestion.difficulty}
                  </span>
                </div>
              ))}
            </Section>
          )}

          {/* Performance Tips */}
          {r.tips?.length > 0 && (
            <Section title="💡 Performance Tips" color="#BA7517">
              {r.tips.map((tip, i) => <Block key={i} color="#BA7517">{tip}</Block>)}
            </Section>
          )}
        </div>
      );
    }

    return (
      <div style={{ padding: '1rem', overflowY: 'auto', height: '100%' }}>
        <div style={{ fontSize: '13px', lineHeight: 1.8, color: '#ccc', whiteSpace: 'pre-wrap' }}>
          {r.text || JSON.stringify(r, null, 2)}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: 'calc(100vh - 120px)' }}>
      {/* Left: Editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {MODES.map(m => (
            <button key={m.key} onClick={() => setMode(m.key)} style={{
              fontSize: '13px', fontWeight: 600, padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
              border: mode === m.key ? 'none' : '1px solid #2a2a3a',
              background: mode === m.key ? m.color : 'transparent',
              color: mode === m.key ? 'white' : '#888', transition: 'all 0.15s'
            }}>{m.label}</button>
          ))}
          <select value={language} onChange={e => setLanguage(e.target.value)} style={{
            marginLeft: 'auto', background: '#1a1a24', color: '#ccc', border: '1px solid #2a2a3a',
            borderRadius: '8px', padding: '6px 10px', fontSize: '13px'
          }}>
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div style={{
          fontSize: '11px',
          color: '#555',
          background: '#0f0f16',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid #2a2a3a'
        }}>
          ⌨️ <strong>Shortcuts:</strong> Ctrl+Enter = Run • Ctrl+Shift+1-5 = Switch Mode
        </div>

        {/* Monaco Editor */}
        <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid #2a2a3a' }}>
          <Editor
            height="100%"
            language={language.toLowerCase()}
            value={code}
            onChange={handleCodeChange}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              minimap: { enabled: false },
              padding: { top: 16 },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              formatOnPaste: false,
              formatOnType: false,
              renderWhitespace: 'none',
              roundedSelection: true,
              smoothScrolling: true,
              cursorBlinking: 'blink',
              cursorStyle: 'line',
              mouseWheelZoom: false
            }}
          />
        </div>

        {/* Run button */}
        <button onClick={analyze} disabled={loading} style={{
          padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '15px',
          background: loading ? '#333' : activeMode.color, color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.15s', fontFamily: "'Syne', sans-serif"
        }}>
          {loading ? '⟳ Analyzing...' : `Run ${activeMode.label}`}
        </button>
      </div>

      {/* Right: Output + Chat */}
      <div style={{ display: 'flex', flexDirection: 'column', background: '#15151c', borderRadius: '12px', border: '1px solid #2a2a3a', overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #2a2a3a', fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>
          ai output · {mode} mode · {language}
          {result?.durationMs && <span style={{ marginLeft: '8px', color: '#1D9E75' }}>{result.durationMs}ms</span>}
        </div>

        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {renderResult()}
        </div>

        {/* Chat */}
        {result && (
          <>
            <div ref={chatRef} style={{ maxHeight: '200px', overflowY: 'auto', borderTop: '1px solid #2a2a3a', padding: '10px 16px' }}>
              {chatHistory.slice(2).map((msg, i) => (
                <div key={i} style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: msg.role === 'user' ? '#7F77DD' : '#1D9E75', fontWeight: 600 }}>
                    {msg.role === 'user' ? 'You' : 'Claude'}
                  </span>
                  <p style={{ fontSize: '13px', color: '#ccc', margin: '2px 0 0', lineHeight: 1.6 }}>{msg.content}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', padding: '10px', borderTop: '1px solid #2a2a3a' }}>
              <input
                value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Ask a follow-up question..."
                style={{ flex: 1, background: '#0f0f13', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '8px 12px', color: '#ccc', fontSize: '13px' }}
              />
              <button onClick={sendChat} style={{ padding: '8px 14px', background: '#1D9E75', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 600 }}>↗</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
      {children}
    </div>
  );
}

function Block({ color, children }) {
  return (
    <div style={{ background: '#1a1a24', borderRadius: '8px', padding: '10px 12px', marginBottom: '6px', borderLeft: `3px solid ${color}`, fontSize: '13px', color: '#ccc' }}>
      {children}
    </div>
  );
}
