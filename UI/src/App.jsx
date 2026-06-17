import { useState, useCallback } from 'react'
import './App.css'

function App() {
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
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

  const processFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Mohon unggah file gambar (JPEG/PNG)')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'
      const response = await fetch(`${apiUrl}/api/compress`, {
        method: 'POST',
        body: formData,
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengompresi gambar')
      }
      
      setResults(data)
    } catch (err) {
      setError(err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">Kompresi Gambar JPEG</h1>
        <p className="subtitle">FFT (Fast Fourier Transform) • PCA (Principal Component Analysis) • NMF (Non-negative Matrix Factorization)</p>
      </header>

      {!loading && !results && (
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
          <p className="upload-hint">Seret & lepas atau klik untuk mencari file (JPEG, PNG)</p>
          <input 
            id="file-upload" 
            type="file" 
            accept="image/jpeg, image/png, image/webp" 
            onChange={handleChange} 
            style={{ display: 'none' }} 
          />
        </div>
      )}

      {error && <div style={{ color: '#ef4444', marginTop: '1rem', fontWeight: '500' }}>Error: {error}</div>}

      {loading && (
        <div className="loader-container">
          <div className="spinner"></div>
          <div className="loader-text">Memproses algoritma matematis...</div>
        </div>
      )}

      {results && (
        <div className="results-container">
          
          {/* Original Card - Standalone in Center */}
          <div className="original-section">
            <div className="image-card original-card">
              <div className="card-header">
                <div className="card-title">Gambar Asli</div>
              </div>
              <div className="card-image-wrapper original-wrapper">
                <img src={results.original.image} alt="Original" className="card-image" />
              </div>
              <div className="card-content">
                <div className="stat-row">
                  <span className="stat-label">Ukuran File</span>
                  <span className="stat-value">{results.original.size.toFixed(2)} KB</span>
                </div>
              </div>
            </div>
          </div>

          <div className="results-grid">
            {/* FFT Card */}
            <div className="image-card">
              <div className="card-header">
                <div className="card-title">FFT</div>
              </div>
              <div className="card-image-wrapper">
                <img src={results.fft.image} alt="FFT" className="card-image" />
              </div>
              <div className="card-content">
                <div className="stat-row">
                  <span className="stat-label">Ukuran File</span>
                  <span className="stat-value">{results.fft.size.toFixed(2)} KB</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Reduksi</span>
                  <span className="stat-value success">{results.fft.reduction.toFixed(2)}%</span>
                </div>
                <div className="card-actions">
                  <button className="download-button" onClick={() => handleDownload(results.fft.image, 'kompresi_fft.jpg')}>
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
                <img src={results.pca.image} alt="PCA" className="card-image" />
              </div>
              <div className="card-content">
                <div className="stat-row">
                  <span className="stat-label">Ukuran File</span>
                  <span className="stat-value">{results.pca.size.toFixed(2)} KB</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Reduksi</span>
                  <span className="stat-value success">{results.pca.reduction.toFixed(2)}%</span>
                </div>
                <div className="card-actions">
                  <button className="download-button" onClick={() => handleDownload(results.pca.image, 'kompresi_pca.jpg')}>
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
                <img src={results.nmf.image} alt="NMF" className="card-image" />
              </div>
              <div className="card-content">
                <div className="stat-row">
                  <span className="stat-label">Ukuran File</span>
                  <span className="stat-value">{results.nmf.size.toFixed(2)} KB</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Reduksi</span>
                  <span className="stat-value success">{results.nmf.reduction.toFixed(2)}%</span>
                </div>
                <div className="card-actions">
                  <button className="download-button" onClick={() => handleDownload(results.nmf.image, 'kompresi_nmf.jpg')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Unduh Gambar
                  </button>
                </div>
              </div>
            </div>

          </div>
          <div style={{ textAlign: 'center' }}>
             <button className="back-button" onClick={() => setResults(null)}>Analisis Gambar Lain</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
