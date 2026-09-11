// Pure JS 3D Vector Math & Golf Physics Engine (Zero External Dependencies)

class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    clone() { return new Vec3(this.x, this.y, this.z); }
    add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
    scale(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
    addScaled(v, s) { this.x += v.x * s; this.y += v.y * s; this.z += v.z * s; return this; }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
    length() { return Math.hypot(this.x, this.y, this.z); }
    distanceTo(v) { return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z); }
    normalize() {
        const len = this.length();
        if (len > 0.00001) { this.x /= len; this.y /= len; this.z /= len; }
        return this;
    }
}

const CLUBS = {
    '1W': { name: '1W Driver', type: 'wood', loft: 10.5, speed: 68, spin: 2600, range: 250 },
    '3W': { name: '3W Wood', type: 'wood', loft: 15.0, speed: 60, spin: 3400, range: 220 },
    '5I': { name: '5 Iron', type: 'iron', loft: 24.0, speed: 52, spin: 5000, range: 180 },
    '7I': { name: '7 Iron', type: 'iron', loft: 32.0, speed: 45, spin: 6500, range: 150 },
    '9I': { name: '9 Iron', type: 'iron', loft: 40.0, speed: 39, spin: 8000, range: 125 },
    'SW': { name: 'Sand Wedge', type: 'wedge', loft: 56.0, speed: 28, spin: 9800, range: 80 },
    'PT': { name: 'Putter', type: 'putter', loft: 3.5, speed: 12, spin: 800, range: 25 }
};

const TERRAIN_TYPES = {
    TEE: { name: 'Tee', friction: 0.96, restitution: 0.45, liePenalty: 1.0, color: '#38b000' },
    FAIRWAY: { name: 'Fairway', friction: 0.95, restitution: 0.4, liePenalty: 1.0, color: '#48bb78' },
    ROUGH: { name: 'Rough', friction: 0.88, restitution: 0.2, liePenalty: 0.8, color: '#2d6a4f' },
    DEEP_ROUGH: { name: 'Deep Rough', friction: 0.80, restitution: 0.1, liePenalty: 0.65, color: '#1b4332' },
    BUNKER: { name: 'Bunker (Sand)', friction: 0.35, restitution: 0.05, liePenalty: 0.5, color: '#f4d35e' },
    GREEN: { name: 'Green', friction: 0.983, restitution: 0.48, liePenalty: 1.0, color: '#70e000' },
    WATER: { name: 'Water Hazard', friction: 0.0, restitution: 0.0, liePenalty: 0.0, color: '#0077b6' }
};

class PureGolfPhysics {
    constructor(course) {
        this.course = course;
        this.gravity = 9.81;
        this.airDensity = 1.225;
        this.ballRadius = 0.02135;
        this.ballMass = 0.0459;
        this.ballArea = Math.PI * this.ballRadius * this.ballRadius;
        this.cd = 0.24; // Drag coefficient
        this.cl = 0.18; // Lift coefficient

        this.ballPosition = new Vec3();
        this.ballVelocity = new Vec3();
        this.ballSpin = new Vec3(); // x: backspin, y: sidespin

        this.inAir = false;
        this.isRolling = false;
        this.isStopped = true;
        this.inWater = false;
        this.inCup = false;
        this.initialPos = new Vec3();
        this.wind = new Vec3(0, 0, 0);
    }

    setWind(speed, dirRad) {
        this.wind.set(Math.sin(dirRad) * speed, 0, Math.cos(dirRad) * speed);
    }

    resetBall(pos) {
        this.ballPosition.copy(pos);
        this.initialPos.copy(pos);
        this.ballVelocity.set(0, 0, 0);
        this.ballSpin.set(0, 0, 0);
        this.inAir = false;
        this.isRolling = false;
        this.isStopped = true;
        this.inWater = false;
        this.inCup = false;
    }

    launch(clubKey, powerRatio, accuracyRatio, aimAngleRad) {
        const club = CLUBS[clubKey];
        if (!club) return;

        this.initialPos.copy(this.ballPosition);
        this.inCup = false;
        this.inWater = false;

        const currentTerrain = this.course.getTerrainType(this.ballPosition.x, this.ballPosition.z);
        const liePenalty = currentTerrain.liePenalty || 1.0;

        if (club.type === 'putter') {
            const putterSpeed = club.speed * powerRatio * liePenalty;
            const deviationAngle = (accuracyRatio - 0.5) * 0.05;
            const actualAim = aimAngleRad + deviationAngle;

            this.ballVelocity.set(
                Math.sin(actualAim) * putterSpeed,
                0,
                Math.cos(actualAim) * putterSpeed
            );
            this.ballSpin.set(0, 0, 0);
            this.inAir = false;
            this.isRolling = true;
            this.isStopped = false;
            return;
        }

        const sweetSpotOffset = accuracyRatio - 0.5; // -0.5..0.5
        const actualPower = powerRatio * liePenalty;
        const baseSpeed = club.speed * actualPower;
        const loftRad = (club.loft * (1.0 - sweetSpotOffset * 0.1) * Math.PI) / 180;

        const horizDeviationRad = (sweetSpotOffset * 14.0 * Math.PI) / 180;
        const finalAimRad = aimAngleRad + horizDeviationRad;

        const horizontalSpeed = baseSpeed * Math.cos(loftRad);
        const verticalSpeed = baseSpeed * Math.sin(loftRad);

        this.ballVelocity.set(
            Math.sin(finalAimRad) * horizontalSpeed,
            verticalSpeed,
            Math.cos(finalAimRad) * horizontalSpeed
        );

        const backspinRpm = club.spin * actualPower * (1.0 - Math.abs(sweetSpotOffset) * 0.3);
        const sidespinRpm = sweetSpotOffset * 3500 * actualPower;

        this.ballSpin.set(
            (backspinRpm * 2 * Math.PI) / 60,
            (sidespinRpm * 2 * Math.PI) / 60,
            0
        );

        this.inAir = true;
        this.isRolling = false;
        this.isStopped = false;
    }

    update(delta, callbacks = {}) {
        if (this.isStopped) return;

        const dt = Math.min(delta, 0.033);
        const subSteps = 4;
        const subDt = dt / subSteps;

        for (let step = 0; step < subSteps; step++) {
            if (this.isStopped) break;
            if (this.inAir) this.updateAirFlight(subDt, callbacks);
            else if (this.isRolling) this.updateGroundRoll(subDt, callbacks);
        }
    }

    updateAirFlight(dt, callbacks) {
        const relVel = new Vec3(
            this.ballVelocity.x - this.wind.x,
            this.ballVelocity.y - this.wind.y,
            this.ballVelocity.z - this.wind.z
        );
        const speed = relVel.length();

        if (speed > 0.001) {
            const dragMag = 0.5 * this.airDensity * speed * speed * this.cd * this.ballArea;
            const dragForce = relVel.clone().normalize().scale(-dragMag);

            const forward = this.ballVelocity.clone().normalize();
            const liftMag = 0.5 * this.airDensity * speed * speed * this.cl * this.ballArea * (this.ballSpin.x / 500);
            const liftForce = new Vec3(0, liftMag, 0);

            const rightDir = new Vec3(forward.z, 0, -forward.x).normalize();
            const curveMag = 0.5 * this.airDensity * speed * speed * this.cl * this.ballArea * (this.ballSpin.y / 500);
            const curveForce = rightDir.scale(curveMag);

            const totalForce = dragForce.add(liftForce).add(curveForce);
            const accel = totalForce.scale(1 / this.ballMass);
            accel.y -= this.gravity;

            this.ballVelocity.addScaled(accel, dt);
        } else {
            this.ballVelocity.y -= this.gravity * dt;
        }

        this.ballSpin.scale(Math.pow(0.98, dt * 60));
        this.ballPosition.addScaled(this.ballVelocity, dt);

        const groundH = this.course.getTerrainHeight(this.ballPosition.x, this.ballPosition.z);
        const terrain = this.course.getTerrainType(this.ballPosition.x, this.ballPosition.z);

        if (this.ballPosition.y <= groundH + this.ballRadius) {
            this.ballPosition.y = groundH + this.ballRadius;
            this.handleGroundImpact(terrain, callbacks);
        }
    }

    handleGroundImpact(terrain, callbacks) {
        if (terrain === TERRAIN_TYPES.WATER) {
            this.inWater = true;
            this.isStopped = true;
            this.inAir = false;
            this.isRolling = false;
            if (callbacks.onWater) callbacks.onWater();
            return;
        }

        const normal = this.course.getTerrainNormal(this.ballPosition.x, this.ballPosition.z);
        const normalVel = this.ballVelocity.dot(normal);

        if (callbacks.onBounce) callbacks.onBounce(Math.abs(normalVel) / 20, terrain);

        if (terrain === TERRAIN_TYPES.BUNKER) {
            this.ballVelocity.set(0, 0, 0);
            this.inAir = false;
            this.isRolling = false;
            this.isStopped = true;
            if (callbacks.onRest) callbacks.onRest();
            return;
        }

        if (normalVel < -1.5) {
            const restitution = terrain.restitution || 0.4;
            const normalComp = normal.clone().scale(normalVel);
            const tangentComp = this.ballVelocity.clone().sub(normalComp);

            const spinBite = (this.ballSpin.x / 1000) * 0.5;
            tangentComp.scale(Math.max(0.2, (terrain.friction || 0.9) - spinBite));

            this.ballVelocity.copy(tangentComp).addScaled(normalComp, -restitution);
            this.ballSpin.x *= 0.4;
            this.ballSpin.y *= 0.4;
        } else {
            this.inAir = false;
            this.isRolling = true;
            this.ballVelocity.y = 0;
        }
    }

    updateGroundRoll(dt, callbacks) {
        const x = this.ballPosition.x;
        const z = this.ballPosition.z;
        const groundH = this.course.getTerrainHeight(x, z);
        const terrain = this.course.getTerrainType(x, z);
        const normal = this.course.getTerrainNormal(x, z);

        this.ballPosition.y = groundH + this.ballRadius;

        const cupPos = this.course.cupPosition;
        const distToCup = Math.hypot(x - cupPos.x, z - cupPos.z);
        const cupRadius = 0.054; // ~5.4cm

        if (distToCup < cupRadius) {
            const speed = this.ballVelocity.length();
            if (speed < 3.2) {
                this.inCup = true;
                this.isStopped = true;
                this.isRolling = false;
                this.ballPosition.set(cupPos.x, cupPos.y - 0.04, cupPos.z);
                if (callbacks.onCupIn) callbacks.onCupIn();
                return;
            } else {
                if (callbacks.onPinHit) callbacks.onPinHit();
                const deflect = new Vec3(x - cupPos.x, 0, z - cupPos.z).normalize();
                this.ballVelocity.addScaled(deflect, 0.5);
            }
        }

        const slopeAccel = new Vec3(normal.x, 0, normal.z).scale(this.gravity * 0.9);
        this.ballVelocity.addScaled(slopeAccel, dt);

        const frictionRate = Math.pow(terrain.friction || 0.95, dt * 60);
        this.ballVelocity.scale(frictionRate);
        this.ballPosition.addScaled(this.ballVelocity, dt);

        if (this.ballVelocity.length() < 0.05) {
            this.ballVelocity.set(0, 0, 0);
            this.isRolling = false;
            this.isStopped = true;
            if (callbacks.onRest) callbacks.onRest();
        }
    }
}

window.Vec3 = Vec3;
window.CLUBS = CLUBS;
window.TERRAIN_TYPES = TERRAIN_TYPES;
window.PureGolfPhysics = PureGolfPhysics;
