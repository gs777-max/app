// Pure HTML5 Canvas 3D Perspective Rasterizer Engine (Zero External Dependencies)

class Pure3DRenderer {
    constructor(canvas, course, physics) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.course = course;
        this.physics = physics;

        // Camera
        this.camPos = new Vec3(0, 5, -10);
        this.camTarget = new Vec3(0, 0, 20);
        this.camYaw = 0;
        this.camPitch = 0;
        this.fov = 65; // degrees

        this.showGreenGrid = false;
        this.gridAnimTime = 0;

        // Sunlight direction
        this.sunDir = new Vec3(0.5, 0.8, 0.3).normalize();

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.focalLength = (this.width / 2) / Math.tan((this.fov * Math.PI) / 360);
    }

    // World to Camera & Screen Projection
    project(worldPos) {
        // Translate relative to camera
        const dx = worldPos.x - this.camPos.x;
        const dy = worldPos.y - this.camPos.y;
        const dz = worldPos.z - this.camPos.z;

        // Rotate by Cam Yaw (Y-axis)
        const cosY = Math.cos(-this.camYaw);
        const sinY = Math.sin(-this.camYaw);
        const x1 = dx * cosY - dz * sinY;
        const z1 = dx * sinY + dz * cosY;

        // Rotate by Cam Pitch (X-axis)
        const cosP = Math.cos(-this.camPitch);
        const sinP = Math.sin(-this.camPitch);
        const y2 = dy * cosP - z1 * sinP;
        const z2 = dy * sinP + z1 * cosP;

        // Clip if behind camera
        if (z2 <= 0.2) return null;

        // Perspective divide
        const screenX = (x1 * this.focalLength) / z2 + this.width / 2;
        const screenY = (-y2 * this.focalLength) / z2 + this.height / 2;

        return {
            x: screenX,
            y: screenY,
            z: z2 // Camera depth for sorting
        };
    }

    render(trailPoints, aimAngleRad, club) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // 1. Draw Sky Gradient & Distant Mountains
        this.drawSky();

        // 2. Collect & Sort 3D Render Polygons & Objects
        const renderList = [];

        // Add Terrain Mesh Quads
        this.collectTerrainQuads(renderList);

        // Add 3D Trees
        this.collectTrees(renderList);

        // Add Pin Flag
        this.collectFlag(renderList);

        // Add Green Slope Grid
        if (this.showGreenGrid) {
            this.collectGreenGrid(renderList);
        }

        // Add Ball & Aim Visuals
        this.collectBallAndAim(renderList, trailPoints, aimAngleRad, club);

        // 3. Depth Sort (Painter's Algorithm: Furthest Z first)
        renderList.sort((a, b) => b.depth - a.depth);

        // 4. Render All Sorted Primitives
        for (const item of renderList) {
            item.render(ctx);
        }
    }

    drawSky() {
        const ctx = this.ctx;
        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height * 0.7);
        skyGrad.addColorStop(0, '#0096c7');
        skyGrad.addColorStop(0.5, '#48cae4');
        skyGrad.addColorStop(1, '#caf0f8');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        // Distant mountain silhouettes
        ctx.fillStyle = 'rgba(40, 116, 101, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, this.height * 0.48);
        const segments = 12;
        for (let i = 0; i <= segments; i++) {
            const sx = (this.width / segments) * i;
            const sy = this.height * 0.45 + Math.sin(i * 1.3 + this.camYaw * 2) * 25;
            ctx.lineTo(sx, sy);
        }
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(0, this.height);
        ctx.closePath();
        ctx.fill();
    }

    collectTerrainQuads(list) {
        const hole = this.course.holeData;
        const stepX = 4;
        const stepZ = 5;

        // Visible range around camera and ball
        const minZ = Math.max(-20, Math.floor((this.camPos.z - 20) / stepZ) * stepZ);
        const maxZ = Math.min(hole.cupPosition.z + 50, Math.floor((this.camPos.z + 360) / stepZ) * stepZ);
        const minX = -45;
        const maxX = 45;

        for (let z = minZ; z < maxZ; z += stepZ) {
            for (let x = minX; x < maxX; x += stepX) {
                // 4 corners of terrain quad
                const p00 = new Vec3(x, this.course.getTerrainHeight(x, z), z);
                const p10 = new Vec3(x + stepX, this.course.getTerrainHeight(x + stepX, z), z);
                const p11 = new Vec3(x + stepX, this.course.getTerrainHeight(x + stepX, z + stepZ), z + stepZ);
                const p01 = new Vec3(x, this.course.getTerrainHeight(x, z + stepZ), z + stepZ);

                const proj00 = this.project(p00);
                const proj10 = this.project(p10);
                const proj11 = this.project(p11);
                const proj01 = this.project(p01);

                if (!proj00 || !proj10 || !proj11 || !proj01) continue;

                // Frustum culling (skip if completely outside screen)
                const minSX = Math.min(proj00.x, proj10.x, proj11.x, proj01.x);
                const maxSX = Math.max(proj00.x, proj10.x, proj11.x, proj01.x);
                const minSY = Math.min(proj00.y, proj10.y, proj11.y, proj01.y);
                const maxSY = Math.max(proj00.y, proj10.y, proj11.y, proj01.y);
                if (maxSX < 0 || minSX > this.width || maxSY < 0 || minSY > this.height) continue;

                const avgZ = (proj00.z + proj10.z + proj11.z + proj01.z) / 4;

                // Center terrain type & normal lighting
                const midX = x + stepX / 2;
                const midZ = z + stepZ / 2;
                const terrain = this.course.getTerrainType(midX, midZ);
                const normal = this.course.getTerrainNormal(midX, midZ);
                const light = Math.max(0.65, Math.min(1.2, 0.7 + normal.dot(this.sunDir) * 0.45));

                list.push({
                    depth: avgZ,
                    render: (ctx) => {
                        ctx.fillStyle = this.getShadedColor(terrain.color, light);
                        ctx.strokeStyle = ctx.fillStyle;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(proj00.x, proj00.y);
                        ctx.lineTo(proj10.x, proj10.y);
                        ctx.lineTo(proj11.x, proj11.y);
                        ctx.lineTo(proj01.x, proj01.y);
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();
                    }
                });
            }
        }
    }

    collectTrees(list) {
        for (const t of this.course.holeData.trees) {
            const groundH = this.course.getTerrainHeight(t.x, t.z);
            const basePos = new Vec3(t.x, groundH, t.z);
            const topPos = new Vec3(t.x, groundH + 7.0 * t.s, t.z);

            const pBase = this.project(basePos);
            const pTop = this.project(topPos);

            if (!pBase || !pTop) continue;

            const depth = pBase.z;
            const treeHeight = Math.abs(pBase.y - pTop.y);
            const trunkWidth = Math.max(2, treeHeight * 0.08);
            const foliageWidth = treeHeight * 0.45;

            list.push({
                depth: depth,
                render: (ctx) => {
                    // Trunk
                    ctx.fillStyle = '#4a2810';
                    ctx.fillRect(pBase.x - trunkWidth / 2, pBase.y - treeHeight * 0.35, trunkWidth, treeHeight * 0.35);

                    // Foliage 3-tier cones
                    for (let i = 0; i < 3; i++) {
                        const tierBaseY = pBase.y - treeHeight * (0.25 + i * 0.22);
                        const tierTopY = pBase.y - treeHeight * (0.55 + i * 0.22);
                        const tierW = foliageWidth * (1.0 - i * 0.18);

                        ctx.fillStyle = i === 2 ? '#1f6f38' : (i === 1 ? '#185a2d' : '#124522');
                        ctx.beginPath();
                        ctx.moveTo(pBase.x, tierTopY);
                        ctx.lineTo(pBase.x + tierW / 2, tierBaseY);
                        ctx.lineTo(pBase.x - tierW / 2, tierBaseY);
                        ctx.closePath();
                        ctx.fill();
                    }
                }
            });
        }
    }

    collectFlag(list) {
        const cup = this.course.cupPosition;
        const pBottom = this.project(cup);
        const pTop = this.project(new Vec3(cup.x, cup.y + 2.5, cup.z));

        if (!pBottom || !pTop) return;

        const depth = pBottom.z;
        const flagHeight = Math.abs(pBottom.y - pTop.y);

        list.push({
            depth: depth,
            render: (ctx) => {
                // Cup hole ring
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.ellipse(pBottom.x, pBottom.y, Math.max(3, flagHeight * 0.06), Math.max(1.5, flagHeight * 0.03), 0, 0, Math.PI * 2);
                ctx.fill();

                // Flag Pole
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = Math.max(1.5, flagHeight * 0.02);
                ctx.beginPath();
                ctx.moveTo(pBottom.x, pBottom.y);
                ctx.lineTo(pTop.x, pTop.y);
                ctx.stroke();

                // Pennant Cloth
                const clothW = Math.max(8, flagHeight * 0.22);
                const clothH = Math.max(5, flagHeight * 0.14);
                ctx.fillStyle = '#e63946';
                ctx.beginPath();
                ctx.moveTo(pTop.x, pTop.y);
                ctx.lineTo(pTop.x + clothW, pTop.y + clothH * 0.5);
                ctx.lineTo(pTop.x, pTop.y + clothH);
                ctx.closePath();
                ctx.fill();
            }
        });
    }

    collectGreenGrid(list) {
        const hole = this.course.holeData;
        const green = hole.greenCenter;
        const r = hole.greenRadius;
        const step = 2.0;

        for (let x = green.x - r; x <= green.x + r; x += step) {
            for (let z = green.z - r; z <= green.z + r; z += step) {
                if (Math.hypot(x - green.x, z - green.z) <= r) {
                    const h = this.course.getTerrainHeight(x, z);
                    const normal = this.course.getTerrainNormal(x, z);
                    const mag = Math.hypot(normal.x, normal.z);
                    const p = this.project(new Vec3(x, h + 0.05, z));

                    if (!p) continue;

                    // Bead moving in slope direction
                    const animOffset = ((this.gridAnimTime * 2.0 + x + z) % 1.5) / 1.5;
                    const shiftX = (mag > 0.001 ? normal.x / mag : 0) * animOffset * 0.8;
                    const shiftZ = (mag > 0.001 ? normal.z / mag : 0) * animOffset * 0.8;
                    const pAnim = this.project(new Vec3(x + shiftX, h + 0.05, z + shiftZ));

                    if (!pAnim) continue;

                    list.push({
                        depth: pAnim.z,
                        render: (ctx) => {
                            const beadRadius = Math.max(1.5, Math.min(5, (1 / pAnim.z) * 50));
                            ctx.fillStyle = mag < 0.02 ? '#4ade80' : (mag < 0.05 ? '#facc15' : '#ef4444');
                            ctx.beginPath();
                            ctx.arc(pAnim.x, pAnim.y, beadRadius, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    });
                }
            }
        }
    }

    collectBallAndAim(list, trailPoints, aimAngleRad, club) {
        const ballPos = this.physics.ballPosition;
        const pBall = this.project(ballPos);

        // Ground shadow
        const groundH = this.course.getTerrainHeight(ballPos.x, ballPos.z);
        const pShadow = this.project(new Vec3(ballPos.x, groundH, ballPos.z));

        // 1. Aim Line & Target (when idle)
        if (!this.physics.inAir && !this.physics.isRolling && pBall) {
            const targetDist = club.range * 0.9144;
            const targetX = ballPos.x + Math.sin(aimAngleRad) * targetDist;
            const targetZ = ballPos.z + Math.cos(aimAngleRad) * targetDist;
            const targetH = this.course.getTerrainHeight(targetX, targetZ);
            const pTarget = this.project(new Vec3(targetX, targetH, targetZ));

            if (pTarget) {
                list.push({
                    depth: pTarget.z + 0.1,
                    render: (ctx) => {
                        // Target landing ring
                        ctx.strokeStyle = '#ffea00';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.ellipse(pTarget.x, pTarget.y, 16, 8, 0, 0, Math.PI * 2);
                        ctx.stroke();

                        // Parabolic dashed aim guideline
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
                        ctx.lineWidth = 2;
                        ctx.setLineDash([6, 6]);
                        ctx.beginPath();
                        const segments = 16;
                        for (let i = 0; i <= segments; i++) {
                            const t = i / segments;
                            const px = ballPos.x + (targetX - ballPos.x) * t;
                            const pz = ballPos.z + (targetZ - ballPos.z) * t;
                            const gh = this.course.getTerrainHeight(px, pz);
                            const arch = Math.sin(t * Math.PI) * (club.type === 'putter' ? 0 : 8);
                            const pArc = this.project(new Vec3(px, gh + arch, pz));
                            if (pArc) {
                                if (i === 0) ctx.moveTo(pArc.x, pArc.y);
                                else ctx.lineTo(pArc.x, pArc.y);
                            }
                        }
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }
                });
            }
        }

        // 2. Flight Trail
        if (trailPoints.length > 1) {
            list.push({
                depth: pBall ? pBall.z : 10,
                render: (ctx) => {
                    ctx.strokeStyle = '#00f2fe';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    let started = false;
                    for (const pt of trailPoints) {
                        const pp = this.project(pt);
                        if (pp) {
                            if (!started) { ctx.moveTo(pp.x, pp.y); started = true; }
                            else { ctx.lineTo(pp.x, pp.y); }
                        }
                    }
                    if (started) ctx.stroke();
                }
            });
        }

        // 3. Ball Mesh & Shadow
        if (pBall) {
            list.push({
                depth: pBall.z,
                render: (ctx) => {
                    // Shadow on ground
                    if (pShadow && ballPos.y > groundH) {
                        const shadowAlpha = Math.max(0.1, 0.6 - (ballPos.y - groundH) * 0.05);
                        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
                        ctx.beginPath();
                        ctx.ellipse(pShadow.x, pShadow.y, Math.max(2, 60 / pShadow.z), Math.max(1, 30 / pShadow.z), 0, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    // Golf Ball Sphere
                    const ballRadius = Math.max(3.5, Math.min(16, (1 / pBall.z) * 110));
                    const grad = ctx.createRadialGradient(
                        pBall.x - ballRadius * 0.3,
                        pBall.y - ballRadius * 0.3,
                        ballRadius * 0.1,
                        pBall.x,
                        pBall.y,
                        ballRadius
                    );
                    grad.addColorStop(0, '#ffffff');
                    grad.addColorStop(0.8, '#e2e8f0');
                    grad.addColorStop(1, '#94a3b8');

                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(pBall.x, pBall.y, ballRadius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });
        }
    }

    getShadedColor(hex, factor) {
        // Simple hex color brightness adjuster
        let num = parseInt(hex.replace('#', ''), 16);
        let r = Math.min(255, Math.floor(((num >> 16) & 255) * factor));
        let g = Math.min(255, Math.floor(((num >> 8) & 255) * factor));
        let b = Math.min(255, Math.floor((num & 255) * factor));
        return `rgb(${r}, ${g}, ${b})`;
    }
}

window.Pure3DRenderer = Pure3DRenderer;
