// Pure Web Audio API Sound Generator with Touch Unlock Support (Zero External Dependencies)

class PureSoundEffects {
    constructor() {
        this.ctx = null;
        this.initialized = false;
        this.setupTouchUnlock();
    }

    init() {
        if (this.initialized && this.ctx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
                this.initialized = true;
            }
        } catch (e) {
            console.warn("AudioContext not supported");
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setupTouchUnlock() {
        const unlock = () => {
            this.init();
            this.resume();
            if (this.ctx && this.ctx.state === 'running') {
                ['touchstart', 'touchend', 'pointerdown', 'click'].forEach(evt => {
                    document.removeEventListener(evt, unlock);
                });
            }
        };
        ['touchstart', 'touchend', 'pointerdown', 'click'].forEach(evt => {
            document.addEventListener(evt, unlock, { passive: true });
        });
    }

    playDriverShot(power = 1.0) {
        this.init();
        this.resume();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1900, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.12);

        oscGain.gain.setValueAtTime(0.6 * power, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);

        const thudOsc = this.ctx.createOscillator();
        const thudGain = this.ctx.createGain();
        thudOsc.type = 'triangle';
        thudOsc.frequency.setValueAtTime(240, now);
        thudOsc.frequency.exponentialRampToValueAtTime(60, now + 0.14);

        thudGain.gain.setValueAtTime(0.8 * power, now);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        thudOsc.connect(thudGain);
        thudGain.connect(this.ctx.destination);
        thudOsc.start(now);
        thudOsc.stop(now + 0.15);

        this.playNoiseClick(now, 0.04, 0.5 * power);
    }

    playIronShot(power = 1.0) {
        this.init();
        this.resume();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

        gain.gain.setValueAtTime(0.7 * power, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.13);

        this.playNoiseClick(now, 0.03, 0.4 * power);
    }

    playPutterShot(power = 1.0) {
        this.init();
        this.resume();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

        gain.gain.setValueAtTime(0.4 * Math.max(0.2, power), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    playBounce(intensity = 0.5) {
        this.init();
        this.resume();
        if (!this.ctx || intensity < 0.05) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.06);

        gain.gain.setValueAtTime(0.3 * Math.min(1.0, intensity), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    playCupIn() {
        this.init();
        this.resume();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        [0, 0.05, 0.1].forEach((delay, idx) => {
            const hitTime = now + delay;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            const freq = idx === 0 ? 1150 : (idx === 1 ? 880 : 620);
            osc.frequency.setValueAtTime(freq, hitTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.6, hitTime + 0.06);

            const vol = 0.5 / (idx + 1);
            gain.gain.setValueAtTime(vol, hitTime);
            gain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.07);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(hitTime);
            osc.stop(hitTime + 0.08);
        });

        setTimeout(() => this.playCheer(), 200);
    }

    playCheer() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];

        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const startTime = now + i * 0.07;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.25, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.7);
        });
    }

    playMeterTick() {
        this.init();
        this.resume();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
    }

    playNoiseClick(time, duration, volume) {
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1500, time);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(time);
    }
}

window.sound = new PureSoundEffects();
