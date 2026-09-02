/**
 * The Nail Canvas - 3D Three.js Wheel System
 * WebGL 3D roulette wheel with metallic gold materials,
 * dynamic studio lighting, mechanical pointer physics, and floating sparkles.
 * Note: Cursor parallax is disabled per user request.
 */

import * as THREE from 'three';
import { WHEEL_SEGMENTS } from './discountEngine.js';
import { soundEngine } from './soundEngine.js';

export class ThreeWheel {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = options;
    this.segments = WHEEL_SEGMENTS;
    this.numSegments = this.segments.length;
    this.segmentAngle = (Math.PI * 2) / this.numSegments;

    this.isSpinning = false;
    this.currentRotation = 0;
    this.targetRotation = 0;
    this.startRotation = 0;
    this.spinStartTime = 0;
    this.spinDuration = 5800; // ms
    this.onSpinComplete = null;

    // Pointer dynamic tick physics
    this.pointerAngle = 0;
    this.lastPegIndex = -1;

    this.initScene();
    this.createWheel();
    this.createPointer();
    this.createSparkles();
    this.setupEventListeners();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initScene() {
    this.width = this.container.clientWidth || 400;
    this.height = this.container.clientHeight || 400;

    this.scene = new THREE.Scene();
    // Keep scene stable - no parallax tilt
    this.scene.rotation.set(0, 0, 0);

    // Camera setup - positioned directly in front
    this.camera = new THREE.PerspectiveCamera(38, this.width / this.height, 0.1, 1000);
    this.camera.position.set(0, 0, 10.2);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    this.container.appendChild(this.renderer.domElement);

    // Lighting
    // 1. Warm ambient light
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.3);
    this.scene.add(ambientLight);

    // 2. Main Studio Key Light (Champagne Gold)
    const keyLight = new THREE.DirectionalLight(0xfff0dd, 2.4);
    keyLight.position.set(4, 7, 7);
    this.scene.add(keyLight);

    // 3. Accent Rim Light (Velvet Rose)
    const rimLight = new THREE.DirectionalLight(0xff99bb, 1.8);
    rimLight.position.set(-6, -4, 4);
    this.scene.add(rimLight);

    // 4. Pointer Highlight Spot
    const pointerLight = new THREE.PointLight(0xffd700, 2.2, 8);
    pointerLight.position.set(0, 3.6, 2.5);
    this.scene.add(pointerLight);
  }

  /**
   * Generates ultra-crisp procedural canvas texture for the wheel face
   */
  generateWheelTexture() {
    const size = 2048;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const center = size / 2;
    const radius = size * 0.48;

    ctx.clearRect(0, 0, size, size);

    // Draw slices
    const segCount = this.numSegments;
    const arcAngle = (Math.PI * 2) / segCount;

    for (let i = 0; i < segCount; i++) {
      const seg = this.segments[i];
      const startAngle = i * arcAngle;
      const endAngle = (i + 1) * arcAngle;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();

      // Slice background gradient
      const midAngle = (startAngle + endAngle) / 2;
      const gradX1 = center + Math.cos(midAngle) * (radius * 0.2);
      const gradY1 = center + Math.sin(midAngle) * (radius * 0.2);
      const gradX2 = center + Math.cos(midAngle) * radius;
      const gradY2 = center + Math.sin(midAngle) * radius;

      const gradient = ctx.createLinearGradient(gradX1, gradY1, gradX2, gradY2);
      gradient.addColorStop(0, seg.color);
      gradient.addColorStop(1, this.shadeColor(seg.color, -25));
      ctx.fillStyle = gradient;
      ctx.fill();

      // Golden sector separator line
      ctx.strokeStyle = 'rgba(230, 180, 80, 0.75)';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Draw sector text & typography
      ctx.save();
      ctx.translate(center, center);

      // Rotate to slice center angle
      ctx.rotate(midAngle);

      const textDist = radius * 0.68;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Special highlight badge for 40% and 50%
      if (seg.isHigh) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.22)';
        ctx.beginPath();
        ctx.arc(textDist, 0, 90, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Percentage text
      ctx.fillStyle = seg.textColor || '#FFFFFF';
      ctx.font = 'bold 96px "Cinzel", "Playfair Display", Georgia, serif';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 3;
      ctx.fillText(`${seg.discount}%`, textDist, -22);

      // "OFF" Subtitle
      ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      ctx.letterSpacing = '4px';
      ctx.shadowBlur = 4;
      ctx.fillText('OFF', textDist, 38);

      // Sub-label (GLOW / CHIC / LUXE / SPECIAL / JACKPOT)
      ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = seg.isHigh ? '#FFDF78' : 'rgba(255, 255, 255, 0.85)';
      ctx.letterSpacing = '5px';
      ctx.fillText(seg.sub, textDist, 74);

      ctx.restore();
    }

    // Outer golden decorative concentric rings
    ctx.beginPath();
    ctx.arc(center, center, radius - 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 14;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, radius - 24, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 235, 170, 0.6)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Inner gold ring around center hub
    ctx.beginPath();
    ctx.arc(center, center, radius * 0.28, 0, Math.PI * 2);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 10;
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  shadeColor(color, percent) {
    let num = parseInt(color.replace('#', ''), 16);
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) + amt;
    let G = ((num >> 8) & 0x00FF) + amt;
    let B = (num & 0x0000FF) + amt;
    return '#' + (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1);
  }

  createWheel() {
    this.wheelGroup = new THREE.Group();
    const wheelRadius = 3.35;
    const wheelDepth = 0.45;

    // 1. Wheel face disc with procedural texture
    const faceTexture = this.generateWheelTexture();
    const faceGeometry = new THREE.CircleGeometry(wheelRadius, 64);
    const faceMaterial = new THREE.MeshStandardMaterial({
      map: faceTexture,
      roughness: 0.28,
      metalness: 0.15,
      side: THREE.FrontSide
    });
    this.wheelFace = new THREE.Mesh(faceGeometry, faceMaterial);
    this.wheelFace.position.z = wheelDepth / 2 + 0.01;
    this.wheelGroup.add(this.wheelFace);

    // 2. Cylindrical wheel body (Chic dark velvet casing)
    const bodyGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelDepth, 64, 1, false);
    bodyGeometry.rotateX(Math.PI / 2);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a0f18,
      roughness: 0.5,
      metalness: 0.4
    });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.wheelGroup.add(bodyMesh);

    // 3. Luxurious Beveled Gold Outer Rim
    const rimGeometry = new THREE.TorusGeometry(wheelRadius + 0.02, 0.12, 24, 64);
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6b450,
      metalness: 0.92,
      roughness: 0.18,
    });
    const rimMesh = new THREE.Mesh(rimGeometry, goldMaterial);
    rimMesh.position.z = wheelDepth / 2;
    this.wheelGroup.add(rimMesh);

    // 4. Perimeter Gold Rivets / Pegs
    this.pegObjects = [];
    const pegGeometry = new THREE.CylinderGeometry(0.045, 0.045, 0.16, 16);
    pegGeometry.rotateX(Math.PI / 2);
    const pegMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdf78,
      metalness: 0.95,
      roughness: 0.1
    });

    for (let i = 0; i < this.numSegments; i++) {
      const angle = i * this.segmentAngle;
      const pegMesh = new THREE.Mesh(pegGeometry, pegMaterial);
      const pegDist = wheelRadius - 0.08;
      // Invert Y to match canvas coordinates (phi = -alpha)
      pegMesh.position.set(
        Math.cos(angle) * pegDist,
        -Math.sin(angle) * pegDist,
        wheelDepth / 2 + 0.08
      );
      this.wheelGroup.add(pegMesh);
      this.pegObjects.push(pegMesh);
    }

    // 5. Center Hub Gold Rim Ring (The interactive SPIN button lives right in the center)
    const hubBaseGeo = new THREE.CylinderGeometry(0.92, 0.98, 0.18, 32);
    hubBaseGeo.rotateX(Math.PI / 2);
    const hubBase = new THREE.Mesh(hubBaseGeo, goldMaterial);
    hubBase.position.z = wheelDepth / 2 + 0.06;
    this.wheelGroup.add(hubBase);

    this.scene.add(this.wheelGroup);
  }

  /**
   * Creates the 3D Metallic Pointer at the top (12 o'clock)
   */
  createPointer() {
    this.pointerPivot = new THREE.Group();
    // Position at top center pointing down into the wheel
    this.pointerPivot.position.set(0, 3.42, 0.42);

    // 3D Arrow / Teardrop flapper
    const pointerShape = new THREE.Shape();
    pointerShape.moveTo(0, -0.65);
    pointerShape.lineTo(0.24, 0.18);
    pointerShape.lineTo(0.08, 0.38);
    pointerShape.lineTo(-0.08, 0.38);
    pointerShape.lineTo(-0.24, 0.18);
    pointerShape.closePath();

    const extrudeSettings = {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04
    };

    const pointerGeo = new THREE.ExtrudeGeometry(pointerShape, extrudeSettings);
    const pointerMat = new THREE.MeshStandardMaterial({
      color: 0xffe070,
      metalness: 0.96,
      roughness: 0.12,
    });

    this.pointerMesh = new THREE.Mesh(pointerGeo, pointerMat);
    this.pointerMesh.position.z = -0.06;
    this.pointerPivot.add(this.pointerMesh);

    // Pointer pivot gold cap
    const capGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.12, 16);
    capGeo.rotateX(Math.PI / 2);
    const capMesh = new THREE.Mesh(capGeo, pointerMat);
    capMesh.position.set(0, 0.26, 0.08);
    this.pointerPivot.add(capMesh);

    this.scene.add(this.pointerPivot);
  }

  /**
   * Floating 3D ambient cosmetic sparkles
   */
  createSparkles() {
    const particleCount = 140;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const goldColor = new THREE.Color('#FFD700');
    const roseColor = new THREE.Color('#FFB6C1');
    const whiteColor = new THREE.Color('#FFFFFF');

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;

      const r = Math.random();
      const col = r < 0.45 ? goldColor : (r < 0.8 ? roseColor : whiteColor);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d');
    const grad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 220, 160, 0.7)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 64, 64);

    const pTexture = new THREE.CanvasTexture(pCanvas);

    const material = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      map: pTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.sparkles = new THREE.Points(geometry, material);
    this.scene.add(this.sparkles);
  }

  setupEventListeners() {
    this.handleResize = () => {
      if (!this.container) return;
      this.width = this.container.clientWidth;
      this.height = this.container.clientHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    };
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Starts spinning towards the designated target segment
   */
  spinTo(outcome, onComplete) {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.onSpinComplete = onComplete;

    soundEngine.playSpinStart();

    const targetIndex = outcome.segment.index;
    const segAngle = this.segmentAngle;

    // Canvas center angle of the target slice
    const sliceCenterCanvasAngle = (targetIndex + 0.5) * segAngle;

    // Top pointer is at Math.PI / 2 (12 o'clock).
    // Canvas angle phi = R - Math.PI / 2.
    // Setting phi == sliceCenterCanvasAngle gives:
    const targetRotationAngle = sliceCenterCanvasAngle + Math.PI / 2;

    // Normalize current rotation
    const currentMod = this.currentRotation % (Math.PI * 2);

    // 6 to 8 full rotations
    const fullSpins = (6 + Math.floor(Math.random() * 2)) * Math.PI * 2;

    // Safe random jitter within slice (+/- 18% of slice width) to land naturally
    const jitter = (Math.random() - 0.5) * (segAngle * 0.35);

    let delta = (targetRotationAngle + jitter - currentMod) % (Math.PI * 2);
    while (delta < 0) {
      delta += Math.PI * 2;
    }

    this.startRotation = this.currentRotation;
    this.targetRotation = this.currentRotation + fullSpins + delta;
    this.spinDuration = 5600 + Math.random() * 400; // ~6 seconds
    this.spinStartTime = performance.now();
    this.lastPegIndex = -1;
  }

  easeOutQuint(t) {
    return 1 - Math.pow(1 - t, 5);
  }

  animate(time) {
    requestAnimationFrame(this.animate);

    // Wheel spin animation
    if (this.isSpinning) {
      const elapsed = performance.now() - this.spinStartTime;
      const progress = Math.min(elapsed / this.spinDuration, 1);
      const easedProgress = this.easeOutQuint(progress);

      const prevRotation = this.currentRotation;
      this.currentRotation = this.startRotation + (this.targetRotation - this.startRotation) * easedProgress;
      this.wheelGroup.rotation.z = this.currentRotation;

      const angularSpeed = this.currentRotation - prevRotation;

      // Pointer tick detection aligned with slice pegs
      let phiUnderPointer = (this.currentRotation - Math.PI / 2) % (Math.PI * 2);
      while (phiUnderPointer < 0) phiUnderPointer += Math.PI * 2;
      const pegIndex = Math.floor(phiUnderPointer / this.segmentAngle);

      if (pegIndex !== this.lastPegIndex) {
        this.lastPegIndex = pegIndex;
        const speedFactor = Math.min(angularSpeed * 80, 1.2);
        this.pointerAngle = -0.32 * Math.max(0.3, speedFactor);
        soundEngine.playTick(0.9 + Math.random() * 0.2);
      }

      if (progress >= 1) {
        this.isSpinning = false;
        if (this.onSpinComplete) {
          this.onSpinComplete();
          this.onSpinComplete = null;
        }
      }
    }

    // Pointer spring return physics
    this.pointerAngle += (0 - this.pointerAngle) * 0.18;
    this.pointerPivot.rotation.z = this.pointerAngle;

    // Subtle drift for ambient sparkles
    if (this.sparkles) {
      this.sparkles.rotation.z = time * 0.0001;
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    window.removeEventListener('resize', this.handleResize);
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
