import Phaser from 'phaser';

interface BuildingInfo {
  id: number;
  name: string;
  x: number;
  y: number;
  defenderColor: number;
  attackerColor: number;
}

export class MainScene extends Phaser.Scene {
  private buildings: BuildingInfo[] = [
    { id: 1, name: "The Lobby", x: 0, y: 0, defenderColor: 0x3b82f6, attackerColor: 0xef4444 },
    { id: 2, name: "Employee Workstation", x: 150, y: 150, defenderColor: 0x0ea5e9, attackerColor: 0xd946ef },
    { id: 3, name: "Executive Suite", x: 300, y: 150, defenderColor: 0x06b6d4, attackerColor: 0xdb2777 },
    { id: 4, name: "Server Cluster Alpha", x: 300, y: 0, defenderColor: 0x14b8a6, attackerColor: 0xe11d48 },
    { id: 5, name: "Network Closet", x: 150, y: -150, defenderColor: 0x10b981, attackerColor: 0xf97316 },
    { id: 6, name: "Encryption Node", x: 0, y: -150, defenderColor: 0x8b5cf6, attackerColor: 0x84cc16 },
    { id: 7, name: "AI Defense Core", x: -150, y: -150, defenderColor: 0x6366f1, attackerColor: 0xa855f7 },
    { id: 8, name: "The Castle", x: -300, y: 0, defenderColor: 0xf59e0b, attackerColor: 0xdc2626 },
  ];

  private buildingGraphics: Map<number, Phaser.GameObjects.Graphics> = new Map();
  private buildingLabels: Map<number, Phaser.GameObjects.Text> = new Map();
  private buildingGlows: Map<number, Phaser.GameObjects.Graphics> = new Map();
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private ambientParticles: { x: number; y: number; vx: number; vy: number; alpha: number; size: number }[] = [];
  private ambientGraphics!: Phaser.GameObjects.Graphics;
  private dataPackets: { x: number; y: number; targetX: number; targetY: number; progress: number; speed: number; pathIndex: number }[] = [];
  private dataPacketGraphics!: Phaser.GameObjects.Graphics;
  private glowPulseTime: number = 0;

  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    this.drawIsometricGrid();
    
    // Ambient particle layer (behind everything)
    this.ambientGraphics = this.add.graphics();
    this.initAmbientParticles();

    this.pathGraphics = this.add.graphics();
    this.dataPacketGraphics = this.add.graphics();

    this.cameras.main.centerOn(0, 0);

    this.buildings.forEach((b) => {
      // Glow layer beneath building
      const glowGraphics = this.add.graphics();
      this.buildingGlows.set(b.id, glowGraphics);

      const graphics = this.add.graphics();
      const label = this.add.text(0, 0, `${b.id}. ${b.name}`, {
        fontFamily: "'Inter', sans-serif",
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#71717a',
        backgroundColor: '#000000cc',
        padding: { x: 6, y: 3 }
      }).setOrigin(0.5).setResolution(2);

      // Floating label animation
      this.tweens.add({
        targets: label,
        y: '-=6',
        yoyo: true,
        repeat: -1,
        duration: 1500 + Math.random() * 1000,
        ease: 'Sine.easeInOut'
      });

      // Hovering building animation
      this.tweens.add({
        targets: graphics,
        y: '-=10',
        yoyo: true,
        repeat: -1,
        duration: 2000 + Math.random() * 1000,
        ease: 'Sine.easeInOut'
      });

      this.buildingGraphics.set(b.id, graphics);
      this.buildingLabels.set(b.id, label);
    });

    this.updateBuildings();
    this.focusHighestUnlocked();

    // Registry events for reactive updates
    this.registry.events.on('changedata', (_parent: any, key: string, _data: any) => {
      this.updateBuildings();
      if (key === 'role') {
        this.focusHighestUnlocked();
      }
    });

    // Disable right-click menu so right-click drag can work if needed
    this.input.mouse?.disableContextMenu();

    let lastX = 0;
    let lastY = 0;
    let wasDown = false;

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        if (wasDown) {
          const dx = pointer.position.x - lastX;
          const dy = pointer.position.y - lastY;
          
          this.cameras.main.scrollX -= dx / this.cameras.main.zoom;
          this.cameras.main.scrollY -= dy / this.cameras.main.zoom;
        }
        lastX = pointer.position.x;
        lastY = pointer.position.y;
        wasDown = true;
      } else {
        wasDown = false;
      }
    });

    // Handle case where mouse is released outside the canvas or skips move events
    this.input.on('pointerup', () => { wasDown = false; });
    this.input.on('pointerupoutside', () => { wasDown = false; });

    // Mouse wheel to zoom
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any, _deltaX: number, deltaY: number, _deltaZ: number) => {
      // Handle both smooth pixel scrolling (trackpads) and stepped line scrolling (mouse wheels)
      let zoomStep = deltaY * 0.002; 
      if (Math.abs(deltaY) < 10) {
        zoomStep = Math.sign(deltaY) * 0.15;
      }
      const newZoom = this.cameras.main.zoom - zoomStep;
      this.cameras.main.zoom = Phaser.Math.Clamp(newZoom, 0.4, 2.5);
    });
  }

  private initAmbientParticles() {
    for (let i = 0; i < 80; i++) {
      this.ambientParticles.push({
        x: Phaser.Math.Between(-800, 800),
        y: Phaser.Math.Between(-600, 600),
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2 - 0.1,
        alpha: Math.random() * 0.3 + 0.05,
        size: Math.random() * 2 + 0.5,
      });
    }
  }

  private focusHighestUnlocked() {
    const role = this.registry.get('role');
    const unlockedLevels = this.registry.get('unlockedLevels');
    if (!unlockedLevels || !role) return;

    const currentUnlocked = unlockedLevels[role];
    const targetBuilding = this.buildings.find(b => b.id === currentUnlocked);

    if (targetBuilding) {
      const isoX = targetBuilding.x - targetBuilding.y;
      const isoY = (targetBuilding.x + targetBuilding.y) / 2;
      this.cameras.main.pan(isoX, isoY, 400, 'Sine.easeOut');
    }
  }

  private drawIsoBox(g: Phaser.GameObjects.Graphics, x: number, y: number, z: number, w: number, d: number, h: number, color: number, alpha: number, isUnlocked: boolean) {
    const isoX = x - y;
    const isoY = (x + y) / 2 - z;

    const pBack = { x: isoX, y: isoY }; 
    const pRight = { x: isoX + w, y: isoY + w/2 }; 
    const pFront = { x: isoX + w - d, y: isoY + (w+d)/2 }; 
    const pLeft = { x: isoX - d, y: isoY + d/2 }; 

    const pBackTop = { x: pBack.x, y: pBack.y - h }; 
    const pRightTop = { x: pRight.x, y: pRight.y - h }; 
    const pFrontTop = { x: pFront.x, y: pFront.y - h }; 
    const pLeftTop = { x: pLeft.x, y: pLeft.y - h }; 

    const darkerColor = Phaser.Display.Color.IntegerToColor(color).darken(25).color;
    const darkestColor = Phaser.Display.Color.IntegerToColor(color).darken(45).color;
    const brighterColor = Phaser.Display.Color.IntegerToColor(color).brighten(40).color;

    // Edge highlighting
    g.lineStyle(isUnlocked ? 2 : 1, isUnlocked ? brighterColor : 0xffffff, alpha * (isUnlocked ? 0.9 : 0.3));

    // Front-Left face
    g.fillStyle(darkerColor, alpha);
    g.beginPath();
    g.moveTo(pFrontTop.x, pFrontTop.y);
    g.lineTo(pLeftTop.x, pLeftTop.y);
    g.lineTo(pLeft.x, pLeft.y);
    g.lineTo(pFront.x, pFront.y);
    g.closePath(); g.fillPath(); g.strokePath();

    // Front-Right face
    g.fillStyle(darkestColor, alpha);
    g.beginPath();
    g.moveTo(pFrontTop.x, pFrontTop.y);
    g.lineTo(pFront.x, pFront.y);
    g.lineTo(pRight.x, pRight.y);
    g.lineTo(pRightTop.x, pRightTop.y);
    g.closePath(); g.fillPath(); g.strokePath();

    // Top face
    g.fillStyle(color, alpha);
    g.beginPath();
    g.moveTo(pBackTop.x, pBackTop.y);
    g.lineTo(pRightTop.x, pRightTop.y);
    g.lineTo(pFrontTop.x, pFrontTop.y);
    g.lineTo(pLeftTop.x, pLeftTop.y);
    g.closePath(); g.fillPath(); g.strokePath();

    // Decorative glowing inner rim on top face if unlocked
    if (isUnlocked && w > 10 && d > 10) {
      g.fillStyle(brighterColor, alpha * 0.25);
      g.beginPath();
      g.moveTo(pBackTop.x, pBackTop.y + 4);
      g.lineTo(pRightTop.x - 4, pRightTop.y + 2);
      g.lineTo(pFrontTop.x, pFrontTop.y - 4);
      g.lineTo(pLeftTop.x + 4, pLeftTop.y + 2);
      g.closePath(); g.fillPath();
    }

    // Glowing vertical window strips or patterns on front faces
    if (h > 15 && isUnlocked) {
      const windowRows = Math.floor(h / 12);
      for (let row = 0; row < windowRows; row++) {
        // Front-left face details
        const wyL = pLeft.y + ((pFront.y - pLeft.y) * 0.5) - (row + 1) * (h / (windowRows + 1));
        const wxL = pLeft.x + ((pFront.x - pLeft.x) * 0.5);
        
        g.fillStyle(brighterColor, alpha * 0.8);
        g.beginPath();
        g.moveTo(wxL - 3, wyL - 1);
        g.lineTo(wxL + 3, wyL + 2);
        g.lineTo(wxL + 3, wyL + 5);
        g.lineTo(wxL - 3, wyL + 2);
        g.closePath(); g.fillPath();

        // Front-right face details
        const wyR = pFront.y + ((pRight.y - pFront.y) * 0.5) - (row + 1) * (h / (windowRows + 1));
        const wxR = pFront.x + ((pRight.x - pFront.x) * 0.5);

        g.fillStyle(brighterColor, alpha * 0.6);
        g.beginPath();
        g.moveTo(wxR - 3, wyR + 2);
        g.lineTo(wxR + 3, wyR - 1);
        g.lineTo(wxR + 3, wyR + 2);
        g.lineTo(wxR - 3, wyR + 5);
        g.closePath(); g.fillPath();
      }
    }
  }

  private updateBuildings() {
    const role = this.registry.get('role');
    const unlockedLevels = this.registry.get('unlockedLevels');
    const currentUnlocked = unlockedLevels ? unlockedLevels[role] : 1;

    // Draw Data Highway paths
    this.pathGraphics.clear();
    this.dataPackets = [];

    for (let i = 0; i < this.buildings.length - 1; i++) {
      const b1 = this.buildings[i];
      const b2 = this.buildings[i+1];
      const isPathUnlocked = currentUnlocked > b1.id;
      
      const startIsoX = b1.x - b1.y;
      const startIsoY = (b1.x + b1.y) / 2;
      const endIsoX = b2.x - b2.y;
      const endIsoY = (b2.x + b2.y) / 2;

      // Glow under path
      if (isPathUnlocked) {
        this.pathGraphics.lineStyle(8, role === 'attacker' ? 0xef4444 : 0x3b82f6, 0.08);
        this.pathGraphics.beginPath();
        this.pathGraphics.moveTo(startIsoX, startIsoY);
        this.pathGraphics.lineTo(endIsoX, endIsoY);
        this.pathGraphics.strokePath();
      }

      // Main line
      this.pathGraphics.lineStyle(isPathUnlocked ? 3 : 1, isPathUnlocked ? (role === 'attacker' ? 0xef4444 : 0x3b82f6) : 0x3f3f46, isPathUnlocked ? 0.7 : 0.2);
      this.pathGraphics.beginPath();
      this.pathGraphics.moveTo(startIsoX, startIsoY);
      this.pathGraphics.lineTo(endIsoX, endIsoY);
      this.pathGraphics.strokePath();

      // Dashed overlay for locked paths
      if (!isPathUnlocked) {
        const dashLen = 8;
        const dx = endIsoX - startIsoX;
        const dy = endIsoY - startIsoY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dashes = Math.floor(dist / (dashLen * 2));
        this.pathGraphics.lineStyle(1, 0x52525b, 0.3);
        for (let d = 0; d < dashes; d++) {
          const t1 = (d * 2 * dashLen) / dist;
          const t2 = ((d * 2 + 1) * dashLen) / dist;
          this.pathGraphics.beginPath();
          this.pathGraphics.moveTo(startIsoX + dx * t1, startIsoY + dy * t1);
          this.pathGraphics.lineTo(startIsoX + dx * t2, startIsoY + dy * t2);
          this.pathGraphics.strokePath();
        }
      }

      // Spawn data packets for unlocked paths
      if (isPathUnlocked) {
        for (let p = 0; p < 2; p++) {
          this.dataPackets.push({
            x: startIsoX,
            y: startIsoY,
            targetX: endIsoX,
            targetY: endIsoY,
            progress: Math.random(),
            speed: 0.003 + Math.random() * 0.002,
            pathIndex: i,
          });
        }
      }
    }

    this.buildings.forEach((b) => {
      const role = this.registry.get('role');
      const unlockedLevels = this.registry.get('unlockedLevels');
      const completedLevels = this.registry.get('completedLevels');
      
      const currentUnlocked = (unlockedLevels && role) ? (unlockedLevels[role] || 1) : 1;
      const isCompleted = (completedLevels && role && completedLevels[role]) ? completedLevels[role].has(b.id) : false;
      const isUnlocked = b.id <= currentUnlocked;
      const isCurrent = b.id === currentUnlocked;
      const graphics = this.buildingGraphics.get(b.id)!;
      const label = this.buildingLabels.get(b.id)!;
      const glowG = this.buildingGlows.get(b.id)!;

      graphics.clear();
      glowG.clear();
      
      // Use role-specific colors
      let baseColor = role === 'attacker' ? b.attackerColor : b.defenderColor;
      let color = isUnlocked ? baseColor : 0x3f3f46;
      if (isCompleted) {
        // Brighter success color for completed nodes based on their base color
        color = Phaser.Display.Color.IntegerToColor(baseColor).brighten(20).color;
      }
      
      const alpha = isUnlocked ? 1.0 : 0.3;
      
      const bx = b.x;
      const by = b.y;

      const isoX = bx - by;
      const isoY = (bx + by) / 2;

      // Draw ground glow for unlocked buildings
      if (isUnlocked) {
        glowG.fillStyle(baseColor, isCurrent ? 0.12 : 0.05);
        glowG.fillEllipse(isoX, isoY + 20, 100, 40);
        if (isCurrent) {
          glowG.fillStyle(baseColor, 0.06);
          glowG.fillEllipse(isoX, isoY + 20, 140, 55);
        }
      }

      // Draw structures - each building has unique architecture
      if (b.id === 1) { 
        // The Lobby: Reception building with entrance
        this.drawIsoBox(graphics, bx - 25, by - 25, 0, 50, 50, 12, color, alpha, isUnlocked);
        this.drawIsoBox(graphics, bx - 15, by - 15, 12, 30, 30, 20, color, alpha, isUnlocked);
        // Antenna
        if (isUnlocked) {
          graphics.lineStyle(2, color, alpha * 0.8);
          graphics.beginPath();
          graphics.moveTo(isoX, isoY - 32);
          graphics.lineTo(isoX, isoY - 50);
          graphics.strokePath();
          graphics.fillStyle(color, alpha);
          graphics.fillCircle(isoX, isoY - 52, 3);
        }
      } 
      else if (b.id === 2) { 
        // Workstation: Multi-story office
        this.drawIsoBox(graphics, bx - 25, by - 25, 0, 50, 50, 10, color, alpha, isUnlocked);
        this.drawIsoBox(graphics, bx - 22, by - 22, 10, 44, 44, 25, color, alpha, isUnlocked);
        this.drawIsoBox(graphics, bx - 18, by - 18, 35, 36, 36, 25, color, alpha, isUnlocked);
      }
      else if (b.id === 3) {
        // Executive Suite: Tall tower with spire
        this.drawIsoBox(graphics, bx - 20, by - 20, 0, 40, 40, 60, color, alpha, isUnlocked);
        this.drawIsoBox(graphics, bx - 15, by - 15, 60, 30, 30, 40, color, alpha, isUnlocked);
        this.drawIsoBox(graphics, bx - 10, by - 10, 100, 20, 20, 30, color, alpha, isUnlocked);
        // Spire
        if (isUnlocked) {
          graphics.lineStyle(2, color, alpha);
          graphics.beginPath();
          graphics.moveTo(isoX, isoY - 130);
          graphics.lineTo(isoX, isoY - 155);
          graphics.strokePath();
        }
      }
      else if (b.id === 4) {
        // Server cluster: Multiple units
        this.drawIsoBox(graphics, bx - 35, by - 15, 0, 25, 30, 25, color, alpha, isUnlocked);
        this.drawIsoBox(graphics, bx - 5, by - 15, 0, 25, 30, 30, color, alpha, isUnlocked);
        this.drawIsoBox(graphics, bx + 10, by - 15, 0, 25, 30, 20, color, alpha, isUnlocked);
        // Connecting cables on top
        if (isUnlocked) {
          graphics.lineStyle(1, color, alpha * 0.6);
          const s1x = (bx - 22) - (by);
          const s1y = ((bx - 22) + (by)) / 2 - 25;
          const s2x = (bx + 8) - (by);
          const s2y = ((bx + 8) + (by)) / 2 - 30;
          graphics.beginPath();
          graphics.moveTo(s1x, s1y);
          graphics.lineTo(s2x, s2y);
          graphics.strokePath();
        }
      }
      else if (b.id === 5) {
        // Network closet: Compact with satellite
        this.drawIsoBox(graphics, bx - 20, by - 20, 0, 40, 40, 18, color, alpha, isUnlocked);
        this.drawIsoBox(graphics, bx - 12, by - 12, 18, 24, 24, 10, color, alpha, isUnlocked);
        // Satellite dish
        if (isUnlocked) {
          graphics.lineStyle(1, color, alpha * 0.7);
          graphics.beginPath();
          graphics.arc(isoX + 15, isoY - 35, 8, -0.5, 1.5);
          graphics.strokePath();
        }
      }
      else if (b.id === 6) {
        // Encryption Node: Hexagonal base
        this.drawIsoBox(graphics, bx - 18, by - 18, 0, 36, 36, 15, color, alpha, isUnlocked);
        this.drawIsoBox(graphics, bx - 14, by - 14, 15, 28, 28, 20, color, alpha, isUnlocked);
        this.drawIsoBox(graphics, bx - 8, by - 8, 35, 16, 16, 15, color, alpha, isUnlocked);
      }
      else if (b.id === 7) {
        // AI Defense Core: Angular fortress
        this.drawIsoBox(graphics, bx - 30, by - 30, 0, 60, 60, 15, color, alpha, isUnlocked);
        this.drawIsoBox(graphics, bx - 15, by - 15, 15, 30, 30, 35, color, alpha, isUnlocked);
        // Dome
        if (isUnlocked) {
          graphics.fillStyle(color, alpha * 0.4);
          graphics.fillEllipse(isoX, isoY - 50, 30, 12);
        }
      }
      else if (b.id === 8) {
        // The Castle: Grand structure
        this.drawIsoBox(graphics, bx - 35, by - 35, 0, 70, 70, 20, color, alpha, isUnlocked);
        this.drawIsoBox(graphics, bx - 25, by - 25, 20, 50, 50, 40, color, alpha, isUnlocked);
        // Turrets
        this.drawIsoBox(graphics, bx - 30, by - 30, 20, 15, 15, 50, color, alpha, isUnlocked);
        this.drawIsoBox(graphics, bx + 15, by + 15, 20, 15, 15, 50, color, alpha, isUnlocked);
        // Flag on top
        if (isUnlocked) {
          graphics.lineStyle(2, 0xfbbf24, alpha);
          graphics.beginPath();
          graphics.moveTo(isoX, isoY - 60);
          graphics.lineTo(isoX, isoY - 80);
          graphics.strokePath();
          graphics.fillStyle(0xfbbf24, alpha);
          graphics.fillTriangle(isoX, isoY - 80, isoX + 10, isoY - 75, isoX, isoY - 70);
        }
      }

      // Label positioning
      const labelYOffset = b.id === 3 ? -160 : b.id === 8 ? -100 : -80;
      label.setPosition(isoX, isoY + labelYOffset);
      
      let labelText = `${b.id}. ${b.name}`;
      if (isCompleted) {
        labelText += role === 'attacker' ? " [BREACHED]" : " [SECURED]";
      }
      label.setText(labelText);
      label.setColor(isUnlocked ? '#e4e4e7' : '#52525b');
      label.setAlpha(alpha);

      // Level badge beneath label
      if (isCurrent) {
        label.setStyle({ 
          color: '#ffffff', 
          fontStyle: 'bold',
          backgroundColor: role === 'attacker' ? '#7f1d1dcc' : '#0c4a6ecc'
        });
      } else if (isCompleted) {
        label.setStyle({ 
          color: role === 'attacker' ? '#ff4444' : '#22d3ee', 
          fontStyle: 'bold', 
          backgroundColor: '#000000cc' 
        });
      } else if (isUnlocked) {
        label.setStyle({ color: '#e4e4e7', fontStyle: 'normal', backgroundColor: '#000000cc' });
      } else {
        label.setStyle({ color: '#52525b', fontStyle: 'normal', backgroundColor: '#000000aa' });
      }

      // Persist interactivity
      if (!graphics.input) {
        const hitArea = new Phaser.Geom.Polygon([
          isoX, isoY - 140,
          isoX + 70, isoY,
          isoX, isoY + 70,
          isoX - 70, isoY
        ]);
        graphics.setInteractive({ hitArea, hitAreaCallback: Phaser.Geom.Polygon.Contains, useHandCursor: true });
        
        graphics.on('pointerdown', () => {
          const r = this.registry.get('role');
          const ul = this.registry.get('unlockedLevels');
          const cu = (ul && r) ? (ul[r] || 1) : 1;
          if (b.id <= cu) {
            this.tweens.add({ targets: [graphics, label], scale: 0.96, duration: 80, ease: 'Power2' });
          }
        });

        graphics.on('pointerup', (pointer: Phaser.Input.Pointer) => {
          const r = this.registry.get('role');
          const ul = this.registry.get('unlockedLevels');
          const cu = (ul && r) ? (ul[r] || 1) : 1;
          
          if (b.id <= cu) {
            this.tweens.add({ targets: [graphics, label], scale: 1.08, duration: 100, ease: 'Back.easeOut' });
            
            if (pointer.getDistance() > 5) return; // Distinguish drag from click

            const activeLevel = this.registry.get('currentLevel');
            if (activeLevel !== null) return;
            
            const callback = this.registry.get('onBuildingClick');
            if (callback) callback(b.id);
          }
        });

        graphics.on('pointerover', () => {
          const r = this.registry.get('role');
          const ul = this.registry.get('unlockedLevels');
          const cu = (ul && r) ? (ul[r] || 1) : 1;
          if (b.id <= cu) {
            label.setStyle({ color: '#fff', fontWeight: 'bold', backgroundColor: '#000000ee' });
            const glowColor = r === 'attacker' ? '#ef4444' : '#38bdf8';
            label.setShadow(0, 0, glowColor, 10, true, true);
            this.tweens.add({ targets: [graphics, label], scale: 1.08, duration: 200, ease: 'Back.easeOut', overwrite: true });
          }
        });

        graphics.on('pointerout', () => {
          const r = this.registry.get('role');
          const ul = this.registry.get('unlockedLevels');
          const cu = (ul && r) ? (ul[r] || 1) : 1;
          label.setStyle({ 
            color: (b.id <= cu ? '#e4e4e7' : '#52525b'), 
            fontWeight: 'normal',
            backgroundColor: '#000000cc'
          });
          label.setShadow(0, 0, '#000', 0);
          this.tweens.add({ targets: [graphics, label], scale: 1, duration: 200, ease: 'Power2', overwrite: true });
        });
      }
    });
  }

  drawIsometricGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0xffffff, 0.03);
    
    const size = 1200;
    const step = 50;

    for (let i = -size; i <= size; i += step) {
      let startX = i - (-size);
      let startY = (i + (-size)) / 2;
      let endX = i - size;
      let endY = (i + size) / 2;
      graphics.moveTo(startX, startY);
      graphics.lineTo(endX, endY);

      startX = (-size) - i;
      startY = ((-size) + i) / 2;
      endX = size - i;
      endY = (size + i) / 2;
      graphics.moveTo(startX, startY);
      graphics.lineTo(endX, endY);
    }
    graphics.strokePath();

    // Subtle radial gradient overlay for depth
    const depthGraphics = this.add.graphics();
    depthGraphics.fillStyle(0x050507, 0.6);
    depthGraphics.fillCircle(0, 0, 900);
    depthGraphics.setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  update(_time: number, delta: number) {
    this.glowPulseTime += delta * 0.001;

    // Ambient particles animated below

    // Animate ambient particles
    this.ambientGraphics.clear();
    for (const p of this.ambientParticles) {
      p.x += p.vx;
      p.y += p.vy;
      
      // Wrap around
      if (p.x < -800) p.x = 800;
      if (p.x > 800) p.x = -800;
      if (p.y < -600) p.y = 600;
      if (p.y > 600) p.y = -600;

      const flickerAlpha = p.alpha * (0.6 + Math.sin(this.glowPulseTime * 2 + p.x * 0.01) * 0.4);
      this.ambientGraphics.fillStyle(0x38bdf8, flickerAlpha);
      this.ambientGraphics.fillCircle(p.x, p.y, p.size);
    }

    // Animate data packets along paths
    this.dataPacketGraphics.clear();
    const role = this.registry.get('role');
    const packetColor = role === 'attacker' ? 0xef4444 : 0x38bdf8;

    for (const packet of this.dataPackets) {
      packet.progress += packet.speed;
      if (packet.progress >= 1) packet.progress = 0;

      const px = packet.x + (packet.targetX - packet.x) * packet.progress;
      const py = packet.y + (packet.targetY - packet.y) * packet.progress;

      // Packet glow
      this.dataPacketGraphics.fillStyle(packetColor, 0.15);
      this.dataPacketGraphics.fillCircle(px, py, 6);
      // Packet core
      this.dataPacketGraphics.fillStyle(packetColor, 0.7);
      this.dataPacketGraphics.fillCircle(px, py, 2.5);
    }

    // Pulse glow on building bases
    const pulse = Math.sin(this.glowPulseTime * 1.5) * 0.04 + 0.08;
    this.buildings.forEach((b) => {
      const glowG = this.buildingGlows.get(b.id);
      if (glowG) {
        const unlockedLevels = this.registry.get('unlockedLevels');
        const currentUnlocked = (unlockedLevels && role) ? (unlockedLevels[role] || 1) : 1;
        const isCurrent = b.id === currentUnlocked;
        if (isCurrent) {
          glowG.setAlpha(0.7 + pulse * 3);
        }
      }
    });
  }
}
