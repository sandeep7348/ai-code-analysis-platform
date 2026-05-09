import React, { useEffect, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { historyApi } from '../services/api';
import { useAnalysisStore } from '../hooks/useStore';
import toast from 'react-hot-toast';

const MODE_COLORS = {
  review: '#7F77DD',
  explain: '#1D9E75',
  refactor: '#BA7517',
  test: '#D85A30'
};

export default function HistoryPage() {

  const [analyses, setAnalyses] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedCodes, setExpandedCodes] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [favorites, setFavorites] = useState(new Set(JSON.parse(localStorage.getItem('favorites') || '[]')));
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const { setCode, setMode, setLanguage } = useAnalysisStore();

  const load = async (p = 1) => {

    setLoading(true);

    try {

      const { data } = await historyApi.getHistory(p, 10);

      setAnalyses(data.analyses);

      setPagination(data.pagination);

      setPage(p);

    } catch {

      toast.error('Failed to load history');

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {

    load();

  }, []);

  const deleteItem = async (id) => {

    try {

      await historyApi.deleteAnalysis(id);

      setAnalyses(prev =>
        prev.filter(a => a._id !== id)
      );

      toast.success('Deleted');

    } catch {

      toast.error('Delete failed');

    }
  };

  const toggleCodeExpansion = (id) => {
    setExpandedCodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Code copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy code');
    }
  };

  const reRunAnalysis = (analysis) => {
    setCode(analysis.codeSnippet);
    setMode(analysis.mode);
    setLanguage(analysis.language);
    toast.success('Code loaded in editor. Switch to Editor tab to re-run analysis.');
  };

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
        toast.success('Removed from favorites');
      } else {
        newFavorites.add(id);
        toast.success('Added to favorites');
      }
      localStorage.setItem('favorites', JSON.stringify([...newFavorites]));
      return newFavorites;
    });
  };

  const toggleSelection = (id) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(filteredAnalyses.map(a => a._id)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const bulkDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(`Delete ${selectedItems.size} selected analyses?`)) return;

    try {
      await Promise.all([...selectedItems].map(id => historyApi.deleteAnalysis(id)));
      setAnalyses(prev => prev.filter(a => !selectedItems.has(a._id)));
      setSelectedItems(new Set());
      toast.success(`Deleted ${selectedItems.size} analyses`);
    } catch {
      toast.error('Bulk delete failed');
    }
  };

  const exportSelected = () => {
    const selectedData = filteredAnalyses.filter(a => selectedItems.has(a._id));
    const dataStr = JSON.stringify(selectedData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `codelens-analyses-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast.success('Analyses exported successfully!');
  };

  const filteredAnalyses = analyses.filter(a => {
    const matchesSearch = !searchTerm ||
      a.codeSnippet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.mode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMode = !filterMode || a.mode === filterMode;
    const matchesLanguage = !filterLanguage || a.language === filterLanguage;
    const matchesFavorites = !showOnlyFavorites || favorites.has(a._id);

    return matchesSearch && matchesMode && matchesLanguage && matchesFavorites;
  });

  return (
    <div
      style={{
        fontFamily: "'Syne', sans-serif",
        color: '#e8e8f0'
      }}
    >

      <h1
        style={{
          fontSize: '22px',
          fontWeight: 800,
          marginBottom: '1.5rem'
        }}
      >
        Analysis History
      </h1>

      {loading ? (

        <div
          style={{
            color: '#555',
            textAlign: 'center',
            padding: '3rem'
          }}
        >
          Loading...
        </div>

      ) : analyses.length === 0 ? (

        <div
          style={{
            color: '#555',
            textAlign: 'center',
            padding: '3rem'
          }}
        >
          No analyses yet. Run some code on the Editor page!
        </div>

      ) : (

        <>

          {/* Search and Filter Controls */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '1.5rem',
              alignItems: 'center'
            }}
          >

            <input
              type="text"
              placeholder="Search code, language, or mode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: '1',
                minWidth: '200px',
                padding: '8px 12px',
                background: '#15151c',
                border: '1px solid #2a2a3a',
                borderRadius: '8px',
                color: '#e8e8f0',
                fontSize: '14px'
              }}
            />

            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              style={{
                padding: '8px 12px',
                background: '#15151c',
                border: '1px solid #2a2a3a',
                borderRadius: '8px',
                color: '#e8e8f0',
                fontSize: '14px',
                minWidth: '120px'
              }}
            >
              <option value="">All Modes</option>
              <option value="review">Review</option>
              <option value="explain">Explain</option>
              <option value="refactor">Refactor</option>
              <option value="test">Test</option>
            </select>

            <select
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              style={{
                padding: '8px 12px',
                background: '#15151c',
                border: '1px solid #2a2a3a',
                borderRadius: '8px',
                color: '#e8e8f0',
                fontSize: '14px',
                minWidth: '120px'
              }}
            >
              <option value="">All Languages</option>
              <option value="JavaScript">JavaScript</option>
              <option value="TypeScript">TypeScript</option>
              <option value="Python">Python</option>
              <option value="Go">Go</option>
              <option value="Rust">Rust</option>
              <option value="Java">Java</option>
              <option value="C++">C++</option>
              <option value="PHP">PHP</option>
            </select>

            {(searchTerm || filterMode || filterLanguage) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterMode('');
                  setFilterLanguage('');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#D85A30',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#e8e8f0',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Clear Filters
              </button>
            )}

            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              style={{
                padding: '8px 16px',
                background: showOnlyFavorites ? '#BA7517' : '#15151c',
                border: '1px solid #2a2a3a',
                borderRadius: '8px',
                color: '#e8e8f0',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ⭐ {showOnlyFavorites ? 'Show All' : 'Favorites Only'} ({favorites.size})
            </button>

          </div>

          {/* Bulk Actions */}
          {filteredAnalyses.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '1rem',
                padding: '12px',
                background: '#0f0f16',
                borderRadius: '8px',
                border: '1px solid #2a2a3a'
              }}
            >

              <input
                type="checkbox"
                checked={selectedItems.size === filteredAnalyses.length && filteredAnalyses.length > 0}
                onChange={(e) => e.target.checked ? selectAll() : clearSelection()}
                style={{ margin: 0 }}
              />

              <span style={{ fontSize: '14px', color: '#e8e8f0' }}>
                {selectedItems.size} of {filteredAnalyses.length} selected
              </span>

              {selectedItems.size > 0 && (
                <>
                  <button
                    onClick={clearSelection}
                    style={{
                      padding: '6px 12px',
                      background: '#666',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#e8e8f0',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Clear
                  </button>
                  <button
                    onClick={bulkDelete}
                    style={{
                      padding: '6px 12px',
                      background: '#D85A30',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#e8e8f0',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Delete Selected
                  </button>
                  <button
                    onClick={exportSelected}
                    style={{
                      padding: '6px 12px',
                      background: '#1D9E75',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#e8e8f0',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Export Selected
                  </button>
                </>
              )}

            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >

            {filteredAnalyses.map(a => (

              <div
                key={a._id}
                style={{
                  background: '#15151c',
                  borderRadius: '12px',
                  border: '1px solid #2a2a3a',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >

                  <input
                    type="checkbox"
                    checked={selectedItems.has(a._id)}
                    onChange={() => toggleSelection(a._id)}
                    style={{ margin: 0 }}
                  />

                  <span
                    style={{
                      background: MODE_COLORS[a.mode] + '20',
                      color: MODE_COLORS[a.mode],
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      minWidth: '70px',
                      textAlign: 'center'
                    }}
                  >
                    {a.mode}
                  </span>

                  <span
                    style={{
                      fontSize: '13px',
                      color: '#888',
                      minWidth: '90px'
                    }}
                  >
                    {a.language}
                  </span>

                  {a.score != null && (

                    <span
                      style={{
                        fontSize: '13px',
                        color:
                          a.score >= 75
                            ? '#1D9E75'
                            : a.score >= 50
                            ? '#BA7517'
                            : '#D85A30',
                        fontWeight: 700
                      }}
                    >
                      Score: {a.score}
                    </span>

                  )}

                  <span
                    style={{
                      fontSize: '11px',
                      color: '#666',
                      background: '#0f0f16',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    {a.codeSnippet.split('\n').length} lines • {a.codeSnippet.length} chars
                  </span>

                  {a.cached && (

                    <span
                      style={{
                        fontSize: '11px',
                        color: '#1D9E75'
                      }}
                    >
                      ⚡ cached
                    </span>

                  )}

                  <span
                    style={{
                      fontSize: '12px',
                      color: '#444',
                      marginLeft: 'auto'
                    }}
                  >
                    {new Date(a.createdAt).toLocaleString()}
                  </span>

                  <button
                    onClick={() => deleteItem(a._id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#D85A30',
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '0 4px'
                    }}
                  >
                    ×
                  </button>

                </div>

                <div
                  style={{
                    background: '#0f0f16',
                    border: '1px solid #2a2a3a',
                    borderRadius: '8px',
                    padding: '10px',
                    overflowX: 'auto'
                  }}
                >

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#888', fontWeight: 600 }}>
                      Code Tested ({a.codeSnippet.length} chars • {a.codeSnippet.split('\n').length} lines)
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => toggleFavorite(a._id)}
                        style={{
                          background: 'none',
                          border: '1px solid #2a2a3a',
                          color: favorites.has(a._id) ? '#FFD700' : '#666',
                          cursor: 'pointer',
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: favorites.has(a._id) ? '#FFD70020' : 'transparent'
                        }}
                      >
                        {favorites.has(a._id) ? '★ Favorited' : '☆ Favorite'}
                      </button>
                      <button
                        onClick={() => copyCode(a.codeSnippet)}
                        style={{
                          background: 'none',
                          border: '1px solid #2a2a3a',
                          color: '#1D9E75',
                          cursor: 'pointer',
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#1D9E7520'
                        }}
                      >
                        📋 Copy
                      </button>
                      <button
                        onClick={() => reRunAnalysis(a)}
                        style={{
                          background: 'none',
                          border: '1px solid #2a2a3a',
                          color: '#7F77DD',
                          cursor: 'pointer',
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#7F77DD20'
                        }}
                      >
                        🔄 Re-run
                      </button>
                      <button
                        onClick={() => toggleCodeExpansion(a._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#BA7517',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#BA751720'
                        }}
                      >
                        {expandedCodes.has(a._id) ? 'Collapse' : 'Expand'}
                      </button>
                    </div>
                  </div>

                  <div style={{
                    maxHeight: expandedCodes.has(a._id) ? 'none' : '200px',
                    overflow: expandedCodes.has(a._id) ? 'visible' : 'hidden',
                    position: 'relative'
                  }}>
                    <SyntaxHighlighter
                      language={a.language.toLowerCase()}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: '12px',
                        background: 'transparent',
                        fontSize: '12px',
                        lineHeight: '1.4'
                      }}
                      wrapLines={true}
                      wrapLongLines={true}
                    >
                      {a.codeSnippet}
                    </SyntaxHighlighter>
                    {!expandedCodes.has(a._id) && a.codeSnippet.length > 300 && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '40px',
                        background: 'linear-gradient(transparent, #0f0f16)',
                        display: 'flex',
                        alignItems: 'end',
                        justifyContent: 'center',
                        paddingBottom: '8px'
                      }}>
                        <span style={{ fontSize: '11px', color: '#666' }}>Click expand to see full code</span>
                      </div>
                    )}
                  </div>

                </div>

              </div>

            ))}

          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '1.5rem'
            }}
          >

            {page > 1 && (

              <button
                onClick={() => load(page - 1)}
                style={{
                  padding: '8px 16px',
                  background: '#1a1a24',
                  border: '1px solid #2a2a3a',
                  borderRadius: '8px',
                  color: '#ccc',
                  cursor: 'pointer'
                }}
              >
                ← Prev
              </button>

            )}

            <span
              style={{
                padding: '8px 16px',
                color: '#555',
                fontSize: '13px'
              }}
            >
              Page {page} of {pagination.pages || 1}
            </span>

            {page < (pagination.pages || 1) && (

              <button
                onClick={() => load(page + 1)}
                style={{
                  padding: '8px 16px',
                  background: '#1a1a24',
                  border: '1px solid #2a2a3a',
                  borderRadius: '8px',
                  color: '#ccc',
                  cursor: 'pointer'
                }}
              >
                Next →
              </button>

            )}

          </div>

        </>

      )}

    </div>
  );
}