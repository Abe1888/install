'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Workflow,
  GitBranch,
  ArrowRight,
  ArrowDown,
  Plus,
  Minus,
  RotateCcw,
  Save,
  Settings,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Target,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Square,
  Diamond,
  Triangle,
  X,
  Info,
  Zap,
  Play,
  Pause
} from 'lucide-react';
import { Task, Vehicle, TeamMember } from '@/lib/supabase/types';
import { validateTaskConflicts } from '@/lib/utils/taskValidation';

interface TaskNode {
  id: string;
  task: Task;
  x: number;
  y: number;
  level: number;
  dependencies: string[];
  dependents: string[];
}

interface TaskWorkflowManagerProps {
  tasks: Task[];
  vehicles: Vehicle[];
  teamMembers: TeamMember[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onClose?: () => void;
}

export function TaskWorkflowManager({
  tasks,
  vehicles,
  teamMembers,
  onTaskUpdate,
  onClose
}: TaskWorkflowManagerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(true);
  const [viewMode, setViewMode] = useState<'workflow' | 'gantt' | 'network'>('workflow');
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Build task dependency graph
  const taskGraph = useMemo(() => {
    const nodes: TaskNode[] = [];
    const nodeMap = new Map<string, TaskNode>();

    // First pass: create nodes and build dependency relationships
    tasks.forEach(task => {
      const dependencies = task.dependencies || [];
      const dependents = tasks
        .filter(t => t.dependencies?.includes(task.id))
        .map(t => t.id);

      const node: TaskNode = {
        id: task.id,
        task,
        x: 0,
        y: 0,
        level: 0,
        dependencies,
        dependents
      };

      nodes.push(node);
      nodeMap.set(task.id, node);
    });

    // Second pass: calculate levels using topological sort
    const visited = new Set<string>();
    const temp = new Set<string>();

    const calculateLevel = (nodeId: string): number => {
      if (temp.has(nodeId)) {
        // Circular dependency detected
        console.warn(`Circular dependency detected involving task ${nodeId}`);
        return 0;
      }

      if (visited.has(nodeId)) {
        return nodeMap.get(nodeId)?.level || 0;
      }

      temp.add(nodeId);
      const node = nodeMap.get(nodeId);
      if (!node) return 0;

      let maxDepLevel = -1;
      node.dependencies.forEach(depId => {
        maxDepLevel = Math.max(maxDepLevel, calculateLevel(depId));
      });

      node.level = maxDepLevel + 1;
      temp.delete(nodeId);
      visited.add(nodeId);

      return node.level;
    };

    // Calculate levels for all nodes
    nodes.forEach(node => calculateLevel(node.id));

    // Third pass: position nodes
    const levelGroups = new Map<number, TaskNode[]>();
    nodes.forEach(node => {
      const level = node.level;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node);
    });

    // Position nodes based on levels
    const nodeWidth = 200;
    const nodeHeight = 80;
    const levelSpacing = 300;
    const nodeSpacing = 120;

    levelGroups.forEach((levelNodes, level) => {
      const totalHeight = (levelNodes.length - 1) * nodeSpacing;
      const startY = -totalHeight / 2;

      levelNodes.forEach((node, index) => {
        node.x = level * levelSpacing;
        node.y = startY + index * nodeSpacing;
      });
    });

    return { nodes, nodeMap };
  }, [tasks]);

  // Get task color based on status and priority
  const getTaskColor = useCallback((task: Task) => {
    if (task.status === 'Completed') return 'bg-green-100 border-green-500 text-green-900';
    if (task.status === 'In Progress') return 'bg-blue-100 border-blue-500 text-blue-900';
    if (task.status === 'Blocked') return 'bg-red-100 border-red-500 text-red-900';
    
    if (task.priority === 'High') return 'bg-orange-100 border-orange-500 text-orange-900';
    if (task.priority === 'Medium') return 'bg-yellow-100 border-yellow-500 text-yellow-900';
    return 'bg-gray-100 border-gray-500 text-gray-900';
  }, []);

  // Get task icon based on type/status
  const getTaskIcon = useCallback((task: Task) => {
    if (task.status === 'Completed') return CheckCircle2;
    if (task.status === 'In Progress') return Play;
    if (task.status === 'Blocked') return AlertTriangle;
    if (task.is_milestone) return Diamond;
    return Circle;
  }, []);

  // Handle task drag operations
  const handleMouseDown = useCallback((taskId: string, event: React.MouseEvent) => {
    event.preventDefault();
    setDraggedTask(taskId);
    setSelectedTask(taskId);
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!draggedTask || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left - panOffset.x) / zoom;
    const y = (event.clientY - rect.top - panOffset.y) / zoom;

    const node = taskGraph.nodeMap.get(draggedTask);
    if (node) {
      node.x = x - 100; // Center the node
      node.y = y - 40;
    }
  }, [draggedTask, taskGraph.nodeMap, zoom, panOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggedTask(null);
  }, []);

  // Handle dependency creation
  const handleCreateDependency = useCallback((fromTaskId: string, toTaskId: string) => {
    const fromTask = tasks.find(t => t.id === fromTaskId);
    const toTask = tasks.find(t => t.id === toTaskId);

    if (!fromTask || !toTask) return;

    // Prevent self-dependencies
    if (fromTaskId === toTaskId) return;

    // Check for circular dependencies
    const wouldCreateCircle = (startId: string, targetId: string, visited = new Set<string>()): boolean => {
      if (visited.has(startId)) return true;
      visited.add(startId);

      const task = tasks.find(t => t.id === startId);
      if (!task || !task.dependencies) return false;

      return task.dependencies.some(depId => 
        depId === targetId || wouldCreateCircle(depId, targetId, new Set(visited))
      );
    };

    if (wouldCreateCircle(toTaskId, fromTaskId)) {
      alert('Cannot create dependency: This would create a circular dependency.');
      return;
    }

    // Add dependency
    const existingDependencies = toTask.dependencies || [];
    if (!existingDependencies.includes(fromTaskId)) {
      onTaskUpdate(toTaskId, {
        dependencies: [...existingDependencies, fromTaskId]
      });
    }
  }, [tasks, onTaskUpdate]);

  // Handle dependency removal
  const handleRemoveDependency = useCallback((taskId: string, dependencyId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.dependencies) return;

    const updatedDependencies = task.dependencies.filter(id => id !== dependencyId);
    onTaskUpdate(taskId, { dependencies: updatedDependencies });
  }, [tasks, onTaskUpdate]);

  // Auto-layout algorithm
  const autoLayout = useCallback(() => {
    // Rebuild the graph with better positioning
    const { conflicts } = validateTaskConflicts(tasks);
    
    // Adjust positions to minimize conflicts
    taskGraph.nodes.forEach(node => {
      const taskConflicts = conflicts.filter(c => 
        c.conflicting_tasks.includes(node.id)
      );

      if (taskConflicts.length > 0) {
        // Move conflicting tasks further apart
        node.y += taskConflicts.length * 20;
      }
    });
  }, [tasks, taskGraph.nodes]);

  // Render dependency arrows
  const renderDependencyArrows = useCallback(() => {
    const arrows: JSX.Element[] = [];

    taskGraph.nodes.forEach(node => {
      node.dependencies.forEach(depId => {
        const depNode = taskGraph.nodeMap.get(depId);
        if (!depNode) return;

        const startX = depNode.x + 200; // Right edge of dependency node
        const startY = depNode.y + 40;   // Center of dependency node
        const endX = node.x;            // Left edge of dependent node
        const endY = node.y + 40;       // Center of dependent node

        // Create curved arrow path
        const midX = (startX + endX) / 2;
        const pathD = `M ${startX} ${startY} Q ${midX} ${startY} ${midX} ${(startY + endY) / 2} Q ${midX} ${endY} ${endX} ${endY}`;

        arrows.push(
          <g key={`${depId}-${node.id}`}>
            <path
              d={pathD}
              stroke="#6B7280"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
              className="hover:stroke-blue-500 cursor-pointer"
              onClick={() => setSelectedTask(`${depId}-${node.id}`)}
            />
            {/* Add dependency relationship indicator */}
            <circle
              cx={midX}
              cy={(startY + endY) / 2}
              r="8"
              fill="white"
              stroke="#6B7280"
              strokeWidth="2"
              className="hover:fill-blue-100 cursor-pointer"
              onClick={() => handleRemoveDependency(node.id, depId)}
            >
              <title>Click to remove dependency</title>
            </circle>
            <text
              x={midX}
              y={(startY + endY) / 2 + 4}
              textAnchor="middle"
              className="text-xs fill-gray-600 pointer-events-none"
            >
              ×
            </text>
          </g>
        );
      });
    });

    return arrows;
  }, [taskGraph, handleRemoveDependency]);

  // Render task nodes
  const renderTaskNodes = useCallback(() => {
    return taskGraph.nodes.map(node => {
      const { task } = node;
      const isSelected = selectedTask === task.id;
      const colorClass = getTaskColor(task);
      const Icon = getTaskIcon(task);

      return (
        <g key={task.id}>
          {/* Task Node */}
          <foreignObject
            x={node.x}
            y={node.y}
            width="200"
            height="80"
            className="overflow-visible"
          >
            <div
              className={`
                w-full h-full rounded-lg border-2 p-3 cursor-move shadow-lg
                ${colorClass}
                ${isSelected ? 'ring-2 ring-blue-500 shadow-xl' : ''}
                hover:shadow-xl transition-all duration-200
              `}
              onMouseDown={(e) => handleMouseDown(task.id, e)}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon className="w-4 h-4" />
                <div className="flex items-center space-x-1 text-xs">
                  {task.priority === 'High' && <span className="text-red-600">🔥</span>}
                  {task.is_milestone && <span className="text-purple-600">🏁</span>}
                </div>
              </div>
              
              <div className="text-sm font-medium truncate mb-1" title={task.name}>
                {task.name}
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {task.estimated_duration || 60}m
                </span>
                <span className="flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  {Array.isArray(task.assigned_to) ? task.assigned_to.length : 1}
                </span>
              </div>
            </div>
          </foreignObject>

          {/* Connection Points */}
            <circle
              cx={node.x + 15}
              cy={node.y + 15}
              r="8"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="2"
              className="cursor-pointer hover:fill-blue-600"
            />
            <circle
              cx={node.x + 185}
              cy={node.y + 40}
              r="8"
              fill="#10b981"
              stroke="white"
              strokeWidth="2"
              className="cursor-pointer hover:fill-green-600"
            />
        </g>
      );
    });
  }, [taskGraph.nodes, selectedTask, getTaskColor, getTaskIcon, handleMouseDown]);

  // Get viewport dimensions
  const viewBox = useMemo(() => {
    if (taskGraph.nodes.length === 0) return '0 0 800 600';

    const padding = 100;
    const minX = Math.min(...taskGraph.nodes.map(n => n.x)) - padding;
    const maxX = Math.max(...taskGraph.nodes.map(n => n.x + 200)) + padding;
    const minY = Math.min(...taskGraph.nodes.map(n => n.y)) - padding;
    const maxY = Math.max(...taskGraph.nodes.map(n => n.y + 80)) + padding;

    return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
  }, [taskGraph.nodes]);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'relative'} bg-white border border-gray-200 rounded-lg overflow-hidden`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Task Workflow Manager</h3>
              <p className="text-purple-100 text-sm">
                {taskGraph.nodes.length} tasks • {taskGraph.nodes.reduce((sum, node) => sum + node.dependencies.length, 0)} dependencies
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex bg-white bg-opacity-20 rounded-lg p-1">
              <button
                onClick={() => setViewMode('workflow')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'workflow' ? 'bg-white text-purple-600' : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                Workflow
              </button>
              <button
                onClick={() => setViewMode('network')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'network' ? 'bg-white text-purple-600' : 'text-white hover:bg-white hover:bg-opacity-10'
                }`}
              >
                Network
              </button>
            </div>

            {/* Controls */}
            <button
              onClick={autoLayout}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Auto Layout"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Toggle Details"
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="p-1 hover:bg-gray-200 rounded"
                disabled={zoom <= 0.5}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-mono min-w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="p-1 hover:bg-gray-200 rounded"
                disabled={zoom >= 2}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-100 border border-green-500 rounded"></div>
                <span>Completed</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-100 border border-blue-500 rounded"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-100 border border-red-500 rounded"></div>
                <span>Blocked</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Info className="w-4 h-4" />
            <span>Drag tasks to reposition • Click connection points to create dependencies</span>
          </div>
        </div>
      </div>

      {/* Main Workflow Canvas */}
      <div className="flex-1 overflow-hidden relative">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          viewBox={viewBox}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`
          }}
        >
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6B7280"
              />
            </marker>
          </defs>

          {/* Grid Pattern */}
          <defs>
            <pattern
              id="grid"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect
            x={viewBox.split(' ')[0]}
            y={viewBox.split(' ')[1]}
            width={viewBox.split(' ')[2]}
            height={viewBox.split(' ')[3]}
            fill="url(#grid)"
          />

          {/* Render Dependencies */}
          {renderDependencyArrows()}

          {/* Render Task Nodes */}
          {renderTaskNodes()}
        </svg>
      </div>

      {/* Task Details Sidebar */}
      {showDetails && selectedTask && (
        <div className="absolute right-0 top-16 bottom-0 w-80 bg-white border-l border-gray-200 shadow-lg overflow-y-auto">
          <TaskDetailsPanel
            task={tasks.find(t => t.id === selectedTask)}
            tasks={tasks}
            vehicles={vehicles}
            teamMembers={teamMembers}
            onUpdate={(updates) => onTaskUpdate(selectedTask, updates)}
            onClose={() => setSelectedTask(null)}
          />
        </div>
      )}
    </div>
  );
}

// Task Details Panel Component
interface TaskDetailsPanelProps {
  task?: Task;
  tasks: Task[]; // Add tasks parameter for dependency resolution
  vehicles: Vehicle[];
  teamMembers: TeamMember[];
  onUpdate: (updates: Partial<Task>) => void;
  onClose: () => void;
}

function TaskDetailsPanel({ task, tasks, vehicles, teamMembers, onUpdate, onClose }: TaskDetailsPanelProps) {
  if (!task) return null;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Task Details</h4>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task Name
          </label>
          <input
            type="text"
            value={task.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={task.status}
            onChange={(e) => onUpdate({ status: e.target.value as Task['status'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Blocked">Blocked</option>
            <option value="Scheduled">Scheduled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={task.priority}
            onChange={(e) => onUpdate({ priority: e.target.value as Task['priority'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estimated Duration (minutes)
          </label>
          <input
            type="number"
            value={task.estimated_duration || 60}
            onChange={(e) => onUpdate({ estimated_duration: Number(e.target.value) })}
            min="15"
            step="15"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={task.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Task description..."
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="milestone"
            checked={task.is_milestone || false}
            onChange={(e) => onUpdate({ is_milestone: e.target.checked })}
            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <label htmlFor="milestone" className="text-sm text-gray-700">
            Mark as milestone
          </label>
        </div>

        {task.dependencies && task.dependencies.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dependencies
            </label>
            <div className="space-y-1">
              {task.dependencies.map(depId => {
                const depTask = tasks.find(t => t.id === depId);
                return (
                  <div key={depId} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                    <span>{depTask?.name || depId}</span>
                    <button
                      onClick={() => {
                        const updatedDeps = task.dependencies?.filter(id => id !== depId) || [];
                        onUpdate({ dependencies: updatedDeps });
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
