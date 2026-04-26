'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, ZoomIn, ZoomOut, Trash2, Plus } from 'lucide-react';
import styles from './MindMapViewer.module.css';

const DEPTH_COLORS = [
  '#a78bfa', '#60a5fa', '#34d399', '#22d3ee', '#f59e0b', '#f472b6',
];

// Recursive node component
function MindMapNode({ node, depth, expanded, onToggle, onRename, onDelete, onAddChild, dragState, onDragStart, onDragOver, onDragLeave, onDrop }) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.label);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef(null);
  const nodeColor = node.color || DEPTH_COLORS[depth % DEPTH_COLORS.length];
  const isExpanded = expanded.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isDragTarget = dragState.overId === node.id && dragState.dragId !== node.id;
  const isDragging = dragState.dragId === node.id;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setEditing(true);
    setEditValue(node.label);
  };

  const handleSave = () => {
    setEditing(false);
    if (editValue.trim() && editValue.trim() !== node.label) {
      onRename(node.id, editValue.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setEditing(false); setEditValue(node.label); }
  };

  return (
    <div className={styles.nodeRow}>
      {/* The node itself */}
      <div
        className={`${styles.node} ${isDragTarget ? styles.dropTarget : ''} ${isDragging ? styles.dragging : ''}`}
        data-node-id={node.id}
        style={{ '--node-color': nodeColor }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={handleDoubleClick}
        draggable={!editing}
        onDragStart={(e) => {
          e.stopPropagation();
          onDragStart(node.id);
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', node.id);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDragOver(node.id);
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          onDragLeave();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDrop(node.id);
        }}
        onDragEnd={() => onDragStart(null)}
      >
        {editing ? (
          <input
            ref={inputRef}
            className={styles.editInput}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className={styles.nodeLabel}>{node.label}</span>
        )}

        {/* Expand/collapse button */}
        {hasChildren && (
          <button
            className={`${styles.expandBtn} ${isExpanded ? styles.expandBtnActive : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <ChevronRight size={14} />
          </button>
        )}

        {/* Hover actions */}
        {hovered && !editing && !isDragging && (
          <div className={styles.nodeActions}>
            <button
              className={styles.actionBtn}
              onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
              title="Add child"
            >
              <Plus size={12} />
            </button>
            {depth > 0 && (
              <button
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Children (rendered in-place to the right) */}
      {hasChildren && isExpanded && (
        <div className={styles.childrenColumn}>
          {node.children.map((child) => (
            <MindMapNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onRename={onRename}
              onDelete={onDelete}
              onAddChild={onAddChild}
              dragState={dragState}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MindMapViewer({ data: initialData }) {
  const [data, setData] = useState(initialData);
  const [expanded, setExpanded] = useState(() => {
    const set = new Set();
    if (initialData?.nodes) {
      set.add('root');
      initialData.nodes.forEach(n => set.add(n.id));
    }
    return set;
  });
  const [zoom, setZoom] = useState(1);
  const [dragState, setDragState] = useState({ dragId: null, overId: null });
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const toggleExpand = useCallback((nodeId) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  // Rename a node by ID (deep search)
  const renameNode = useCallback((nodeId, newLabel) => {
    setData(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      function find(nodes) {
        for (const n of nodes) {
          if (n.id === nodeId) { n.label = newLabel; return true; }
          if (n.children && find(n.children)) return true;
        }
        return false;
      }
      find(clone.nodes);
      return clone;
    });
  }, []);

  // Delete a node by ID (deep search)
  const deleteNode = useCallback((nodeId) => {
    setData(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      function remove(nodes) {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === nodeId) { nodes.splice(i, 1); return true; }
          if (nodes[i].children && remove(nodes[i].children)) return true;
        }
        return false;
      }
      remove(clone.nodes);
      return clone;
    });
  }, []);

  // Add a child to a node
  const addChild = useCallback((parentId) => {
    setData(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      function find(nodes) {
        for (const n of nodes) {
          if (n.id === parentId) {
            if (!n.children) n.children = [];
            const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
            n.children.push({ id: newId, label: 'New topic', children: [] });
            return true;
          }
          if (n.children && find(n.children)) return true;
        }
        return false;
      }
      // Handle root
      if (parentId === 'root') {
        const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        clone.nodes.push({ id: newId, label: 'New topic', children: [] });
      } else {
        find(clone.nodes);
      }
      return clone;
    });
    setExpanded(prev => new Set([...prev, parentId]));
  }, []);

  // Drag and drop: move a node to become a child of another node
  const handleDragStart = useCallback((nodeId) => {
    setDragState(prev => ({ ...prev, dragId: nodeId }));
  }, []);

  const handleDragOver = useCallback((nodeId) => {
    setDragState(prev => ({ ...prev, overId: nodeId }));
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragState(prev => ({ ...prev, overId: null }));
  }, []);

  const handleDrop = useCallback((targetId) => {
    const { dragId } = dragState;
    if (!dragId || dragId === targetId) {
      setDragState({ dragId: null, overId: null });
      return;
    }

    setData(prev => {
      const clone = JSON.parse(JSON.stringify(prev));

      // Helper: check if targetId is a descendant of dragId (prevent circular)
      function isDescendant(nodes, ancestorId, checkId) {
        for (const n of nodes) {
          if (n.id === ancestorId) {
            if (n.id === checkId) return true;
            if (n.children) {
              for (const c of n.children) {
                if (c.id === checkId) return true;
                if (isDescendant([c], c.id, checkId)) return true;
              }
            }
            return false;
          }
          if (n.children && isDescendant(n.children, ancestorId, checkId)) return true;
        }
        return false;
      }

      if (isDescendant(clone.nodes, dragId, targetId)) {
        return prev; // Can't drop a parent onto its own child
      }

      // Remove the dragged node from its current location
      let draggedNode = null;
      function removeNode(nodes) {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === dragId) {
            draggedNode = nodes.splice(i, 1)[0];
            return true;
          }
          if (nodes[i].children && removeNode(nodes[i].children)) return true;
        }
        return false;
      }
      removeNode(clone.nodes);
      if (!draggedNode) return prev;

      // Add the dragged node as a child of the target
      if (targetId === 'root') {
        clone.nodes.push(draggedNode);
      } else {
        function addToTarget(nodes) {
          for (const n of nodes) {
            if (n.id === targetId) {
              if (!n.children) n.children = [];
              n.children.push(draggedNode);
              return true;
            }
            if (n.children && addToTarget(n.children)) return true;
          }
          return false;
        }
        addToTarget(clone.nodes);
      }

      return clone;
    });

    // Auto-expand the target
    setExpanded(prev => new Set([...prev, targetId]));
    setDragState({ dragId: null, overId: null });
  }, [dragState]);

  // Draw SVG connections between all visible parent-child pairs
  const drawConnections = useCallback(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const containerRect = container.getBoundingClientRect();

    const allNodeEls = container.querySelectorAll(`[data-node-id]`);
    const nodeRects = {};
    allNodeEls.forEach(el => {
      const id = el.getAttribute('data-node-id');
      const rect = el.getBoundingClientRect();
      nodeRects[id] = {
        right: rect.right - containerRect.left,
        left: rect.left - containerRect.left,
        cy: rect.top + rect.height / 2 - containerRect.top,
      };
    });

    function drawFor(nodes, parentId) {
      nodes.forEach((node) => {
        const parentRect = nodeRects[parentId];
        const childRect = nodeRects[node.id];
        if (!parentRect || !childRect) return;

        const x1 = parentRect.right;
        const y1 = parentRect.cy;
        const x2 = childRect.left;
        const y2 = childRect.cy;
        const midX = (x1 + x2) / 2;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`);
        path.setAttribute('class', styles.connectionLine);
        path.setAttribute('stroke', node.color || DEPTH_COLORS[0]);
        svg.appendChild(path);

        if (expanded.has(node.id) && node.children?.length) {
          drawFor(node.children, node.id);
        }
      });
    }

    if (nodeRects['root'] && data.nodes) {
      drawFor(data.nodes, 'root');
    }
  }, [expanded, data]);

  useEffect(() => {
    const timer = setTimeout(drawConnections, 80);
    return () => clearTimeout(timer);
  }, [drawConnections]);

  useEffect(() => {
    const handler = () => drawConnections();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [drawConnections]);

  if (!data || !data.nodes) {
    return <div className={styles.empty}>No mind map data available.</div>;
  }

  return (
    <div className={styles.wrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarInfo}>
          <span className={styles.toolbarHint}>Double-click to rename • Drag to reparent • Hover for actions</span>
        </div>
        <div className={styles.zoomControls}>
          <button className={styles.zoomBtn} onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}>
            <ZoomOut size={16} />
          </button>
          <span className={styles.zoomLabel}>{Math.round(zoom * 100)}%</span>
          <button className={styles.zoomBtn} onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}>
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {/* Mind Map Canvas */}
      <div className={styles.canvasScroll}>
        <div className={styles.canvas} style={{ transform: `scale(${zoom})`, transformOrigin: 'left top' }}>
          <div className={styles.mapContainer} ref={containerRef}>
            <svg className={styles.svgLayer} ref={svgRef} />

            {/* Root + recursive tree */}
            <div className={styles.nodeRow}>
              {/* Root node */}
              <div
                className={`${styles.rootNode} ${dragState.overId === 'root' && dragState.dragId ? styles.dropTarget : ''}`}
                data-node-id="root"
                style={{ '--node-color': '#a78bfa' }}
                onDragOver={(e) => { e.preventDefault(); handleDragOver('root'); }}
                onDragLeave={handleDragLeave}
                onDrop={(e) => { e.preventDefault(); handleDrop('root'); }}
              >
                <span className={styles.nodeLabel}>{data.title}</span>
                <button
                  className={`${styles.expandBtn} ${expanded.has('root') ? styles.expandBtnActive : ''}`}
                  onClick={() => toggleExpand('root')}
                >
                  <ChevronRight size={14} />
                </button>
                <div className={styles.nodeActions} style={{ opacity: 1, pointerEvents: 'auto' }}>
                  <button
                    className={styles.actionBtn}
                    onClick={(e) => { e.stopPropagation(); addChild('root'); }}
                    title="Add child"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>

              {/* First-level children */}
              {expanded.has('root') && data.nodes.length > 0 && (
                <div className={styles.childrenColumn}>
                  {data.nodes.map((node) => (
                    <MindMapNode
                      key={node.id}
                      node={node}
                      depth={1}
                      expanded={expanded}
                      onToggle={toggleExpand}
                      onRename={renameNode}
                      onDelete={deleteNode}
                      onAddChild={addChild}
                      dragState={dragState}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
