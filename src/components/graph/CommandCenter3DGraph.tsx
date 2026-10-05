'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { AuthEvent, Incident } from '@/types/auth-event';

interface CommandCenter3DGraphProps {
  events: readonly AuthEvent[];
  incident: Incident | null;
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string | null) => void;
  className?: string;
}

interface Node3DData {
  id: string;
  type: 'ip' | 'account';
  label: string;
  isCompromised?: boolean;
  isSpray?: boolean;
  position: THREE.Vector3;
  mesh?: THREE.Mesh;
}

interface Edge3DData {
  source: string;
  target: string;
  isSuccess: boolean;
  points: THREE.Vector3[];
}

export function CommandCenter3DGraph({
  events,
  incident,
  selectedNodeId,
  onSelectNode,
  className = '',
}: CommandCenter3DGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const graphGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // Interactive interaction states
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [topologyMode, setTopologyMode] = useState<'bipartite' | 'helix' | 'orbital'>('bipartite');
  const [isRotating, setIsRotating] = useState(true);

  // Nodes & Edges collection
  const nodesRef = useRef<Map<string, Node3DData>>(new Map());
  const meshesRef = useRef<THREE.Mesh[]>([]);

  // Build 3D Topology from AuthEvents and Incident
  const buildTopology = useCallback(() => {
    const nodes = new Map<string, Node3DData>();
    const edges: Edge3DData[] = [];

    const sprayIps = new Set(incident?.contributingIps || []);
    const targetedAccounts = new Set(incident?.targetedAccounts || []);
    const compromisedAccounts = new Set(incident?.compromisedAccounts || []);

    // Collect all unique IPs and Accounts from events or incident
    events.forEach((ev) => {
      if (ev.srcIp) {
        if (!nodes.has(`ip:${ev.srcIp}`)) {
          nodes.set(`ip:${ev.srcIp}`, {
            id: `ip:${ev.srcIp}`,
            type: 'ip',
            label: ev.srcIp,
            isSpray: sprayIps.has(ev.srcIp),
            position: new THREE.Vector3(),
          });
        }
      }
      if (ev.userName && ev.userPresent && ev.userName !== '__unknown__') {
        if (!nodes.has(`user:${ev.userName}`)) {
          nodes.set(`user:${ev.userName}`, {
            id: `user:${ev.userName}`,
            type: 'account',
            label: ev.userName,
            isCompromised: compromisedAccounts.has(ev.userName),
            position: new THREE.Vector3(),
          });
        }
      }
    });

    // Fallback if events are empty
    if (nodes.size === 0) {
      const defaultIps = ['198.51.100.22', '198.51.100.23', '203.0.113.45', '185.44.12.99', '45.12.33.101'];
      const defaultUsers = ['admin_corp', 'marcus.v', 'elena.r', 'svc_backup', 'dev_ops'];
      defaultIps.forEach((ip, idx) => {
        nodes.set(`ip:${ip}`, {
          id: `ip:${ip}`,
          type: 'ip',
          label: ip,
          isSpray: idx < 3,
          position: new THREE.Vector3(),
        });
      });
      defaultUsers.forEach((usr, idx) => {
        nodes.set(`user:${usr}`, {
          id: `user:${usr}`,
          type: 'account',
          label: usr,
          isCompromised: idx === 0,
          position: new THREE.Vector3(),
        });
      });
    }

    const ipNodes = Array.from(nodes.values()).filter((n) => n.type === 'ip');
    const accountNodes = Array.from(nodes.values()).filter((n) => n.type === 'account');

    // Calculate Coordinates based on chosen topology
    if (topologyMode === 'bipartite') {
      // Dual-plane 3D command structure: Source IPs at -Z, Target Accounts at +Z
      ipNodes.forEach((node, i) => {
        const angle = (i / Math.max(1, ipNodes.length)) * Math.PI * 2;
        const radius = 18;
        node.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, -14);
      });
      accountNodes.forEach((node, i) => {
        const angle = (i / Math.max(1, accountNodes.length)) * Math.PI * 2;
        const radius = 24;
        node.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 14);
      });
    } else if (topologyMode === 'helix') {
      // Double Helix structure
      ipNodes.forEach((node, i) => {
        const t = (i / Math.max(1, ipNodes.length)) * Math.PI * 4;
        node.position.set(Math.cos(t) * 16, (i - ipNodes.length / 2) * 4, Math.sin(t) * 16);
      });
      accountNodes.forEach((node, i) => {
        const t = (i / Math.max(1, accountNodes.length)) * Math.PI * 4 + Math.PI;
        node.position.set(Math.cos(t) * 22, (i - accountNodes.length / 2) * 4, Math.sin(t) * 22);
      });
    } else {
      // Concentric Spherical Orbit
      ipNodes.forEach((node, i) => {
        const phi = Math.acos(-1 + (2 * i) / Math.max(1, ipNodes.length));
        const theta = Math.sqrt(ipNodes.length * Math.PI) * phi;
        node.position.setFromSphericalCoords(16, phi, theta);
      });
      accountNodes.forEach((node, i) => {
        const phi = Math.acos(-1 + (2 * i) / Math.max(1, accountNodes.length));
        const theta = Math.sqrt(accountNodes.length * Math.PI) * phi;
        node.position.setFromSphericalCoords(26, phi, theta);
      });
    }

    // Connect attack and normal edges
    events.forEach((ev) => {
      const src = nodes.get(`ip:${ev.srcIp}`);
      const tgt = nodes.get(`user:${ev.userName}`);
      if (src && tgt) {
        const midPoint = new THREE.Vector3()
          .addVectors(src.position, tgt.position)
          .multiplyScalar(0.5);
        // Add subtle radial curvature to edge in 3D
        midPoint.y += (Math.random() - 0.5) * 4;

        const curve = new THREE.QuadraticBezierCurve3(src.position, midPoint, tgt.position);
        edges.push({
          source: src.id,
          target: tgt.id,
          isSuccess: ev.eventOutcome === 'SUCCESS',
          points: curve.getPoints(20),
        });
      }
    });

    // Fallback edges if no events
    if (edges.length === 0 && ipNodes.length > 0 && accountNodes.length > 0) {
      ipNodes.slice(0, 4).forEach((src) => {
        accountNodes.slice(0, 4).forEach((tgt, tIdx) => {
          const midPoint = new THREE.Vector3().addVectors(src.position, tgt.position).multiplyScalar(0.5);
          const curve = new THREE.QuadraticBezierCurve3(src.position, midPoint, tgt.position);
          edges.push({
            source: src.id,
            target: tgt.id,
            isSuccess: tIdx === 0,
            points: curve.getPoints(20),
          });
        });
      });
    }

    nodesRef.current = nodes;
    return { nodes, edges };
  }, [events, incident, topologyMode]);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene with Command Center fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.012);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 18, 54);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. High-performance WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xdc2626, 1.2);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    const cyanLight = new THREE.PointLight(0x0284c7, 1.5, 120);
    cyanLight.position.set(-20, -20, 20);
    scene.add(cyanLight);

    // 5. Grid plane floor for command-center spatial reference
    const gridHelper = new THREE.GridHelper(80, 40, 0x1e293b, 0x090d16);
    gridHelper.position.y = -22;
    scene.add(gridHelper);

    // 6. Graph Group
    const graphGroup = new THREE.Group();
    scene.add(graphGroup);
    graphGroupRef.current = graphGroup;

    // 7. Render Topology elements
    const { nodes, edges } = buildTopology();
    meshesRef.current = [];

    // Shared Geometries & Materials
    const sphereGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const ringGeo = new THREE.RingGeometry(1.6, 2.0, 24);

    // Node meshes
    nodes.forEach((node) => {
      const isIp = node.type === 'ip';
      const color = node.isCompromised
        ? 0xdc2626 // Crimson for compromised
        : node.isSpray
        ? 0xf59e0b // Amber for spray
        : isIp
        ? 0xef4444 // Red for attacker source
        : 0x10b981; // Emerald for normal accounts

      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.45,
        roughness: 0.2,
        metalness: 0.8,
      });

      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.position.copy(node.position);
      mesh.userData = { nodeId: node.id, label: node.label, type: node.type };
      graphGroup.add(mesh);
      node.mesh = mesh;
      meshesRef.current.push(mesh);

      // Add target ring for critical/compromised nodes
      if (node.isCompromised || node.isSpray) {
        const ringMat = new THREE.MeshBasicMaterial({
          color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(node.position);
        ring.lookAt(camera.position);
        graphGroup.add(ring);
      }
    });

    // Edge Lines
    edges.forEach((edge) => {
      const geo = new THREE.BufferGeometry().setFromPoints(edge.points);
      const mat = new THREE.LineBasicMaterial({
        color: edge.isSuccess ? 0xdc2626 : 0x334155,
        transparent: true,
        opacity: edge.isSuccess ? 0.85 : 0.22,
        linewidth: edge.isSuccess ? 2 : 1,
      });
      const line = new THREE.Line(geo, mat);
      graphGroup.add(line);
    });

    // 8. Attack Photon Particles along edges
    const particleCount = 120;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleGeometry = new THREE.BufferGeometry();

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 40;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xdc2626,
      size: 0.8,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeometry, particleMat);
    graphGroup.add(particles);

    // 9. Resize Listener
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Loop (Strict 60 FPS)
    let angle = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      if (graphGroupRef.current && isRotating) {
        angle += 0.003;
        graphGroupRef.current.rotation.y = angle;
      }

      // Pulse particle photon wave
      const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        arr[i * 3 + 1] += 0.06;
        if (arr[i * 3 + 1] > 20) arr[i * 3 + 1] = -20;
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      scene.clear();
    };
  }, [buildTopology, isRotating]);

  // Mouse Raycasting for Interactive Selection
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container || !cameraRef.current || !sceneRef.current) return;

    const rect = container.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(meshesRef.current);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const id = hit.userData.nodeId;
      setHoveredNode(id);
      document.body.style.cursor = 'pointer';
    } else {
      setHoveredNode(null);
      document.body.style.cursor = 'default';
    }
  };

  const handlePointerDown = () => {
    if (hoveredNode) {
      if (onSelectNode) onSelectNode(hoveredNode === selectedNodeId ? null : hoveredNode);
    }
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none bg-black ${className}`}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
    >
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Holographic HUD Overlays */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 bg-surface/80 border border-white/10 backdrop-blur-md rounded-sm">
          <span className="w-2 h-2 rounded-full bg-severity-critical animate-ping" />
          <span className="font-mono text-xs font-bold text-white tracking-widest uppercase">
            3D ATTACK TOPOLOGY
          </span>
        </div>
        <span className="font-mono text-xs text-slate-300">
          Nodes: {nodesRef.current.size} | Mode: {topologyMode.toUpperCase()}
        </span>
      </div>

      {/* Camera & Topology Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-surface/80 border border-white/10 backdrop-blur-md p-1 rounded-sm">
        {(['bipartite', 'helix', 'orbital'] as const).map((mode) => (
          <button
            key={mode}
            onClick={(e) => {
              e.stopPropagation();
              setTopologyMode(mode);
            }}
            className={`px-2.5 py-1 font-mono text-xs uppercase tracking-wider transition-all duration-150 rounded-sm ${
              topologyMode === mode
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {mode}
          </button>
        ))}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsRotating(!isRotating);
          }}
          className="px-2 py-1 font-mono text-xs text-slate-400 hover:text-white hover:bg-white/5 border-l border-white/10"
          title="Toggle Rotation"
        >
          {isRotating ? 'PAUSE' : 'ORBIT'}
        </button>
      </div>

      {/* Selected Node HUD Banner */}
      {hoveredNode && (
        <div className="absolute bottom-4 left-4 z-10 p-3 bg-surface/90 border border-severity-critical/40 backdrop-blur-md rounded-sm flex items-center gap-4">
          <div className="w-2 h-8 bg-severity-critical rounded-full" />
          <div>
            <div className="font-mono text-xs text-slate-400 uppercase tracking-widest">
              Inspecting Entity
            </div>
            <div className="font-mono text-xs font-bold text-white tracking-wide">
              {hoveredNode}
            </div>
          </div>
          <span className="font-mono text-xs text-severity-critical font-bold px-2 py-0.5 border border-severity-critical/30 bg-severity-critical/10 rounded-sm">
            CLICK TO LOCK TARGET
          </span>
        </div>
      )}

      {/* 3D Depth Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/80" />
    </div>
  );
}
