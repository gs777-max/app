// Dynamic Putting Slope Grid with animated direction beads
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class GreenSlopeGrid {
    constructor(scene, course) {
        this.scene = scene;
        this.course = course;
        this.gridGroup = new THREE.Group();
        this.scene.add(this.gridGroup);

        this.visible = false;
        this.points = [];
        this.particles = null;
        this.time = 0;
        this.gridLines = null;

        this.initGrid();
    }

    initGrid() {
        // Clear previous
        while (this.gridGroup.children.length > 0) {
            this.gridGroup.remove(this.gridGroup.children[0]);
        }

        const hole = this.course.holeData;
        const greenCenter = hole.greenCenter;
        const greenRadius = hole.greenRadius;
        const spacing = 1.0; // 1 meter grid interval

        const posList = [];
        const slopeDirList = [];
        const slopeMagList = [];

        const minX = greenCenter.x - greenRadius;
        const maxX = greenCenter.x + greenRadius;
        const minZ = greenCenter.y - greenRadius;
        const maxZ = greenCenter.y + greenRadius;

        const linePositions = [];
        const lineColors = [];

        for (let x = minX; x <= maxX; x += spacing) {
            for (let z = minZ; z <= maxZ; z += spacing) {
                const dist = Math.hypot(x - greenCenter.x, z - greenCenter.y);
                if (dist <= greenRadius) {
                    const h = this.course.getTerrainHeight(x, z);
                    const normal = this.course.getTerrainNormal(x, z);

                    // Slope gradient (horizontal gravity direction)
                    const slopeX = normal.x;
                    const slopeZ = normal.z;
                    const mag = Math.hypot(slopeX, slopeZ);

                    posList.push(new THREE.Vector3(x, h + 0.04, z));
                    slopeDirList.push(new THREE.Vector2(mag > 0.001 ? slopeX / mag : 0, mag > 0.001 ? slopeZ / mag : 0));
                    slopeMagList.push(mag);
                }
            }
        }

        this.pointsData = {
            count: posList.length,
            positions: posList,
            slopeDirs: slopeDirList,
            slopeMags: slopeMagList
        };

        // 1. Grid Beads (Instanced animated particles)
        const beadGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const beadMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });

        this.beadsMesh = new THREE.InstancedMesh(beadGeo, beadMat, this.pointsData.count);
        this.beadDummy = new THREE.Object3D();

        for (let i = 0; i < this.pointsData.count; i++) {
            const p = this.pointsData.positions[i];
            this.beadDummy.position.copy(p);
            this.beadDummy.updateMatrix();
            this.beadsMesh.setMatrixAt(i, this.beadDummy.matrix);
            
            // Color based on slope intensity (Green = Flat, Yellow = Moderate, Red = Steep)
            const mag = this.pointsData.slopeMags[i] * 15;
            const col = new THREE.Color();
            if (mag < 0.3) {
                col.setHSL(0.35, 1.0, 0.6); // Bright green
            } else if (mag < 0.7) {
                col.setHSL(0.15, 1.0, 0.6); // Yellow / Amber
            } else {
                col.setHSL(0.0, 1.0, 0.6); // Red
            }
            this.beadsMesh.setColorAt(i, col);
        }
        this.beadsMesh.instanceMatrix.needsUpdate = true;
        if (this.beadsMesh.instanceColor) this.beadsMesh.instanceColor.needsUpdate = true;

        this.gridGroup.add(this.beadsMesh);

        // 2. Subtle Grid line wireframe overlay
        this.createGridLines(minX, maxX, minZ, maxZ, spacing, greenCenter, greenRadius);
        this.setVisible(false);
    }

    createGridLines(minX, maxX, minZ, maxZ, spacing, greenCenter, greenRadius) {
        const linePositions = [];

        // Longitudinal lines
        for (let x = minX; x <= maxX; x += spacing) {
            let lastInside = false;
            for (let z = minZ; z <= maxZ; z += spacing * 0.2) {
                const d = Math.hypot(x - greenCenter.x, z - greenCenter.y);
                if (d <= greenRadius) {
                    const h = this.course.getTerrainHeight(x, z) + 0.02;
                    linePositions.push(x, h, z);
                }
            }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        const mat = new THREE.LineBasicMaterial({ color: '#4ade80', transparent: true, opacity: 0.25 });
        const lines = new THREE.LineSegments(geo, mat);
        this.gridGroup.add(lines);
    }

    setVisible(visible) {
        this.visible = visible;
        this.gridGroup.visible = visible;
    }

    update(delta) {
        if (!this.visible || !this.pointsData || this.pointsData.count === 0) return;

        this.time += delta;
        const cycle = 1.2; // seconds per wave cycle

        for (let i = 0; i < this.pointsData.count; i++) {
            const basePos = this.pointsData.positions[i];
            const dir = this.pointsData.slopeDirs[i];
            const mag = this.pointsData.slopeMags[i];

            // Animate bead flowing in slope direction
            const progress = ((this.time * 1.5 + (basePos.x + basePos.z) * 0.5) % cycle) / cycle;
            const offset = (progress - 0.5) * 0.8 * Math.min(1.0, mag * 20);

            this.beadDummy.position.set(
                basePos.x + dir.x * offset,
                basePos.y,
                basePos.z + dir.y * offset
            );
            // Pulse scale along wave
            const scale = 0.7 + Math.sin(progress * Math.PI) * 0.6;
            this.beadDummy.scale.set(scale, scale, scale);
            this.beadDummy.updateMatrix();

            this.beadsMesh.setMatrixAt(i, this.beadDummy.matrix);
        }

        this.beadsMesh.instanceMatrix.needsUpdate = true;
    }
}
