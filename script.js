/* ============================================================================
   ReviewCard — Landing page
   script.js

   Tanpa library. Semua bagian dibungkus try/catch secara terpisah: satu
   bagian yang gagal tidak boleh menghentikan bagian lain.

   KONTRAK KEAMANAN
   Script ini tidak pernah menyentuh opacity/display/visibility/width elemen
   kartu 3D atau konten halaman. Satu-satunya state tersembunyi adalah
   atribut [data-reveal], dan itu HANYA disembunyikan bila <html> punya kelas
   "js-reveal" — kelas yang ditambahkan oleh script ini sendiri.

   Artinya: kalau script ini gagal total, halaman tetap tampil utuh.

   Daftar isi
   A. Utilitas          E. Scroll spy
   B. Tema             F. Reveal
   C. Navbar           G. FAQ
   D. Kartu 3D (tilt)  H. Form kontak
   I. Inisialisasi
   ========================================================================= */

(function () {
"use strict";

/* ==========================================================================
   A. UTILITAS
   ========================================================================== */
var $  = function (sel, root) { return (root || document).querySelector(sel); };
var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function lerp(a, b, k)  { return a + (b - a) * k; }

var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var fine   = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* bungkus satu bagian agar error-nya tidak mematikan bagian lain */
function safe(name, fn) {
  try { fn(); }
  catch (err) {
    if (window.console && console.error) console.error("[ReviewCard] " + name + ":", err);
  }
}


/* ==========================================================================
   A2. KONFIGURASI PUSAT
   --------------------------------------------------------------------------
   Ubah HANYA baris WA di bawah ini kalau nomor WhatsApp berubah.
   Script ini akan menulis ulang SEMUA link wa.me di halaman secara otomatis.

   WA harus format internasional tanpa "+" dan tanpa angka 0 di depan:
     0882 1272 5000  ->  6288212725000
   ========================================================================== */
var WA = "6288212725000";

safe("link WhatsApp", function () {
  var links = $$('a[href*="wa.me"]');
  links.forEach(function (a) {
    var href = a.getAttribute("href") || "";
    var m = href.match(/^https:\/\/wa\.me\/(\d+)(.*)$/);
    if (m) a.setAttribute("href", "https://wa.me/" + WA + m[2]);
  });
});



/* ==========================================================================
   B. TEMA TERANG / GELAP
   ========================================================================== */
safe("tema", function () {
  var root   = document.documentElement;
  var toggle = $("#themeToggle");
  if (!toggle) return;

  function current() { return root.getAttribute("data-theme") === "dark" ? "dark" : "light"; }

  function apply(mode) {
    root.setAttribute("data-theme", mode);
    toggle.setAttribute("aria-label",
      mode === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap");
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", mode === "dark" ? "#0a0e17" : "#1a73e8");
    try { localStorage.setItem("rc-theme", mode); } catch (e) { /* abaikan */ }
  }

  /* set label awal sesuai tema yang sudah dipasang <head> */
  apply(current());

  toggle.addEventListener("click", function () {
    apply(current() === "dark" ? "light" : "dark");
  });
});


/* ==========================================================================
   C. NAVBAR
   ========================================================================== */
safe("navbar", function () {
  var nav    = $("#nav");
  var burger = $("#navBurger");
  var menu   = $("#navMenu");

  /* --- blur saat scroll --- */
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle("is-stuck", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* --- menu mobile --- */
  if (burger && menu) {
    var setOpen = function (open) {
      menu.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
    };
    burger.addEventListener("click", function () {
      setOpen(burger.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target && e.target.tagName === "A") setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }
});


/* ==========================================================================
   D. KARTU 3D — TILT (tidak mengubah ukuran/visibilitas)
   ========================================================================== */
function createTilt(card, opt) {
  var o         = opt || {};
  var MAX_TILT  = (o.max   != null) ? o.max   : 11;
  var MAX_SCALE = (o.scale != null) ? o.scale : 1.02;
  var cast      = o.cast || null;

  function setVar(k, v) { card.style.setProperty(k, v); }

  if (reduce || !card) return;

  var cur = { x:0, y:0, s:1 },  tgt = { x:0, y:0, s:1 };
  var gl  = { gx:50, gy:50, ga:0, go:0 }, glT = { gx:50, gy:50, ga:0, go:0 };
  var sh  = { x:0, y:0, s:1, o:.9 },     shT = { x:0, y:0, s:1, o:.9 };

  var dragging = false, startX = 0, startY = 0, baseX = 0, baseY = 0;
  var idleAt = performance.now();
  var rafId = 0;

  function onMove(e) {
    var r = card.getBoundingClientRect();
    if (!r || !r.width || !r.height) return;
    var px = (e.clientX - r.left) / r.width;
    var py = (e.clientY - r.top)  / r.height;
    idleAt = performance.now();

    if (dragging) {
      tgt.x = clamp(baseX - (e.clientY - startY) * 0.30, -34, 34);
      tgt.y = baseY + (e.clientX - startX) * 0.34;
    } else {
      tgt.x = (0.5 - py) * MAX_TILT;
      tgt.y = (px - 0.5) * MAX_TILT;
      tgt.s = MAX_SCALE;
    }

    glT.gx = px * 100;  glT.gy = py * 100;
    glT.ga = (px - 0.5) * 120;  glT.go = 1;

    shT.x = (px - 0.5) * 22;  shT.y = (py - 0.5) * 10;
    shT.s = 1 - Math.abs(py - 0.5) * 0.30;
    shT.o = 1 - Math.abs(py - 0.5) * 0.28;
  }

  function onLeave() {
    tgt.x = 0; tgt.y = 0; tgt.s = 1;
    glT.go = 0; glT.ga = 0;
    shT.x = 0; shT.y = 0; shT.s = 1; shT.o = 0.9;
  }

  function onDown(e) {
    dragging = true;
    baseX = cur.x; baseY = cur.y;
    startX = e.clientX; startY = e.clientY;
    card.classList.add("is-drag");
    try { card.setPointerCapture(e.pointerId); } catch (err) { /* abaikan */ }
  }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    card.classList.remove("is-drag");
    onLeave();
  }
  function onKey(e) {
    var step = 6, used = true;
    if      (e.key === "ArrowUp")    tgt.x -= step;
    else if (e.key === "ArrowDown")  tgt.x += step;
    else if (e.key === "ArrowLeft")  tgt.y -= step;
    else if (e.key === "ArrowRight") tgt.y += step;
    else used = false;
    if (!used) return;
    e.preventDefault();
    tgt.x = clamp(tgt.x, -24, 24); tgt.y = clamp(tgt.y, -24, 24);
    tgt.s = MAX_SCALE; glT.go = 1;
    clearTimeout(onKey.timer);
    onKey.timer = setTimeout(onLeave, 1200);
  }

  card.addEventListener("pointermove", onMove);
  card.addEventListener("pointerenter", onMove);
  card.addEventListener("pointerleave", function () { if (!dragging) onLeave(); });
  card.addEventListener("pointerdown", onDown);
  card.addEventListener("keydown", onKey);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  function frame(now) {
    var idle = ((now - idleAt) > 2600) && !dragging;
    var wobX = idle ? Math.sin(now / 2100) * 1.5 : 0;
    var wobY = idle ? Math.cos(now / 2600) * 2.0 : 0;

    cur.x = lerp(cur.x, tgt.x + wobX, 0.12);
    cur.y = lerp(cur.y, tgt.y + wobY, 0.12);
    cur.s = lerp(cur.s, tgt.s, 0.12);

    gl.gx = lerp(gl.gx, glT.gx, 0.18);  gl.gy = lerp(gl.gy, glT.gy, 0.18);
    gl.ga = lerp(gl.ga, glT.ga, 0.10);  gl.go = lerp(gl.go, glT.go, 0.10);

    sh.x = lerp(sh.x, shT.x, 0.12);  sh.y = lerp(sh.y, shT.y, 0.12);
    sh.s = lerp(sh.s, shT.s, 0.12);  sh.o = lerp(sh.o, shT.o, 0.12);

    card.style.transform =
      "rotateX(" + cur.x.toFixed(3) + "deg) " +
      "rotateY(" + cur.y.toFixed(3) + "deg) " +
      "scale(" + cur.s.toFixed(4) + ")";

    setVar("--gx", gl.gx.toFixed(1) + "%");
    setVar("--gy", gl.gy.toFixed(1) + "%");
    setVar("--ga", gl.ga.toFixed(1) + "deg");
    setVar("--go", gl.go.toFixed(3));

    if (cast) {
      cast.style.transform =
        "translate(-50%,0) translate(" + sh.x.toFixed(1) + "px," +
        sh.y.toFixed(1) + "px) scale(" + sh.s.toFixed(3) + ")";
      cast.style.opacity = sh.o.toFixed(3);
    }
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);

  return { destroy: function () { window.cancelAnimationFrame(rafId); } };
}

safe("kartu 3D", function () {
  var card = $("#card");
  if (!card) return;
  createTilt(card, { max: fine ? 11 : 7, scale: 1.02, cast: $("#cast") });
});


/* ==========================================================================
   E. SCROLL SPY — tandai menu aktif
   ========================================================================== */
safe("scroll spy", function () {
  var links = $$("#navMenu a[href^='#']");
  if (!links.length || !("IntersectionObserver" in window)) return;

  var map = {};
  links.forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    var sec = document.getElementById(id);
    if (sec) map[id] = a;
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var link = map[en.target.id];
      if (!link) return;
      if (en.isIntersecting) {
        links.forEach(function (l) { l.classList.remove("is-active"); });
        link.classList.add("is-active");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });

  Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
});


/* ==========================================================================
   F. REVEAL (fade-in-up)
   ========================================================================== */
safe("reveal", function () {
  var items = $$("[data-reveal]");
  if (!items.length) return;

  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }

  /* baru aktifkan state tersembunyi SEBELUM observe, supaya tidak berkedip */
  document.documentElement.classList.add("js-reveal");

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("is-in");
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

  items.forEach(function (el) { io.observe(el); });

  /* jaring pengaman: bila observer tidak memicu (mis. section tinggi 0),
     tetap tampilkan setelah 2,5 detik */
  window.setTimeout(function () {
    items.forEach(function (el) { el.classList.add("is-in"); });
  }, 2500);
});


/* ==========================================================================
   G. FAQ — tutup yang lain saat satu dibuka
   (accordion-nya sendiri <details>, jadi jalan tanpa JS)
   ========================================================================== */
safe("faq", function () {
  var list = $$(".faq__item");
  if (!list.length) return;
  list.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      list.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });
});


/* ==========================================================================
   H. FORM KONTAK
   ========================================================================== */
safe("form kontak", function () {
  var form = $("#contactForm");
  var note = $("#formNote");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var name  = form.elements.nama;
    var mail  = form.elements.email;
    var pesan = form.elements.pesan;

    var bad = [];
    [name, mail, pesan].forEach(function (f) {
      var empty = !f || !f.value.trim();
      var mailBad = mail && !empty && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim());
      if (f) f.classList.toggle("is-bad", empty || !!mailBad);
      if (empty || mailBad) bad.push(f ? (f.name || "field") : "field");
    });

    if (note) {
      if (bad.length) {
        note.textContent = "Mohon lengkapi nama, email yang valid, dan pesan.";
        note.classList.remove("is-ok");
      } else {
        note.textContent = "Terima kasih, " + name.value.trim() + "! Pesan Anda sudah kami terima.";
        note.classList.add("is-ok");
        form.reset();
      }
    }
  });
});


/* ==========================================================================
   I. INISIALISASI
   ========================================================================== */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () { /* semua init sudah jalan */ });
}

if (window.console && console.log) {
  console.log("%cReviewCard — siap. thanks to no libraries.", "color:#1a73e8;font-weight:700");
}

})();


/* ==========================================================================
   J. KONFIGURASI HARGA & DISKON
   --------------------------------------------------------------------------
   Ubah HANYA nilai di bawah ini. Tabel diskon di index.html dan kalkulator
   memakai nilai yang sama, jadi cukup ubah di satu tempat.

   PENTING: nilai diskon di sini masih PLACEHOLDER. Ganti dengan angka
   diskon resmi Anda sebelum situs tayang.
   ========================================================================== */
var HARGA = {
  basic: 50000,      /* Basic — PVC + stand   */
  pro:   100000      /* Pro — Akrilik + stand */
};

/* [ minimal qty, persen diskon ] — yang pertama cocok akan dipakai */
var DISKON = [
  { min: 20, pct: 12 },
  { min: 10, pct: 8  },
  { min: 5,  pct: 5  }
];

function diskonUntuk(qty) {
  for (var i = 0; i < DISKON.length; i++) {
    if (qty >= DISKON[i].min) return DISKON[i].pct;
  }
  return 0;
}

function rupiah(n) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}


/* ==========================================================================
   K. WHATSAPP MELAYANG
   ========================================================================== */
safe("wa melayang", function () {
  var el = $("#waFloat");
  if (!el) return;
  var onScroll = function () {
    if (window.innerWidth > 600) return;
    el.classList.toggle("is-show", window.scrollY > 260);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
});


/* ==========================================================================
   L. DEMO INTERAKTIF
   ========================================================================== */
safe("demo interaktif", function () {
  var play   = $("#demoPlay");
  var reset  = $("#demoReset");
  var again  = $("#demoAgain");
  var steps  = $$("#demoSteps li");
  var stars  = $$("#demoStars button");
  var hint   = $("#demoHint");
  var write  = $("#demoWrite");
  var total  = $("#oTotal");            /* panel estimasi ikut berubah */

  if (!play || !steps.length) return;

  var step = 0;
  var rating = 0;
  var timer = null;

  function paint() {
    $$(".scr").forEach(function (s) {
      s.classList.toggle("is-on", s.getAttribute("data-scr") === String(step));
    });
    steps.forEach(function (li, i) { li.classList.toggle("is-on", i === step); });
  }

  function show(n) {
    step = clamp(n, 0, 2);
    paint();
  }

  /* pilih bintang */
  stars.forEach(function (b) {
    b.addEventListener("click", function () {
      rating = parseInt(b.getAttribute("data-v"), 10) || 0;
      stars.forEach(function (o) {
        o.classList.toggle("is-on", parseInt(o.getAttribute("data-v"), 10) <= rating);
      });
      if (hint) hint.textContent = rating + " bintang dipilih";
      if (write) write.classList.add("is-on");
    });
  });

  /* tombol tulis ulasan -> lanjut ke layar sukses */
  if (write) {
    write.addEventListener("click", function () {
      if (!rating) return;
      if (total) {
        total.hidden = false;
        total.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
      }
      show(2);
    });
  }

  function restart() {
    rating = 0;
    stars.forEach(function (o) { o.classList.remove("is-on"); });
    if (hint) hint.textContent = "Ketuk bintang untuk memberi rating";
    if (write) write.classList.remove("is-on");
    if (total) total.hidden = true;
    show(0);
  }

  if (again) again.addEventListener("click", restart);
  if (reset) reset.addEventListener("click", restart);

  /* putar otomatis: 0 -> 1 (delay) -> 2 */
  if (play) {
    play.addEventListener("click", function () {
      clearTimeout(timer);
      restart();
      this.disabled = true;
      this.textContent = "Memutar...";
      timer = setTimeout(function () {
        show(1);
        timer = setTimeout(function () {
          show(2);
          play.disabled = false;
          play.textContent = "Putar Demo";
        }, 3200);
      }, 1400);
    });
  }
});


/* ==========================================================================
   M. KALKULATOR DISKON
   ========================================================================== */
safe("kalkulator", function () {
  var paket = $("#calcPaket");
  var qty   = $("#calcQty");
  if (!paket || !qty) return;

  var uUnit  = $("#calcUnit");
  var uDisc  = $("#calcDisc");
  var uTotal = $("#calcTotal");
  var hint   = $("#calcHint");
  var wa     = $("#calcWa");

  function paint() {
    var n  = parseInt(qty.value, 10) || 1;
    var pc = diskonUntuk(n);
    var base  = parseInt(paket.value, 10) || HARGA.pro;
    var unit  = Math.round(base * (1 - pc / 100));
    var total = unit * n;
    var nama  = /^Basic/.test(paket.options[paket.selectedIndex].text) ? "Basic (PVC)" : "Pro (Akrilik)";

    if (uUnit)  uUnit.textContent  = rupiah(unit);
    if (uDisc)  uDisc.textContent  = pc + "%";
    if (uTotal) uTotal.textContent = rupiah(total);
    if (hint)   hint.textContent   = pc > 0
      ? "Diskon " + pc + "% sudah termasuk. Belum termasuk ongkir."
      : "Belum termasuk ongkir. Pesan 5 pcs untuk hemat 5%.";

    /* tandai baris tabel yang sesuai */
    $$("[data-qty]").forEach(function (tr) {
      var min = parseInt(tr.getAttribute("data-qty"), 10) || 1;
      var hi  = (min === 1) ? n < 5 : n >= min;
      tr.classList.toggle("is-hint", hi);
    });

    /* tautan WA ikut membawa ringkasan */
    if (wa) {
      var msg = "Halo, saya ingin memesan " + n + " kartu (" + nama + ")"
        + (pc > 0 ? " dengan diskon " + pc + "%" : "")
        + ". Perkiraan total " + rupiah(total) + ". Boleh info ongkir?";
      wa.setAttribute("href", "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg));
    }
  }

  paket.addEventListener("change", paint);
  qty.addEventListener("input", paint);
  paint();
});


/* ==========================================================================
   N. FORM PESANAN
   ========================================================================== */
safe("form pesanan", function () {
  var form = $("#orderForm");
  if (!form) return;

  var note  = $("#oNote");
  var total = $("#oTotal");
  var totalVal = $("#oTotalVal");
  var upload   = $("#oUpload");
  var logoName = $("#oLogoName");
  var logoInput= $("#oLogo");
  var paket    = $("#oPaket");
  var qty      = $("#oQty");

  function hitung() {
    var n = parseInt(qty.value, 10) || 1;
    var t = paket.options[paket.selectedIndex].text;
    var base = /^Basic/.test(t) ? HARGA.basic
            : /^Pro/.test(t)   ? HARGA.pro
            : 0;                                  /* Enterprise:custom */
    if (!base) {
      if (total) total.hidden = true;
      return;
    }
    var pc  = diskonUntuk(n);
    var sum = Math.round(base * (1 - pc / 100)) * n;
    if (total) total.hidden = false;
    if (totalVal) totalVal.textContent = rupiah(sum) + (pc > 0 ? " (diskon " + pc + "%)" : "");
  }

  paket.addEventListener("change", hitung);
  qty.addEventListener("input", hitung);
  hitung();

  /* pratinjau nama berkas logo */
  if (logoInput) {
    logoInput.addEventListener("change", function () {
      var f = this.files && this.files[0];
      if (!f) {
        if (upload) upload.classList.remove("has-file");
        if (logoName) logoName.textContent = "Pilih berkas logo";
        return;
      }
      /* validasi ringan di sisi klien */
      if (f.size > 5 * 1024 * 1024) {
        if (note) { note.textContent = "Ukuran logo melebihi 5 MB. Pilih berkas yang lebih kecil."; note.classList.remove("is-ok"); }
        this.value = "";
        return;
      }
      if (upload) upload.classList.add("has-file");
      if (logoName) logoName.textContent = f.name;
      if (note) { note.textContent = "Logo siap. Jangan lupa lampirkan di WhatsApp."; note.classList.add("is-ok"); }
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var f      = form.elements;
    var bisnis = (f.bisnis && f.bisnis.value || "").trim();
    var link   = (f.link   && f.link.value   || "").trim();
    var catatan= (f.catatan&& f.catatan.value|| "").trim();
    var logo   = logoInput && logoInput.files && logoInput.files[0];
    var n      = parseInt(f.jumlah && f.jumlah.value, 10) || 1;
    var t      = f.paket.options[f.paket.selectedIndex].text;
    var pc     = diskonUntuk(n);
    var base   = /^Basic/.test(t) ? HARGA.basic : /^Pro/.test(t) ? HARGA.pro : 0;
    var sum    = base ? Math.round(base * (1 - pc / 100)) * n : 0;

    /* validasi */
    var bad = [];
    if (!bisnis) bad.push(f.bisnis);
    if (!link || !/^https?:\/\/.+\..+/.test(link)) bad.push(f.link);
    bad.forEach(function (el) { if (el) el.classList.add("is-bad"); });

    if (bad.length) {
      if (note) { note.textContent = "Mohon isi nama bisnis dan link Google review yang valid."; note.classList.remove("is-ok"); }
      return;
    }
    [f.bisnis, f.link].forEach(function (el) { if (el) el.classList.remove("is-bad"); });

    /* rangkum pesan */
    var lines = [
      "*PESANAN KARTU NFC/QR*",
      "",
      "Nama bisnis   : " + bisnis,
      "Paket         : " + t,
      "Jumlah        : " + n + " pcs"
    ];
    if (pc > 0)  lines.push("Diskon        : " + pc + "%");
    if (sum > 0)  lines.push("Estimasi total: " + rupiah(sum) + " (belum ongkir)");
    lines.push("Link review   : " + link);
    if (logo)     lines.push("Logo          : " + logo.name + " (akan saya lampirkan)");
    if (catatan)   lines.push("", "Catatan desain:", catatan);
    lines.push("", "Mohon info ongkir dan estimasi pengirimannya. Terima kasih.");

    track("order_submit", { paket: t, qty: n, diskon: pc });

    window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(lines.join("\n")),
                "_blank", "noopener");

    if (note) {
      note.textContent = "Pesanan dirangkum. Lanjutkan kirim di WhatsApp, lalu lampirkan logo bila ada.";
      note.classList.add("is-ok");
    }
  });
});


/* ==========================================================================
   O. PELACAKAN KLIK WHATSAPP (analytics ringan)
   --------------------------------------------------------------------------
   Tanpa library. Melepas event kustom + mengirim ke gtag/GA4 bila ada.
   Ganti GA_ID di bawah dengan ID milik Anda.
   ========================================================================== */
var GA_ID = "";   /* contoh: "G-XXXXXXXXXX" */

function track(name, params) {
  try {
    if (window.gtag) {
      window.gtag("event", name, params || {});
    } else if (window.dataLayer) {
      window.dataLayer.push({ event: name, ...(params || {}) });
    }
  } catch (e) { /* abaikan */ }
}

safe("pelacakan", function () {
  /* 1. event global untuk klik WA, plus atribut untuk GA */
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href*="wa.me"]') : null;
    if (!a) return;
    a.setAttribute("data-ga", "wa_click");
    track("wa_click", { label: (a.getAttribute("data-ga-label") || "cta") });
  }, true);

  /* 2. kirim ke GA4 hanya bila ID diisi dan cookie consent sudah disetujui */
  if (GA_ID && !document.cookie.match(/rc_analytics=1/)) return;

  if (GA_ID) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID, { anonymize_ip: true });
  }
});

