// Pure JS Golf Course Terrain & Hazards Profile (Zero External Dependencies)

const HOLE_DATA = [
    {
        holeNumber: 1,
        par: 4,
        teePosition: new Vec3(0, 2.0, 0),
        cupPosition: new Vec3(8, 1.5, 300),
        totalYards: 330,
        description: "Hole 1 - Emerald Valley (Par 4, 330 YDS)",
        fairwayPath: [
            { x: 0, z: 0 },
            { x: 4, z: 90 },
            { x: 10, z: 190 },
            { x: 8, z: 300 }
        ],
        fairwayWidth: 34,
        greenCenter: { x: 8, z: 300 },
        greenRadius: 16,
        bunkers: [
            { x: -12, z: 160, r: 10 },
            { x: 22, z: 280, r: 9 },
            { x: -5, z: 315, r: 8 }
        ],
        waterHazards: [
            { x: -35, z: 150, rx: 25, rz: 75, waterLevel: 0.1 }
        ],
        trees: [
            { x: -28, z: 40, s: 1.2 },
            { x: -32, z: 100, s: 1.5 },
            { x: -38, z: 180, s: 1.4 },
            { x: -22, z: 290, s: 1.6 },
            { x: 26, z: 30, s: 1.1 },
            { x: 34, z: 90, s: 1.4 },
            { x: 30, z: 170, s: 1.3 },
            { x: 32, z: 250, s: 1.5 },
            { x: 28, z: 320, s: 1.2 }
        ]
    },
    {
        holeNumber: 2,
        par: 3,
        teePosition: new Vec3(0, 4.0, 0),
        cupPosition: new Vec3(0, 1.0, 150),
        totalYards: 165,
        description: "Hole 2 - Island Sanctuary (Par 3, 165 YDS)",
        fairwayPath: [
            { x: 0, z: 0 },
            { x: 0, z: 60 },
            { x: 0, z: 150 }
        ],
        fairwayWidth: 26,
        greenCenter: { x: 0, z: 150 },
        greenRadius: 18,
        bunkers: [
            { x: -14, z: 145, r: 8 },
            { x: 14, z: 155, r: 8 }
        ],
        waterHazards: [
            { x: 0, z: 95, rx: 50, rz: 28, waterLevel: 0.1 }
        ],
        trees: [
            { x: -25, z: 30, s: 1.3 },
            { x: 25, z: 30, s: 1.3 },
            { x: -30, z: 150, s: 1.6 },
            { x: 30, z: 150, s: 1.6 },
            { x: 0, z: 185, s: 1.4 }
        ]
    }
];

class PureGolfCourse {
    constructor() {
        this.currentHoleIndex = 0;
        this.holeData = HOLE_DATA[0];
    }

    get teePosition() {
        return this.holeData.teePosition;
    }

    get cupPosition() {
        const h = this.getTerrainHeight(this.holeData.cupPosition.x, this.holeData.cupPosition.z);
        return new Vec3(this.holeData.cupPosition.x, h, this.holeData.cupPosition.z);
    }

    loadHole(index) {
        this.currentHoleIndex = index % HOLE_DATA.length;
        this.holeData = HOLE_DATA[this.currentHoleIndex];
    }

    getTerrainHeight(x, z) {
        const hole = this.holeData;
        const progress = Math.max(0, Math.min(1, z / hole.cupPosition.z));
        let baseHeight = Math.sin(progress * Math.PI) * 1.8 + Math.cos(x * 0.04) * 1.0;

        const distToTee = Math.hypot(x - hole.teePosition.x, z - hole.teePosition.z);
        if (distToTee < 14) {
            baseHeight += Math.cos((distToTee / 14) * (Math.PI / 2)) * 1.4;
        }

        const distToGreen = Math.hypot(x - hole.greenCenter.x, z - hole.greenCenter.z);
        if (distToGreen < hole.greenRadius + 6) {
            const factor = 1.0 - Math.min(1.0, distToGreen / (hole.greenRadius + 6));
            baseHeight += ((x - hole.greenCenter.x) * 0.025 + (z - hole.greenCenter.z) * 0.015) * factor;
        }

        for (const b of hole.bunkers) {
            const d = Math.hypot(x - b.x, z - b.z);
            if (d < b.r) {
                baseHeight -= Math.cos((d / b.r) * (Math.PI / 2)) * 1.3;
            }
        }

        for (const w of hole.waterHazards) {
            const d = Math.hypot((x - w.x) / w.rx, (z - w.z) / w.rz);
            if (d < 1.0) {
                baseHeight -= Math.cos(d * (Math.PI / 2)) * 2.0;
            }
        }

        return baseHeight;
    }

    getTerrainNormal(x, z) {
        const eps = 0.15;
        const hL = this.getTerrainHeight(x - eps, z);
        const hR = this.getTerrainHeight(x + eps, z);
        const hD = this.getTerrainHeight(x, z - eps);
        const hU = this.getTerrainHeight(x, z + eps);
        return new Vec3(hL - hR, 2 * eps, hD - hU).normalize();
    }

    getTerrainType(x, z) {
        const hole = this.holeData;

        for (const w of hole.waterHazards) {
            if (Math.hypot((x - w.x) / w.rx, (z - w.z) / w.rz) < 0.95) {
                if (this.getTerrainHeight(x, z) <= w.waterLevel + 0.05) return TERRAIN_TYPES.WATER;
            }
        }

        for (const b of hole.bunkers) {
            if (Math.hypot(x - b.x, z - b.z) < b.r) return TERRAIN_TYPES.BUNKER;
        }

        if (Math.hypot(x - hole.greenCenter.x, z - hole.greenCenter.z) < hole.greenRadius) {
            return TERRAIN_TYPES.GREEN;
        }

        if (Math.hypot(x - hole.teePosition.x, z - hole.teePosition.z) < 8) {
            return TERRAIN_TYPES.TEE;
        }

        let minDist = 9999;
        for (let i = 0; i < hole.fairwayPath.length - 1; i++) {
            const p1 = hole.fairwayPath[i];
            const p2 = hole.fairwayPath[i + 1];
            const d = this.distToSegment(x, z, p1.x, p1.z, p2.x, p2.z);
            if (d < minDist) minDist = d;
        }

        if (minDist < hole.fairwayWidth * 0.5) return TERRAIN_TYPES.FAIRWAY;
        if (minDist < hole.fairwayWidth * 0.85) return TERRAIN_TYPES.ROUGH;
        return TERRAIN_TYPES.DEEP_ROUGH;
    }

    distToSegment(px, pz, vx, vz, wx, wz) {
        const l2 = (vx - wx) * (vx - wx) + (vz - wz) * (vz - wz);
        if (l2 === 0) return Math.hypot(px - vx, pz - vz);
        let t = ((px - vx) * (wx - vx) + (pz - vz) * (wz - vz)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(px - (vx + t * (wx - vx)), pz - (vz + t * (wz - vz)));
    }
}

window.HOLE_DATA = HOLE_DATA;
window.PureGolfCourse = PureGolfCourse;
