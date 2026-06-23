# Praktikum Kompresi Gambar (Ekstensi JPEG)

Repositori ini memuat implementasi tugas praktikum kelompok mengenai kompresi citra digital untuk format `.jpeg`. Algoritma ditulis menggunakan bahasa pemrograman Python dalam format Jupyter Notebook, dan dilengkapi dengan antarmuka grafis (Web UI).

## Deskripsi Tugas
1. **Algoritma yang Digunakan** (Kompresi Lossy):
   - **Fast Fourier Transform (FFT)**
   - **Principal Component Analysis (PCA)**
   - **Non-negative Matrix Factorization (NMF)**
2. **Data Uji**: 20 gambar berekstensi `.jpeg` yang terdapat pada direktori `jpeg`.
3. **Luaran (Output)**: Menampilkan perbandingan gambar asli dan hasil kompresi secara visual beserta ukuran *file*-nya, persentase reduksi ukurannya, durasi waktu pengeksekusian kompresi, serta grafik rangkuman rata-rata performa seluruh algoritma.

## Prasyarat & Instalasi (Dependencies)

Sebelum menjalankan proyek ini, pastikan Anda telah menyelesaikan tahapan instalasi berikut:

### 0. Clone Repositori (Unduh Kode Sumber)
Langkah pertama adalah menyalin seluruh kode sumber proyek ini ke komputer lokal Anda. Buka Terminal atau *Command Prompt*, lalu jalankan perintah berikut:
```bash
git clone https://github.com/rizkimauln/KompresiJPEG.git
cd "Nama_Folder_Repositori"
```
*(Catatan: Ganti `<URL_REPOSITORY_ANDA>` dengan tautan dari repositori GitHub/GitLab Anda).*

### 1. Instalasi Mesin Kompresi (Backend Python)
Program ini membutuhkan Python 3.x. Buka *Command Prompt* atau Terminal pada root folder proyek, lalu jalankan perintah ini untuk menginstal seluruh pustaka matematis dan infrastruktur server Flask:
```bash
pip install -r requirements.txt
```

### 2. Instalasi Antarmuka Web (Frontend Node.js)
Karena proyek ini memiliki antarmuka grafis (*Web UI*), Anda **wajib** menginstal piranti lunak [Node.js](https://nodejs.org/) di komputer Anda.
Setelah terinstal, Anda perlu mengunduh pustaka (*modules*) pembangun React-nya dengan cara:
1. Buka Terminal / *Command Prompt*.
2. Masuk ke dalam direktori UI dengan perintah: `cd ui`
3. Salin file *environment* bawaan: *copy* file `.env.example` menjadi `.env` (berisi tautan port API).
4. Jalankan proses instalasi: `npm install`
5. Tunggu hingga proses pengunduhan selesai.

## Struktur Direktori
Pastikan struktur folder pada *workspace* Anda menyerupai format berikut agar program berjalan lancar:
```text
Compresi/
├── Kompresi_FFT_PCA_NMF_JPEG.ipynb     # Notebook utama kompresi JPEG
├── app.py                              # Backend API Server (Flask)
├── requirements.txt                    # Daftar library backend Python
├── Procfile                            # Konfigurasi deployment web server (Gunicorn)
├── ui/                                 # Frontend Web UI (React)
├── jpeg/                               # Direktori gambar input JPEG (.jpeg)
├── hasil_kompresi_jpeg/                # Direktori output gambar setelah kompresi
└── README.md                           # Dokumentasi panduan proyek
```

## Panduan Penggunaan

### A. Menggunakan Jupyter Notebook
1. Pastikan gambar sudah berada pada folder `jpeg`.
2. Buka *notebook* `Kompresi_FFT_PCA_NMF_JPEG.ipynb` menggunakan Jupyter Notebook, JupyterLab, atau Visual Studio Code.
3. Sel kode pertama akan mengeksekusi instalasi referensi pustaka (*library*) tambahan secara otomatis. Tunggu hingga selesai.
4. Jalankan (*Run All*) seluruh sel kode dari atas hingga bawah.
5. Tabel komparasi waktu & memori kompresi, sub-plot visualisasi gambar, dan **Grafik Rata-rata Performa Algoritma** akan langsung ditampilkan di bagian akhir *notebook*.

### B. Menggunakan Web UI Interaktif (Terbaru!)
Proyek ini sekarang dilengkapi dengan antarmuka grafis (UI) berbasis web yang modern.
1. Buka 2 jendela Terminal / Command Prompt.
2. **Terminal 1 (Menjalankan Server Python):**
   ```bash
   cd Compresi
   python app.py
   ```
   *(Tunggu hingga muncul tulisan Running on http://127.0.0.1:5000)*
3. **Terminal 2 (Menjalankan UI React):**
   ```bash
   cd Compresi/ui
   npm run dev
   ```
4. Buka tautan lokal yang muncul (biasanya `http://localhost:5173`) di browser Anda.
5. Anda dapat mengunggah **satu atau banyak file sekaligus (Multiple Upload)** melalui area *Drag and Drop*. 
6. Sistem akan memproses algoritma dan menampilkan hasilnya. Anda bisa berpindah tampilan antar gambar menggunakan menu **Pagination** atau dengan **mengklik salah satu baris di dalam tabel**.
7. Di bagian bawah UI, disajikan matriks tabel berisi komparasi ukuran asli fisik data, waktu eksekusi kompresi, serta **Diagram (Bar Chart)** yang merangkum rata-rata pengurangan memori kompresi dari seluruh kumpulan gambar yang telah Anda unggah.
8. Klik tombol **Unduh Gambar** (ikon *download*) di bawah masing-masing kartu output untuk menyimpan gambar ke perangkat Anda.

> **Catatan Kompresi**: Saat ini nilai rasio kompresinya dikunci pada pengaturan paling optimal di dalam *backend* (FFT menyisakan 15% frekuensi, sementara PCA/NMF menggunakan 80 komponen fitur). Ukuran *file* divalidasi langsung melalui pengecekan wujud fisik OS secara natural demi akurasi pelaporan reduksi.

## Tinjauan Metodologi
- **Fast Fourier Transform (FFT)**: Memindahkan struktur citra spasial menjadi domain spektrum gelombang kompleks (domain frekuensi). Menggunakan fungsi *Low-Pass Filter* untuk membuang detail spektrum frekuensi tinggi yang sering tidak disadari mata, lalu merekonstruksinya (Lossy).
- **Principal Component Analysis (PCA)**: Teknik perombakan statistik *Principal Component*. Matriks citra dijabarkan menjadi fitur berdimensi kecil sesuai dengan tingkat varians, menekan ukuran *file* dengan membuang dimensi-dimensi fitur terendah.
- **Non-negative Matrix Factorization (NMF)**: Mengeksploitasi struktur angka warna RGB citra natural yang selalu positif dengan menggunakan dekomposisi matriks secara parsial (faktorisasi aditif non-negatif).

## Deployment (Production)

### 1. Deploy Backend (Railway / Render / Heroku)
Proyek ini sudah dikonfigurasi agar siap di-deploy ke layanan *cloud* platform-as-a-service (PaaS) seperti Railway:
- Terdapat `requirements.txt` untuk instalasi dependensi otomatis.
- Terdapat `Procfile` yang menginstruksikan server untuk menggunakan `gunicorn`.
- Skrip `app.py` sudah diatur agar mendengarkan ke host `0.0.0.0` dan menyesuaikan `PORT` environment yang disediakan oleh *cloud provider*.
Cukup hubungkan repositori GitHub ini ke dashboard *cloud provider* pilihan Anda dan *deploy* secara otomatis.

### 2. Deploy Frontend UI (Vercel / Netlify / Railway)
Setelah Backend berhasil berjalan dan Anda mendapatkan URL API-nya, Anda bisa men-deploy UI React:
1. Buka file `.env` di dalam folder `ui/` (atau atur Environment Variables di *cloud provider*) dan atur `VITE_API_URL` dengan URL Backend produksi Anda (contoh: `VITE_API_URL=https://kompresijpeg.up.railway.app`).
2. Jika Anda men-deploy ke **Vercel**, **Netlify**, atau platform lain: hubungkan repositori ini, pastikan untuk mengatur *Root Directory* ke `ui` (atau jalankan perintah dari dalam folder `ui`).
3. Perintah *Build* yang digunakan adalah `npm run build` dan folder outputnya adalah `dist`.
4. UI akan ter-deploy dan otomatis bisa berkomunikasi dengan server backend Anda!
