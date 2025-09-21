document.addEventListener('DOMContentLoaded', () => {
    // --- Ambil Elemen DOM ---
    const canvas = document.getElementById('logo-canvas');
    const ctx = canvas.getContext('2d');

    const textInput = document.getElementById('text-input');
    const fontSizeInput = document.getElementById('font-size-input');
    const fontFamilySelect = document.getElementById('font-family-select');
    const textColorInput = document.getElementById('text-color-input');
    const bgColorInput = document.getElementById('bg-color-input');
    const downloadBtn = document.getElementById('download-btn');

    // --- Fungsi Utama untuk Menggambar Logo ---
    function drawLogo() {
        // Ambil nilai dari kontrol
        const text = textInput.value;
        const fontSize = fontSizeInput.value;
        const fontFamily = fontFamilySelect.value;
        const textColor = textColorInput.value;
        const bgColor = bgColorInput.value;

        // 1. Bersihkan Canvas dan gambar latar belakang
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Atur properti teks
        ctx.fillStyle = textColor;
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 3. Gambar teks di tengah canvas
        const x = canvas.width / 2;
        const y = canvas.height / 2;
        ctx.fillText(text, x, y);
    }

    // --- Event Listeners untuk Kontrol Interaktif ---
    // Setiap kali ada perubahan pada input, panggil drawLogo()
    textInput.addEventListener('input', drawLogo);
    fontSizeInput.addEventListener('input', drawLogo);
    fontFamilySelect.addEventListener('change', drawLogo);
    textColorInput.addEventListener('input', drawLogo);
    bgColorInput.addEventListener('input', drawLogo);

    // --- Fungsi untuk Download Logo ---
    downloadBtn.addEventListener('click', () => {
        // Pastikan logo tergambar dengan versi terbaru sebelum download
        drawLogo();

        // Konversi canvas ke data URL (format PNG)
        const dataURL = canvas.toDataURL('image/png');

        // Buat link sementara untuk memicu download
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'logo.png'; // Nama file yang akan di-download

        // Simulasikan klik pada link
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // --- Gambar logo awal saat halaman dimuat ---
    drawLogo();
});
