import React, { useState, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { analyzeApi } from '../services/api';

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C++', 'PHP'];

const IMPACT_COLORS = {
  'improved': '#1D9E75',
  'same': '#BA7517',
  'degraded': '#D85A30'
};

export default function ComparisonPage() {
  const [originalCode, setOriginalCode] = useState('');
  const [refactoredCode, setRefactoredCode] = useState('');
  const [language, setLanguage] = useState('JavaScript');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Memoize code change handlers for responsive cursor
  const handleOriginalCodeChange = useCallback((val) => {
    setOriginalCode(val || '');
  }, []);

  const handleRefactoredCodeChange = useCallback((val) => {
    setRefactoredCode(val || '');
  }, []);

  const compare = async () => {
    if (!originalCode.trim() || !refactoredCode.trim()) {
      toast.error('Both code snippets are required!');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data } = await analyzeApi.compare(originalCode, refactoredCode, language);
      setResult(data);
      toast.success('Comparison complete!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  const swapCode = () => {
    const temp = originalCode;
    setOriginalCode(refactoredCode);
    setRefactoredCode(temp);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 120px)' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <select value={language} onChange={e => setLanguage(e.target.value)} style={{
          background: '#1a1a24', color: '#ccc', border: '1px solid #2a2a3a',
          borderRadius: '8px', padding: '8px 12px', fontSize: '13px'
        }}>
          {LANGUAGES.map(l => <option key={l}>{l}</option>)}
        </select>

        <button onClick={swapCode} style={{
          padding: '8px 14px', background: '#7F77DD', border: 'none', borderRadius: '8px',
          color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '13px'
        }}>
          ⇄ Swap
        </button>

        <button onClick={compare} disabled={loading} style={{
          marginLeft: 'auto', padding: '10px 20px', borderRadius: '8px', border: 'none',
          fontWeight: 700, fontSize: '14px', background: loading ? '#333' : '#FF6B9D',
          color: 'white', cursor: loading ? 'not-allowed' : 'pointer'
        }}>
          {loading ? '⟳ Comparing...' : '🔀 Compare Code'}
        </button>
      </div>

      {/* Main Content: Editors + Results */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* Left: Editors */}
        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '12px', minHeight: 0 }}>
          {/* Original */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              📄 Original Code
            </div>
            <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid #2a2a3a' }}>
              <Editor
                height="100%"
                language={language.toLowerCase()}
                value={originalCode}
                onChange={handleOriginalCodeChange}
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
          </div>

          {/* Refactored */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ✨ Refactored Code
            </div>
            <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid #2a2a3a' }}>
              <Editor
                height="100%"
                language={language.toLowerCase()}
                value={refactoredCode}
                onChange={handleRefactoredCodeChange}
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
          </div>
        </div>
        </div>

        {/* Right: Results */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#15151c', borderRadius: '12px', border: '1px solid #2a2a3a', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #2a2a3a', fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>
            comparison results · {language}
            {result?.durationMs && <span style={{ marginLeft: '8px', color: '#1D9E75' }}>{result.durationMs}ms</span>}
          </div>

          {!result ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555', gap: '12px', padding: '2rem' }}>
              <span style={{ fontSize: '48px' }}>✦</span>
              <p style={{ fontSize: '14px', textAlign: 'center' }}>Compare code to see analysis here</p>
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
              <div style={{ overflowY: 'auto', height: '100%', padding: '1rem' }}>
                {/* Impact Badges */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  {[
                    ['Readability', result.result?.readabilityImpact],
                    ['Performance', result.result?.performanceImpact],
                    ['Security', result.result?.securityImpact]
                  ].map(([label, impact]) => impact && (
                    <div key={label} style={{
                      background: IMPACT_COLORS[impact] + '20',
                      border: `1px solid ${IMPACT_COLORS[impact]}`,
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: IMPACT_COLORS[impact]
                    }}>
                      {label}: <span style={{ textTransform: 'uppercase' }}>{impact}</span>
                    </div>
                  ))}
                </div>

                {/* Complexity Change */}
                {result.result?.complexityChange && (
                  <div style={{ 
                    background: '#1a1a24', borderRadius: '8px', padding: '10px', 
                    marginBottom: '12px', fontSize: '12px', color: '#ccc',
                    borderLeft: '3px solid #FF6B9D'
                  }}>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>COMPLEXITY</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{result.result.complexityChange}</div>
                  </div>
                )}

                {/* Summary */}
                {result.result?.summary && (
                  <div style={{ 
                    background: '#1a1a24', borderRadius: '8px', padding: '10px', 
                    marginBottom: '12px', fontSize: '12px', color: '#ccc',
                    lineHeight: 1.5
                  }}>
                    <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px' }}>SUMMARY</div>
                    {result.result.summary}
                  </div>
                )}

                {/* Improvements */}
                {result.result?.improvements?.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#1D9E75', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ✅ Improvements ({result.result.improvements.length})
                    </div>
                    {result.result.improvements.map((imp, i) => (
                      <div key={i} style={{ 
                        background: '#1a1a24', borderRadius: '6px', padding: '8px 10px', marginBottom: '4px',
                        borderLeft: '3px solid #1D9E75', fontSize: '12px', color: '#ccc'
                      }}>
                        {imp}
                      </div>
                    ))}
                  </div>
                )}

                {/* Removed Code */}
                {result.result?.removedCode?.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#D85A30', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      🗑️ Removed Code ({result.result.removedCode.length})
                    </div>
                    {result.result.removedCode.map((code, i) => (
                      <div key={i} style={{
                        background: '#1a1a24', borderRadius: '6px', padding: '6px 8px', marginBottom: '4px',
                        borderLeft: '3px solid #D85A30', fontSize: '11px', color: '#999',
                        fontFamily: 'monospace', overflow: 'auto'
                      }}>
                        {code}
                      </div>
                    ))}
                  </div>
                )}

                {/* New Code */}
                {result.result?.newCode?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#1D9E75', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      ✨ New Code ({result.result.newCode.length})
                    </div>
                    {result.result.newCode.map((code, i) => (
                      <div key={i} style={{
                        background: '#1a1a24', borderRadius: '6px', padding: '6px 8px', marginBottom: '4px',
                        borderLeft: '3px solid #1D9E75', fontSize: '11px', color: '#ccc',
                        fontFamily: 'monospace', overflow: 'auto'
                      }}>
                        {code}
                      </div>
                    ))}
                  </div>
                )}

                {result.cached && (
                  <div style={{ fontSize: '10px', color: '#555', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #2a2a3a' }}>
                    ⚡ Cached result
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
