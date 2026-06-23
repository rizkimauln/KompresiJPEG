FROM python:3.9-slim

# Atur direktori kerja di dalam container
WORKDIR /app

# Salin file requirements.txt
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Salin seluruh file proyek ke dalam container
COPY . .

# Hugging Face Spaces mengharuskan aplikasi berjalan di port 7860
ENV PORT=7860
EXPOSE 7860

# Jalankan server menggunakan gunicorn dengan timeout 5 menit
CMD ["gunicorn", "-b", "0.0.0.0:7860", "--timeout", "300", "app:app"]
