import { useState, useCallback, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, ReferenceLine } from 'recharts'
import './App.css'

function App() {
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [overallProgress, setOverallProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState(null)

  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true)
    } else if (e.type === 'dragleave') {
      setIsDragging(false)
    }
  }, [])

  const handleDownload = (base64Data, filename) => {
    const link = document.createElement('a')
    link.href = base64Data
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const processFiles = async (files) => {
    const validFiles = Array.from(files).filter(f => f.type === 'image/jpeg' || f.type === 'image/jpg')
    if (validFiles.length === 0) {
      setError('Mohon unggah file gambar dalam format JPEG/JPG')
      return
    }

    setLoading(true)
    setError(null)
    setOverallProgress({ current: 0, total: validFiles.length })
    
    const newResults = []

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]
      const formData = new FormData()
      formData.append('image', file)

      try {
        setOverallProgress({ current: i + 1, total: validFiles.length })
        const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'
        const response = await fetch(`${apiUrl}/api/compress`, {
          method: 'POST',
          body: formData,
        })
        
        const data = await response.json()
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Gagal mengompresi gambar')
        }
        
        newResults.push(data)
      } catch (err) {
        setError((prev) => (prev ? prev + '\n' : '') + `Gagal memproses ${file.name}: ${err.message}`)
        console.error(err)
      }
    }
    
    if (newResults.length > 0) {
      setResults(newResults)
      setCurrentImageIndex(0)
    }
    setLoading(false)
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }, [])

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files)
    }
  }

  const currentResult = results.length > 0 ? results[currentImageIndex] : null

  const avgData = useMemo(() => {
    if (results.length === 0) return [];
    return [
      {
        name: 'FFT',
        'Reduksi (%)': Number((results.reduce((acc, curr) => acc + curr.fft.reduction, 0) / results.length).toFixed(2)),
        'Waktu (s)': Number((results.reduce((acc, curr) => acc + curr.fft.duration, 0) / results.length).toFixed(3)),
      },
      {
        name: 'PCA',
        'Reduksi (%)': Number((results.reduce((acc, curr) => acc + curr.pca.reduction, 0) / results.length).toFixed(2)),
        'Waktu (s)': Number((results.reduce((acc, curr) => acc + curr.pca.duration, 0) / results.length).toFixed(3)),
      },
      {
        name: 'NMF',
        'Reduksi (%)': Number((results.reduce((acc, curr) => acc + curr.nmf.reduction, 0) / results.length).toFixed(2)),
        'Waktu (s)': Number((results.reduce((acc, curr) => acc + curr.nmf.duration, 0) / results.length).toFixed(3)),
      }
    ];
  }, [results]);

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">Kompresi Gambar JPEG</h1>
        <p className="subtitle">Studi Komparatif Algoritma Fast Fourier Transform (FFT), Principal Component Analysis (PCA), dan Non-negative Matrix Factorization (NMF)</p>
      </header>

      {!loading && results.length === 0 && (
        <div 
          className={`upload-zone ${isDragging ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload').click()}
        >
          <div className="upload-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h3 className="upload-text">Unggah Gambar Asli</h3>
          <p className="upload-hint">Seret & lepas atau klik untuk mencari file (bisa lebih dari satu)</p>
          <input 
            id="file-upload" 
            type="file" 
            multiple
            accept="image/jpeg, image/jpg" 
            onChange={handleChange} 
            style={{ display: 'none' }} 
          />
        </div>
      )}

      {error && <div style={{ color: '#ef4444', marginTop: '1rem', fontWeight: '500', whiteSpace: 'pre-wrap' }}>Error: {error}</div>}

      {loading && (
        <div className="loader-container">
          <div className="spinner"></div>
          <div className="loader-text">
            Memproses algoritma matematis... {overallProgress.current > 0 ? `(${overallProgress.current}/${overallProgress.total})` : ''}
          </div>
        </div>
      )}

      {results.length > 0 && currentResult && (
        <div className="results-container" style={{ width: '100%' }}>
          
          {/* Back Button */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
             <button className="back-button" onClick={() => setResults([])}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Kompresi gambar lain
             </button>
          </div>
          
          {/* Pagination Controls */}
          {results.length > 1 && (
            <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <button 
                disabled={currentImageIndex === 0} 
                onClick={() => setCurrentImageIndex(prev => prev - 1)}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid #475569', backgroundColor: currentImageIndex === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', color: 'var(--text-main)', cursor: currentImageIndex === 0 ? 'not-allowed' : 'pointer', fontWeight: '500' }}
              >
                &laquo; Sebelumnya
              </button>
              <span className="page-info" style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                Gambar {currentImageIndex + 1} dari {results.length}
              </span>
              <button 
                disabled={currentImageIndex === results.length - 1} 
                onClick={() => setCurrentImageIndex(prev => prev + 1)}
                style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', border: '1px solid #475569', backgroundColor: currentImageIndex === results.length - 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', color: 'var(--text-main)', cursor: currentImageIndex === results.length - 1 ? 'not-allowed' : 'pointer', fontWeight: '500' }}
              >
                Selanjutnya &raquo;
              </button>
            </div>
          )}
          <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.25rem', color: 'var(--text-main)' }}>File: {currentResult.filename || `Gambar ${currentImageIndex + 1}`}</h2>

          {/* Results Grid: 4 Cards (Original, FFT, PCA, NMF) */}
          <div className="results-grid" style={{ marginBottom: '3rem', width: '100%' }}>
            
            {/* Original Card */}
            <div className="image-card original-card">
              <div className="card-header">
                <div className="card-title">Asli (JPEG)</div>
              </div>
              <div className="card-image-wrapper">
                <img src={currentResult.original.image} alt="Original" className="card-image" />
              </div>
              <div className="card-content">
                <div className="stat-row">
                  <span className="stat-label">Ukuran File</span>
                  <span className="stat-value">{currentResult.original.size.toFixed(2)} KB</span>
                </div>
              </div>
            </div>

            {/* FFT Card */}
            <div className="image-card">
              <div className="card-header">
                <div className="card-title">FFT</div>
              </div>
              <div className="card-image-wrapper">
                <img src={currentResult.fft.image} alt="FFT" className="card-image" />
              </div>
              <div className="card-content">
                <div className="stat-row">
                  <span className="stat-label">Ukuran File</span>
                  <span className="stat-value">{currentResult.fft.size.toFixed(2)} KB</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Reduksi</span>
                  <span className="stat-value success">{currentResult.fft.reduction.toFixed(2)}%</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Waktu</span>
                  <span className="stat-value">{currentResult.fft.duration.toFixed(3)} s</span>
                </div>
                <div className="card-actions">
                  <button className="download-button" onClick={() => handleDownload(currentResult.fft.image, 'kompresi_fft.jpg')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Unduh Gambar
                  </button>
                </div>
              </div>
            </div>

            {/* PCA Card */}
            <div className="image-card">
              <div className="card-header">
                <div className="card-title">PCA</div>
              </div>
              <div className="card-image-wrapper">
                <img src={currentResult.pca.image} alt="PCA" className="card-image" />
              </div>
              <div className="card-content">
                <div className="stat-row">
                  <span className="stat-label">Ukuran File</span>
                  <span className="stat-value">{currentResult.pca.size.toFixed(2)} KB</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Reduksi</span>
                  <span className="stat-value success">{currentResult.pca.reduction.toFixed(2)}%</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Waktu</span>
                  <span className="stat-value">{currentResult.pca.duration.toFixed(3)} s</span>
                </div>
                <div className="card-actions">
                  <button className="download-button" onClick={() => handleDownload(currentResult.pca.image, 'kompresi_pca.jpg')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Unduh Gambar
                  </button>
                </div>
              </div>
            </div>

            {/* NMF Card */}
            <div className="image-card">
              <div className="card-header">
                <div className="card-title">NMF</div>
              </div>
              <div className="card-image-wrapper">
                <img src={currentResult.nmf.image} alt="NMF" className="card-image" />
              </div>
              <div className="card-content">
                <div className="stat-row">
                  <span className="stat-label">Ukuran File</span>
                  <span className="stat-value">{currentResult.nmf.size.toFixed(2)} KB</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Reduksi</span>
                  <span className="stat-value success">{currentResult.nmf.reduction.toFixed(2)}%</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Waktu</span>
                  <span className="stat-value">{currentResult.nmf.duration.toFixed(3)} s</span>
                </div>
                <div className="card-actions">
                  <button className="download-button" onClick={() => handleDownload(currentResult.nmf.image, 'kompresi_nmf.jpg')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Unduh Gambar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Matrix Table at the bottom */}
          <div className="comparison-matrix" style={{ width: '100%' }}>
            <h3 className="matrix-title">Matriks Perbandingan Kompresi</h3>
            <div className="table-responsive">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th>Nama File</th>
                    <th>Asli (KB)</th>
                    <th>FFT (KB)</th>
                    <th>Reduksi FFT (%)</th>
                    <th>Waktu FFT (s)</th>
                    <th>PCA (KB)</th>
                    <th>Reduksi PCA (%)</th>
                    <th>Waktu PCA (s)</th>
                    <th>NMF (KB)</th>
                    <th>Reduksi NMF (%)</th>
                    <th>Waktu NMF (s)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((res, idx) => (
                    <tr 
                      key={idx} 
                      className={idx === currentImageIndex ? 'active-row' : ''} 
                      onClick={() => setCurrentImageIndex(idx)} 
                      style={{
                        cursor: 'pointer', 
                        backgroundColor: idx === currentImageIndex ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        fontWeight: idx === currentImageIndex ? '600' : 'normal'
                      }}
                    >
                      <td>{res.filename || `Gambar ${idx + 1}`}</td>
                      <td>{res.original.size.toFixed(2)}</td>
                      <td>{res.fft.size.toFixed(2)}</td>
                      <td className="success">{res.fft.reduction.toFixed(2)}%</td>
                      <td>{res.fft.duration ? res.fft.duration.toFixed(3) : '-'}</td>
                      <td>{res.pca.size.toFixed(2)}</td>
                      <td className="success">{res.pca.reduction.toFixed(2)}%</td>
                      <td>{res.pca.duration ? res.pca.duration.toFixed(3) : '-'}</td>
                      <td>{res.nmf.size.toFixed(2)}</td>
                      <td className="success">{res.nmf.reduction.toFixed(2)}%</td>
                      <td>{res.nmf.duration ? res.nmf.duration.toFixed(3) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem'}}>*Klik pada baris tabel untuk melihat gambar</p>
          </div>

          {/* Performance Summary Charts */}
          <div className="charts-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem', width: '100%' }}>
            <div className="chart-card" style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.2rem' }}>Rata-rata Reduksi Ukuran (%)</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={avgData} margin={{ top: 30, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" tickFormatter={(val) => val.toFixed(1)} />

                    <ReferenceLine y={0} stroke="var(--text-muted)" />
                    <Bar dataKey="Reduksi (%)" radius={[4, 4, 0, 0]} barSize={60}>
                      {avgData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry['Reduksi (%)'] >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                      <LabelList dataKey="Reduksi (%)" position="top" fill="var(--text-muted)" fontSize={12} formatter={(val) => val + '%'} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem'}}>*Nilai merah (negatif) menunjukkan ukuran file justru membengkak</p>
            </div>

            <div className="chart-card" style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.2rem' }}>Rata-rata Waktu Eksekusi (s)</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={avgData} margin={{ top: 30, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" tickFormatter={(val) => val.toFixed(2)} />

                    <Bar dataKey="Waktu (s)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60}>
                       <LabelList dataKey="Waktu (s)" position="top" fill="var(--text-muted)" fontSize={12} formatter={(val) => val + ' s'} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>


        </div>
      )}
    </div>
  )
}

export default App
