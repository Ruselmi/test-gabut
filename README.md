# Proyek Gabungan: Logo Generator & Voxel Game

Proyek ini berisi dua aplikasi web: **Logo Generator** dan **Voxel Game**.

## Struktur Proyek

- `/logo_generator`: Berisi semua file untuk aplikasi Logo Generator.
- `/voxel_game`: Berisi semua file untuk aplikasi Voxel Game.
- `index.html`: Halaman menu utama untuk memilih aplikasi.
- `style.css`: Stylesheet untuk halaman menu utama.

## Cara Menjalankan Proyek

Kedua aplikasi dapat diakses dari menu utama.

**PENTING:** Karena Voxel Game menggunakan modul JavaScript (ESM) yang diimpor dari CDN, Anda **harus** menjalankannya dari server web lokal. Membuka `index.html` langsung di browser sebagai file (`file:///...`) akan menyebabkan error CORS dan game tidak akan berjalan.

Cara termudah untuk menjalankan server web lokal adalah dengan menggunakan Python.

### Instruksi Menjalankan Server:

1.  **Pastikan Anda memiliki Python terinstal.** Sebagian besar sistem operasi modern sudah memilikinya. Anda bisa memeriksanya dengan membuka terminal atau command prompt dan mengetik:
    ```sh
    python --version
    ```
    atau
    ```sh
    python3 --version
    ```

2.  **Buka terminal atau command prompt di direktori utama proyek ini.**

3.  **Jalankan salah satu perintah berikut, tergantung pada versi Python Anda:**

    **Untuk Python 3:**
    ```sh
    python3 -m http.server
    ```

    **Untuk Python 2 (jika Python 3 tidak tersedia):**
    ```sh
    python -m SimpleHTTPServer
    ```

4.  **Buka browser web Anda dan navigasikan ke alamat berikut:**
    ```
    http://localhost:8000
    ```

5.  Anda sekarang akan melihat menu utama dan dapat menjalankan kedua aplikasi dengan benar.
