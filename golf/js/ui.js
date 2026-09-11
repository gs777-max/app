// Pure JS UI and Swing Gauge Controller (Unified Mouse, Touch & Keyboard Support)

class PureGolfUI {
    constructor(game) {
        this.game = game;

        this.holeTitleEl = document.getElementById('hole-title');
        this.parInfoEl = document.getElementById('par-info');
        this.distanceToPinEl = document.getElementById('dist-pin');
        this.shotCountEl = document.getElementById('shot-count');
        this.clubNameEl = document.getElementById('club-name');
        this.clubStatsEl = document.getElementById('club-stats');
        this.terrainLieEl = document.getElementById('terrain-lie');
        this.windSpeedEl = document.getElementById('wind-speed');
        this.windArrowEl = document.getElementById('wind-arrow');
        this.celebrationModalEl = document.getElementById('celebration-modal');
        this.scoreResultTitleEl = document.getElementById('score-result-title');
        this.scoreResultDetailEl = document.getElementById('score-result-detail');

        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

        this.swingContainerEl = document.querySelector('.swing-gauge-container');
        this.gaugeCursorEl = document.getElementById('gauge-cursor');
        this.gaugePowerMarkerEl = document.getElementById('gauge-power-marker');
        this.swingBtnEl = document.getElementById('swing-action-btn');

        this.swingState = 'IDLE'; // 'IDLE', 'POWER_UP', 'IMPACT_ACTIVE'
        this.gaugeProgress = 0.0;
        this.selectedPower = 0.0;
        this.selectedAccuracy = 0.5;
        this.gaugeSpeed = 1.35;

        this.bindEvents();
    }

    bindEvents() {
        // Keyboard Support
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleSwingInput();
            } else if (e.code === 'KeyC') {
                this.game.cycleClub(1);
            } else if (e.code === 'KeyX') {
                this.game.cycleClub(-1);
            } else if (e.code === 'KeyV') {
                this.game.toggleCameraMode();
            } else if (e.code === 'KeyG') {
                this.game.toggleGreenGrid();
            } else if (e.code === 'KeyR') {
                this.game.resetCurrentShot();
            }
        });

        // Universal Button Trigger (Handles both Mouse Click and Touch Tap smoothly)
        const bindButton = (el, action) => {
            if (!el) return;
            let lastTrigger = 0;
            const trigger = (e) => {
                const now = Date.now();
                if (now - lastTrigger < 150) return; // Debounce rapid multi-triggers
                lastTrigger = now;
                if (e.cancelable && e.type !== 'click') e.preventDefault();
                e.stopPropagation();
                action();
            };

            el.addEventListener('click', trigger);
            el.addEventListener('touchend', trigger);
        };

        // Swing Button
        bindButton(this.swingBtnEl, () => this.handleSwingInput());

        // Gauge Track click / tap
        if (this.swingContainerEl) {
            this.swingContainerEl.addEventListener('click', (e) => {
                if (e.target !== this.swingBtnEl) {
                    e.stopPropagation();
                    this.handleSwingInput();
                }
            });
        }

        // Club Navigation
        bindButton(document.getElementById('club-prev-btn'), () => this.game.cycleClub(-1));
        bindButton(document.getElementById('club-next-btn'), () => this.game.cycleClub(1));

        // Tool Actions
        bindButton(document.getElementById('btn-cam-view'), () => this.game.toggleCameraMode());
        bindButton(document.getElementById('btn-grid-toggle'), () => this.game.toggleGreenGrid());
        bindButton(document.getElementById('btn-reset-shot'), () => this.game.resetCurrentShot());

        // Next Hole Modal
        bindButton(document.getElementById('btn-next-hole'), () => {
            this.celebrationModalEl.classList.add('hidden');
            this.game.nextHole();
        });
    }

    handleSwingInput() {
        if (this.game.physics.inAir || this.game.physics.isRolling) return;
        window.sound.playMeterTick();

        switch (this.swingState) {
            case 'IDLE':
                this.swingState = 'POWER_UP';
                this.gaugeProgress = 0.0;
                this.gaugePowerMarkerEl.style.display = 'none';
                if (this.swingBtnEl) this.swingBtnEl.textContent = 'SET POWER';
                break;

            case 'POWER_UP':
                this.selectedPower = Math.max(0.15, Math.min(1.0, this.gaugeProgress));
                this.swingState = 'IMPACT_ACTIVE';
                this.gaugePowerMarkerEl.style.display = 'block';
                this.gaugePowerMarkerEl.style.bottom = `${this.selectedPower * 100}%`;
                if (this.swingBtnEl) this.swingBtnEl.textContent = 'IMPACT!';
                break;

            case 'IMPACT_ACTIVE':
                const impactDiff = this.gaugeProgress;
                this.selectedAccuracy = 0.5 + impactDiff * 0.5;
                this.swingState = 'IDLE';
                this.gaugePowerMarkerEl.style.display = 'none';
                if (this.swingBtnEl) this.swingBtnEl.textContent = 'SWING';
                this.game.executeShot(this.selectedPower, this.selectedAccuracy);
                break;
        }
    }

    update(delta) {
        if (this.swingState === 'POWER_UP') {
            this.gaugeProgress += delta * this.gaugeSpeed;
            if (this.gaugeProgress >= 1.0) {
                this.gaugeProgress = 1.0;
                this.selectedPower = 1.0;
                this.swingState = 'IMPACT_ACTIVE';
                this.gaugePowerMarkerEl.style.display = 'block';
                this.gaugePowerMarkerEl.style.bottom = '100%';
                if (this.swingBtnEl) this.swingBtnEl.textContent = 'IMPACT!';
            }
            this.gaugeCursorEl.style.bottom = `${this.gaugeProgress * 100}%`;
        } else if (this.swingState === 'IMPACT_ACTIVE') {
            this.gaugeProgress -= delta * this.gaugeSpeed * 1.4;
            if (this.gaugeProgress <= -0.3) {
                this.selectedAccuracy = 0.9;
                this.swingState = 'IDLE';
                this.gaugePowerMarkerEl.style.display = 'none';
                if (this.swingBtnEl) this.swingBtnEl.textContent = 'SWING';
                this.game.executeShot(this.selectedPower, this.selectedAccuracy);
            }
            const clamped = Math.max(0, this.gaugeProgress);
            this.gaugeCursorEl.style.bottom = `${clamped * 100}%`;
        } else {
            this.gaugeCursorEl.style.bottom = '0%';
            if (this.swingBtnEl && this.swingBtnEl.textContent !== 'SWING') {
                this.swingBtnEl.textContent = 'SWING';
            }
        }

        this.updateHUD();
        this.renderMinimap();
    }

    updateHUD() {
        const course = this.game.course;
        const ballPos = this.game.physics.ballPosition;
        const cupPos = course.cupPosition;

        const distMeters = ballPos.distanceTo(cupPos);
        const distYards = Math.round(distMeters * 1.09361);

        if (this.distanceToPinEl) this.distanceToPinEl.textContent = `${distYards} YDS (${distMeters.toFixed(1)}m)`;
        if (this.shotCountEl) this.shotCountEl.textContent = `Shot ${this.game.shotCount}`;
        if (this.holeTitleEl) this.holeTitleEl.textContent = course.holeData.description;
        if (this.parInfoEl) this.parInfoEl.textContent = `PAR ${course.holeData.par}`;

        const club = window.CLUBS[this.game.currentClubKey];
        if (club && this.clubNameEl) {
            this.clubNameEl.textContent = club.name;
            if (this.clubStatsEl) this.clubStatsEl.textContent = `Max: ${club.range} YDS | Loft: ${club.loft}°`;
        }

        const terrain = course.getTerrainType(ballPos.x, ballPos.z);
        if (this.terrainLieEl) {
            this.terrainLieEl.textContent = terrain.name;
            this.terrainLieEl.style.color = terrain.color;
        }

        const wind = this.game.physics.wind;
        const speed = wind.length();
        if (this.windSpeedEl) this.windSpeedEl.textContent = `${speed.toFixed(1)} m/s`;
        if (this.windArrowEl) {
            const angleDeg = (Math.atan2(wind.x, wind.z) * 180) / Math.PI;
            this.windArrowEl.style.transform = `rotate(${angleDeg}deg)`;
        }
    }

    renderMinimap() {
        if (!this.minimapCtx) return;
        const ctx = this.minimapCtx;
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;

        ctx.clearRect(0, 0, w, h);

        const hole = this.game.course.holeData;
        const ballPos = this.game.physics.ballPosition;
        const cupPos = this.game.course.cupPosition;

        const mapZMax = hole.cupPosition.z + 40;
        const scaleY = h / mapZMax;
        const scaleX = w / 110;
        const offsetX = w / 2;

        const toMapX = (x) => offsetX + x * scaleX;
        const toMapY = (z) => h - z * scaleY;

        // Fairway
        ctx.strokeStyle = '#48bb78';
        ctx.lineWidth = hole.fairwayWidth * scaleX * 0.9;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < hole.fairwayPath.length; i++) {
            const p = hole.fairwayPath[i];
            if (i === 0) ctx.moveTo(toMapX(p.x), toMapY(p.z));
            else ctx.lineTo(toMapX(p.x), toMapY(p.z));
        }
        ctx.stroke();

        // Green
        ctx.fillStyle = '#70e000';
        ctx.beginPath();
        ctx.arc(toMapX(hole.greenCenter.x), toMapY(hole.greenCenter.z), hole.greenRadius * scaleX, 0, Math.PI * 2);
        ctx.fill();

        // Water
        ctx.fillStyle = '#0077b6';
        for (const wtr of hole.waterHazards) {
            ctx.beginPath();
            ctx.ellipse(toMapX(wtr.x), toMapY(wtr.z), wtr.rx * scaleX, wtr.rz * scaleY, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Bunkers
        ctx.fillStyle = '#f4d35e';
        for (const b of hole.bunkers) {
            ctx.beginPath();
            ctx.arc(toMapX(b.x), toMapY(b.z), b.r * scaleX, 0, Math.PI * 2);
            ctx.fill();
        }

        // Pin
        ctx.fillStyle = '#e63946';
        ctx.beginPath();
        ctx.arc(toMapX(cupPos.x), toMapY(cupPos.z), 4, 0, Math.PI * 2);
        ctx.fill();

        // Ball
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(toMapX(ballPos.x), toMapY(ballPos.z), 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    showCelebration(title, detail) {
        if (this.scoreResultTitleEl) this.scoreResultTitleEl.textContent = title;
        if (this.scoreResultDetailEl) this.scoreResultDetailEl.textContent = detail;
        if (this.celebrationModalEl) this.celebrationModalEl.classList.remove('hidden');
    }
}

window.PureGolfUI = PureGolfUI;
