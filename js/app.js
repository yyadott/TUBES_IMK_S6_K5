document.addEventListener("DOMContentLoaded", function() {
    const listAnggaranContainer = document.getElementById('listAnggaranContainer');
    const switchAnggaranUmum = document.getElementById('switchAnggaranUmum');
    const wrapperNamaAnggaran = document.getElementById('wrapperNamaAnggaran');
    const wrapperVisualAnggaran = document.getElementById('wrapperVisualAnggaran');
    const inputNama = document.getElementById('inputNama');

    // Inisialisasi awal database LocalStorage berupa array kosong murni
    if (!localStorage.getItem('master_anggaran')) {
        localStorage.setItem('master_anggaran', JSON.stringify([]));
    }

    // 1. EVENT LOGIKA SWITCH SAKLAR ANGGARAN UMUM (FORM MANIPULATION)
    switchAnggaranUmum.addEventListener('change', function() {
        if (this.checked) {
            wrapperNamaAnggaran.style.display = "none";
            wrapperVisualAnggaran.style.display = "none";
            inputNama.removeAttribute('required'); 
            inputNama.value = "";
        } else {
            wrapperNamaAnggaran.style.display = "block";
            wrapperVisualAnggaran.style.display = "flex";
            inputNama.setAttribute('required', 'true');
        }
    });

    // 2. FUNGSI UTAMA RENDERING KARTU ANGGARAN
    function renderAnggaran() {
        listAnggaranContainer.innerHTML = "";
        const listData = JSON.parse(localStorage.getItem('master_anggaran')) || [];
        
        // Tampilkan Placeholder ramah jika data kosong
        if (listData.length === 0) {
            listAnggaranContainer.innerHTML = `
                <div class="text-center py-5 px-3 border border-dashed rounded-4 bg-light">
                    <i class="bi bi-wallet2 text-muted" style="font-size: 3rem;"></i>
                    <h6 class="fw-bold text-dark mt-3 mb-1">Belum Ada Anggaran</h6>
                    <p class="text-muted small m-0">Silakan klik tombol di atas untuk menyusun batas pengeluaran kustom atau umum Anda.</p>
                </div>
            `;
            document.getElementById('totalPlafonAnggaran').innerText = "Rp 0";
            document.getElementById('jumlahKategoriAktif').innerText = "0 Kategori Aktif";
            return;
        }
        
        let totalPlafonAktif = 0;
        let hitungKategoriAktif = 0;

        listData.forEach((item, index) => {
            if (item.aktif) {
                totalPlafonAktif += parseInt(item.target);
                hitungKategoriAktif++;
            }

            let persentase = item.aktif ? Math.min((item.terpakai / item.target) * 100, 100) : 0;
            let sisaBaku = item.target - item.terpakai;

            const card = document.createElement('div');
            card.className = `budget-card d-flex flex-column gap-2 ${!item.aktif ? 'disabled-category' : ''}`;

            card.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div class="d-flex align-items-center gap-3">
                        <div class="icon-box bg-${item.aktif ? item.warnaClass : 'secondary'}">
                            <i class="bi ${item.ikonClass}"></i>
                        </div>
                        <div>
                            <h6 class="fw-bold mb-0 text-dark" style="font-size: 1rem;">${item.nama}</h6>
                            <small class="text-muted" style="font-size: 0.75rem;">
                                Tipe: ${item.isUmum ? '<span class="badge bg-secondary-subtle text-secondary fw-bold">Anggaran Umum</span>' : '<span class="badge bg-primary-subtle text-primary fw-bold">Kategori</span>'}
                            </small>
                        </div>
                    </div>
                    <div class="d-flex gap-1">
                        <button type="button" class="btn-action-budget toggle" data-index="${index}" title="${item.aktif ? 'Nonaktifkan' : 'Aktifkan'}">
                            <i class="bi ${item.aktif ? 'bi-toggle-on text-success' : 'bi-toggle-off'} fs-4"></i>
                        </button>
                        <button type="button" class="btn-action-budget delete text-danger ms-1" data-index="${index}" title="Hapus Permanen">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    </div>
                </div>

                ${item.aktif ? `
                <div class="mt-2">
                    <div class="d-flex justify-content-between small mb-1 fw-semibold">
                        <span class="text-muted">Terpakai: Rp ${parseInt(item.terpakai).toLocaleString('id-ID')}</span>
                        <span class="${sisaBaku < 0 ? 'text-danger' : 'text-success'}">Sisa: Rp ${sisaBaku.toLocaleString('id-ID')}</span>
                    </div>
                    <div class="progress progress-custom mb-1">
                        <div class="progress-bar bg-${persentase >= 90 ? 'danger' : (persentase >= 70 ? 'warning' : 'success')}" role="progressbar" style="width: ${persentase}%"></div>
                    </div>
                    <div class="d-flex justify-content-between text-muted" style="font-size: 0.7rem;">
                        <span>Plafon Limit: Rp ${parseInt(item.target).toLocaleString('id-ID')}</span>
                        <span class="fw-bold">${persentase.toFixed(0)}%</span>
                    </div>
                </div>
                ` : '<p class="text-muted small m-0 py-1 italic">Pelacakan anggaran ini sedang dinonaktifkan.</p>'}
            `;

            listAnggaranContainer.appendChild(card);
        });

        document.getElementById('totalPlafonAnggaran').innerText = "Rp " + totalPlafonAktif.toLocaleString('id-ID');
        document.getElementById('jumlahKategoriAktif').innerText = `${hitungKategoriAktif} Kategori Aktif`;

        inisialisasiTombolKontrol();
    }

    // 3. EVENT HANDLER ATTACHMENT (TOGGLE ON/OFF & DELETE EVENT)
    function inisialisasiTombolKontrol() {
        // Eksekusi Saklar Pembekuan Anggaran
        document.querySelectorAll('.btn-action-budget.toggle').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                let listData = JSON.parse(localStorage.getItem('master_anggaran'));
                listData[idx].aktif = !listData[idx].aktif;
                localStorage.setItem('master_anggaran', JSON.stringify(listData));
                renderAnggaran();
            });
        });

        // Eksekusi Penghapusan Kartu Permanen (Semua kartu user bisa dihapus)
        document.querySelectorAll('.btn-action-budget.delete').forEach(btn => {
            btn.addEventListener('click', function() {
                if (confirm("Apakah Anda yakin ingin menghapus pengaturan anggaran ini?")) {
                    const idx = parseInt(this.getAttribute('data-index'));
                    let listData = JSON.parse(localStorage.getItem('master_anggaran'));
                    listData.splice(idx, 1);
                    localStorage.setItem('master_anggaran', JSON.stringify(listData));
                    renderAnggaran();
                }
            });
        });
    }

    // 4. SUBMIT VALIDATION INPUT ANGGARAN BARU
    document.getElementById('formSimpanAnggaran').addEventListener('submit', function(e) {
        e.preventDefault();
        
        let namaFinal = "";
        let ikonClassFinal = "";
        let warnaClassFinal = "";
        let statusUmum = false;

        const target = document.getElementById('inputTarget').value;
        let listData = JSON.parse(localStorage.getItem('master_anggaran')) || [];

        if (switchAnggaranUmum.checked) {
            namaFinal = "Anggaran Umum";
            ikonClassFinal = "bi-wallet2"; 
            warnaClassFinal = "dark";      
            statusUmum = true;

            const hitungUmumSama = listData.filter(item => item.isUmum).length;
            if (hitungUmumSama > 0) {
                namaFinal = `Anggaran Umum ${hitungUmumSama + 1}`;
            }
        } else {
            namaFinal = inputNama.value.trim();
            ikonClassFinal = document.getElementById('inputIkon').value;
            warnaClassFinal = document.getElementById('inputWarna').value;

            const namaSama = listData.find(item => item.nama.toLowerCase() === namaFinal.toLowerCase());
            if(namaSama) {
                alert("Kategori anggaran tersebut sudah ada! Silakan ganti nama yang lain.");
                return;
            }
        }
        
        listData.push({
            nama: namaFinal,
            target: parseInt(target),
            terpakai: 0,
            ikonClass: ikonClassFinal,
            warnaClass: warnaClassFinal,
            aktif: true,
            isUmum: statusUmum
        });

        localStorage.setItem('master_anggaran', JSON.stringify(listData));
        
        // Reset Kondisi Form Modal Kembali ke Default
        this.reset();
        switchAnggaranUmum.checked = false;
        wrapperNamaAnggaran.style.display = "block";
        wrapperVisualAnggaran.style.display = "flex";
        inputNama.setAttribute('required', 'true');

        // Sembunyikan Modal Bootstrap secara aman
        const modalEl = document.getElementById('modalTambahAnggaran');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        modalInstance.hide();

        renderAnggaran();
    });

    // Pemicu awal ketika dokumen selesai di-load browser
    renderAnggaran();
});