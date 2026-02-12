import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingScreen, SCREEN_TYPE_LABELS } from "@/types/onboarding-cms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowRight, 
  GitBranch, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Minimize2,
  Link2,
  Unlink,
  RotateCcw,
  Plus,
  Trash2,
  GraduationCap,
  X
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { OnboardingScreenEditor } from "./OnboardingScreenEditor";

interface WorkflowVisualizerProps {
  screens: OnboardingScreen[];
  onScreenSelect: (screenId: string) => void;
  onUpdateConnection: (screenId: string, optionIndex: number | null, targetScreenId: string | null) => void;
  onUpdatePosition: (screenId: string, position: { x: number; y: number }) => void;
  onUpdateScreen?: (screen: OnboardingScreen) => void;
  onAddScreen?: () => void;
  onDeleteScreen?: (screenId: string) => void;
  onSave?: () => Promise<void>;
  isSaving?: boolean;
  hasChanges?: boolean;
  selectedScreenId: string | null;
}

interface Position {
  x: number;
  y: number;
}

interface Connection {
  from: string;
  to: string;
  optionIndex: number | null;
  optionLabel?: string;
  ruleLabel?: string;
  isConditional: boolean;
  isRule?: boolean;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const NODE_SPACING_X = 280;
const NODE_SPACING_Y = 140;
const NODES_PER_ROW = 4;

export function WorkflowVisualizer({ 
  screens, 
  onScreenSelect, 
  onUpdateConnection,
  onUpdatePosition,
  onUpdateScreen,
  onAddScreen,
  onDeleteScreen,
  onSave,
  isSaving,
  hasChanges,
  selectedScreenId 
}: WorkflowVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState<Position>({ x: 40, y: 40 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<{ screenId: string; optionIndex: number | null } | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);
  const [parcoursMap, setParcoursMap] = useState<Record<string, string>>({});
  
  const editingScreen = editingScreenId ? screens.find(s => s.id === editingScreenId) : null;

  // Fetch parcours names for display
  useEffect(() => {
    const fetchParcours = async () => {
      const { data } = await supabase.from("parcours").select("id, title");
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(p => { map[p.id] = p.title; });
        setParcoursMap(map);
      }
    };
    fetchParcours();
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      wrapperRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle Escape key - close editor first, then exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;

      if (editingScreenId) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setEditingScreenId(null);
        setDraggingNode(null);
        setIsPanning(false);
        return;
      }
      // If no editor is open, let the default fullscreen exit behavior happen
    };

    // Use capture phase with highest priority
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [editingScreenId]);

  // Get node position from screen data or calculate default
  const getNodePosition = useCallback((screen: OnboardingScreen, index: number): Position => {
    const workflowPosition = screen.workflow_position as { x?: number; y?: number } | null;
    if (workflowPosition && typeof workflowPosition.x === 'number' && typeof workflowPosition.y === 'number') {
      // Only return saved position if it's not the default (0, 0)
      if (workflowPosition.x !== 0 || workflowPosition.y !== 0) {
        return { x: workflowPosition.x, y: workflowPosition.y };
      }
    }
    // Calculate default grid position
    const row = Math.floor(index / NODES_PER_ROW);
    const col = index % NODES_PER_ROW;
    return {
      x: col * NODE_SPACING_X + 20,
      y: row * NODE_SPACING_Y + 20,
    };
  }, []);

  // Build connections from screens data (only explicit connections, no defaults)
  const connections: Connection[] = [];
  screens.forEach((screen) => {
    // Screen-level next_step_id
    if (screen.next_step_id) {
      connections.push({
        from: screen.id,
        to: screen.next_step_id,
        optionIndex: null,
        isConditional: true,
      });
    }

    // Option-level branching
    if (screen.options && Array.isArray(screen.options)) {
      screen.options.forEach((option, optIdx) => {
        if (option.nextStepId) {
          connections.push({
            from: screen.id,
            to: option.nextStepId,
            optionIndex: optIdx,
            optionLabel: option.label,
            isConditional: true,
          });
        }
      });
    }

    // Transition conditions
    if (screen.metadata?.transitionConditions && Array.isArray(screen.metadata.transitionConditions)) {
      screen.metadata.transitionConditions.forEach((condition) => {
        if (condition.targetScreenId) {
          connections.push({
            from: screen.id,
            to: condition.targetScreenId,
            optionIndex: null,
            ruleLabel: condition.label,
            isConditional: true,
            isRule: true,
          });
        }
      });
    }
  });

  // Get SVG path for a connection
  const getConnectionPath = (from: string, to: string, optionIndex: number | null): string => {
    const fromScreen = screens.find(s => s.id === from);
    const toScreen = screens.find(s => s.id === to);
    const fromIndex = screens.findIndex(s => s.id === from);
    const toIndex = screens.findIndex(s => s.id === to);
    
    if (!fromScreen || !toScreen || fromIndex === -1 || toIndex === -1) return "";

    const fromPos = getNodePosition(fromScreen, fromIndex);
    const toPos = getNodePosition(toScreen, toIndex);

    // Calculate dynamic height for options
    const hasOptions = fromScreen.options && fromScreen.options.length > 0 && 
      ['SINGLE_CHOICE', 'MULTI_CHOICE', 'TOGGLE'].includes(fromScreen.type);
    const baseY = fromPos.y + NODE_HEIGHT / 2;
    
    // If this is an option connection, calculate Y position based on option index
    let startY = baseY;
    if (optionIndex !== null && hasOptions) {
      // Header is ~60px, each option is ~20px
      const optionStartY = fromPos.y + 70; // After header
      startY = optionStartY + optionIndex * 20 + 10; // Center of option row
    }

    const startX = fromPos.x + NODE_WIDTH;
    const endX = toPos.x;
    const endY = toPos.y + NODE_HEIGHT / 2;

    // Calculate control points for curved line
    const dx = endX - startX;
    const midX = startX + dx / 2;
    
    // Different curves based on direction
    if (dx > 50) {
      // Forward connection
      return `M ${startX} ${startY} C ${startX + 60} ${startY}, ${endX - 60} ${endY}, ${endX} ${endY}`;
    } else if (dx < -50) {
      // Backward connection - loop around
      const offset = 60;
      return `M ${startX} ${startY} 
              C ${startX + offset} ${startY}, 
                ${startX + offset} ${startY - 80}, 
                ${midX} ${Math.min(startY, endY) - 80}
              C ${endX - offset} ${Math.min(startY, endY) - 80},
                ${endX - offset} ${endY},
                ${endX} ${endY}`;
    } else {
      // Same column or close - vertical curve
      return `M ${startX} ${startY} 
              C ${startX + 80} ${startY}, 
                ${endX - 80} ${endY}, 
                ${endX} ${endY}`;
    }
  };

  // Get midpoint of connection for label
  const getConnectionMidpoint = (from: string, to: string): Position => {
    const fromScreen = screens.find(s => s.id === from);
    const toScreen = screens.find(s => s.id === to);
    const fromIndex = screens.findIndex(s => s.id === from);
    const toIndex = screens.findIndex(s => s.id === to);
    
    if (!fromScreen || !toScreen) return { x: 0, y: 0 };

    const fromPos = getNodePosition(fromScreen, fromIndex);
    const toPos = getNodePosition(toScreen, toIndex);

    return {
      x: (fromPos.x + NODE_WIDTH + toPos.x) / 2,
      y: (fromPos.y + toPos.y + NODE_HEIGHT) / 2 - 8,
    };
  };

  // Handle canvas mouse events
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !connectingFrom && !draggingNode) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggingNode) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        // Calculate mouse position relative to the container
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert to canvas coordinates (accounting for pan and zoom)
        const canvasX = (mouseX - pan.x) / zoom;
        const canvasY = (mouseY - pan.y) / zoom;
        
        // Apply drag offset to get new node position
        const newX = canvasX - dragOffset.x;
        const newY = canvasY - dragOffset.y;
        
        // Snap to grid
        const snappedX = Math.round(newX / 20) * 20;
        const snappedY = Math.round(newY / 20) * 20;
        
        onUpdatePosition(draggingNode, { x: Math.max(0, snappedX), y: Math.max(0, snappedY) });
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setDraggingNode(null);
  };

  // Handle node drag
  const handleNodeMouseDown = (screenId: string, e: React.MouseEvent, pos: Position) => {
    e.stopPropagation();
    if (connectingFrom) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      // Calculate mouse position relative to the container
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Convert to canvas coordinates
      const canvasX = (mouseX - pan.x) / zoom;
      const canvasY = (mouseY - pan.y) / zoom;
      
      // Calculate offset from the node's position
      setDragOffset({ x: canvasX - pos.x, y: canvasY - pos.y });
      setDraggingNode(screenId);
    }
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.3, Math.min(1.5, prev + delta)));
  };

  const handleFitView = () => {
    if (!containerRef.current || screens.length === 0) return;
    
    // Find bounds of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    screens.forEach((screen, index) => {
      const pos = getNodePosition(screen, index);
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + NODE_WIDTH);
      maxY = Math.max(maxY, pos.y + NODE_HEIGHT);
    });

    const container = containerRef.current;
    const padding = 80;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;
    
    const scaleX = container.clientWidth / contentWidth;
    const scaleY = container.clientHeight / contentHeight;
    const newZoom = Math.min(1, Math.max(0.3, Math.min(scaleX, scaleY)));
    
    setZoom(newZoom);
    setPan({ 
      x: -minX * newZoom + padding, 
      y: -minY * newZoom + padding 
    });
  };

  // Reset positions to grid layout
  const handleResetLayout = () => {
    screens.forEach((screen, index) => {
      const row = Math.floor(index / NODES_PER_ROW);
      const col = index % NODES_PER_ROW;
      const defaultPos = {
        x: col * NODE_SPACING_X + 20,
        y: row * NODE_SPACING_Y + 20,
      };
      onUpdatePosition(screen.id, defaultPos);
    });
  };

  // Handle connection creation
  const handleNodeClick = (screenId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (connectingFrom) {
      if (connectingFrom.screenId !== screenId) {
        onUpdateConnection(connectingFrom.screenId, connectingFrom.optionIndex, screenId);
      }
      setConnectingFrom(null);
    } else if (!draggingNode) {
      onScreenSelect(screenId);
    }
  };

  // Handle double-click to open editor (works in both normal + fullscreen)
  const handleNodeDoubleClick = (screenId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Cancel any drag/pan started by the first click of the double-click
    setDraggingNode(null);
    setIsPanning(false);

    if (onUpdateScreen) {
      setEditingScreenId(screenId);
    }
  };

  const startConnection = (screenId: string, optionIndex: number | null, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectingFrom({ screenId, optionIndex });
  };

  const cancelConnection = () => {
    setConnectingFrom(null);
  };

  const removeConnection = (screenId: string, optionIndex: number | null, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateConnection(screenId, optionIndex, null);
  };

  // Calculate canvas size
  const canvasWidth = Math.max(1200, screens.length * NODE_SPACING_X);
  const canvasHeight = Math.max(600, Math.ceil(screens.length / NODES_PER_ROW + 2) * NODE_SPACING_Y);

  return (
    <TooltipProvider>
      <div 
        ref={wrapperRef}
        className={`relative overflow-hidden ${isFullscreen ? 'h-screen w-screen bg-workflow-backdrop' : 'rounded-lg h-full w-full bg-muted/30'}`}
      >
        {/* Toolbar */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-sm border">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleZoom(0.1)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleZoom(-0.1)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="h-4 w-px bg-border mx-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleResetLayout}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Réinitialiser la disposition</TooltipContent>
          </Tooltip>
          {isFullscreen && onAddScreen && (
            <>
              <div className="h-4 w-px bg-border mx-1" />
              <Button size="sm" onClick={onAddScreen} className="h-8">
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </>
          )}
        </div>

        {/* Connection mode indicator */}
        {connectingFrom && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-3 py-2 shadow-sm">
            <Link2 className="h-4 w-4" />
            <span className="text-sm">Cliquez sur l'écran cible</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 hover:bg-primary-foreground/20"
              onClick={cancelConnection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-sm border text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-0.5 bg-muted-foreground/50" style={{ strokeDasharray: '4 2' }} />
              <span className="text-muted-foreground">Défaut</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-0.5 bg-primary" />
              <span className="text-muted-foreground">Conditionnel</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="h-4 px-1 text-[8px] bg-green-500/20 text-green-700 border-green-500/30">
                <GraduationCap className="h-2.5 w-2.5" />
              </Badge>
              <span className="text-muted-foreground">Parcours assigné</span>
            </div>
          </div>
          <div className="text-muted-foreground/70">
            💡 Glissez les nœuds • Double-clic pour éditer
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={containerRef}
          className={`h-full w-full ${draggingNode ? 'cursor-grabbing' : isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              position: 'relative',
              width: canvasWidth,
              height: canvasHeight,
            }}
          >
            {/* Grid background */}
            <svg
              className="absolute top-0 left-0 pointer-events-none opacity-20"
              style={{ width: canvasWidth, height: canvasHeight }}
            >
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* SVG for connections */}
            <svg
              className="absolute top-0 left-0 pointer-events-none"
              style={{ width: canvasWidth, height: canvasHeight }}
            >
              <defs>
                <marker
                  id="arrowhead-default"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="hsl(var(--muted-foreground) / 0.5)"
                  />
                </marker>
                <marker
                  id="arrowhead-conditional"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="hsl(var(--primary))"
                  />
                </marker>
              </defs>
              
              {connections.map((conn, idx) => {
                const path = getConnectionPath(conn.from, conn.to, conn.optionIndex);
                if (!path) return null;
                
                const midpoint = getConnectionMidpoint(conn.from, conn.to);
                const label = conn.optionLabel || conn.ruleLabel;
                const strokeColor = conn.isRule 
                  ? "hsl(var(--chart-2))" 
                  : conn.isConditional 
                    ? "hsl(var(--primary))" 
                    : "hsl(var(--muted-foreground) / 0.5)";
                
                return (
                  <g key={`${conn.from}-${conn.to}-${idx}`}>
                    <path
                      d={path}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={conn.isConditional ? 2 : 1.5}
                      strokeDasharray={conn.isRule ? "6 3" : conn.isConditional ? "none" : "4 2"}
                      markerEnd={conn.isConditional ? "url(#arrowhead-conditional)" : "url(#arrowhead-default)"}
                    />
                    {label && (
                      <g>
                        <rect
                          x={midpoint.x - 40}
                          y={midpoint.y - 8}
                          width="80"
                          height="16"
                          rx="4"
                          fill="hsl(var(--background))"
                          fillOpacity="0.9"
                        />
                        <text
                          x={midpoint.x}
                          y={midpoint.y + 4}
                          className={`text-[10px] font-medium ${conn.isRule ? 'fill-chart-2' : 'fill-primary'}`}
                          textAnchor="middle"
                        >
                          {conn.isRule ? '📋 ' : ''}{label.length > 12 ? label.slice(0, 12) + '...' : label}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {screens.map((screen, index) => {
              const pos = getNodePosition(screen, index);
              const isSelected = screen.id === selectedScreenId;
              const isConnecting = connectingFrom?.screenId === screen.id;
              const isDragging = draggingNode === screen.id;
              const hasConditionalBranches = screen.options?.some(o => o.nextStepId) || screen.next_step_id;
              const hasTransitionConditions = screen.metadata?.transitionConditions && screen.metadata.transitionConditions.length > 0;
              const hasOptions = screen.options && screen.options.length > 0 && 
                ['SINGLE_CHOICE', 'MULTI_CHOICE', 'TOGGLE'].includes(screen.type);

              // Calculate dynamic height based on options and conditions
              const optionHeight = hasOptions ? Math.min(screen.options.length, 4) * 20 + 10 : 0;
              const conditionsHeight = hasTransitionConditions ? 24 : 0;
              const dynamicHeight = NODE_HEIGHT + optionHeight + conditionsHeight;

              return (
                <div
                  key={screen.id}
                  className={`
                    absolute transition-shadow duration-200 select-none group
                    ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background z-20' : ''}
                    ${isConnecting ? 'ring-2 ring-primary animate-pulse z-20' : ''}
                    ${connectingFrom && connectingFrom.screenId !== screen.id ? 'hover:ring-2 hover:ring-primary/50 cursor-pointer' : ''}
                    ${isDragging ? 'z-30 shadow-xl' : ''}
                    ${!connectingFrom && !isDragging ? 'cursor-grab active:cursor-grabbing' : ''}
                  `}
                  style={{
                    left: pos.x,
                    top: pos.y,
                    width: NODE_WIDTH,
                    minHeight: dynamicHeight,
                    transition: isDragging ? 'none' : 'box-shadow 0.2s',
                  }}
                  onMouseDown={(e) => handleNodeMouseDown(screen.id, e, pos)}
                  onClick={(e) => handleNodeClick(screen.id, e)}
                  onDoubleClick={(e) => handleNodeDoubleClick(screen.id, e)}
                >
                  <Card className={`workflow-node-card p-3 h-full ${screen.status !== 'active' ? 'opacity-60' : ''} ${isDragging ? 'shadow-2xl scale-105' : ''}`}>
                    {/* Order badge */}
                    <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shadow-sm">
                      {index + 1}
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-medium line-clamp-1 pr-6">{screen.title}</h4>
                      <Badge variant="outline" className="text-[10px]">
                        {SCREEN_TYPE_LABELS[screen.type]}
                      </Badge>
                      
                      {/* Options with individual connection buttons */}
                      {hasOptions && (
                        <div className="mt-2 space-y-1 border-t pt-2">
                          {screen.options.slice(0, 4).map((option, optIdx) => {
                            const hasParcours = option.parcoursId && parcoursMap[option.parcoursId];
                            return (
                              <div 
                                key={optIdx} 
                                className="flex items-center justify-between gap-1 text-[10px] group"
                              >
                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                  <span className={`truncate ${option.nextStepId ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                    {option.label}
                                  </span>
                                  {hasParcours && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge 
                                          variant="secondary" 
                                          className="h-4 px-1 text-[8px] bg-green-500/20 text-green-700 border-green-500/30 flex-shrink-0 cursor-help"
                                        >
                                          <GraduationCap className="h-2.5 w-2.5" />
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="text-xs max-w-[200px]">
                                        <div className="flex items-center gap-1">
                                          <GraduationCap className="h-3 w-3 text-green-600" />
                                          <span className="font-medium">Parcours assigné :</span>
                                        </div>
                                        <p className="mt-1">{parcoursMap[option.parcoursId!]}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 rounded-full"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startConnection(screen.id, optIdx, e);
                                        }}
                                      >
                                        <Link2 className="h-2.5 w-2.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="text-xs">
                                      Lier "{option.label}" à un écran
                                    </TooltipContent>
                                  </Tooltip>
                                  {option.nextStepId && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-4 w-4 rounded-full text-destructive hover:text-destructive"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeConnection(screen.id, optIdx, e);
                                          }}
                                        >
                                          <Unlink className="h-2.5 w-2.5" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="text-xs">
                                        Supprimer la liaison
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {screen.options.length > 4 && (
                            <div className="text-[9px] text-muted-foreground">
                              +{screen.options.length - 4} autres options
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Branch indicator for screens without visible options */}
                      {!hasOptions && hasConditionalBranches && (
                        <div className="flex items-center gap-1 text-[10px] text-primary">
                          <GitBranch className="h-3 w-3" />
                          <span>Branchements</span>
                        </div>
                      )}

                      {/* Transition conditions indicator */}
                      {hasTransitionConditions && (
                        <div className="flex items-center gap-1 text-[10px] text-chart-2 mt-1 pt-1 border-t">
                          <span>📋</span>
                          <span>{screen.metadata.transitionConditions!.length} condition{screen.metadata.transitionConditions!.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    {/* Global connection action (for screens without options or default next) */}
                    <div className="absolute -right-3 top-4 flex flex-col gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full bg-background shadow-sm"
                            onClick={(e) => startConnection(screen.id, null, e)}
                          >
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>Écran suivant par défaut</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      {screen.next_step_id && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-6 w-6 rounded-full shadow-sm"
                              onClick={(e) => removeConnection(screen.id, null, e)}
                            >
                              <Unlink className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>Supprimer le branchement</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* Delete button */}
                    {onDeleteScreen && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteScreen(screen.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Supprimer l'écran</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Status indicator */}
                    <div 
                      className={`
                        absolute top-2 right-2 w-2 h-2 rounded-full
                        ${screen.status === 'active' ? 'bg-green-500' : 
                          screen.status === 'draft' ? 'bg-yellow-500' : 'bg-gray-400'}
                      `}
                    />
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Editor Dialog - render inside fullscreen container when in fullscreen mode */}
        <Dialog 
          modal={false}
          open={!!editingScreenId && !!editingScreen && !!onUpdateScreen}
          onOpenChange={(open) => !open && setEditingScreenId(null)}
        >
          <DialogContent 
            portalProps={{ container: isFullscreen ? wrapperRef.current : undefined }}
            overlayClassName="bg-workflow-backdrop/80"
            className="max-w-4xl w-full max-h-[90vh] flex flex-col p-0 gap-0"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            {editingScreen && (
              <>
                <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b shrink-0">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-lg font-semibold">Éditer : {editingScreen.title}</DialogTitle>
                    <Badge variant="outline">
                      {SCREEN_TYPE_LABELS[editingScreen.type]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {onSave && (
                      <Button 
                        onClick={async () => {
                          await onSave();
                          setEditingScreenId(null);
                        }}
                        disabled={isSaving || !hasChanges}
                        size="sm"
                      >
                        {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
                      </Button>
                    )}
                  </div>
                </div>
                <ScrollArea className="flex-1 min-h-0" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                  <div className="p-6">
                    <OnboardingScreenEditor
                      screen={editingScreen}
                      allScreens={screens}
                      onUpdate={(updatedScreen) => {
                        if (onUpdateScreen) {
                          onUpdateScreen(updatedScreen);
                        }
                      }}
                    />
                  </div>
                </ScrollArea>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
