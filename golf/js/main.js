// Pure Vanilla JS Golf Game Main Controller (Hybrid Mouse & Touch Screen Optimized)

class PureGolfGame {
    constructor() {
        this.canvas = document.getElementById('render-canvas');
        this.shotCount = 1;
        this.currentClubKey = '1W';
        this.aimAngleRad = 0;
        this.cameraMode = 'ADDRESS'; // 'ADDRESS', 'FOLLOW', 'PUTT', 'OVERVIEW'

        this.trailPoints = [];
        this.maxTrailPoints = 60;

        this.course = new window.PureGolfCourse();
        this.physics = new window.PureGolfPhysics(this.course);
        this.renderer = new window.Pure3DRenderer(this.canvas, this.course, this.physics);
        this.ui = new window.PureGolfUI(this);

        this.isAimDragging = false;
        this.prevInputX = 0;
        this.lastTime = performance.now();

        this.initInput();
        this.startHole();

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    startHole() {
        this.shotCount = 1;
        const tee = this.course.teePosition;
        this.physics.resetBall(tee);

        const cup = this.course.cupPosition;
        this.aimAngleRad = Math.atan2(cup.x - tee.x, cup.z - tee.z);

        const windSpeed = 1.0 + Math.random() * 5.5;
        const windDir = Math.random() * Math.PI * 2;
        this.physics.setWind(windSpeed, windDir);

        this.autoSelectClub();
        this.cameraMode = 'ADDRESS';
        this.trailPoints = [];
    }

    autoSelectClub() {
        const ballPos = this.physics.ballPosition;
        const cupPos = this.course.cupPosition;
        const distYards = ballPos.distanceTo(cupPos) * 1.09361;
        const terrain = this.course.getTerrainType(ballPos.x, ballPos.z);

        if (terrain === window.TERRAIN_TYPES.GREEN || distYards < 20) {
            this.currentClubKey = 'PT';
            this.renderer.showGreenGrid = true;
        } else if (distYards > 210) {
            this.currentClubKey = '1W';
            this.renderer.showGreenGrid = false;
        } else if (distYards > 170) {
            this.currentClubKey = '3W';
            this.renderer.showGreenGrid = false;
        } else if (distYards > 140) {
            this.currentClubKey = '5I';
            this.renderer.showGreenGrid = false;
        } else if (distYards > 115) {
            this.currentClubKey = '7I';
            this.renderer.showGreenGrid = false;
        } else if (distYards > 95) {
            this.currentClubKey = '9I';
            this.renderer.showGreenGrid = false;
        } else {
            this.currentClubKey = 'SW';
            this.renderer.showGreenGrid = false;
        }
    }

    cycleClub(direction) {
        if (this.physics.inAir || this.physics.isRolling) return;
        const keys = Object.keys(window.CLUBS);
        let idx = keys.indexOf(this.currentClubKey);
        idx = (idx + direction + keys.length) % keys.length;
        this.currentClubKey = keys[idx];
        if (this.currentClubKey === 'PT') this.renderer.showGreenGrid = true;
    }

    toggleGreenGrid() {
        this.renderer.showGreenGrid = !this.renderer.showGreenGrid;
    }

    toggleCameraMode() {
        if (this.cameraMode === 'ADDRESS') this.cameraMode = 'OVERVIEW';
        else if (this.cameraMode === 'OVERVIEW') this.cameraMode = 'PUTT';
        else this.cameraMode = 'ADDRESS';
    }

    executeShot(power, accuracy) {
        const club = window.CLUBS[this.currentClubKey];
        if (club.type === 'wood') window.sound.playDriverShot(power);
        else if (club.type === 'putter') window.sound.playPutterShot(power);
        else window.sound.playIronShot(power);

        this.trailPoints = [];
        this.physics.launch(this.currentClubKey, power, accuracy, this.aimAngleRad);
        this.cameraMode = 'FOLLOW';
    }

    onBallRest() {
        this.shotCount++;
        const terrain = this.course.getTerrainType(this.physics.ballPosition.x, this.physics.ballPosition.z);

        if (terrain === window.TERRAIN_TYPES.GREEN) {
            this.renderer.showGreenGrid = true;
            this.currentClubKey = 'PT';
        } else {
            this.autoSelectClub();
        }

        const cup = this.course.cupPosition;
        const b = this.physics.ballPosition;
        this.aimAngleRad = Math.atan2(cup.x - b.x, cup.z - b.z);

        this.cameraMode = (terrain === window.TERRAIN_TYPES.GREEN) ? 'PUTT' : 'ADDRESS';
    }

    onWaterHazard() {
        alert("Water Hazard! +1 Penalty stroke.");
        this.shotCount++;
        this.physics.resetBall(this.physics.initialPos);
        this.onBallRest();
    }

    onCupIn() {
        window.sound.playCupIn();
        const par = this.course.holeData.par;
        const strokes = this.shotCount;
        const diff = strokes - par;

        let title = "PAR";
        if (strokes === 1) title = "HOLE IN ONE! 🎉";
        else if (diff <= -2) title = "EAGLE! 🦅";
        else if (diff === -1) title = "BIRDIE! 🐦";
        else if (diff === 0) title = "PAR 👍";
        else if (diff === 1) title = "BOGEY";
        else title = `+${diff} OVER PAR`;

        const detail = `Completed Hole ${this.course.holeData.holeNumber} in ${strokes} strokes (Par ${par})`;
        this.ui.showCelebration(title, detail);
    }

    nextHole() {
        this.course.loadHole(this.course.currentHoleIndex + 1);
        this.startHole();
    }

    resetCurrentShot() {
        this.physics.resetBall(this.physics.initialPos);
        this.cameraMode = 'ADDRESS';
    }

    updateCamera(delta) {
        const ballPos = this.physics.ballPosition;

        if (this.cameraMode === 'ADDRESS') {
            const camDist = 4.5;
            const camH = 1.6;
            const targetX = ballPos.x - Math.sin(this.aimAngleRad) * camDist;
            const targetY = ballPos.y + camH;
            const targetZ = ballPos.z - Math.cos(this.aimAngleRad) * camDist;

            this.renderer.camPos.x += (targetX - this.renderer.camPos.x) * delta * 8;
            this.renderer.camPos.y += (targetY - this.renderer.camPos.y) * delta * 8;
            this.renderer.camPos.z += (targetZ - this.renderer.camPos.z) * delta * 8;

            this.renderer.camYaw = this.aimAngleRad;
            this.renderer.camPitch = 0.08;

        } else if (this.cameraMode === 'FOLLOW') {
            const vel = this.physics.ballVelocity;
            const speed = vel.length();
            const forwardX = speed > 0.5 ? vel.x / speed : Math.sin(this.aimAngleRad);
            const forwardZ = speed > 0.5 ? vel.z / speed : Math.cos(this.aimAngleRad);

            const targetX = ballPos.x - forwardX * 6.5;
            const targetY = ballPos.y + 3.2;
            const targetZ = ballPos.z - forwardZ * 6.5;

            this.renderer.camPos.x += (targetX - this.renderer.camPos.x) * delta * 6;
            this.renderer.camPos.y += (targetY - this.renderer.camPos.y) * delta * 6;
            this.renderer.camPos.z += (targetZ - this.renderer.camPos.z) * delta * 6;

            this.renderer.camYaw = Math.atan2(forwardX, forwardZ);
            this.renderer.camPitch = 0.18;

        } else if (this.cameraMode === 'PUTT') {
            const cup = this.course.cupPosition;
            const dx = cup.x - ballPos.x;
            const dz = cup.z - ballPos.z;
            const len = Math.hypot(dx, dz) || 1;

            const targetX = ballPos.x - (dx / len) * 2.6;
            const targetY = ballPos.y + 0.9;
            const targetZ = ballPos.z - (dz / len) * 2.6;

            this.renderer.camPos.x += (targetX - this.renderer.camPos.x) * delta * 8;
            this.renderer.camPos.y += (targetY - this.renderer.camPos.y) * delta * 8;
            this.renderer.camPos.z += (targetZ - this.renderer.camPos.z) * delta * 8;

            this.renderer.camYaw = Math.atan2(dx, dz);
            this.renderer.camPitch = 0.12;

        } else if (this.cameraMode === 'OVERVIEW') {
            const targetX = ballPos.x;
            const targetY = ballPos.y + 65;
            const targetZ = ballPos.z - 30;

            this.renderer.camPos.x += (targetX - this.renderer.camPos.x) * delta * 4;
            this.renderer.camPos.y += (targetY - this.renderer.camPos.y) * delta * 4;
            this.renderer.camPos.z += (targetZ - this.renderer.camPos.z) * delta * 4;

            this.renderer.camYaw = 0;
            this.renderer.camPitch = 0.8;
        }
    }

    initInput() {
        const isInteractive = (target) => {
            return target && (target.closest('.interactive') || target.tagName === 'BUTTON' || target.closest('button'));
        };

        // 1. Mouse Events
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0 && !isInteractive(e.target)) {
                this.isAimDragging = true;
                this.prevInputX = e.clientX;
                document.body.style.cursor = 'grabbing';
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isAimDragging && !this.physics.inAir && !this.physics.isRolling) {
                const dx = e.clientX - this.prevInputX;
                this.aimAngleRad += dx * 0.005;
                this.prevInputX = e.clientX;
            }
        });

        window.addEventListener('mouseup', () => {
            this.isAimDragging = false;
            document.body.style.cursor = 'default';
        });

        // Mouse Wheel for Camera Mode Toggle
        window.addEventListener('wheel', (e) => {
            if (!isInteractive(e.target)) {
                if (e.deltaY > 50) this.toggleCameraMode();
            }
        }, { passive: true });

        // 2. Touch Events (Mobile / Tablet)
        window.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0 && !isInteractive(e.target)) {
                this.isAimDragging = true;
                this.prevInputX = e.touches[0].clientX;
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (this.isAimDragging && e.touches.length > 0 && !this.physics.inAir && !this.physics.isRolling) {
                const dx = e.touches[0].clientX - this.prevInputX;
                this.aimAngleRad += dx * 0.006;
                this.prevInputX = e.touches[0].clientX;
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            this.isAimDragging = false;
        }, { passive: true });

        window.addEventListener('touchcancel', () => {
            this.isAimDragging = false;
        }, { passive: true });
    }

    loop(now) {
        requestAnimationFrame(this.loop);
        const delta = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;

        this.physics.update(delta, {
            onBounce: (intensity) => window.sound.playBounce(intensity),
            onWater: () => this.onWaterHazard(),
            onCupIn: () => this.onCupIn(),
            onRest: () => this.onBallRest()
        });

        if (this.physics.inAir || this.physics.isRolling) {
            this.trailPoints.push(this.physics.ballPosition.clone());
            if (this.trailPoints.length > this.maxTrailPoints) this.trailPoints.shift();
        }

        this.renderer.gridAnimTime += delta;
        this.ui.update(delta);
        this.updateCamera(delta);

        const currentClub = window.CLUBS[this.currentClubKey];
        this.renderer.render(this.trailPoints, this.aimAngleRad, currentClub);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new PureGolfGame();
});
