import os
import io
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import numpy as np
from sklearn.decomposition import PCA, NMF

app = Flask(__name__)
# Mengizinkan aplikasi React (berbeda port) untuk mengakses API ini
CORS(app)  

# ----------------- FUNGSI ALGORITMA KOMPRESI -----------------

def compress_image_fft(image_array, keep_fraction=0.15):
    """
    Kompresi menggunakan Fast Fourier Transform (FFT).
    Mengubah gambar ke spektrum frekuensi dan membuang frekuensi tinggi (Low-Pass Filter).
    """
    compressed = np.zeros_like(image_array, dtype=float)
    
    # Menentukan ukuran batas frekuensi (radius) yang akan dipertahankan
    r = int(image_array.shape[0] * keep_fraction)
    c = int(image_array.shape[1] * keep_fraction)
    
    for i in range(3):
        channel = image_array[:, :, i]
        
        # Eksekusi Transformasi 2D Fourier
        f_transform = np.fft.fft2(channel)
        f_shift = np.fft.fftshift(f_transform)
        
        # Membuat Masking (Topeng): Menyimpan frekuensi di tengah matriks
        mask = np.zeros_like(channel)
        crow, ccol = channel.shape[0] // 2, channel.shape[1] // 2
        r_min, r_max = max(0, crow - r), min(channel.shape[0], crow + r)
        c_min, c_max = max(0, ccol - c), min(channel.shape[1], ccol + c)
        mask[r_min:r_max, c_min:c_max] = 1
        
        # Membuang frekuensi tinggi dan merekonstruksi citra
        f_shift_filtered = f_shift * mask
        f_ishift = np.fft.ifftshift(f_shift_filtered)
        img_back = np.fft.ifft2(f_ishift)
        compressed[:, :, i] = np.abs(img_back)
        
    # Pastikan nilai piksel tetap berada di rentang warna valid (0-255)
    return np.clip(compressed, 0, 255).astype('uint8')

def compress_image_pca(image_array, n_components=80):
    """
    Kompresi menggunakan Principal Component Analysis (PCA).
    Membuang fitur minor (reduksi dimensi) berdasarkan varians data.
    """
    compressed = np.zeros_like(image_array, dtype=float)
    for i in range(3):
        channel = image_array[:, :, i]
        pca = PCA(n_components=n_components)
        
        # Mengecilkan dimensi matriks
        transformed = pca.fit_transform(channel)
        # Mengembalikan struktur awal dengan informasi yang telah dipadatkan
        reconstructed = pca.inverse_transform(transformed)
        
        compressed[:, :, i] = reconstructed
    return np.clip(compressed, 0, 255).astype('uint8')

def compress_image_nmf(image_array, n_components=80):
    """
    Kompresi menggunakan Non-negative Matrix Factorization (NMF).
    Faktorisasi perkalian matriks secara parsial (khusus untuk angka positif).
    """
    compressed = np.zeros_like(image_array, dtype=float)
    for i in range(3):
        channel = image_array[:, :, i]
        nmf = NMF(n_components=n_components, init='random', random_state=42, max_iter=100)
        
        # Mendekomposisi matriks warna menjadi perkalian dua matriks kecil (W dan H)
        W = nmf.fit_transform(channel)
        H = nmf.components_
        
        # Menggabungkan kembali dua matriks (dot product)
        reconstructed = np.dot(W, H)
        
        compressed[:, :, i] = reconstructed
    return np.clip(compressed, 0, 255).astype('uint8')

# ----------------- UTILITAS -----------------

def pil_to_base64_and_size(img_pil, quality=80):
    """
    Menyimpan gambar ke dalam memori komputer dan mengubahnya menjadi 
    teks Base64 agar dapat dikirim ke React UI tanpa harus menyimpannya sebagai file.
    """
    buffer = io.BytesIO()
    img_pil.save(buffer, format="JPEG", quality=quality)
    buffer.seek(0)
    
    # Menghitung ukuran file dalam format KB
    size_kb = len(buffer.getvalue()) / 1024.0
    
    # Melakukan penyandian (encoding) ke tulisan Base64
    b64_str = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return b64_str, size_kb

# ----------------- ROUTING API -----------------

# Titik akses (endpoint) untuk menangani permintaan kompresi dari antarmuka pengguna
@app.route('/api/compress', methods=['POST'])
def compress_endpoint():
    # Validasi apakah pengguna mengirimkan file gambar
    if 'image' not in request.files:
        return jsonify({'error': 'Tidak ada gambar yang diunggah'}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'File gambar belum dipilih'}), 400
        
    try:
        # Membuka gambar asli dan mengubahnya menjadi format Matriks RGB
        img_pil = Image.open(file.stream).convert('RGB')
        img_array = np.array(img_pil)
        
        # Mengambil referensi ukuran awal dari gambar yang diunggah
        _, orig_size = pil_to_base64_and_size(img_pil, quality=100)
        orig_b64, orig_size = pil_to_base64_and_size(img_pil, quality=80) 
        
        # 1. Jalankan Algoritma FFT
        fft_array = compress_image_fft(img_array, keep_fraction=0.15)
        fft_b64, fft_size = pil_to_base64_and_size(Image.fromarray(fft_array))
        fft_reduction = ((orig_size - fft_size) / orig_size) * 100 if orig_size > 0 else 0
        
        # 2. Jalankan Algoritma PCA
        pca_array = compress_image_pca(img_array, n_components=80)
        pca_b64, pca_size = pil_to_base64_and_size(Image.fromarray(pca_array))
        pca_reduction = ((orig_size - pca_size) / orig_size) * 100 if orig_size > 0 else 0
        
        # 3. Jalankan Algoritma NMF
        nmf_array = compress_image_nmf(img_array, n_components=80)
        nmf_b64, nmf_size = pil_to_base64_and_size(Image.fromarray(nmf_array))
        nmf_reduction = ((orig_size - nmf_size) / orig_size) * 100 if orig_size > 0 else 0
        
        # Mengembalikan paket JSON berisi gambar yang siap ditampilkan oleh React
        return jsonify({
            'success': True,
            'original': {
                'image': f'data:image/jpeg;base64,{orig_b64}',
                'size': orig_size
            },
            'fft': {
                'image': f'data:image/jpeg;base64,{fft_b64}',
                'size': fft_size,
                'reduction': fft_reduction
            },
            'pca': {
                'image': f'data:image/jpeg;base64,{pca_b64}',
                'size': pca_size,
                'reduction': pca_reduction
            },
            'nmf': {
                'image': f'data:image/jpeg;base64,{nmf_b64}',
                'size': nmf_size,
                'reduction': nmf_reduction
            }
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Menjalankan Backend Flask...")
    app.run(debug=True, port=5000)
