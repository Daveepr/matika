// kdykoliv klikneš myší → skip intro
window.addEventListener("mousedown", () => {
    window.location.href = "menu.html";
});

// kdykoliv zmáčkneš klávesu → skip intro
window.addEventListener("keydown", () => {
    window.location.href = "menu.html";
});
// dotyk prstem → skip intro
window.addEventListener("touchstart", () => {
    window.location.href = "menu.html";
}, { once: true
 });

// --- SOUND ENGINE (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playOsc(type, freq, duration, volume = 0.3) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration = 0.4, volume = 0.25, lowpass = 800) {
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = lowpass;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    noise.start();
}

function s_whoosh() {
    playNoise(0.5, 0.22, 1200);
}

function s_pop() {
    playOsc("sine", 420, 0.08, 0.25);
}

function s_ding() {
    playOsc("triangle", 880, 0.25, 0.22);
}

function s_dust() {
    playNoise(0.35, 0.18, 600);
}

function s_glow() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
}

function s_fade() {
    playNoise(0.8, 0.12, 300);
}


const canvas = document.getElementById("matika");
const ctx = canvas.getContext("2d");

let W, H;
function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
}
window.addEventListener("resize", resize);
resize();

// parametry
const COUNT = 1400;
const SPEED = 0.08;
const CHAOS_FORCE = 35;

let particles = [];
let targets = [];
let mode = "chaos";

function initParticles() {
    particles = [];
    for (let i = 0; i < COUNT; i++) {
        particles.push({
            x: Math.random() * W,
            y: Math.random() * H,
            tx: W / 2,
            ty: H / 2
        });
    }
}
initParticles();

// chaos
function chaos() {
    particles.forEach(p => {
        p.x += (Math.random() - 0.5) * CHAOS_FORCE;
        p.y += (Math.random() - 0.5) * CHAOS_FORCE;
    });
}

// shlukování
function cluster() {
    particles.forEach(p => {
        let dx = p.tx - p.x;
        let dy = p.ty - p.y;
        p.x += dx * SPEED;
        p.y += dy * SPEED;
    });
}

// vykreslení částic
function draw() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    particles.forEach((p, i) => {
        let hue = (i * 2 + Date.now() / 30) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.fillRect(p.x, p.y, 3, 3);
    });
}

// sampling pomocí pomocné funkce
function sampleText(drawFn) {
    let temp = document.createElement("canvas");
    temp.width = W;
    temp.height = H;
    let tctx = temp.getContext("2d");

    drawFn(tctx);

    let data = tctx.getImageData(0, 0, W, H).data;
    targets = [];

    const step = 5;
    for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
            let index = (y * W + x) * 4;
            if (data[index] > 200) {
                targets.push({ x, y });
            }
        }
    }

    particles.forEach((p, i) => {
        let t = targets[i % targets.length];
        p.tx = t.x;
        p.ty = t.y;
    });

    mode = "cluster";
}

// generátor korektního příkladu
function generateEquation() {
    const ops = ["+", "-", "×", "÷"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, c;

    if (op === "+") {
        a = Math.floor(Math.random() * 9) + 1;
        b = Math.floor(Math.random() * 9) + 1;
        c = a + b;
    } else if (op === "-") {
        a = Math.floor(Math.random() * 8) + 2; // 2–9
        b = Math.floor(Math.random() * (a - 1)) + 1; // 1..a-1
        c = a - b;
    } else if (op === "×") {
        a = Math.floor(Math.random() * 9) + 1;
        b = Math.floor(Math.random() * 9) + 1;
        c = a * b;
    } else { // ÷
        b = Math.floor(Math.random() * 9) + 1;
        c = Math.floor(Math.random() * 9) + 1;
        a = b * c;
    }

    return { a, b, c, op };
}

// rozhozená tři čísla po obrazovce
function makeScatteredDigits(eq) {
    let safeX = W * 0.15;
    let safeY = H * 0.15;

    let positions = [
        { x: safeX, y: safeY + 13},
        { x: W - safeX * 2, y: safeY * 1.2 },
        { x: W * 0.4, y: H - safeY * 2 }
    ];

    sampleText(tctx => {
        tctx.fillStyle = "#fff";
        tctx.font = `bold ${Math.min(W, H) / 5}px Arial`;

        [eq.a, eq.b, eq.c].forEach((d, idx) => {
            tctx.save();
            tctx.translate(positions[idx].x, positions[idx].y);
            tctx.rotate((Math.random() - 0.5) * 0.4);
            tctx.fillText(d.toString(), 0, 0);
            tctx.restore();
        });
    });
}

// tři čísla uprostřed v řadě
function makeCenteredDigits(eq) {
    sampleText(tctx => {
        let fontSize = Math.min(W, H) / 5;
        tctx.font = `bold ${fontSize}px Arial`;
        tctx.fillStyle = "#fff";

        const text = `${eq.a}   ${eq.b}   ${eq.c}`;
        const width = tctx.measureText(text).width;
        const x = (W - width) / 2;
        const y = H / 2;

        tctx.fillText(text, x, y);
    });
}

// příklad: a op b = c
function makeCenteredEquation(eq) {
    sampleText(tctx => {
        let fontSize = Math.min(W, H) / 6;
        tctx.font = `bold ${fontSize}px Arial`;
        tctx.fillStyle = "#fff";

        const text = `${eq.a} ${eq.op} ${eq.b} = ${eq.c}`;
        const width = tctx.measureText(text).width;
        const x = (W - width) / 2;
        const y = H / 2;

        tctx.fillText(text, x, y);
    });
}

function makeCenteredText(top, bottom) {
    sampleText(tctx => {

        // bezpečná oblast pro text (region)
        const regionW = W * 0.7;   // 70 % šířky okna
        const regionH = H * 0.45;  // 45 % výšky okna

        // posun regionu doprostřed
        const offsetX = (W - regionW) / 2;
        const offsetY = (H - regionH) / 2;

        // font – může být velký, protože region je menší
        let fontSize = Math.min(regionW, regionH) / 3.8;
        tctx.font = `bold ${fontSize}px Arial`;
        tctx.fillStyle = "#fff";

        // měření textu
        let topWidth = tctx.measureText(top).width;
        let bottomWidth = tctx.measureText(bottom).width;

        // centrování v regionu
        let topX = offsetX + (regionW - topWidth) / 2;
        let bottomX = offsetX + (regionW - bottomWidth) / 2;

        let topY = offsetY + regionH * 0.35;
        let bottomY = offsetY + regionH * 0.75;

        // kreslení
        tctx.fillText(top, topX, topY);
        tctx.fillText(bottom, bottomX, bottomY);
    });
}

// animace
function loop() {
    if (mode === "chaos") chaos();
    if (mode === "cluster") cluster();

    draw();
    requestAnimationFrame(loop);
}
loop();

// sekvence
const eq = generateEquation();

// 1) chaos → rozhozená tři čísla
setTimeout(() => {
    s_whoosh();
    makeScatteredDigits(eq);
}, 2000);

// 2) přesun tří čísel doprostřed
setTimeout(() => {
    s_pop();
    makeCenteredDigits(eq);
}, 5000);

// 3) přeměna na příklad a op b = c
setTimeout(() => {
    s_ding();
    makeCenteredEquation(eq);
}, 8000);

// 4) krátké držení → rozplynutí (chaos)
setTimeout(() => {
    s_dust();
    mode = "chaos";
}, 11500);

// 5) finální logo HRAVÁ MATIKA
setTimeout(() => {
    s_glow();
    makeCenteredText("HRAVÁ", "MATIKA");
}, 13000);

// 6) fade-to-white a přechod na menu.html
setTimeout(() => {
    s_fade();
    let alpha = 0.0;

    function fadeToWhite() {
        alpha += 0.02;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillRect(0, 0, W, H);

        if (alpha < 1) {
            requestAnimationFrame(fadeToWhite);
        } else {
            window.location.href = "menu.html";
        }
    }

    fadeToWhite();
}, 16000);
