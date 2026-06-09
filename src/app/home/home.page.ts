import { Component, HostListener, OnInit, OnDestroy, ViewChild, ElementRef, NgZone, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AudioService } from '../services/audio.service';
import { GestureController, Platform, NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('gridBoard', { read: ElementRef }) gridBoard!: ElementRef;

  private backButtonSub?: Subscription;

  constructor(
    public audioService: AudioService,
    private router: Router,
    private gestureCtrl: GestureController,
    private zone: NgZone,
    private platform: Platform,
    private navCtrl: NavController
  ) { }

  // ===== DATA =====
  words: string[] = [];
  foundWords: string[] = [];
  grid: string[][] = [];
  gridSize: number = 8;

  // ===== HINT SYSTEM =====
  hintCount: number = 2;
  wordPaths: { [key: string]: { r: number, c: number }[] } = {};
  hintedCells: { r: number, c: number }[] = [];

  // ===== SETTINGS =====
  showSettings: boolean = false;

  openSettings() {
    this.audioService.playSfx('click');
    this.showSettings = true;
  }

  closeSettings() {
    this.audioService.playSfx('click');
    this.showSettings = false;
  }

  toggleMusic() {
    this.audioService.playSfx('click');
    this.audioService.toggleMusic();
  }

  toggleSfx() {
    this.audioService.toggleSfx();
    this.audioService.playSfx('click');
  }

  toggleVibration() {
    this.audioService.playSfx('click');
    this.audioService.toggleVibration();
    if (this.audioService.settings.vibration) {
      this.audioService.vibrate('light');
    }
  }

  lines: any[] = [];

  colors: string[] = [
    'rgba(231,76,60,1)',
    'rgba(52,152,219,1)',
    'rgba(46,204,113,1)',
    'rgba(241,196,15,1)',
    'rgba(155,89,182,1)',
    'rgba(26,188,156,1)'
  ];

  get currentColor() {
    return this.colors[this.lines.length % this.colors.length];
  }

  // ===== DRAG =====
  isDragging = false;
  showHebat = false;
  startPos: any = null;
  currentPath: any[] = [];

  // ===== LEVEL =====
  levels: any[] = [];
  currentLevelIndex = 0;

  themes = [
    // Alam
    ['HUTAN', 'SUNGAI', 'GUNUNG', 'LAUT', 'PANTAI', 'DANAU', 'AWAN', 'HUJAN', 'ANGIN', 'TANAH', 'POHON', 'LANGIT', 'BINTANG', 'BULAN', 'MATAHARI', 'PELANGI', 'GURUN', 'GOA', 'LEMBAH', 'BUKIT', 'BATU', 'PASIR', 'DEBU', 'ASAP', 'KABUT'],
    // Buah
    ['APEL', 'MANGGA', 'JERUK', 'PISANG', 'ANGGUR', 'SEMANGKA', 'MELON', 'PEPAYA', 'NANAS', 'SALAK', 'JAMBU', 'DURIAN', 'LECI', 'MANGGIS', 'SIRSAK', 'NANGKA', 'RAMBUTAN', 'KEDONDONG', 'DUKU', 'KELAPA', 'PIR', 'KURMA', 'SAWO', 'KIWI', 'DELIMA'],
    // Kendaraan
    ['MOBIL', 'MOTOR', 'SEPEDA', 'BUS', 'KERETA', 'PESAWAT', 'KAPAL', 'TRUK', 'TAKSI', 'ANGKOT', 'BECAK', 'DELMAN', 'BAJAK', 'PERAHU', 'RAKIT', 'HELIKOPTER', 'SKUTER', 'TRAKTOR', 'SAMPAN', 'BAJAJ', 'KANO', 'TREK', 'LORI', 'BEMO', 'ANDONG'],
    // Hewan Darat
    ['SINGA', 'GAJAH', 'HARIMAU', 'ZEBRA', 'MONYET', 'KUCING', 'ANJING', 'KUDA', 'KAMBING', 'SAPI', 'BABI', 'RUSA', 'JERAPAH', 'BADAK', 'UNTA', 'KELINCI', 'TIKUS', 'SERIGALA', 'BERUANG', 'KANGURU', 'BANTENG', 'LUWAK', 'MUSANG', 'TUPAI', 'LANDAK'],
    // Hewan Air & Terbang 
    ['IKAN', 'PAUS', 'HIU', 'LUMBA', 'CUMI', 'GURITA', 'UDANG', 'KEPITING', 'PENYU', 'BURUNG', 'ELANG', 'MERPATI', 'KAKAKTUA', 'GAGAK', 'BEBEK', 'ANGSA', 'KELELAWAR', 'KUPUKUPU', 'LEBAH', 'NYAMUK', 'PARI', 'BUNTAL', 'CENDRAWASIH', 'KUTILANG', 'GELATIK'],
    // Alat Sekolah
    ['BUKU', 'GURU', 'KELAS', 'PENSIL', 'TAS', 'MEJA', 'KURSI', 'UJIAN', 'SEKOLAH', 'PENGGARIS', 'PENGHAPUS', 'PAPAN', 'SPIDOL', 'PULPEN', 'KERTAS', 'JANGKA', 'SAMPUL', 'KAPUR', 'MAP', 'LEM', 'RAUTAN', 'KUAS', 'PALET', 'STAPLES', 'KLIP'],
    // Profesi
    ['DOKTER', 'GURU', 'POLISI', 'TENTARA', 'PILOT', 'NELAYAN', 'PETANI', 'PERAWAT', 'ARSITEK', 'KOKI', 'HAKIM', 'JAKSA', 'SUPIR', 'MASINIS', 'PENULIS', 'PELUKIS', 'PENYANYI', 'AKTOR', 'PROGRAMMER', 'KASIR', 'BOS', 'DIREKTUR', 'MANAJER', 'STAF', 'TUKANG'],
    // Warna
    ['MERAH', 'KUNING', 'HIJAU', 'BIRU', 'HITAM', 'PUTIH', 'UNGU', 'COKLAT', 'ABU', 'ORANGE', 'EMAS', 'PERAK', 'NILA', 'CYAN', 'MAGENTA', 'PINK', 'KREM', 'TOSCA', 'MAROON', 'LILAC', 'PERUNGGU', 'SALEM', 'KORAL', 'PERSIA', 'ZAMRUD'],
    // Olahraga
    ['BOLA', 'BASKET', 'VOLI', 'TENIS', 'BADMINTON', 'RENANG', 'LARI', 'CATUR', 'TINJU', 'SENAM', 'KARATE', 'JUDO', 'GOLF', 'MEMANAH', 'BALAP', 'YOGA', 'FUTSAL', 'BILIAR', 'BASEBALL', 'RUGBY', 'HOKI', 'SELANCAR', 'DAYUNG', 'POLO', 'ANGGAR'],
    // Negara
    ['INDONESIA', 'MALAYSIA', 'SINGAPURA', 'JEPANG', 'KOREA', 'CINA', 'AMERIKA', 'INGGRIS', 'ITALIA', 'SPANYOL', 'PRANCIS', 'JERMAN', 'RUSIA', 'INDIA', 'ARAB', 'MESIR', 'BRAZIL', 'BELANDA', 'TURKI', 'VIETNAM', 'MEKSIKO', 'KANADA', 'FILIPINA', 'THAILAND', 'BRUNEI'],
    // Sayuran
    ['BAYAM', 'KANGKUNG', 'WORTEL', 'TOMAT', 'BROKOLI', 'SAWI', 'TERONG', 'BUNCIS', 'KUBIS', 'KENTANG', 'JAMUR', 'JAGUNG', 'BAWANG', 'CABE', 'KACANG', 'SELEDRI', 'LOBAK', 'PARIA', 'TIMUN', 'LABU', 'TAOGE', 'KLUWEK', 'PETE', 'JENGKOL', 'KEDELAI'],
    // Alat Dapur 
    ['PANCI', 'WAJAN', 'PISAU', 'SENDOK', 'GARPU', 'PIRING', 'GELAS', 'MANGKUK', 'TEKO', 'OVEN', 'KIPAS', 'KULKAS', 'SUTIL', 'BASKOM', 'TUMBLER', 'TALENAN', 'PARUTAN', 'BLENDER', 'KUALI', 'CENTONG', 'COBEK', 'ULEKAN', 'SARINGAN', 'PARANG', 'TUSUKAN'],
    // Pakaian 
    ['BAJU', 'CELANA', 'KEMEJA', 'KAOS', 'JAKET', 'SEPATU', 'SANDAL', 'TOPI', 'SABUK', 'DASI', 'KACAMATA', 'JAM', 'CINCIN', 'GELANG', 'KALUNG', 'SARUNG', 'ROK', 'GAUN', 'SORBAN', 'HELM', 'SYAL', 'MANTEL', 'ROMPI', 'KIMONO', 'DASTER'],
    // Makanan & Minuman 
    ['NASI', 'MIE', 'BAKSO', 'SOTO', 'SATE', 'AYAM', 'IKAN', 'TELUR', 'TAHU', 'TEMPE', 'SAYUR', 'SAMBAL', 'ROTI', 'KUE', 'COKLAT', 'KEJU', 'SUSU', 'KOPI', 'TEH', 'GULA', 'JUS', 'ES', 'KRIM', 'SIRUP', 'JAMU'],
    // Anggota Tubuh 
    ['KEPALA', 'RAMBUT', 'MATA', 'HIDUNG', 'TELINGA', 'MULUT', 'GIGI', 'LIDAH', 'LEHER', 'BAHU', 'TANGAN', 'JARI', 'DADA', 'PERUT', 'PAHA', 'KAKI', 'LUTUT', 'TUMIT', 'KUKU', 'KULIT', 'ALIS', 'BULU', 'KUMIS', 'JANGGUT', 'PIPI'],
    // Kota Indonesia 
    ['JAKARTA', 'BANDUNG', 'SURABAYA', 'MEDAN', 'SEMARANG', 'MAKASSAR', 'PALEMBANG', 'BATAM', 'PEKANBARU', 'MALANG', 'PADANG', 'DENPASAR', 'SAMARINDA', 'PONTIANAK', 'BANJARMASIN', 'BALIKPAPAN', 'JAMBI', 'KUPANG', 'MANADO', 'AMBON', 'MATARAM', 'JAYAPURA', 'BOGOR', 'DEPOK', 'BEKASI'],
    // Bunga & Tanaman 
    ['MAWAR', 'MELATI', 'ANGGREK', 'MATAHARI', 'TULIP', 'TERATAI', 'SEPATU', 'LILI', 'KAMBOJA', 'DAHLIA', 'KENANGA', 'CEMARA', 'BAMBU', 'KAKTUS', 'RUMPUT', 'LUMUT', 'PAKIS', 'JAHE', 'KUNYIT', 'LENGKUAS', 'SERAI', 'PANDAN', 'KEMANGI', 'BINAHONG', 'SIRIH'],
    // Ruangan & Rumah 
    ['KAMAR', 'DAPUR', 'TAMU', 'MANDI', 'TERAS', 'GUDANG', 'HALAMAN', 'GARASI', 'PINTU', 'JENDELA', 'ATAP', 'LANTAI', 'DINDING', 'PAGAR', 'TANGGA', 'PLAFON', 'BALKON', 'TAMAN', 'KOLAM', 'SUMUR', 'GENTENG', 'TIANG', 'KUNCI', 'GEMBOK', 'BEL'],
    // Alat Musik 
    ['GITAR', 'PIANO', 'DRUM', 'SULING', 'BIOLA', 'BASS', 'HARPA', 'TEROMPET', 'SAKSOFON', 'REBANA', 'GENDANG', 'KECAPI', 'ANGKLUNG', 'KOLINTANG', 'SASANDO', 'GAMELAN', 'GONG', 'BONANG', 'SARON', 'SITER', 'TAMBORIN', 'HARMONIKA', 'AKORDEON', 'UKULELE', 'SIMBAL'],
    // Luar Angkasa 
    ['BUMI', 'BULAN', 'MATAHARI', 'BINTANG', 'MARS', 'VENUS', 'JUPITER', 'SATURNUS', 'URANUS', 'NEPTUNUS', 'PLUTO', 'METEOR', 'KOMET', 'GALAXY', 'ASTEROID', 'ORBIT', 'ROKET', 'SATELIT', 'UFO', 'ALIEN', 'ASTRONOT', 'KOSMOS', 'SUPERNOVA', 'LUBANG', 'HITAM'],
    // Cuaca & Iklim 
    ['PANAS', 'DINGIN', 'CERAH', 'MENDUNG', 'KEMARAU', 'SALJU', 'GERIMIS', 'BADAI', 'KILAT', 'PETIR', 'GELUDUG', 'ANGIN', 'EMBUN', 'IKLIM', 'CUACA', 'TOPAN', 'TSUNAMI', 'GEMPA', 'BANJIR', 'LONGSOR', 'PANTAI', 'TROPIS', 'KUTUB', 'AWAN', 'SUHU'],
    // Perasaan & Emosi 
    ['SENANG', 'SEDIH', 'MARAH', 'TAKUT', 'BOSAN', 'MALU', 'KAGET', 'CINTA', 'BENCI', 'RINDU', 'KECEWA', 'BANGGA', 'HARU', 'CEMAS', 'GELISAH', 'PANIK', 'BINGUNG', 'KESAL', 'MUAK', 'GEMBIRA', 'BAHAGIA', 'SYOK', 'DENDAM', 'IRI', 'DENGKI'],
    // Bagian Kendaraan 
    ['RODA', 'BAN', 'MESIN', 'KACA', 'SPION', 'STIR', 'JOK', 'KNALPOT', 'BAGASI', 'KOPLING', 'REM', 'GAS', 'GIGI', 'PEDAL', 'BEMPER', 'HELM', 'AKI', 'RANTAI', 'BUSI', 'TANGKI', 'KABIN', 'LAMPU', 'SABUK', 'WIPER', 'KAP'],
    // Alat Tukang 
    ['PALU', 'PAKU', 'GERGAJI', 'OBENG', 'TANG', 'BAUT', 'MUR', 'KUNCI', 'METERAN', 'KAPAK', 'PAHAT', 'BOR', 'KLEM', 'SEKOP', 'KUAS', 'AMPLAS', 'WATERPAS', 'SENTER', 'GUNTING', 'CUTTER', 'ROLL', 'KATROL', 'MESIN', 'LEM', 'KARET'],
    // Mitos & Legenda 
    ['NAGA', 'PERI', 'RAKSASA', 'TUYUL', 'POCONG', 'KUNTI', 'GENDERUWO', 'JIN', 'SETAN', 'IBLIS', 'MALAIKAT', 'DEWA', 'DEWI', 'HANTU', 'ZOMBIE', 'VAMPIR', 'DRACULA', 'YETI', 'MERMAID', 'UNICORN', 'PHOENIX', 'CYCLOPS', 'KRAKEN', 'MUMMY', 'GOLEM'],
    // Bentuk & Bangun 
    ['KOTAK', 'BULAT', 'BUNDAR', 'SEGI', 'TIGA', 'EMPAT', 'LIMA', 'ENAM', 'OVAL', 'KUBUS', 'BALOK', 'TABUNG', 'KERUCUT', 'BOLA', 'PRISMA', 'LIMAS', 'ELIPS', 'TRAPESIUM', 'LAYANG', 'BELAH', 'KETUPAT', 'GARIS', 'SUDUT', 'RUANG', 'DATAR'],
    // Transportasi Umum 
    ['HALTE', 'STASIUN', 'TERMINAL', 'BANDARA', 'PELABUHAN', 'TIKET', 'KARCIS', 'KASIR', 'LOKET', 'SUPIR', 'KONDEKTUR', 'MASINIS', 'PILOT', 'NAKHODA', 'PENUMPANG', 'BAGASI', 'KURSI', 'JADWAL', 'RUTE', 'ONGKOS', 'KARTU', 'UANG', 'BAYAR', 'JALUR', 'REL'],
    // Nama Hari & Bulan 
    ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU', 'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER', 'HARI', 'MINGGUAN', 'BULANAN', 'TAHUNAN', 'ABAD', 'DEKADE'],
    // Istilah Teknologi 
    ['DATA', 'FILE', 'FOLDER', 'SERVER', 'JARINGAN', 'INTERNET', 'WIFI', 'SINYAL', 'KUOTA', 'PULSA', 'LAYAR', 'MOUSE', 'KEYBOARD', 'MONITOR', 'LAPTOP', 'PONSEL', 'APLIKASI', 'SISTEM', 'PROGRAM', 'VIRUS', 'HACKER', 'KODE', 'SANDI', 'LOGIN', 'AKUN'],
    // Hobi & Hiburan 
    ['BACA', 'TULIS', 'GAMBAR', 'LUKIS', 'NYANYI', 'JOGET', 'TARI', 'MAIN', 'GAME', 'FILM', 'MUSIK', 'TIDUR', 'MAKAN', 'MASAK', 'BELANJA', 'JALAN', 'KEMAH', 'FOTO', 'VIDEO', 'VLOG', 'SENI', 'PUISI', 'SASTRA', 'TEATER', 'DRAMA']
  ];

  // ===== INIT =====
  ngOnInit() {
    this.audioService.playBgm();
    this.generateLevels();
  }

  ngAfterViewInit() {
    const gesture = this.gestureCtrl.create({
      el: this.gridBoard.nativeElement,
      gestureName: 'word-search-drag',
      threshold: 0,
      onStart: (detail) => this.onDragStart(detail),
      onMove: (detail) => this.onDragMove(detail),
      onEnd: (detail) => this.onDragEnd(detail)
    });
    gesture.enable(true);
  }

  ionViewWillEnter() {
    const savedLevel = localStorage.getItem('currentLevelIndex');
    if (savedLevel) {
      this.currentLevelIndex = parseInt(savedLevel, 10);
      if (isNaN(this.currentLevelIndex) || this.currentLevelIndex < 0 || this.currentLevelIndex >= this.levels.length) {
        this.currentLevelIndex = 0;
      }
    } else {
      this.currentLevelIndex = 0;
    }
    this.setLevel();
  }

  ionViewDidEnter() {
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(10, () => {
      if (this.showSettings) {
        this.closeSettings();
      } else {
        this.goBack();
      }
    });
  }

  ionViewWillLeave() {
    if (this.backButtonSub) {
      this.backButtonSub.unsubscribe();
    }
  }

  ngOnDestroy() {
    // Music plays globally now, so we don't stop it when leaving home
  }

  // ===== LEVEL SYSTEM =====
  generateLevels() {
    this.levels = [];

    // Gabungkan semua kata dari semua tema menjadi satu array (hilangkan duplikat tanpa Set untuk hindari error TS)
    const allWords = this.themes
      .reduce((acc, curr) => acc.concat(curr), [])
      .filter((value, index, self) => self.indexOf(value) === index);

    // Ubah dari 100 menjadi 1000 level
    for (let i = 0; i < 1000; i++) {
      const gridSize = this.getGridSize(i);

      // Pastikan hanya mengambil kata yang muat di grid
      const validWords = allWords.filter(w => w.length <= gridSize);

      this.levels.push({
        size: gridSize,
        words: this.getRandomWords(validWords, this.getWordCount(i))
      });
    }
  }

  getGridSize(level: number) {
    if (level < 10) return 7;
    if (level < 25) return 8;
    if (level < 50) return 9;
    if (level < 100) return 10;
    if (level < 200) return 11;
    if (level < 350) return 12;
    if (level < 500) return 13;
    if (level < 700) return 14;
    if (level < 900) return 15;
    return 16;
  }

  getWordCount(level: number) {
    if (level < 10) return 3;
    if (level < 25) return 4;
    if (level < 50) return 5;
    if (level < 100) return 6;
    if (level < 200) return 7;
    if (level < 350) return 8;
    if (level < 500) return 9;
    if (level < 700) return 10;
    if (level < 900) return 11;
    return 12;
  }

  setLevel() {
    const level = this.levels[this.currentLevelIndex];

    this.gridSize = level.size;
    this.words = level.words;

    this.foundWords = [];
    this.lines = [];
    this.hintedCells = [];
    this.hintCount = 2; // Beri 2 hint setiap level baru

    this.generateGrid();
  }

  nextLevel() {
    if (this.currentLevelIndex < this.levels.length - 1) {
      this.currentLevelIndex++;
      localStorage.setItem('currentLevelIndex', this.currentLevelIndex.toString());
      this.setLevel();
    } else {
      alert('Semua level selesai!');
    }
  }

  resetGame() {
    this.audioService.playSfx('click');
    this.setLevel();
  }

  useHint() {
    this.audioService.playSfx('click');

    if (this.hintCount <= 0) return;

    // Cari kata yang belum ditemukan
    const unfoundWord = this.words.find(w => !this.foundWords.includes(w));
    if (!unfoundWord || !this.wordPaths[unfoundWord]) return;

    // Kurangi jatah hint
    this.hintCount--;

    // Ambil sel huruf pertama dari kata tersebut
    const firstCell = this.wordPaths[unfoundWord][0];

    // Tambahkan ke array hintedCells jika belum ada
    if (!this.hintedCells.some(h => h.r === firstCell.r && h.c === firstCell.c)) {
      this.hintedCells.push(firstCell);
    }
  }

  isHinted(row: number, col: number) {
    return this.hintedCells.some(h => h.r === row && h.c === col);
  }

  goBack() {
    this.audioService.playSfx('click');
    this.navCtrl.navigateBack('/menu');
  }

  getRandomWords(theme: string[], count: number) {
    return [...theme].sort(() => Math.random() - 0.5).slice(0, count);
  }

  // ===== GRID GENERATOR (FIX) =====
  generateGrid() {
    this.wordPaths = {};
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    this.grid = Array.from({ length: this.gridSize }, () =>
      Array(this.gridSize).fill('')
    );

    const directions = [
      { r: 0, c: 1 }, { r: 1, c: 0 },
      { r: 1, c: 1 }, { r: 1, c: -1 },
      { r: 0, c: -1 }, { r: -1, c: 0 },
      { r: -1, c: -1 }, { r: -1, c: 1 }
    ];

    this.words.forEach(word => {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 200) {
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const row = Math.floor(Math.random() * this.gridSize);
        const col = Math.floor(Math.random() * this.gridSize);

        const endRow = row + dir.r * (word.length - 1);
        const endCol = col + dir.c * (word.length - 1);

        if (
          endRow >= 0 && endRow < this.gridSize &&
          endCol >= 0 && endCol < this.gridSize
        ) {
          let canPlace = true;

          for (let i = 0; i < word.length; i++) {
            const r = row + dir.r * i;
            const c = col + dir.c * i;

            if (this.grid[r][c] !== '' && this.grid[r][c] !== word[i]) {
              canPlace = false;
              break;
            }
          }

          if (canPlace) {
            const path = [];
            for (let i = 0; i < word.length; i++) {
              const r = row + dir.r * i;
              const c = col + dir.c * i;
              this.grid[r][c] = word[i];
              path.push({ r, c });
            }
            this.wordPaths[word] = path;
            placed = true;
          }
        }

        attempts++;
      }
    });

    // isi huruf random
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (this.grid[i][j] === '') {
          this.grid[i][j] =
            letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }
  }

  // ===== DRAG SYSTEM =====
  startSelection(row: number, col: number) {
    this.audioService.playSfx('click');
    this.audioService.vibrate('light');
    this.isDragging = true;
    this.startPos = { row, col };
    this.currentPath = [{ row, col }];
  }

  moveSelection(row: number, col: number) {
    if (!this.isDragging) return;
    this.currentPath = this.getLine(this.startPos, { row, col });
  }

  endSelection() {
    this.isDragging = false;

    const word = this.currentPath
      .map(p => this.grid[p.row][p.col])
      .join('');

    const reversed = word.split('').reverse().join('');

    let finalWord = '';

    if (this.words.includes(word)) finalWord = word;
    else if (this.words.includes(reversed)) finalWord = reversed;

    if (finalWord && !this.foundWords.includes(finalWord)) {
      this.foundWords.push(finalWord);

      // Hapus hint jika hurufnya termasuk dalam kata yang baru ditemukan
      const path = this.wordPaths[finalWord];
      if (path) {
        this.hintedCells = this.hintedCells.filter(h =>
          !path.some((p: any) => p.r === h.r && p.c === h.c)
        );
      }

      this.audioService.playSfx('success');
      this.audioService.vibrate('heavy');

      this.lines.push({
        path: [...this.currentPath],
        color: this.currentColor
      });

      // Cek apakah semua kata sudah ditemukan
      if (this.foundWords.length === this.words.length) {
        this.showHebat = true;
        setTimeout(() => {
          this.showHebat = false;
          this.nextLevel();
        }, 1500);
      }
    }

    this.currentPath = [];
  }

  // ===== LINE PATH =====
  getLine(start: any, end: any) {
    const result = [];

    const rowDiff = end.row - start.row;
    const colDiff = end.col - start.col;

    // Pastikan pergerakan hanya lurus (horizontal, vertikal, atau diagonal sempurna)
    if (Math.abs(rowDiff) !== Math.abs(colDiff) && rowDiff !== 0 && colDiff !== 0) {
      return [{ row: start.row, col: start.col }];
    }

    const rowStep = Math.sign(rowDiff);
    const colStep = Math.sign(colDiff);

    let row = start.row;
    let col = start.col;

    let limit = 100; // Failsafe untuk mencegah infinite loop
    while (limit-- > 0) {
      result.push({ row, col });

      if (row === end.row && col === end.col) break;

      row += rowStep;
      col += colStep;
    }

    return result;
  }

  isInPath(row: number, col: number) {
    return this.currentPath.some(p => p.row === row && p.col === col);
  }

  // ===== GESTURE HANDLERS =====
  onDragStart(detail: any) {
    this.zone.run(() => {
      const el = document.elementFromPoint(detail.currentX, detail.currentY) as HTMLElement;
      if (!el) return;

      const row = el.getAttribute('data-row');
      const col = el.getAttribute('data-col');

      if (row !== null && col !== null) {
        this.startSelection(+row, +col);
      }
    });
  }

  onDragMove(detail: any) {
    if (!this.isDragging) return;
    this.zone.run(() => {
      const el = document.elementFromPoint(detail.currentX, detail.currentY) as HTMLElement;
      if (!el) return;

      const row = el.getAttribute('data-row');
      const col = el.getAttribute('data-col');

      if (row !== null && col !== null) {
        this.moveSelection(+row, +col);
      }
    });
  }

  onDragEnd(detail: any) {
    this.zone.run(() => {
      if (this.isDragging) {
        this.endSelection();
      }
    });
  }

  // ===== FIX GARIS AKURAT =====
  getCellCenter(row: number, col: number) {
    const el = document.querySelector(
      `[data-row="${row}"][data-col="${col}"]`
    ) as HTMLElement;

    if (!el) return { x: 0, y: 0 };

    const rect = el.getBoundingClientRect();
    const parent = el.closest('.grid-board') as HTMLElement;

    if (!parent) return { x: 0, y: 0 };

    const parentRect = parent.getBoundingClientRect();

    return {
      x: rect.left - parentRect.left + rect.width / 2,
      y: rect.top - parentRect.top + rect.height / 2
    };
  }
}