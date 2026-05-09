import React, { useEffect, useState } from 'react';
import { historyApi } from '../services/api';
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

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >

            {analyses.map(a => (

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

                  <pre
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      color: '#ccc',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {a.codeSnippet}
                  </pre>

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