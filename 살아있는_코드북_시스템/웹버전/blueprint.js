// 블루프린트 스타일 코드 연결 시각화
class BlueprintVisualizer {
    constructor(canvasId, cards) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.cards = cards;
        
        this.nodes = new Map();
        this.connections = [];
        this.selectedNode = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.viewOffset = { x: 0, y: 0 };
        this.scale = 1;
        
        // Colors (dark blueprint theme)
        this.colors = {
            background: '#0f172a',
            grid: '#1e293b',
            gridMajor: '#334155',
            nodeFunction: '#3b82f6',
            nodeMain: '#f59e0b',
            nodeSelected: '#ef4444',
            connection: '#06b6d4',
            connectionHighlight: '#f97316',
            text: '#f1f5f9',
            textMuted: '#94a3b8'
        };
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.createNodesFromCards();
        this.createConnections();
        this.setupEventListeners();
        this.render();
    }
    
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.canvasRect = rect;
    }
    
    createNodesFromCards() {
        const cardArray = Array.from(this.cards.values());
        const centerX = this.canvas.width / (2 * window.devicePixelRatio);
        const centerY = this.canvas.height / (2 * window.devicePixelRatio);
        const radius = 200;
        
        cardArray.forEach((card, index) => {
            const angle = (index * 2 * Math.PI) / cardArray.length;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            const node = {
                id: card.id,
                name: card.name,
                x: x,
                y: y,
                width: 120,
                height: 60,
                type: card.id === 'main' ? 'main' : 'function',
                connections: card.connections || [],
                isSelected: false
            };
            
            this.nodes.set(card.id, node);
        });
    }
    
    createConnections() {
        this.connections = [];
        
        this.nodes.forEach(fromNode => {
            fromNode.connections.forEach(toNodeId => {
                const toNode = this.nodes.get(toNodeId);
                if (toNode) {
                    this.connections.push({
                        from: fromNode.id,
                        to: toNode.id,
                        fromNode: fromNode,
                        toNode: toNode
                    });
                }
            });
        });
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        
        // Control buttons
        const resetBtn = document.getElementById('resetLayoutBtn');
        const centerBtn = document.getElementById('centerViewBtn');
        
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetLayout());
        if (centerBtn) centerBtn.addEventListener('click', () => this.centerView());
    }
    
    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        const node = this.getNodeAt(pos.x, pos.y);
        
        if (node) {
            this.selectedNode = node;
            this.isDragging = true;
            this.dragOffset.x = pos.x - node.x;
            this.dragOffset.y = pos.y - node.y;
            
            // Update selection
            this.nodes.forEach(n => n.isSelected = false);
            node.isSelected = true;
            
            this.canvas.style.cursor = 'grabbing';
        } else {
            this.selectedNode = null;
            this.nodes.forEach(n => n.isSelected = false);
        }
        
        this.render();
    }
    
    handleMouseMove(e) {
        const pos = this.getMousePos(e);
        
        if (this.isDragging && this.selectedNode) {
            this.selectedNode.x = pos.x - this.dragOffset.x;
            this.selectedNode.y = pos.y - this.dragOffset.y;
            this.render();
        } else {
            // Update cursor
            const node = this.getNodeAt(pos.x, pos.y);
            this.canvas.style.cursor = node ? 'grab' : 'default';
        }
    }
    
    handleMouseUp(e) {
        this.isDragging = false;
        this.canvas.style.cursor = 'default';
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.5, Math.min(2, this.scale * delta));
        
        if (newScale !== this.scale) {
            this.scale = newScale;
            this.render();
        }
    }
    
    handleDoubleClick(e) {
        const pos = this.getMousePos(e);
        const node = this.getNodeAt(pos.x, pos.y);
        
        if (node && window.codebook) {
            // Show node details in main app
            window.codebook.selectCard(node.id);
        }
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * this.scale,
            y: (e.clientY - rect.top) * this.scale
        };
    }
    
    getNodeAt(x, y) {
        for (const node of this.nodes.values()) {
            if (x >= node.x && x <= node.x + node.width &&
                y >= node.y && y <= node.y + node.height) {
                return node;
            }
        }
        return null;
    }
    
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw grid
        this.drawGrid(ctx, width, height);
        
        // Draw connections first (behind nodes)
        this.drawConnections(ctx);
        
        // Draw nodes
        this.drawNodes(ctx);
        
        // Draw info panel
        this.drawInfoPanel(ctx, width, height);
    }
    
    drawGrid(ctx, width, height) {
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;
        
        const gridSize = 20;
        const majorGridSize = 100;
        
        // Minor grid lines
        ctx.beginPath();
        for (let x = 0; x <= width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();
        
        // Major grid lines
        ctx.strokeStyle = this.colors.gridMajor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= width; x += majorGridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += majorGridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();
    }
    
    drawConnections(ctx) {
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        this.connections.forEach(conn => {
            const from = conn.fromNode;
            const to = conn.toNode;
            
            // Calculate connection points
            const fromPoint = this.getConnectionPoint(from, to);
            const toPoint = this.getConnectionPoint(to, from);
            
            // Draw curved line
            ctx.strokeStyle = from.isSelected || to.isSelected ? 
                this.colors.connectionHighlight : this.colors.connection;
            
            ctx.beginPath();
            
            // Control points for Bezier curve
            const controlOffset = 60;
            const midX = (fromPoint.x + toPoint.x) / 2;
            const midY = (fromPoint.y + toPoint.y) / 2;
            
            const dx = toPoint.x - fromPoint.x;
            const dy = toPoint.y - fromPoint.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length > 0) {
                const normalX = -dy / length;
                const normalY = dx / length;
                
                const control1X = fromPoint.x + normalX * controlOffset;
                const control1Y = fromPoint.y + normalY * controlOffset;
                const control2X = toPoint.x + normalX * controlOffset;
                const control2Y = toPoint.y + normalY * controlOffset;
                
                ctx.moveTo(fromPoint.x, fromPoint.y);
                ctx.bezierCurveTo(control1X, control1Y, control2X, control2Y, toPoint.x, toPoint.y);
            } else {
                ctx.moveTo(fromPoint.x, fromPoint.y);
                ctx.lineTo(toPoint.x, toPoint.y);
            }
            
            ctx.stroke();
            
            // Draw arrow head
            this.drawArrowHead(ctx, toPoint, fromPoint);
        });
    }
    
    getConnectionPoint(from, to) {
        const fromCenterX = from.x + from.width / 2;
        const fromCenterY = from.y + from.height / 2;
        const toCenterX = to.x + to.width / 2;
        const toCenterY = to.y + to.height / 2;
        
        const dx = toCenterX - fromCenterX;
        const dy = toCenterY - fromCenterY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal connection
            if (dx > 0) {
                return { x: from.x + from.width, y: fromCenterY };
            } else {
                return { x: from.x, y: fromCenterY };
            }
        } else {
            // Vertical connection
            if (dy > 0) {
                return { x: fromCenterX, y: from.y + from.height };
            } else {
                return { x: fromCenterX, y: from.y };
            }
        }
    }
    
    drawArrowHead(ctx, to, from) {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const arrowLength = 12;
        const arrowAngle = Math.PI / 6;
        
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(
            to.x - arrowLength * Math.cos(angle - arrowAngle),
            to.y - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.lineTo(
            to.x - arrowLength * Math.cos(angle + arrowAngle),
            to.y - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.closePath();
        ctx.fill();
    }
    
    drawNodes(ctx) {
        this.nodes.forEach(node => {
            // Node background
            let fillColor;
            if (node.isSelected) {
                fillColor = this.colors.nodeSelected;
            } else if (node.type === 'main') {
                fillColor = this.colors.nodeMain;
            } else {
                fillColor = this.colors.nodeFunction;
            }
            
            // Draw node shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(node.x + 2, node.y + 2, node.width, node.height);
            
            // Draw node background
            ctx.fillStyle = fillColor;
            ctx.fillRect(node.x, node.y, node.width, node.height);
            
            // Draw node border
            ctx.strokeStyle = this.colors.text;
            ctx.lineWidth = 2;
            ctx.strokeRect(node.x, node.y, node.width, node.height);
            
            // Draw node text
            ctx.fillStyle = this.colors.text;
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const textX = node.x + node.width / 2;
            const textY = node.y + node.height / 2;
            
            // Function name
            ctx.fillText(node.name, textX, textY - 5);
            
            // Node type indicator
            ctx.font = '10px Inter, sans-serif';
            ctx.fillStyle = this.colors.textMuted;
            const typeText = node.type === 'main' ? 'ENTRY' : 'FUNC';
            ctx.fillText(typeText, textX, textY + 10);
            
            // Connection count indicator
            if (node.connections.length > 0) {
                ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
                ctx.beginPath();
                ctx.arc(node.x + node.width - 8, node.y + 8, 6, 0, 2 * Math.PI);
                ctx.fill();
                
                ctx.fillStyle = 'white';
                ctx.font = 'bold 8px Inter, sans-serif';
                ctx.fillText(node.connections.length, node.x + node.width - 8, node.y + 8);
            }
        });
    }
    
    drawInfoPanel(ctx, width, height) {
        if (!this.selectedNode) return;
        
        const panelWidth = 200;
        const panelHeight = 120;
        const panelX = 10;
        const panelY = 10;
        
        // Panel background
        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        
        // Panel border
        ctx.strokeStyle = this.colors.nodeFunction;
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Panel content
        ctx.fillStyle = this.colors.text;
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        let y = panelY + 15;
        const lineHeight = 18;
        
        ctx.fillText(`함수: ${this.selectedNode.name}`, panelX + 10, y);
        y += lineHeight;
        
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = this.colors.textMuted;
        
        ctx.fillText(`타입: ${this.selectedNode.type}`, panelX + 10, y);
        y += lineHeight;
        
        ctx.fillText(`연결: ${this.selectedNode.connections.length}개`, panelX + 10, y);
        y += lineHeight;
        
        ctx.fillText(`위치: (${Math.round(this.selectedNode.x)}, ${Math.round(this.selectedNode.y)})`, panelX + 10, y);
        
        // Tip
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        ctx.fillText('더블클릭하여 코드 보기', panelX + 10, panelY + panelHeight - 15);
    }
    
    resetLayout() {
        this.createNodesFromCards();
        this.viewOffset = { x: 0, y: 0 };
        this.scale = 1;
        this.render();
    }
    
    centerView() {
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;
        
        if (this.selectedNode) {
            // Center on selected node
            this.viewOffset.x = width / 2 - this.selectedNode.x - this.selectedNode.width / 2;
            this.viewOffset.y = height / 2 - this.selectedNode.y - this.selectedNode.height / 2;
        } else {
            // Center on all nodes
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            
            this.nodes.forEach(node => {
                minX = Math.min(minX, node.x);
                minY = Math.min(minY, node.y);
                maxX = Math.max(maxX, node.x + node.width);
                maxY = Math.max(maxY, node.y + node.height);
            });
            
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            
            this.viewOffset.x = width / 2 - centerX;
            this.viewOffset.y = height / 2 - centerY;
        }
        
        this.render();
    }
    
    // Public API for external integration
    selectNode(nodeId) {
        this.nodes.forEach(node => node.isSelected = false);
        const node = this.nodes.get(nodeId);
        if (node) {
            node.isSelected = true;
            this.selectedNode = node;
            this.render();
        }
    }
    
    highlightConnections(nodeId) {
        const node = this.nodes.get(nodeId);
        if (node) {
            // This could be implemented to highlight related connections
            this.render();
        }
    }
}

// Initialize blueprint when needed
window.BlueprintVisualizer = BlueprintVisualizer;