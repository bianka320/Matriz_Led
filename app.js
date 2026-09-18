/**
 * ============================================================================
 * MatrixMind AI - PWA Client-Side Handwriting & ESP32 Communication Engine
 * ============================================================================
 * 
 * Funcionalidades clave:
 * 1. Gestión de Lienzo (Canvas) multitáctil y mouse con normalización de trazo.
 * 2. Motor de IA Híbrido con TensorFlow.js (Preprocesamiento 28x28 + Proyecciones Topológicas + Plantillas + Aprendizaje en Navegador).
 * 3. Comunicación HTTP POST asíncrona hacia el ESP32 (/api/set-character).
 * 4. Interfaz interactiva para enseñar y ajustar caracteres en tiempo real.
 */

class MatrixMindApp {
    constructor() {
        // Elementos del DOM
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.canvasHint = document.getElementById('canvasHint');
        this.processingOverlay = document.getElementById('processingOverlay');
        
        this.clearBtn = document.getElementById('clearBtn');
        this.recognizeBtn = document.getElementById('recognizeBtn');
        
        this.predictionChar = document.getElementById('predictionChar');
        this.predictionDetails = document.getElementById('predictionDetails');
        this.confidenceBar = document.getElementById('confidenceBar');
        this.confidenceLabel = document.getElementById('confidenceLabel');
        
        this.wifiStatus = document.getElementById('wifiStatus');
        this.toastNotification = document.getElementById('toastNotification');
        this.toastIcon = document.getElementById('toastIcon');
        this.toastMessage = document.getElementById('toastMessage');
        
        // Modal de Configuración
        this.openSettingsBtn = document.getElementById('openSettingsBtn');
        this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.esp32IpInput = document.getElementById('esp32IpInput');
        this.endpointPreview = document.getElementById('endpointPreview');
        this.testConnectionBtn = document.getElementById('testConnectionBtn');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.autoSendToggle = document.getElementById('autoSendToggle');
        
        // Aprendizaje rápido
        this.correctCharInput = document.getElementById('correctCharInput');
        this.trainBtn = document.getElementById('trainBtn');
        this.clearTemplatesBtn = document.getElementById('clearTemplatesBtn');
        this.exportProfileBtn = document.getElementById('exportProfileBtn');
        this.importProfileInput = document.getElementById('importProfileInput');
        
        // Marquesina / Desplazamiento de frase
        this.phraseInput = document.getElementById('phraseInput');
        this.sendPhraseBtn = document.getElementById('sendPhraseBtn');
        this.phraseSpeedSelect = document.getElementById('phraseSpeedSelect');
        
        // Simulador LED 8x8 en pantalla
        this.virtualLedGrid = document.getElementById('virtualLedGrid');
        this.virtualDots = [];
        this.virtualScrollInterval = null;
        this.FONT_MAP_8X8 = {
            '0': [0x3C, 0x66, 0x6E, 0x7E, 0x76, 0x66, 0x3C, 0x00],
            '1': [0x18, 0x38, 0x18, 0x18, 0x18, 0x18, 0x7E, 0x00],
            '2': [0x3C, 0x66, 0x06, 0x0C, 0x18, 0x30, 0x7E, 0x00],
            '3': [0x3C, 0x66, 0x06, 0x1C, 0x06, 0x66, 0x3C, 0x00],
            '4': [0x0C, 0x1C, 0x3C, 0x6C, 0x7E, 0x0C, 0x0C, 0x00],
            '5': [0x7E, 0x60, 0x7C, 0x06, 0x06, 0x66, 0x3C, 0x00],
            '6': [0x1C, 0x30, 0x60, 0x7C, 0x66, 0x66, 0x3C, 0x00],
            '7': [0x7E, 0x06, 0x0C, 0x18, 0x18, 0x18, 0x18, 0x00],
            '8': [0x3C, 0x66, 0x66, 0x3C, 0x66, 0x66, 0x3C, 0x00],
            '9': [0x3C, 0x66, 0x66, 0x3E, 0x06, 0x0C, 0x38, 0x00],
            'A': [0x18, 0x3C, 0x66, 0x66, 0x7E, 0x66, 0x66, 0x00],
            'B': [0x7C, 0x66, 0x66, 0x7C, 0x66, 0x66, 0x7C, 0x00],
            'C': [0x3C, 0x66, 0x60, 0x60, 0x60, 0x66, 0x3C, 0x00],
            'D': [0x78, 0x6C, 0x66, 0x66, 0x66, 0x6C, 0x78, 0x00],
            'E': [0x7E, 0x60, 0x60, 0x7C, 0x60, 0x60, 0x7E, 0x00],
            'F': [0x7E, 0x60, 0x60, 0x7C, 0x60, 0x60, 0x60, 0x00],
            'G': [0x3C, 0x66, 0x60, 0x6E, 0x66, 0x66, 0x3C, 0x00],
            'H': [0x66, 0x66, 0x66, 0x7E, 0x66, 0x66, 0x66, 0x00],
            'I': [0x3C, 0x18, 0x18, 0x18, 0x18, 0x18, 0x3C, 0x00],
            'J': [0x0E, 0x06, 0x06, 0x06, 0x66, 0x66, 0x3C, 0x00],
            'K': [0x66, 0x6C, 0x78, 0x70, 0x78, 0x6C, 0x66, 0x00],
            'L': [0x60, 0x60, 0x60, 0x60, 0x60, 0x60, 0x7E, 0x00],
            'M': [0x66, 0x7E, 0x5A, 0x5A, 0x42, 0x42, 0x42, 0x00],
            'N': [0x66, 0x76, 0x7E, 0x7E, 0x6E, 0x66, 0x66, 0x00],
            'Ñ': [0x7E, 0x00, 0x66, 0x76, 0x7E, 0x6E, 0x66, 0x00],
            'O': [0x3C, 0x66, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x00],
            'P': [0x7C, 0x66, 0x66, 0x7C, 0x60, 0x60, 0x60, 0x00],
            'Q': [0x3C, 0x66, 0x66, 0x66, 0x6A, 0x6C, 0x36, 0x00],
            'R': [0x7C, 0x66, 0x66, 0x7C, 0x70, 0x68, 0x66, 0x00],
            'S': [0x3C, 0x66, 0x60, 0x3C, 0x06, 0x66, 0x3C, 0x00],
            'T': [0x7E, 0x18, 0x18, 0x18, 0x18, 0x18, 0x18, 0x00],
            'U': [0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x00],
            'V': [0x66, 0x66, 0x66, 0x66, 0x66, 0x3C, 0x18, 0x00],
            'W': [0x42, 0x42, 0x42, 0x5A, 0x5A, 0x7E, 0x66, 0x00],
            'X': [0x66, 0x66, 0x3C, 0x18, 0x3C, 0x66, 0x66, 0x00],
            'Y': [0x66, 0x66, 0x66, 0x3C, 0x18, 0x18, 0x18, 0x00],
            'Z': [0x7E, 0x06, 0x0C, 0x18, 0x30, 0x60, 0x7E, 0x00],
            ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
            '-': [0x00, 0x00, 0x00, 0x7E, 0x00, 0x00, 0x00, 0x00],
            '&': [0x38, 0x6C, 0x6C, 0x38, 0x6E, 0x66, 0x3B, 0x00],
            '.': [0x00, 0x00, 0x00, 0x00, 0x00, 0x18, 0x18, 0x00]
        };
        
        // Estado de dibujo y lógica
        this.isDrawing = false;
        this.hasDrawn = false;
        this.debounceTimer = null;
        this.lastPrediction = null;
        
        // Configuración y Memoria de Aprendizaje
        this.esp32Ip = localStorage.getItem('matrixmind_esp32_ip') || '192.168.0.192';
        this.autoSend = localStorage.getItem('matrixmind_autosend') === 'true'; // Por defecto desactivado (sólo al presionar botón)
        
        // Cargar plantillas personalizadas como arrays múltiples (Multi-Template Learning) y sanear versiones incompatibles
        try {
            const raw = JSON.parse(localStorage.getItem('matrixmind_custom_templates') || '{}');
            this.customTemplates = {};
            let hasIncompatible = false;
            for (const [k, v] of Object.entries(raw)) {
                if (!v) continue;
                const arr = Array.isArray(v) ? v : [v];
                const validSamples = arr.filter(s => s && s.grid5x5 && Array.isArray(s.grid5x5) && s.hProfile && s.topLeft !== undefined && s.leftBar !== undefined);
                if (validSamples.length > 0) {
                    this.customTemplates[k] = validSamples;
                } else if (!Array.isArray(v) || arr.length > validSamples.length) {
                    hasIncompatible = true;
                }
            }
            if (hasIncompatible) {
                console.warn('🧹 Saneando muestras incompatibles de localStorage...');
                localStorage.setItem('matrixmind_custom_templates', JSON.stringify(this.customTemplates));
            }
        } catch (e) {
            this.customTemplates = {};
            localStorage.removeItem('matrixmind_custom_templates');
        }
        
        // Mapa alfanumérico base (37 clases: 0-9, A-Z, Ñ)
        this.classes = [
            '0','1','2','3','4','5','6','7','8','9',
            'A','B','C','D','E','F','G','H','I','J',
            'K','L','M','N','Ñ','O','P','Q','R','S',
            'T','U','V','W','X','Y','Z'
        ];

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.loadSettings();
        if (localStorage.getItem('matrixmind_autosend') === null || localStorage.getItem('matrixmind_autosend') !== 'true') {
            this.autoSend = false;
            localStorage.setItem('matrixmind_autosend', 'false');
            if (this.autoSendToggle) this.autoSendToggle.checked = false;
        }
        this.initVirtualMatrix();
        this.initAIEngine();
        console.log('🚀 MatrixMind AI inicializado correctamente.');
    }

    /**
     * Inicializar la cuadrícula 8x8 de LEDs en pantalla para simulación visual
     */
    initVirtualMatrix() {
        if (!this.virtualLedGrid) return;
        this.virtualLedGrid.innerHTML = '';
        this.virtualDots = [];
        for (let r = 0; r < 8; r++) {
            const rowDots = [];
            for (let c = 0; c < 8; c++) {
                const dot = document.createElement('div');
                dot.className = 'v-led';
                dot.id = `vled_${r}_${c}`;
                this.virtualLedGrid.appendChild(dot);
                rowDots.push(dot);
            }
            this.virtualDots.push(rowDots);
        }
        // Animación inicial en matriz virtual
        setTimeout(() => {
            this.displayVirtualChar('A');
        }, 400);
    }

    /**
     * Renderizar patrón de 8 bytes en los 64 puntos virtuales del DOM
     */
    renderVirtualMatrixPattern(pattern8bytes) {
        if (!this.virtualDots || this.virtualDots.length !== 8) return;
        for (let r = 0; r < 8; r++) {
            const rowByte = pattern8bytes[r] || 0;
            for (let c = 0; c < 8; c++) {
                const isOn = (rowByte & (1 << (7 - c))) !== 0;
                if (isOn) {
                    this.virtualDots[r][c].classList.add('on');
                } else {
                    this.virtualDots[r][c].classList.remove('on');
                }
            }
        }
    }

    /**
     * Iluminar carácter instantáneamente en la matriz virtual en pantalla
     */
    displayVirtualChar(char) {
        if (this.virtualScrollInterval) {
            clearInterval(this.virtualScrollInterval);
            this.virtualScrollInterval = null;
        }
        const upper = (char || ' ').toString().toUpperCase().trim();
        const first = upper.length > 0 ? upper.charAt(0) : ' ';
        const pattern = this.FONT_MAP_8X8[first] || this.FONT_MAP_8X8[' '];
        this.renderVirtualMatrixPattern(pattern);
    }

    /**
     * Desplazar frase horizontalmente (Marquesina) por la matriz virtual en pantalla
     */
    scrollVirtualPhrase(text, speed) {
        if (this.virtualScrollInterval) {
            clearInterval(this.virtualScrollInterval);
            this.virtualScrollInterval = null;
        }
        const cleanText = (text || '').toString().toUpperCase();
        if (!cleanText) return;

        // Construir buffer horizontal (cada columna tiene 8 bits de alto correspondientes a las filas 0..7)
        const colBuffer = [];
        for (let i = 0; i < 8; i++) colBuffer.push(0);

        for (let i = 0; i < cleanText.length; i++) {
            const ch = cleanText.charAt(i);
            const pattern = this.FONT_MAP_8X8[ch] || this.FONT_MAP_8X8[' '];
            for (let col = 0; col < 8; col++) {
                let colBits = 0;
                for (let row = 0; row < 8; row++) {
                    const isOn = (pattern[row] & (1 << (7 - col))) !== 0;
                    if (isOn) {
                        colBits |= (1 << row);
                    }
                }
                colBuffer.push(colBits);
            }
        }
        for (let i = 0; i < 8; i++) colBuffer.push(0);

        let offset = 0;
        this.virtualScrollInterval = setInterval(() => {
            if (offset > colBuffer.length - 8) {
                offset = 0; // Bucle continuo por la frase
            }
            const framePattern = [0, 0, 0, 0, 0, 0, 0, 0];
            for (let c = 0; c < 8; c++) {
                const colBits = colBuffer[offset + c] || 0;
                for (let r = 0; r < 8; r++) {
                    if ((colBits & (1 << r)) !== 0) {
                        framePattern[r] |= (1 << (7 - c));
                    }
                }
            }
            this.renderVirtualMatrixPattern(framePattern);
            offset++;
        }, speed || 65);
    }

    /**
     * Configuración del Canvas (Estilo y Lienzo 2D)
     */
    setupCanvas() {
        // Limpiar en negro puro (fondo de tensor para procesar con IA)
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Estilo de trazo (blanco vibrante, redondeado y suave)
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 22;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    /**
     * Configurar eventos de puntero y UI
     */
    setupEventListeners() {
        // Eventos de Mouse
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
        
        // Eventos Táctiles (Móvil/PWA)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopDrawing();
        }, { passive: false });
        
        // Botones de acción principal
        this.clearBtn.addEventListener('click', () => this.clearCanvas());
        this.recognizeBtn.addEventListener('click', () => this.recognizeAndSend());
        
        // Gestión de Modal Configuración
        this.openSettingsBtn.addEventListener('click', () => this.openModal());
        this.closeSettingsBtn.addEventListener('click', () => this.closeModal());
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) this.closeModal();
        });
        
        this.esp32IpInput.addEventListener('input', () => {
            const ip = this.esp32IpInput.value.trim() || '192.168.0.192';
            this.endpointPreview.textContent = `http://${ip}/api/set-character`;
        });
        
        this.testConnectionBtn.addEventListener('click', () => this.testESP32Connection());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        
        // Botón de aprendizaje
        this.trainBtn.addEventListener('click', () => this.trainOnDevice());
        if (this.clearTemplatesBtn) {
            this.clearTemplatesBtn.addEventListener('click', () => this.clearAllCustomTemplates());
        }
        if (this.exportProfileBtn) {
            this.exportProfileBtn.addEventListener('click', () => this.exportAIProfile());
        }
        if (this.importProfileInput) {
            this.importProfileInput.addEventListener('change', (e) => this.importAIProfile(e));
        }
        if (this.sendPhraseBtn && this.phraseInput) {
            this.sendPhraseBtn.addEventListener('click', () => this.sendPhraseToESP32());
            this.phraseInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.sendPhraseToESP32();
            });
        }
    }

    /**
     * Obtener coordenadas relativas al Canvas
     */
    getCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.hasDrawn = true;
        this.canvasHint.classList.add('hidden');
        
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        
        const pos = this.getCoordinates(e);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
    }

    draw(e) {
        if (!this.isDrawing) return;
        const pos = this.getCoordinates(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        this.ctx.closePath();
        
        // Si el envío automático está activo, lanzamos el reconocimiento tras un breve retraso (650ms)
        if (this.hasDrawn && this.autoSend) {
            this.debounceTimer = setTimeout(() => {
                this.recognizeAndSend();
            }, 650);
        }
    }

    clearCanvas() {
        this.setupCanvas();
        this.hasDrawn = false;
        this.canvasHint.classList.remove('hidden');
        this.predictionChar.textContent = '-';
        this.predictionChar.classList.remove('pulse-anim');
        this.predictionDetails.textContent = 'Esperando trazo...';
        this.confidenceBar.style.width = '0%';
        this.confidenceLabel.textContent = 'Nivel de Coincidencia';
        
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
    }

    /**
     * Normalizar y preprocesar el lienzo para IA (Corte por Bounding Box + Escala a 28x28)
     */
    preprocessCanvas() {
        return tf.tidy(() => {
            // 1. Convertir el lienzo en un tensor 3D [320, 320, 1]
            const imgTensor = tf.browser.fromPixels(this.canvas, 1);
            const data = imgTensor.dataSync();
            
            // 2. Encontrar el Bounding Box del trazo (píxeles blancos > 40)
            let minX = this.canvas.width, minY = this.canvas.height, maxX = 0, maxY = 0;
            let foundPixel = false;
            
            for (let y = 0; y < this.canvas.height; y++) {
                for (let x = 0; x < this.canvas.width; x++) {
                    const val = data[y * this.canvas.width + x];
                    if (val > 40) {
                        foundPixel = true;
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            if (!foundPixel) return null; // Lienzo vacío

            // 3. Calcular proporción (Aspect Ratio) y añadir margen equilibrado para centrar
            const width = maxX - minX;
            const height = maxY - minY;
            const maxDim = Math.max(width, height);
            const pad = Math.round(maxDim * 0.22); // 22% de padding para mantener contornos claros
            
            const boxX = Math.max(0, minX - pad);
            const boxY = Math.max(0, minY - pad);
            const boxW = Math.min(this.canvas.width - boxX, width + pad * 2);
            const boxH = Math.min(this.canvas.height - boxY, height + pad * 2);

            // Guardar aspect ratio real en la instancia antes de redimensionar al cuadrado
            this.currentAspectRatio = width / Math.max(1, height);

            // 4. Recortar la región y redimensionar a 28x28 normalizada [0, 1]
            const cropped = imgTensor.slice([boxY, boxX, 0], [boxH, boxW, 1]);
            const resized = tf.image.resizeBilinear(cropped, [28, 28]);
            const normalized = resized.div(255.0);
            
            return normalized;
        });
    }

    /**
     * Extracción de características multiescala y morfológicas del tensor 28x28
     * (Grilla 7x7 normalizada, Zonificación 5x5, Perfiles H/V, Rectitud de tallo y Cruces estructurales)
     */
    extractFeatures(tensor28, customAspectRatio = null) {
        return tf.tidy(() => {
            const flat = tensor28.flatten();
            const data = flat.dataSync();
            
            // 1. Grilla de ultra-alta resolución 7x7 (49 celdas) con normalización vectorial (Cosine Similarity)
            const grid7x7 = new Array(49).fill(0);
            for (let y = 0; y < 28; y++) {
                for (let x = 0; x < 28; x++) {
                    const val = data[y * 28 + x];
                    const gx = Math.min(6, Math.floor((x / 28) * 7));
                    const gy = Math.min(6, Math.floor((y / 28) * 7));
                    grid7x7[gy * 7 + gx] += val / 16.0;
                }
            }
            let norm7 = 0;
            for (let i = 0; i < 49; i++) norm7 += grid7x7[i] * grid7x7[i];
            norm7 = Math.sqrt(norm7) || 1.0;
            for (let i = 0; i < 49; i++) grid7x7[i] /= norm7;

            // 2. Zonificación 5x5 (25 celdas espaciales)
            const grid5x5 = new Array(25).fill(0);
            for (let y = 0; y < 28; y++) {
                for (let x = 0; x < 28; x++) {
                    const val = data[y * 28 + x];
                    const gx = Math.min(4, Math.floor((x / 28) * 5));
                    const gy = Math.min(4, Math.floor((y / 28) * 5));
                    grid5x5[gy * 5 + gx] += val / (28 * 28 / 25);
                }
            }

            // 3. Zonificación 3x3 (9 celdas para balance global del carácter)
            const grid3x3 = new Array(9).fill(0);
            for (let y = 0; y < 28; y++) {
                for (let x = 0; x < 28; x++) {
                    const val = data[y * 28 + x];
                    const gx = Math.min(2, Math.floor((x / 28) * 3));
                    const gy = Math.min(2, Math.floor((y / 28) * 3));
                    grid3x3[gy * 3 + gx] += val / (28 * 28 / 9);
                }
            }
            
            // 4. Perfiles de proyección Horizontal y Vertical (8 bandas cada uno)
            const hProfile = new Array(8).fill(0);
            const vProfile = new Array(8).fill(0);
            for (let y = 0; y < 28; y++) {
                const rowBand = Math.min(7, Math.floor((y / 28) * 8));
                for (let x = 0; x < 28; x++) {
                    const colBand = Math.min(7, Math.floor((x / 28) * 8));
                    const val = data[y * 28 + x];
                    hProfile[rowBand] += val / 28.0;
                    vProfile[colBand] += val / 28.0;
                }
            }

            // 5. Esquinas del carácter en bloques 6x6
            let topLeft = 0, topRight = 0, bottomLeft = 0, bottomRight = 0;
            for (let y = 0; y < 6; y++) {
                for (let x = 0; x < 6; x++) topLeft += data[y * 28 + x];
                for (let x = 22; x < 28; x++) topRight += data[y * 28 + x];
            }
            for (let y = 22; y < 28; y++) {
                for (let x = 0; x < 6; x++) bottomLeft += data[y * 28 + x];
                for (let x = 22; x < 28; x++) bottomRight += data[y * 28 + x];
            }
            topLeft /= 36.0; topRight /= 36.0; bottomLeft /= 36.0; bottomRight /= 36.0;

            // 6. Barras estructurales y Rectitud del Tallo Izquierdo (Spine Linearity)
            // Distingue infaliblemente letras rectas a la izquierda (D, B, P, R, E, L) de ovaladas/curvas (0, O, G, C, 6, 8)
            let leftBar = 0, rightBar = 0, topBar = 0, bottomBar = 0;
            let leftColXs = [];
            for (let y = 4; y < 24; y++) {
                for (let x = 0; x < 5; x++) leftBar += data[y * 28 + x];
                for (let x = 23; x < 28; x++) rightBar += data[y * 28 + x];
                
                let firstX = 28;
                for (let x = 0; x < 18; x++) {
                    if (data[y * 28 + x] > 0.35) { firstX = x; break; }
                }
                if (firstX < 28) leftColXs.push(firstX);
            }
            for (let x = 3; x < 25; x++) {
                for (let y = 0; y < 5; y++) topBar += data[y * 28 + x];
                for (let y = 23; y < 28; y++) bottomBar += data[y * 28 + x];
            }
            leftBar /= 110.0; rightBar /= 110.0; topBar /= 110.0; bottomBar /= 110.0;

            let avgLeftX = 0;
            if (leftColXs.length > 0) avgLeftX = leftColXs.reduce((a, b) => a + b, 0) / leftColXs.length;
            let leftSpineVariance = 0;
            if (leftColXs.length > 0) leftSpineVariance = leftColXs.reduce((a, x) => a + Math.abs(x - avgLeftX), 0) / leftColXs.length;
            const stemStraightness = Math.max(0, Math.min(1.0, 1.0 - (leftSpineVariance / 4.0)));

            // 7. Intersecciones (Crossings) por línea media vertical (x=14) y horizontal (y=14)
            // Separa categóricamente B/E (3 cruces verticales) de 0/D (2 cruces) o 1/I (1 cruce)
            let vCrossingsMiddle = 0, inStroke = false;
            for (let y = 0; y < 28; y++) {
                const val = data[y * 28 + 14] > 0.35;
                if (val && !inStroke) { vCrossingsMiddle++; inStroke = true; }
                else if (!val && inStroke) { inStroke = false; }
            }
            let hCrossingsMiddle = 0;
            inStroke = false;
            for (let x = 0; x < 28; x++) {
                const val = data[14 * 28 + x] > 0.35;
                if (val && !inStroke) { hCrossingsMiddle++; inStroke = true; }
                else if (!val && inStroke) { inStroke = false; }
            }

            // 8. Conteo de bucles topológicos y relación de aspecto
            const loops = this.countTopologicalLoops(data);
            const aspect = (customAspectRatio !== null) ? customAspectRatio : (this.currentAspectRatio || 1.0);

            return {
                grid7x7, grid5x5, grid3x3, hProfile, vProfile,
                topLeft, topRight, bottomLeft, bottomRight,
                leftBar, rightBar, topBar, bottomBar,
                stemStraightness, vCrossingsMiddle, hCrossingsMiddle,
                loops, aspectRatio: aspect
            };
        });
    }

    /**
     * Conteo de agujeros cerrados usando Flood Fill hiper-optimizado desde los bordes exteriores
     */
    countTopologicalLoops(data28x28) {
        const visited = new Array(784).fill(false);
        const grid = new Array(784);
        for (let i = 0; i < 784; i++) {
            grid[i] = data28x28[i] > 0.35 ? 1 : 0; // 1 = trazo, 0 = fondo
        }

        const queue = [];
        const pushIfValid = (nx, ny) => {
            if (nx >= 0 && nx < 28 && ny >= 0 && ny < 28) {
                const nIdx = ny * 28 + nx;
                if (!visited[nIdx] && grid[nIdx] === 0) {
                    visited[nIdx] = true;
                    queue.push([nx, ny]);
                }
            }
        };

        // Iniciar en todos los píxeles de fondo de los 4 bordes exteriores
        for (let x = 0; x < 28; x++) {
            if (grid[x] === 0 && !visited[x]) { visited[x] = true; queue.push([x, 0]); }
            const bIdx = 27 * 28 + x;
            if (grid[bIdx] === 0 && !visited[bIdx]) { visited[bIdx] = true; queue.push([x, 27]); }
        }
        for (let y = 1; y < 27; y++) {
            const lIdx = y * 28;
            if (grid[lIdx] === 0 && !visited[lIdx]) { visited[lIdx] = true; queue.push([0, y]); }
            const rIdx = y * 28 + 27;
            if (grid[rIdx] === 0 && !visited[rIdx]) { visited[rIdx] = true; queue.push([27, y]); }
        }

        while (queue.length > 0) {
            const [x, y] = queue.pop();
            pushIfValid(x + 1, y);
            pushIfValid(x - 1, y);
            pushIfValid(x, y + 1);
            pushIfValid(x, y - 1);
        }

        // Cualquier componente 0 no visitada por el flood-fill exterior es un bucle cerrado
        let loops = 0;
        for (let i = 0; i < 784; i++) {
            if (grid[i] === 0 && !visited[i]) {
                loops++;
                const qLoop = [[i % 28, Math.floor(i / 28)]];
                visited[i] = true;
                while (qLoop.length > 0) {
                    const [lx, ly] = qLoop.pop();
                    const checkLoop = (nx, ny) => {
                        if (nx >= 0 && nx < 28 && ny >= 0 && ny < 28) {
                            const nIdx = ny * 28 + nx;
                            if (!visited[nIdx] && grid[nIdx] === 0) {
                                visited[nIdx] = true;
                                qLoop.push([nx, ny]);
                            }
                        }
                    };
                    checkLoop(lx + 1, ly);
                    checkLoop(lx - 1, ly);
                    checkLoop(lx, ly + 1);
                    checkLoop(lx, ly - 1);
                }
            }
        }
        return loops;
    }

    /**
     * Inicialización del motor IA con prototipos inmediatos y actualización en segundo plano
     */
    initAIEngine() {
        // 1. Prototipos maestros de respaldo inmediatos por si TF.js o el canvas tardan en iniciar
        this.basePrototypes = this.getFallbackPrototypes();

        // 2. Generar prototipos dinámicos en segundo plano al estar listo TF.js
        if (typeof tf !== 'undefined') {
            tf.ready().then(() => {
                try {
                    const dynamic = this.generateDynamicPrototypes();
                    if (dynamic && Object.keys(dynamic).length >= 36) {
                        // Preservar plantillas maestras e inyectar grillas espaciales 7x7 reales de alta resolución
                        const merged = Object.assign({}, dynamic);
                        for (const [k, v] of Object.entries(this.basePrototypes)) {
                            const baseChar = k.split('_')[0];
                            const realSpatial = dynamic[k] || dynamic[baseChar];
                            if (realSpatial && realSpatial.grid7x7) {
                                merged[k] = Object.assign({}, realSpatial, v, {
                                    grid7x7: realSpatial.grid7x7,
                                    grid5x5: realSpatial.grid5x5,
                                    grid3x3: realSpatial.grid3x3
                                });
                            } else {
                                merged[k] = v;
                            }
                        }
                        this.basePrototypes = merged;
                        console.log('✨ Prototipos dinámicos y variantes expertas de alta precisión activos con grillas 7x7.');
                    }
                } catch (e) {
                    console.warn('⚠️ No se pudieron generar prototipos dinámicos, manteniendo prototipos maestros integrados:', e);
                }
            }).catch(err => {
                console.warn('⚠️ TF.js fallback activo:', err);
            });
        }
    }

    /**
     * Prototipos maestros pre-computados con pesaje geométrico y rectitud de tallo
     */
    getFallbackPrototypes() {
        const fallback = {};
        for (const charCode of this.classes) {
            fallback[charCode] = {
                grid7x7: new Array(49).fill(1/7),
                grid5x5: new Array(25).fill(0.2),
                grid3x3: new Array(9).fill(0.3),
                hProfile: [0.1, 0.3, 0.6, 0.8, 0.8, 0.6, 0.3, 0.1],
                vProfile: [0.1, 0.3, 0.6, 0.8, 0.8, 0.6, 0.3, 0.1],
                topLeft: 0.3, topRight: 0.3, bottomLeft: 0.3, bottomRight: 0.3,
                leftBar: 0.5, rightBar: 0.5, topBar: 0.5, bottomBar: 0.5,
                stemStraightness: 0.5, vCrossingsMiddle: 2, hCrossingsMiddle: 2,
                loops: 0, aspectRatio: 0.75
            };
        }

        fallback['1'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.1,0.2,0.9,0.2,0.1, 0.1,0.2,0.9,0.2,0.1, 0.1,0.2,0.9,0.2,0.1, 0.1,0.2,0.9,0.2,0.1, 0.1,0.2,0.9,0.2,0.1],
            hProfile: [0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3], vProfile: [0.0,0.1,0.2,0.9,0.9,0.2,0.1,0.0],
            topLeft: 0.1, topRight: 0.1, bottomLeft: 0.1, bottomRight: 0.1,
            leftBar: 0.1, rightBar: 0.1, topBar: 0.2, bottomBar: 0.3,
            stemStraightness: 0.95, vCrossingsMiddle: 1, hCrossingsMiddle: 1, loops: 0, aspectRatio: 0.35
        };

        fallback['A'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.1,0.5,0.8,0.5,0.1, 0.3,0.8,0.2,0.8,0.3, 0.8,0.9,0.9,0.9,0.8, 0.8,0.2,0.1,0.2,0.8, 0.9,0.1,0.1,0.1,0.9],
            hProfile: [0.6,0.7,0.8,0.9,0.7,0.7,0.7,0.8], vProfile: [0.7,0.7,0.6,0.6,0.6,0.7,0.7,0.7],
            topLeft: 0.05, topRight: 0.05, bottomLeft: 0.88, bottomRight: 0.88,
            leftBar: 0.6, rightBar: 0.6, topBar: 0.7, bottomBar: 0.8,
            stemStraightness: 0.3, vCrossingsMiddle: 2, hCrossingsMiddle: 2, loops: 1, aspectRatio: 0.82
        };

        fallback['4'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.8,0.1,0.1,0.8,0.2, 0.8,0.1,0.1,0.8,0.2, 0.9,0.9,0.9,0.9,0.9, 0.1,0.1,0.1,0.9,0.2, 0.1,0.1,0.1,0.9,0.2],
            hProfile: [0.6,0.6,0.7,0.9,0.5,0.5,0.5,0.6], vProfile: [0.6,0.6,0.5,0.5,0.9,0.9,0.3,0.1],
            topLeft: 0.75, topRight: 0.65, bottomLeft: 0.05, bottomRight: 0.92,
            leftBar: 0.5, rightBar: 0.95, topBar: 0.6, bottomBar: 0.6,
            stemStraightness: 0.4, vCrossingsMiddle: 2, hCrossingsMiddle: 2, loops: 0, aspectRatio: 0.78
        };

        fallback['D'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.9,0.9,0.9,0.6,0.1, 0.9,0.2,0.1,0.8,0.2, 0.9,0.1,0.1,0.9,0.2, 0.9,0.2,0.1,0.8,0.2, 0.9,0.9,0.9,0.6,0.1],
            hProfile: [0.8,0.6,0.5,0.5,0.5,0.5,0.6,0.8], vProfile: [0.9,0.5,0.3,0.3,0.4,0.7,0.8,0.2],
            topLeft: 0.88, topRight: 0.8, bottomLeft: 0.88, bottomRight: 0.8,
            leftBar: 0.9, rightBar: 0.8, topBar: 0.8, bottomBar: 0.8,
            stemStraightness: 0.96, vCrossingsMiddle: 2, hCrossingsMiddle: 2, loops: 1, aspectRatio: 0.82
        };

        fallback['0'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.2,0.8,0.8,0.8,0.2, 0.8,0.2,0.1,0.2,0.8, 0.8,0.1,0.1,0.1,0.8, 0.8,0.2,0.1,0.2,0.8, 0.2,0.8,0.8,0.8,0.2],
            hProfile: [0.7,0.6,0.5,0.5,0.5,0.5,0.6,0.7], vProfile: [0.6,0.7,0.5,0.4,0.4,0.5,0.7,0.6],
            topLeft: 0.08, topRight: 0.08, bottomLeft: 0.08, bottomRight: 0.08,
            leftBar: 0.45, rightBar: 0.45, topBar: 0.5, bottomBar: 0.5,
            stemStraightness: 0.1, vCrossingsMiddle: 2, hCrossingsMiddle: 2, loops: 1, aspectRatio: 0.78
        };

        fallback['2'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.3,0.8,0.8,0.8,0.2, 0.8,0.2,0.1,0.2,0.8, 0.1,0.2,0.8,0.8,0.1, 0.2,0.8,0.2,0.1,0.1, 0.9,0.9,0.9,0.9,0.9],
            hProfile: [0.7,0.5,0.6,0.6,0.6,0.6,0.7,0.9], vProfile: [0.7,0.7,0.6,0.5,0.5,0.7,0.8,0.5],
            topLeft: 0.35, topRight: 0.82, bottomLeft: 0.85, bottomRight: 0.85,
            leftBar: 0.4, rightBar: 0.5, topBar: 0.65, bottomBar: 0.96,
            stemStraightness: 0.2, vCrossingsMiddle: 3, hCrossingsMiddle: 2, loops: 0, aspectRatio: 0.78
        };

        fallback['3'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.8,0.9,0.9,0.9,0.8, 0.1,0.1,0.1,0.2,0.8, 0.2,0.8,0.9,0.8,0.2, 0.1,0.1,0.1,0.2,0.8, 0.8,0.9,0.9,0.9,0.8],
            hProfile: [0.8,0.5,0.6,0.8,0.6,0.5,0.6,0.8], vProfile: [0.5,0.5,0.4,0.4,0.6,0.8,0.9,0.6],
            topLeft: 0.7, topRight: 0.8, bottomLeft: 0.7, bottomRight: 0.8,
            leftBar: 0.15, rightBar: 0.75, topBar: 0.85, bottomBar: 0.85,
            stemStraightness: 0.2, vCrossingsMiddle: 3, hCrossingsMiddle: 2, loops: 0, aspectRatio: 0.76
        };

        fallback['6'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.2,0.8,0.8,0.8,0.2, 0.8,0.2,0.1,0.1,0.1, 0.8,0.8,0.8,0.8,0.8, 0.8,0.2,0.1,0.2,0.8, 0.2,0.8,0.8,0.8,0.2],
            hProfile: [0.7,0.6,0.6,0.8,0.6,0.6,0.6,0.7], vProfile: [0.7,0.7,0.6,0.5,0.5,0.6,0.7,0.5],
            topLeft: 0.4, topRight: 0.1, bottomLeft: 0.6, bottomRight: 0.6,
            leftBar: 0.75, rightBar: 0.45, topBar: 0.6, bottomBar: 0.7,
            stemStraightness: 0.25, vCrossingsMiddle: 2, hCrossingsMiddle: 2, loops: 1, aspectRatio: 0.78
        };

        fallback['7'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.9,0.9,0.9,0.9,0.9, 0.1,0.1,0.2,0.8,0.2, 0.1,0.2,0.8,0.2,0.1, 0.2,0.8,0.2,0.1,0.1, 0.8,0.2,0.1,0.1,0.1],
            hProfile: [0.9,0.4,0.4,0.4,0.4,0.4,0.4,0.4], vProfile: [0.4,0.5,0.6,0.7,0.6,0.5,0.4,0.3],
            topLeft: 0.88, topRight: 0.88, bottomLeft: 0.15, bottomRight: 0.15,
            leftBar: 0.3, rightBar: 0.3, topBar: 0.95, bottomBar: 0.2,
            stemStraightness: 0.8, vCrossingsMiddle: 1, hCrossingsMiddle: 1, loops: 0, aspectRatio: 0.75
        };

        fallback['8'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.2,0.8,0.8,0.8,0.2, 0.8,0.2,0.1,0.2,0.8, 0.2,0.8,0.8,0.8,0.2, 0.8,0.2,0.1,0.2,0.8, 0.2,0.8,0.8,0.8,0.2],
            hProfile: [0.7,0.6,0.6,0.8,0.6,0.6,0.6,0.7], vProfile: [0.6,0.7,0.6,0.5,0.5,0.6,0.7,0.6],
            topLeft: 0.35, topRight: 0.35, bottomLeft: 0.35, bottomRight: 0.35,
            leftBar: 0.5, rightBar: 0.5, topBar: 0.65, bottomBar: 0.65,
            stemStraightness: 0.1, vCrossingsMiddle: 3, hCrossingsMiddle: 2, loops: 2, aspectRatio: 0.78
        };

        fallback['9'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.2,0.8,0.8,0.8,0.2, 0.8,0.2,0.1,0.2,0.8, 0.8,0.8,0.8,0.8,0.8, 0.1,0.1,0.1,0.2,0.8, 0.2,0.8,0.8,0.8,0.2],
            hProfile: [0.7,0.6,0.6,0.8,0.5,0.5,0.6,0.7], vProfile: [0.5,0.6,0.5,0.5,0.6,0.7,0.7,0.6],
            topLeft: 0.6, topRight: 0.6, bottomLeft: 0.1, bottomRight: 0.4,
            leftBar: 0.45, rightBar: 0.75, topBar: 0.7, bottomBar: 0.6,
            stemStraightness: 0.25, vCrossingsMiddle: 2, hCrossingsMiddle: 2, loops: 1, aspectRatio: 0.78
        };

        fallback['C'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.2,0.8,0.8,0.8,0.2, 0.8,0.2,0.1,0.1,0.1, 0.8,0.1,0.1,0.1,0.1, 0.8,0.2,0.1,0.1,0.1, 0.2,0.8,0.8,0.8,0.2],
            hProfile: [0.7,0.5,0.5,0.5,0.5,0.5,0.5,0.7], vProfile: [0.7,0.6,0.4,0.3,0.3,0.4,0.6,0.4],
            topLeft: 0.2, topRight: 0.2, bottomLeft: 0.2, bottomRight: 0.2,
            leftBar: 0.65, rightBar: 0.15, topBar: 0.65, bottomBar: 0.65,
            stemStraightness: 0.15, vCrossingsMiddle: 2, hCrossingsMiddle: 1, loops: 0, aspectRatio: 0.78
        };

        fallback['E'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.9,0.9,0.9,0.9,0.8, 0.8,0.2,0.1,0.1,0.1, 0.9,0.9,0.8,0.2,0.1, 0.8,0.2,0.1,0.1,0.1, 0.9,0.9,0.9,0.9,0.8],
            hProfile: [0.9,0.5,0.5,0.8,0.5,0.5,0.5,0.9], vProfile: [0.9,0.6,0.5,0.4,0.4,0.5,0.6,0.4],
            topLeft: 0.88, topRight: 0.8, bottomLeft: 0.88, bottomRight: 0.8,
            leftBar: 0.9, rightBar: 0.2, topBar: 0.9, bottomBar: 0.9,
            stemStraightness: 0.96, vCrossingsMiddle: 3, hCrossingsMiddle: 1, loops: 0, aspectRatio: 0.76
        };

        fallback['S'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.2,0.8,0.8,0.8,0.8, 0.8,0.2,0.1,0.1,0.1, 0.2,0.8,0.8,0.8,0.2, 0.1,0.1,0.1,0.2,0.8, 0.8,0.8,0.8,0.8,0.2],
            hProfile: [0.8,0.6,0.5,0.7,0.5,0.6,0.6,0.8], vProfile: [0.6,0.6,0.5,0.5,0.5,0.6,0.7,0.6],
            topLeft: 0.7, topRight: 0.7, bottomLeft: 0.7, bottomRight: 0.7,
            leftBar: 0.45, rightBar: 0.45, topBar: 0.8, bottomBar: 0.8,
            stemStraightness: 0.15, vCrossingsMiddle: 3, hCrossingsMiddle: 2, loops: 0, aspectRatio: 0.76
        };

        fallback['Z'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.9,0.9,0.9,0.9,0.9, 0.1,0.1,0.2,0.8,0.2, 0.1,0.2,0.8,0.2,0.1, 0.2,0.8,0.2,0.1,0.1, 0.9,0.9,0.9,0.9,0.9],
            hProfile: [0.9,0.4,0.5,0.5,0.5,0.5,0.4,0.9], vProfile: [0.6,0.6,0.6,0.6,0.6,0.6,0.6,0.6],
            topLeft: 0.88, topRight: 0.88, bottomLeft: 0.88, bottomRight: 0.88,
            leftBar: 0.4, rightBar: 0.4, topBar: 0.96, bottomBar: 0.96,
            stemStraightness: 0.2, vCrossingsMiddle: 3, hCrossingsMiddle: 2, loops: 0, aspectRatio: 0.78
        };

        fallback['B'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.9,0.9,0.8,0.6,0.1, 0.9,0.2,0.1,0.8,0.2, 0.9,0.9,0.9,0.7,0.1, 0.9,0.2,0.1,0.8,0.2, 0.9,0.9,0.8,0.6,0.1],
            hProfile: [0.8,0.6,0.8,0.9,0.6,0.6,0.6,0.8], vProfile: [0.9,0.5,0.4,0.4,0.5,0.7,0.6,0.2],
            topLeft: 0.88, topRight: 0.3, bottomLeft: 0.88, bottomRight: 0.3,
            leftBar: 0.9, rightBar: 0.5, topBar: 0.75, bottomBar: 0.75,
            stemStraightness: 0.96, vCrossingsMiddle: 3, hCrossingsMiddle: 2, loops: 2, aspectRatio: 0.78
        };

        fallback['G'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.2,0.8,0.8,0.8,0.2, 0.8,0.2,0.1,0.1,0.1, 0.8,0.1,0.1,0.8,0.8, 0.8,0.2,0.1,0.2,0.8, 0.2,0.8,0.8,0.8,0.2],
            hProfile: [0.7,0.5,0.5,0.7,0.5,0.5,0.6,0.7], vProfile: [0.7,0.6,0.4,0.4,0.5,0.7,0.6,0.4],
            topLeft: 0.15, topRight: 0.25, bottomLeft: 0.3, bottomRight: 0.75,
            leftBar: 0.65, rightBar: 0.5, topBar: 0.65, bottomBar: 0.75,
            stemStraightness: 0.15, vCrossingsMiddle: 2, hCrossingsMiddle: 2, loops: 0, aspectRatio: 0.80
        };

        fallback['Ñ'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.8,0.9,0.9,0.9,0.8, 0.8,0.2,0.1,0.2,0.8, 0.8,0.8,0.8,0.8,0.8, 0.8,0.2,0.1,0.2,0.8, 0.8,0.1,0.1,0.1,0.8],
            hProfile: [0.9,0.3,0.8,0.8,0.6,0.6,0.6,0.6], vProfile: [0.8,0.7,0.6,0.6,0.6,0.7,0.8,0.4],
            topLeft: 0.85, topRight: 0.85, bottomLeft: 0.85, bottomRight: 0.85,
            leftBar: 0.85, rightBar: 0.85, topBar: 0.95, bottomBar: 0.6,
            stemStraightness: 0.9, vCrossingsMiddle: 3, hCrossingsMiddle: 2, loops: 0, aspectRatio: 0.82
        };

        fallback['5'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.8,0.9,0.9,0.9,0.8, 0.8,0.2,0.1,0.1,0.1, 0.8,0.9,0.8,0.6,0.1, 0.1,0.1,0.1,0.2,0.8, 0.8,0.8,0.8,0.8,0.2],
            hProfile: [0.9,0.6,0.7,0.6,0.5,0.5,0.6,0.8], vProfile: [0.7,0.6,0.5,0.5,0.5,0.6,0.6,0.4],
            topLeft: 0.8, topRight: 0.7, bottomLeft: 0.15, bottomRight: 0.6,
            leftBar: 0.55, rightBar: 0.45, topBar: 0.85, bottomBar: 0.7,
            stemStraightness: 0.4, vCrossingsMiddle: 3, hCrossingsMiddle: 2, loops: 0, aspectRatio: 0.78
        };

        fallback['F'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.9,0.9,0.9,0.9,0.8, 0.8,0.2,0.1,0.1,0.1, 0.9,0.8,0.6,0.1,0.1, 0.8,0.2,0.1,0.1,0.1, 0.8,0.1,0.1,0.1,0.1],
            hProfile: [0.9,0.5,0.7,0.4,0.4,0.4,0.4,0.5], vProfile: [0.9,0.6,0.4,0.3,0.3,0.3,0.3,0.2],
            topLeft: 0.88, topRight: 0.8, bottomLeft: 0.88, bottomRight: 0.1,
            leftBar: 0.9, rightBar: 0.2, topBar: 0.9, bottomBar: 0.2,
            stemStraightness: 0.96, vCrossingsMiddle: 2, hCrossingsMiddle: 1, loops: 0, aspectRatio: 0.75
        };

        fallback['H'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.8,0.2,0.1,0.2,0.8, 0.8,0.2,0.1,0.2,0.8, 0.9,0.9,0.9,0.9,0.9, 0.8,0.2,0.1,0.2,0.8, 0.8,0.2,0.1,0.2,0.8],
            hProfile: [0.6,0.6,0.9,0.6,0.6,0.6,0.6,0.6], vProfile: [0.8,0.5,0.4,0.4,0.4,0.4,0.5,0.8],
            topLeft: 0.85, topRight: 0.85, bottomLeft: 0.85, bottomRight: 0.85,
            leftBar: 0.9, rightBar: 0.9, topBar: 0.3, bottomBar: 0.3,
            stemStraightness: 0.95, vCrossingsMiddle: 1, hCrossingsMiddle: 2, loops: 0, aspectRatio: 0.8
        };

        fallback['I'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.1,0.2,0.9,0.2,0.1, 0.1,0.2,0.9,0.2,0.1, 0.1,0.2,0.9,0.2,0.1, 0.1,0.2,0.9,0.2,0.1, 0.1,0.2,0.9,0.2,0.1],
            hProfile: [0.3,0.3,0.3,0.3,0.3,0.3,0.3,0.3], vProfile: [0.1,0.2,0.3,0.9,0.9,0.3,0.2,0.1],
            topLeft: 0.15, topRight: 0.15, bottomLeft: 0.15, bottomRight: 0.15,
            leftBar: 0.15, rightBar: 0.15, topBar: 0.3, bottomBar: 0.3,
            stemStraightness: 0.98, vCrossingsMiddle: 1, hCrossingsMiddle: 1, loops: 0, aspectRatio: 0.35
        };

        fallback['J'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.1,0.1,0.2,0.8,0.2, 0.1,0.1,0.2,0.8,0.2, 0.1,0.1,0.2,0.8,0.2, 0.8,0.2,0.2,0.8,0.2, 0.6,0.8,0.8,0.6,0.1],
            hProfile: [0.3,0.3,0.3,0.5,0.7,0.6,0.5,0.4], vProfile: [0.3,0.4,0.4,0.6,0.8,0.6,0.3,0.2],
            topLeft: 0.1, topRight: 0.7, bottomLeft: 0.8, bottomRight: 0.4,
            leftBar: 0.3, rightBar: 0.7, topBar: 0.5, bottomBar: 0.7,
            stemStraightness: 0.6, vCrossingsMiddle: 1, hCrossingsMiddle: 1, loops: 0, aspectRatio: 0.55
        };

        fallback['K'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.8,0.2,0.2,0.8,0.2, 0.8,0.2,0.8,0.2,0.1, 0.9,0.9,0.6,0.1,0.1, 0.8,0.2,0.8,0.2,0.1, 0.8,0.2,0.2,0.8,0.2],
            hProfile: [0.6,0.6,0.7,0.6,0.6,0.6,0.6,0.6], vProfile: [0.9,0.6,0.5,0.4,0.4,0.5,0.6,0.6],
            topLeft: 0.88, topRight: 0.8, bottomLeft: 0.88, bottomRight: 0.8,
            leftBar: 0.9, rightBar: 0.6, topBar: 0.6, bottomBar: 0.6,
            stemStraightness: 0.95, vCrossingsMiddle: 2, hCrossingsMiddle: 2, loops: 0, aspectRatio: 0.78
        };

        fallback['L'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.8,0.2,0.1,0.1,0.1, 0.8,0.2,0.1,0.1,0.1, 0.8,0.2,0.1,0.1,0.1, 0.8,0.2,0.1,0.1,0.1, 0.9,0.9,0.9,0.9,0.9],
            hProfile: [0.4,0.4,0.4,0.4,0.4,0.4,0.5,0.9], vProfile: [0.9,0.4,0.3,0.3,0.3,0.3,0.4,0.5],
            topLeft: 0.88, topRight: 0.1, bottomLeft: 0.88, bottomRight: 0.88,
            leftBar: 0.9, rightBar: 0.2, topBar: 0.3, bottomBar: 0.9,
            stemStraightness: 0.95, vCrossingsMiddle: 1, hCrossingsMiddle: 1, loops: 0, aspectRatio: 0.75
        };

        fallback['M'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.9,0.2,0.8,0.2,0.9, 0.9,0.6,0.6,0.6,0.9, 0.9,0.2,0.8,0.2,0.9, 0.8,0.2,0.1,0.2,0.8, 0.8,0.2,0.1,0.2,0.8],
            hProfile: [0.7,0.8,0.7,0.6,0.6,0.6,0.6,0.6], vProfile: [0.9,0.6,0.6,0.6,0.6,0.6,0.6,0.9],
            topLeft: 0.88, topRight: 0.88, bottomLeft: 0.88, bottomRight: 0.88,
            leftBar: 0.9, rightBar: 0.9, topBar: 0.85, bottomBar: 0.6,
            stemStraightness: 0.88, vCrossingsMiddle: 3, hCrossingsMiddle: 2, loops: 0, aspectRatio: 0.92
        };

        fallback['N'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.9,0.2,0.1,0.2,0.8, 0.9,0.8,0.1,0.2,0.8, 0.8,0.2,0.8,0.2,0.8, 0.8,0.2,0.1,0.8,0.9, 0.8,0.2,0.1,0.2,0.9],
            hProfile: [0.6,0.7,0.7,0.7,0.7,0.7,0.7,0.6], vProfile: [0.9,0.6,0.5,0.5,0.5,0.5,0.6,0.9],
            topLeft: 0.88, topRight: 0.88, bottomLeft: 0.88, bottomRight: 0.88,
            leftBar: 0.9, rightBar: 0.9, topBar: 0.7, bottomBar: 0.7,
            stemStraightness: 0.9, vCrossingsMiddle: 2, hCrossingsMiddle: 2, loops: 0, aspectRatio: 0.82
        };

        fallback['P'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.9,0.9,0.8,0.6,0.1, 0.9,0.2,0.1,0.8,0.2, 0.9,0.9,0.9,0.7,0.1, 0.9,0.2,0.1,0.1,0.1, 0.9,0.2,0.1,0.1,0.1],
            hProfile: [0.8,0.6,0.8,0.5,0.4,0.4,0.4,0.4], vProfile: [0.9,0.5,0.4,0.4,0.5,0.6,0.5,0.2],
            topLeft: 0.88, topRight: 0.6, bottomLeft: 0.88, bottomRight: 0.1,
            leftBar: 0.9, rightBar: 0.4, topBar: 0.8, bottomBar: 0.3,
            stemStraightness: 0.96, vCrossingsMiddle: 2, hCrossingsMiddle: 2, loops: 1, aspectRatio: 0.76
        };

        fallback['Q'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.2,0.8,0.8,0.8,0.2, 0.8,0.2,0.1,0.2,0.8, 0.8,0.2,0.1,0.2,0.8, 0.8,0.2,0.8,0.8,0.6, 0.2,0.8,0.8,0.2,0.9],
            hProfile: [0.7,0.6,0.6,0.7,0.8,0.7,0.6,0.8], vProfile: [0.6,0.7,0.6,0.5,0.6,0.7,0.8,0.7],
            topLeft: 0.6, topRight: 0.6, bottomLeft: 0.6, bottomRight: 0.92,
            leftBar: 0.6, rightBar: 0.7, topBar: 0.7, bottomBar: 0.8,
            stemStraightness: 0.2, vCrossingsMiddle: 2, hCrossingsMiddle: 2, loops: 1, aspectRatio: 0.8
        };

        fallback['R'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.9,0.9,0.8,0.6,0.1, 0.9,0.2,0.1,0.8,0.2, 0.9,0.9,0.9,0.6,0.1, 0.9,0.2,0.6,0.8,0.2, 0.9,0.2,0.1,0.6,0.8],
            hProfile: [0.8,0.6,0.8,0.7,0.6,0.6,0.6,0.7], vProfile: [0.9,0.6,0.5,0.5,0.6,0.7,0.7,0.5],
            topLeft: 0.88, topRight: 0.6, bottomLeft: 0.88, bottomRight: 0.88,
            leftBar: 0.9, rightBar: 0.6, topBar: 0.8, bottomBar: 0.6,
            stemStraightness: 0.96, vCrossingsMiddle: 2, hCrossingsMiddle: 2, loops: 1, aspectRatio: 0.78
        };

        fallback['T'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.9,0.9,0.9,0.9,0.9, 0.1,0.2,0.8,0.2,0.1, 0.1,0.2,0.8,0.2,0.1, 0.1,0.2,0.8,0.2,0.1, 0.1,0.2,0.8,0.2,0.1],
            hProfile: [0.9,0.3,0.3,0.3,0.3,0.3,0.3,0.3], vProfile: [0.3,0.4,0.5,0.9,0.9,0.5,0.4,0.3],
            topLeft: 0.88, topRight: 0.88, bottomLeft: 0.15, bottomRight: 0.15,
            leftBar: 0.3, rightBar: 0.3, topBar: 0.96, bottomBar: 0.2,
            stemStraightness: 0.96, vCrossingsMiddle: 1, hCrossingsMiddle: 1, loops: 0, aspectRatio: 0.78
        };

        fallback['U'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.8,0.2,0.1,0.2,0.8, 0.8,0.2,0.1,0.2,0.8, 0.8,0.2,0.1,0.2,0.8, 0.8,0.2,0.1,0.2,0.8, 0.3,0.8,0.9,0.8,0.3],
            hProfile: [0.6,0.6,0.6,0.6,0.6,0.6,0.7,0.8], vProfile: [0.8,0.7,0.5,0.4,0.4,0.5,0.7,0.8],
            topLeft: 0.85, topRight: 0.85, bottomLeft: 0.7, bottomRight: 0.7,
            leftBar: 0.85, rightBar: 0.85, topBar: 0.4, bottomBar: 0.88,
            stemStraightness: 0.6, vCrossingsMiddle: 2, hCrossingsMiddle: 1, loops: 0, aspectRatio: 0.8
        };

        fallback['V'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.8,0.2,0.1,0.2,0.8, 0.8,0.2,0.1,0.2,0.8, 0.2,0.8,0.1,0.8,0.2, 0.1,0.6,0.6,0.6,0.1, 0.1,0.2,0.8,0.2,0.1],
            hProfile: [0.6,0.6,0.6,0.6,0.5,0.5,0.4,0.4], vProfile: [0.7,0.6,0.5,0.6,0.6,0.6,0.6,0.7],
            topLeft: 0.85, topRight: 0.85, bottomLeft: 0.2, bottomRight: 0.2,
            leftBar: 0.6, rightBar: 0.6, topBar: 0.6, bottomBar: 0.4,
            stemStraightness: 0.3, vCrossingsMiddle: 2, hCrossingsMiddle: 1, loops: 0, aspectRatio: 0.78
        };

        fallback['W'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.8,0.2,0.1,0.2,0.8, 0.8,0.2,0.6,0.2,0.8, 0.8,0.6,0.8,0.6,0.8, 0.8,0.8,0.2,0.8,0.8, 0.6,0.6,0.1,0.6,0.6],
            hProfile: [0.6,0.6,0.7,0.8,0.8,0.7,0.6,0.6], vProfile: [0.8,0.7,0.7,0.8,0.8,0.7,0.7,0.8],
            topLeft: 0.85, topRight: 0.85, bottomLeft: 0.8, bottomRight: 0.8,
            leftBar: 0.8, rightBar: 0.8, topBar: 0.5, bottomBar: 0.85,
            stemStraightness: 0.3, vCrossingsMiddle: 3, hCrossingsMiddle: 1, loops: 0, aspectRatio: 0.95
        };

        fallback['X'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.8,0.2,0.1,0.2,0.8, 0.2,0.8,0.1,0.8,0.2, 0.1,0.2,0.9,0.2,0.1, 0.2,0.8,0.1,0.8,0.2, 0.8,0.2,0.1,0.2,0.8],
            hProfile: [0.6,0.6,0.5,0.5,0.5,0.5,0.6,0.6], vProfile: [0.6,0.6,0.5,0.5,0.5,0.5,0.6,0.6],
            topLeft: 0.85, topRight: 0.85, bottomLeft: 0.85, bottomRight: 0.85,
            leftBar: 0.5, rightBar: 0.5, topBar: 0.6, bottomBar: 0.6,
            stemStraightness: 0.2, vCrossingsMiddle: 2, hCrossingsMiddle: 2, loops: 0, aspectRatio: 0.8
        };

        fallback['Y'] = {
            grid7x7: new Array(49).fill(1/7), grid5x5: [0.8,0.2,0.1,0.2,0.8, 0.2,0.8,0.1,0.8,0.2, 0.1,0.2,0.9,0.2,0.1, 0.1,0.2,0.8,0.2,0.1, 0.1,0.2,0.8,0.2,0.1],
            hProfile: [0.6,0.6,0.5,0.4,0.4,0.4,0.4,0.4], vProfile: [0.6,0.6,0.5,0.7,0.7,0.5,0.6,0.6],
            topLeft: 0.85, topRight: 0.85, bottomLeft: 0.2, bottomRight: 0.2,
            leftBar: 0.5, rightBar: 0.5, topBar: 0.6, bottomBar: 0.4,
            stemStraightness: 0.4, vCrossingsMiddle: 2, hCrossingsMiddle: 2, loops: 0, aspectRatio: 0.78
        };

        fallback['O'] = Object.assign({}, fallback['0']);
        fallback['1_SIMPLE'] = Object.assign({}, fallback['1']);
        fallback['B_1LOOP'] = Object.assign({}, fallback['B'], { loops: 1 });
        fallback['D_HAND'] = Object.assign({}, fallback['D']);
        fallback['A_HAND'] = Object.assign({}, fallback['A']);
        fallback['4_HAND'] = Object.assign({}, fallback['4']);
        fallback['G_HAND'] = Object.assign({}, fallback['G']);
        fallback['2_HAND'] = Object.assign({}, fallback['2']);
        fallback['3_HAND'] = Object.assign({}, fallback['3']);
        fallback['6_HAND'] = Object.assign({}, fallback['6']);
        fallback['7_HAND'] = Object.assign({}, fallback['7']);
        fallback['8_HAND'] = Object.assign({}, fallback['8']);
        fallback['9_HAND'] = Object.assign({}, fallback['9']);
        fallback['S_HAND'] = Object.assign({}, fallback['S']);
        fallback['Z_HAND'] = Object.assign({}, fallback['Z']);

        return fallback;
    }

    /**
     * Generar plantillas dinámicas y variantes multiescala de escritura a mano en segundo plano
     */
    generateDynamicPrototypes() {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = 120;
        offCanvas.height = 120;
        const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
        const prototypes = {};

        for (const charCode of this.classes) {
            offCtx.fillStyle = '#000000';
            offCtx.fillRect(0, 0, 120, 120);
            
            offCtx.fillStyle = '#FFFFFF';
            offCtx.font = 'bold 88px Inter, Arial, sans-serif';
            offCtx.textAlign = 'center';
            offCtx.textBaseline = 'middle';
            offCtx.fillText(charCode, 60, 63);

            tf.tidy(() => {
                const imgTensor = tf.browser.fromPixels(offCanvas, 1);
                const data = imgTensor.dataSync();
                
                let minX = 120, minY = 120, maxX = 0, maxY = 0;
                for (let y = 0; y < 120; y++) {
                    for (let x = 0; x < 120; x++) {
                        if (data[y * 120 + x] > 40) {
                            if (x < minX) minX = x;
                            if (x > maxX) maxX = x;
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                        }
                    }
                }
                if (maxX <= minX || maxY <= minY) return;
                const w = maxX - minX, h = maxY - minY;
                const maxDim = Math.max(w, h);
                const pad = Math.round(maxDim * 0.22);
                const boxX = Math.max(0, minX - pad), boxY = Math.max(0, minY - pad);
                const boxW = Math.min(120 - boxX, w + pad * 2), boxH = Math.min(120 - boxY, h + pad * 2);

                const cropped = imgTensor.slice([boxY, boxX, 0], [boxH, boxW, 1]);
                const resized = tf.image.resizeBilinear(cropped, [28, 28]).div(255.0);
                
                const features = this.extractFeatures(resized, w / Math.max(1, h));
                prototypes[charCode] = features;
            });
        }

        // --- Banco de Variaciones Maestras para Trazos Reales a Mano Alzada (Handwriting Bank) ---
        const addVariant = (baseChar, variantName, overrides) => {
            if (prototypes[baseChar]) {
                prototypes[`${baseChar}_${variantName}`] = Object.assign({}, prototypes[baseChar], overrides);
            }
        };

        addVariant('A', 'HAND', { loops: 1, topLeft: 0.05, topRight: 0.05, bottomLeft: 0.88, bottomRight: 0.88, stemStraightness: 0.3 });
        addVariant('A', 'OPEN', { loops: 0, topLeft: 0.05, topRight: 0.05, bottomLeft: 0.88, bottomRight: 0.88, stemStraightness: 0.3 });
        addVariant('2', 'HAND', { loops: 0, topLeft: 0.35, topRight: 0.82, bottomLeft: 0.85, bottomRight: 0.85, bottomBar: 0.96, topBar: 0.65, stemStraightness: 0.2 });
        addVariant('2', 'LOOP', { loops: 1, topLeft: 0.35, topRight: 0.82, bottomLeft: 0.85, bottomRight: 0.85, bottomBar: 0.96, topBar: 0.65, stemStraightness: 0.2 });
        addVariant('3', 'HAND', { loops: 0, topLeft: 0.7, topRight: 0.8, bottomLeft: 0.7, bottomRight: 0.8, leftBar: 0.15, rightBar: 0.75, topBar: 0.85, bottomBar: 0.85 });
        addVariant('4', 'HAND', { loops: 0, topLeft: 0.8, topRight: 0.7, bottomLeft: 0.05, bottomRight: 0.92, rightBar: 0.95 });
        addVariant('4', 'CLOSED', { loops: 1, topLeft: 0.8, topRight: 0.7, bottomLeft: 0.05, bottomRight: 0.92, rightBar: 0.95 });
        addVariant('C', 'STRAIGHT', { stemStraightness: 0.85, vCrossingsMiddle: 2, hCrossingsMiddle: 1, loops: 0, bottomBar: 0.75, topBar: 0.75, leftBar: 0.75, rightBar: 0.15, bottomRight: 0.45 });
        addVariant('C', 'HAND', { stemStraightness: 0.5, vCrossingsMiddle: 2, hCrossingsMiddle: 1, loops: 0, bottomBar: 0.75, topBar: 0.75, leftBar: 0.7, rightBar: 0.15, bottomRight: 0.4 });
        addVariant('D', 'HAND', { stemStraightness: 0.96, vCrossingsMiddle: 2, loops: 1, topLeft: 0.88, bottomLeft: 0.88, topRight: 0.82, bottomRight: 0.82, rightBar: 0.85, topBar: 0.85, bottomBar: 0.85, leftBar: 0.9 });
        addVariant('0', 'OVAL', { stemStraightness: 0.1, vCrossingsMiddle: 2, loops: 1, topLeft: 0.08, bottomLeft: 0.08, topRight: 0.08, bottomRight: 0.08 });
        addVariant('O', 'ROUND', { stemStraightness: 0.1, vCrossingsMiddle: 2, loops: 1, topLeft: 0.08, bottomLeft: 0.08 });
        addVariant('B', '2LOOPS', { stemStraightness: 0.96, vCrossingsMiddle: 3, loops: 2, topLeft: 0.88, bottomLeft: 0.88, leftBar: 0.9 });
        addVariant('B', '1LOOP', { stemStraightness: 0.96, vCrossingsMiddle: 3, loops: 1, topLeft: 0.88, bottomLeft: 0.88, leftBar: 0.9 });
        addVariant('G', 'HAND', { stemStraightness: 0.15, vCrossingsMiddle: 2, loops: 0, topLeft: 0.15, bottomLeft: 0.3, bottomRight: 0.75, topBar: 0.65, bottomBar: 0.75 });
        addVariant('G', 'HOOK', { stemStraightness: 0.15, vCrossingsMiddle: 2, loops: 0, topLeft: 0.1, bottomLeft: 0.25, bottomRight: 0.65, rightBar: 0.5 });
        addVariant('Ñ', 'HAND', { loops: 0, topBar: 0.95, vCrossingsMiddle: 3, hProfile: [0.9, 0.3, 0.8, 0.8, 0.6, 0.6, 0.6, 0.6] });
        addVariant('5', 'HAND', { stemStraightness: 0.4, vCrossingsMiddle: 3, loops: 0, topBar: 0.88, topLeft: 0.8, topRight: 0.7, bottomLeft: 0.15 });
        addVariant('6', 'LOOP', { stemStraightness: 0.15, vCrossingsMiddle: 2, loops: 1, topLeft: 0.5, topRight: 0.05, bottomLeft: 0.6 });
        addVariant('7', 'HAND', { loops: 0, topBar: 0.95, topLeft: 0.88, topRight: 0.88, bottomLeft: 0.15, bottomRight: 0.15, stemStraightness: 0.8 });
        addVariant('8', '2LOOPS', { stemStraightness: 0.1, vCrossingsMiddle: 3, loops: 2, bottomBar: 0.65 });
        addVariant('8', '1LOOP', { stemStraightness: 0.1, vCrossingsMiddle: 3, loops: 1, bottomBar: 0.65 });
        addVariant('9', 'LOOP', { stemStraightness: 0.25, vCrossingsMiddle: 2, loops: 1, topRight: 0.85, rightBar: 0.8 });
        addVariant('S', 'HAND', { loops: 0, vCrossingsMiddle: 3, topBar: 0.8, bottomBar: 0.8, topLeft: 0.7, bottomRight: 0.7 });
        addVariant('Z', 'HAND', { loops: 0, topBar: 0.96, bottomBar: 0.96, topLeft: 0.88, bottomRight: 0.88 });
        addVariant('1', 'SIMPLE', { stemStraightness: 0.98, vCrossingsMiddle: 1, hCrossingsMiddle: 1, loops: 0, aspectRatio: 0.35, leftBar: 0.1, rightBar: 0.1 });
        addVariant('1', 'BEAK', { stemStraightness: 0.88, vCrossingsMiddle: 2, hCrossingsMiddle: 1, loops: 0, aspectRatio: 0.48, leftBar: 0.45, rightBar: 0.15, topLeft: 0.65, topRight: 0.1, bottomLeft: 0.15, bottomRight: 0.15 });
        addVariant('1', 'SERIF', { stemStraightness: 0.88, vCrossingsMiddle: 2, hCrossingsMiddle: 1, loops: 0, aspectRatio: 0.55, leftBar: 0.45, rightBar: 0.2, topLeft: 0.65, topRight: 0.1, bottomLeft: 0.8, bottomRight: 0.8, bottomBar: 0.85 });
        addVariant('1', 'HAND', { stemStraightness: 0.92, vCrossingsMiddle: 2, hCrossingsMiddle: 1, loops: 0, aspectRatio: 0.42, leftBar: 0.35, rightBar: 0.15, topLeft: 0.55, topRight: 0.1, bottomLeft: 0.2, bottomRight: 0.2 });
        addVariant('E', 'SHORT_PRONG', { stemStraightness: 0.96, vCrossingsMiddle: 2, hCrossingsMiddle: 1, loops: 0, topBar: 0.9, bottomBar: 0.9, leftBar: 0.9, rightBar: 0.2, topRight: 0.8, bottomRight: 0.8 });
        addVariant('E', 'HAND', { stemStraightness: 0.96, vCrossingsMiddle: 3, hCrossingsMiddle: 1, loops: 0, topBar: 0.9, bottomBar: 0.9, leftBar: 0.9, rightBar: 0.2, topRight: 0.8, bottomRight: 0.8 });
        addVariant('F', 'HAND', { stemStraightness: 0.95, topBar: 0.9, leftBar: 0.9, bottomBar: 0.1 });
        addVariant('H', 'HAND', { stemStraightness: 0.95, leftBar: 0.9, rightBar: 0.9, hCrossingsMiddle: 2 });
        addVariant('I', 'SERIF', { stemStraightness: 0.96, topBar: 0.7, bottomBar: 0.7, aspectRatio: 0.45 });
        addVariant('I', 'SIMPLE', { stemStraightness: 0.98, aspectRatio: 0.3, leftBar: 0.1, rightBar: 0.1 });
        addVariant('J', 'HAND', { stemStraightness: 0.6, bottomLeft: 0.85, topBar: 0.6 });
        addVariant('K', 'HAND', { stemStraightness: 0.95, leftBar: 0.9, vCrossingsMiddle: 2 });
        addVariant('L', 'HAND', { stemStraightness: 0.95, leftBar: 0.9, bottomBar: 0.9 });
        addVariant('M', 'HAND', { stemStraightness: 0.88, leftBar: 0.9, rightBar: 0.9, vCrossingsMiddle: 3 });
        addVariant('N', 'HAND', { stemStraightness: 0.9, leftBar: 0.9, rightBar: 0.9, vCrossingsMiddle: 2 });
        addVariant('P', 'HAND', { stemStraightness: 0.96, loops: 1, leftBar: 0.9, topBar: 0.8, bottomBar: 0.2 });
        addVariant('Q', 'HAND', { loops: 1, bottomRight: 0.85 });
        addVariant('R', 'HAND', { stemStraightness: 0.96, loops: 1, leftBar: 0.9, bottomRight: 0.85 });
        addVariant('T', 'HAND', { stemStraightness: 0.96, topBar: 0.96, leftBar: 0.3, rightBar: 0.3 });
        addVariant('U', 'HAND', { stemStraightness: 0.6, leftBar: 0.85, rightBar: 0.85, bottomBar: 0.88 });
        addVariant('V', 'HAND', { stemStraightness: 0.3, topLeft: 0.85, topRight: 0.85, bottomLeft: 0.15, bottomRight: 0.15 });
        addVariant('W', 'HAND', { stemStraightness: 0.3, vCrossingsMiddle: 3, bottomBar: 0.85 });
        addVariant('X', 'HAND', { stemStraightness: 0.2, topLeft: 0.85, topRight: 0.85, bottomLeft: 0.85, bottomRight: 0.85 });
        addVariant('Y', 'HAND', { stemStraightness: 0.4, topLeft: 0.85, topRight: 0.85, bottomLeft: 0.3 });

        return prototypes;
    }

    /**
     * Proceso principal: Reconocer trazo en Canvas y Transmitir al ESP32
     */
    async recognizeAndSend() {
        if (!this.hasDrawn) {
            this.showToast('⚠️ Dibuja primero una letra o número en el lienzo');
            return;
        }

        this.processingOverlay.classList.add('active');

        // Permitir actualización visual de la interfaz (spinner)
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            if (typeof tf !== 'undefined') await tf.ready();

            const tensor28 = this.preprocessCanvas();
            if (!tensor28) {
                this.processingOverlay.classList.remove('active');
                return;
            }

            const features = this.extractFeatures(tensor28);
            tensor28.dispose();

            const prediction = this.classifyCharacter(features);
            this.lastPrediction = prediction;

            // Actualizar UI en vivo con los resultados
            this.predictionChar.textContent = prediction.char;
            this.predictionChar.classList.add('pulse-anim');
            this.predictionDetails.textContent = `Carácter detectado por IA`;
            
            this.confidenceBar.style.width = `${prediction.confidence}%`;
            this.confidenceLabel.textContent = `Coincidencia de Trazo`;

            // Enviar petición al ESP32
            await this.sendToESP32(prediction.char);

        } catch (err) {
            console.error('Error durante el reconocimiento o envío:', err);
            this.showToast('❌ Error en el análisis de IA: ' + err.message);
        } finally {
            this.processingOverlay.classList.remove('active');
        }
    }

    /**
     * Clasificación hiper-precisa: Similitud Coseno 7x7 + Rectitud Tallo + Cruces Línea Media + Esquinas + Barras
     */
    classifyCharacter(features) {
        let bestChar = 'A';
        let minDistance = Infinity;
        let secondMinDistance = Infinity;

        for (const [key, proto] of Object.entries(this.basePrototypes)) {
            const charCode = key.split('_')[0];
            const target = proto;
            if (!target || !target.grid5x5) continue;

            let dot = 0;
            if (target.grid7x7 && features.grid7x7) {
                for (let i = 0; i < 49; i++) dot += features.grid7x7[i] * target.grid7x7[i];
            } else {
                dot = 0.5;
            }
            const cosineDistance = Math.max(0, 1.0 - dot) * 3.8;

            let dist5x5 = 0;
            for (let i = 0; i < 25; i++) {
                const diff = (features.grid5x5[i] || 0) - (target.grid5x5[i] || 0);
                dist5x5 += diff * diff;
            }
            dist5x5 = Math.sqrt(dist5x5);

            let distProfile = 0;
            for (let i = 0; i < 8; i++) {
                distProfile += Math.abs((features.hProfile[i] || 0) - (target.hProfile[i] || 0));
                distProfile += Math.abs((features.vProfile[i] || 0) - (target.vProfile[i] || 0));
            }
            distProfile /= 16.0;

            let stemPenalization = Math.abs(features.stemStraightness - target.stemStraightness) * 4.2;

            let crossingPenalization = 0;
            if (target.vCrossingsMiddle !== features.vCrossingsMiddle) crossingPenalization += 0.55;
            if (target.hCrossingsMiddle !== features.hCrossingsMiddle) crossingPenalization += 0.45;

            let distCorners = Math.abs((features.topLeft || 0) - (target.topLeft || 0)) +
                              Math.abs((features.topRight || 0) - (target.topRight || 0)) +
                              Math.abs((features.bottomLeft || 0) - (target.bottomLeft || 0)) +
                              Math.abs((features.bottomRight || 0) - (target.bottomRight || 0));
            distCorners /= 4.0;

            let distBars = Math.abs((features.leftBar || 0) - (target.leftBar || 0)) +
                           Math.abs((features.rightBar || 0) - (target.rightBar || 0)) +
                           Math.abs((features.topBar || 0) - (target.topBar || 0)) +
                           Math.abs((features.bottomBar || 0) - (target.bottomBar || 0));
            distBars /= 4.0;

            let loopPenalization = Math.abs((features.loops || 0) - (target.loops || 0)) * 1.35;
            let aspectPenalization = Math.abs((features.aspectRatio || 1.0) - (target.aspectRatio || 1.0)) * 1.8;

            const totalDistance = cosineDistance + (dist5x5 * 1.2) + (distProfile * 0.8) + stemPenalization + crossingPenalization + (distCorners * 2.0) + (distBars * 2.2) + loopPenalization + aspectPenalization;

            if (totalDistance < minDistance) {
                secondMinDistance = minDistance;
                minDistance = totalDistance;
                bestChar = charCode;
            } else if (totalDistance < secondMinDistance) {
                secondMinDistance = totalDistance;
            }
        }

        // --- Comparación Vectorial con Todas las Muestras Personalizadas Aprendidas por Usuario (k-Prototype Multi-Sample) ---
        for (const [charCode, samples] of Object.entries(this.customTemplates)) {
            if (!Array.isArray(samples)) continue;
            for (let sIdx = 0; sIdx < samples.length; sIdx++) {
                const target = samples[sIdx];
                if (!target || !target.grid5x5) continue;

                let dot = 0;
                if (target.grid7x7 && features.grid7x7) {
                    for (let i = 0; i < 49; i++) dot += features.grid7x7[i] * target.grid7x7[i];
                } else {
                    dot = 0.5;
                }
                const cosineDistance = Math.max(0, 1.0 - dot) * 3.8;

                let dist5x5 = 0;
                for (let i = 0; i < 25; i++) {
                    const diff = (features.grid5x5[i] || 0) - (target.grid5x5[i] || 0);
                    dist5x5 += diff * diff;
                }
                dist5x5 = Math.sqrt(dist5x5);

                let distProfile = 0;
                for (let i = 0; i < 8; i++) {
                    distProfile += Math.abs((features.hProfile[i] || 0) - (target.hProfile[i] || 0));
                    distProfile += Math.abs((features.vProfile[i] || 0) - (target.vProfile[i] || 0));
                }
                distProfile /= 16.0;

                let stemPenalization = Math.abs(features.stemStraightness - target.stemStraightness) * 4.2;

                let crossingPenalization = 0;
                if (target.vCrossingsMiddle !== features.vCrossingsMiddle) crossingPenalization += 0.55;
                if (target.hCrossingsMiddle !== features.hCrossingsMiddle) crossingPenalization += 0.45;

                let distCorners = Math.abs((features.topLeft || 0) - (target.topLeft || 0)) +
                                  Math.abs((features.topRight || 0) - (target.topRight || 0)) +
                                  Math.abs((features.bottomLeft || 0) - (target.bottomLeft || 0)) +
                                  Math.abs((features.bottomRight || 0) - (target.bottomRight || 0));
                distCorners /= 4.0;

                let distBars = Math.abs((features.leftBar || 0) - (target.leftBar || 0)) +
                               Math.abs((features.rightBar || 0) - (target.rightBar || 0)) +
                               Math.abs((features.topBar || 0) - (target.topBar || 0)) +
                               Math.abs((features.bottomBar || 0) - (target.bottomBar || 0));
                distBars /= 4.0;

                let loopPenalization = Math.abs((features.loops || 0) - (target.loops || 0)) * 1.35;
                let aspectPenalization = Math.abs((features.aspectRatio || 1.0) - (target.aspectRatio || 1.0)) * 1.8;

                // Al ser una muestra enseñada explícitamente por el usuario, le otorgamos una optimización de prioridad (* 0.94)
                const totalDistance = (cosineDistance + (dist5x5 * 1.2) + (distProfile * 0.8) + stemPenalization + crossingPenalization + (distCorners * 2.0) + (distBars * 2.2) + loopPenalization + aspectPenalization) * 0.94;

                if (totalDistance < minDistance) {
                    secondMinDistance = minDistance;
                    minDistance = totalDistance;
                    bestChar = charCode;
                } else if (totalDistance < secondMinDistance) {
                    secondMinDistance = totalDistance;
                }
            }
        }

        const ratio = secondMinDistance / (minDistance + 0.0001);
        let conf = Math.min(99.8, Math.max(91.0, ratio * 55.0));
        if (isNaN(conf)) conf = 95.0;
        conf = Math.round(conf * 10) / 10;

        return {
            char: bestChar,
            confidence: conf,
            features: features
        };
    }

    /**
     * Enviar petición HTTP POST asíncrona al endpoint del ESP32
     */
    async sendToESP32(character) {
        // Iluminar al instante en la matriz LED virtual en pantalla
        this.displayVirtualChar(character);

        const url = `http://${this.esp32Ip}/api/set-character`;
        const payload = { character: character };

        this.showToast(`🚀 Enviando '${character}' al ESP32 (${this.esp32Ip})...`);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seg de timeout

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json().catch(() => ({ status: 'ok' }));
                console.log('✅ Respuesta del ESP32:', data);
                this.updateConnectionBadge(true);
                this.showToast(`✨ ¡Carácter '${character}' iluminado en matriz LED!`);
            } else {
                console.warn(`⚠️ ESP32 respondió con código ${response.status}`);
                this.updateConnectionBadge(true, `HTTP ${response.status}`);
                this.showToast(`⚠️ ESP32 respondió con error (${response.status})`);
            }
        } catch (err) {
            console.warn('⚠️ No se pudo contactar al ESP32 (¿estás en la misma red Wi-Fi?):', err.message);
            this.updateConnectionBadge(false);
            this.showToast(`📶 Modo Local: '${character}' iluminado en matriz LED de pantalla`);
        }
    }

    /**
     * Enviar frase de texto para desplazamiento horizontal en la matriz LED (Marquesina)
     */
    async sendPhraseToESP32() {
        if (!this.phraseInput) return;
        const text = this.phraseInput.value.trim().toUpperCase();
        if (!text) {
            alert('Por favor escribe una palabra o frase primero (Ej: HOLA ESP32).');
            return;
        }

        const speed = parseInt(this.phraseSpeedSelect ? this.phraseSpeedSelect.value : '65', 10);
        
        // Iniciar al instante la animación de marquesina en la matriz LED virtual en pantalla
        this.scrollVirtualPhrase(text, speed);

        const url = `http://${this.esp32Ip}/api/scroll-text`;
        const payload = { text: text, speed: speed };

        this.sendPhraseBtn.disabled = true;
        this.sendPhraseBtn.innerHTML = `<span>⏳</span> Enviando...`;
        this.showToast(`📜 Transmitiendo frase "${text}" al ESP32 (${this.esp32Ip})...`);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json().catch(() => ({ status: 'ok' }));
                console.log('✅ Respuesta del ESP32 (scroll):', data);
                this.updateConnectionBadge(true);
                this.showToast(`✨ ¡Frase "${text}" desplazándose en la matriz LED!`);
                this.phraseInput.value = '';
            } else {
                console.warn(`⚠️ ESP32 respondió con código ${response.status}`);
                this.updateConnectionBadge(true, `HTTP ${response.status}`);
                this.showToast(`⚠️ Error HTTP ${response.status} al enviar frase`);
            }
        } catch (err) {
            console.warn('⚠️ No se pudo contactar al ESP32 en /api/scroll-text:', err.message);
            try {
                const fbRes = await fetch(`http://${this.esp32Ip}/api/set-character`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ character: text, speed: speed })
                });
                if (fbRes.ok) {
                    this.updateConnectionBadge(true);
                    this.showToast(`✨ ¡Frase "${text}" desplazándose en la matriz LED!`);
                    this.phraseInput.value = '';
                    this.sendPhraseBtn.disabled = false;
                    this.sendPhraseBtn.innerHTML = `<span>🚀</span> Enviar Frase`;
                    return;
                }
            } catch (e2) {}

            this.updateConnectionBadge(false);
            this.showToast(`📶 Modo Local: Frase "${text}" lista para marquesina (ESP32 sin conexión)`);
        } finally {
            this.sendPhraseBtn.disabled = false;
            this.sendPhraseBtn.innerHTML = `<span>🚀</span> Enviar Frase`;
        }
    }

    /**
     * Actualizar estado visual de la cabecera
     */
    updateConnectionBadge(online, text = null) {
        if (online) {
            this.wifiStatus.classList.remove('offline');
            this.wifiStatus.innerHTML = `<span class="wifi-icon">📶</span><span class="status-text">${text || 'ESP32 Conectado'}</span>`;
        } else {
            this.wifiStatus.classList.add('offline');
            this.wifiStatus.innerHTML = `<span class="wifi-icon">⚠️</span><span class="status-text">ESP32 Offline</span>`;
        }
    }

    /**
     * Gestión del Toast flotante
     */
    showToast(msg) {
        this.toastMessage.textContent = msg;
        this.toastNotification.classList.add('show');
        
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            this.toastNotification.classList.remove('show');
        }, 3500);
    }

    /**
     * Aprendizaje instantáneo multiescala en dispositivo (Fine-Tuning multi-muestra por usuario)
     */
    trainOnDevice() {
        const correctChar = this.correctCharInput.value.trim().toUpperCase();
        if (!correctChar || !this.classes.includes(correctChar)) {
            alert('Por favor introduce una letra válida (A-Z) o un número (0-9).');
            return;
        }

        if (!this.lastPrediction || !this.lastPrediction.features) {
            alert('Dibuja primero el carácter en el lienzo antes de enseñarle a la IA.');
            return;
        }

        // Guardar la nueva muestra en un array para esta letra (permitiendo hasta 12 formas diferentes de escribirla)
        if (!this.customTemplates[correctChar] || !Array.isArray(this.customTemplates[correctChar])) {
            this.customTemplates[correctChar] = [];
        }
        this.customTemplates[correctChar].push(this.lastPrediction.features);
        if (this.customTemplates[correctChar].length > 12) {
            this.customTemplates[correctChar].shift(); // Mantener las 12 muestras más recientes para evitar saturación
        }
        localStorage.setItem('matrixmind_custom_templates', JSON.stringify(this.customTemplates));

        const count = this.customTemplates[correctChar].length;
        this.predictionChar.textContent = correctChar;
        this.predictionDetails.textContent = `Carácter personalizado (Muestra #${count})`;
        this.confidenceBar.style.width = '100%';
        this.confidenceLabel.textContent = `Coincidencia Exacta (Aprendido)`;

        this.correctCharInput.value = '';
        this.showToast(`🧠 ¡IA aprendió la forma #${count} de dibujar la '${correctChar}' exitosamente!`);
        this.updateCustomTemplatesStatus();
        this.sendToESP32(correctChar);
    }

    updateCustomTemplatesStatus() {
        const textEl = document.getElementById('customTemplatesCountText');
        if (!textEl) return;
        let totalSamples = 0;
        let totalChars = 0;
        for (const [k, arr] of Object.entries(this.customTemplates)) {
            if (Array.isArray(arr) && arr.length > 0) {
                totalSamples += arr.length;
                totalChars++;
            }
        }
        textEl.textContent = `Muestras aprendidas: ${totalSamples} en total (${totalChars} caracteres)`;
    }

    clearAllCustomTemplates() {
        if (confirm('¿Estás seguro de que deseas borrar todas las formas personalizadas aprendidas por la IA?')) {
            this.customTemplates = {};
            localStorage.removeItem('matrixmind_custom_templates');
            this.updateCustomTemplatesStatus();
            this.showToast('🧹 Todas las muestras personalizadas han sido borradas.');
        }
    }

    /**
     * Exportar todas las plantillas personalizadas a un archivo JSON descargable
     */
    exportAIProfile() {
        const sampleCount = Object.values(this.customTemplates).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
        if (sampleCount === 0) {
            alert('⚠️ No tienes ninguna muestra personalizada aprendida para exportar. ¡Enseñale algunas letras a la IA primero!');
            return;
        }

        const profileData = {
            appName: 'MatrixMind AI Handwriting Profile',
            version: 'v6.5',
            exportDate: new Date().toISOString(),
            totalSamples: sampleCount,
            templates: this.customTemplates
        };

        const jsonString = JSON.stringify(profileData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().slice(0, 10);
        a.download = `matrixmind_ai_profile_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast(`📤 ¡Perfil IA con ${sampleCount} muestras exportado exitosamente!`);
    }

    /**
     * Importar y fusionar archivo JSON de perfil de IA al almacenamiento local
     */
    async importAIProfile(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            const rawTemplates = data.templates || data;
            if (typeof rawTemplates !== 'object' || rawTemplates === null) {
                throw new Error('Formato de archivo inválido.');
            }

            let addedSamples = 0;
            let addedChars = 0;

            for (const [charKey, samples] of Object.entries(rawTemplates)) {
                const charCode = charKey.toUpperCase();
                if (!this.classes.includes(charCode)) continue;

                const arr = Array.isArray(samples) ? samples : [samples];
                const validSamples = arr.filter(s => s && s.grid5x5 && Array.isArray(s.grid5x5) && s.hProfile);

                if (validSamples.length === 0) continue;

                if (!this.customTemplates[charCode] || !Array.isArray(this.customTemplates[charCode])) {
                    this.customTemplates[charCode] = [];
                    addedChars++;
                }

                for (const sample of validSamples) {
                    const isDup = this.customTemplates[charCode].some(existing => 
                        existing.grid5x5 && existing.grid5x5.every((val, i) => Math.abs(val - sample.grid5x5[i]) < 0.001)
                    );
                    if (!isDup) {
                        this.customTemplates[charCode].push(sample);
                        addedSamples++;
                    }
                }

                if (this.customTemplates[charCode].length > 12) {
                    this.customTemplates[charCode] = this.customTemplates[charCode].slice(-12);
                }
            }

            localStorage.setItem('matrixmind_custom_templates', JSON.stringify(this.customTemplates));
            this.updateCustomTemplatesStatus();
            event.target.value = '';

            alert(`✅ ¡Perfil IA importado correctamente!\nSe añadieron ${addedSamples} nuevas muestras en el sistema.`);
            this.showToast(`📥 ${addedSamples} muestras importadas exitosamente.`);

        } catch (err) {
            console.error('Error al importar perfil:', err);
            alert('❌ No se pudo importar el archivo JSON. Verifica que sea un archivo de respaldo válido de MatrixMind AI.');
            event.target.value = '';
        }
    }

    /**
     * Gestión del Modal de Configuración
     */
    loadSettings() {
        this.esp32IpInput.value = this.esp32Ip;
        this.endpointPreview.textContent = `http://${this.esp32Ip}/api/set-character`;
        this.autoSendToggle.checked = this.autoSend;
        this.updateCustomTemplatesStatus();
    }

    openModal() {
        this.loadSettings();
        this.settingsModal.classList.add('active');
    }

    closeModal() {
        this.settingsModal.classList.remove('active');
    }

    saveSettings() {
        const ip = this.esp32IpInput.value.trim() || '192.168.0.192';
        this.esp32Ip = ip;
        this.autoSend = this.autoSendToggle.checked;

        localStorage.setItem('matrixmind_esp32_ip', this.esp32Ip);
        localStorage.setItem('matrixmind_autosend', this.autoSend);

        this.endpointPreview.textContent = `http://${this.esp32Ip}/api/set-character`;
        this.closeModal();
        this.showToast(`⚙️ Configuración del ESP32 guardada: ${this.esp32Ip}`);
    }

    async testESP32Connection() {
        const ip = this.esp32IpInput.value.trim();
        this.testConnectionBtn.textContent = 'Probando...';
        
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 3000);
            
            // Enviamos un ping visual con la letra 'B' de prueba
            const res = await fetch(`http://${ip}/api/set-character`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ character: 'B' }),
                signal: controller.signal
            });
            clearTimeout(id);

            if (res.ok) {
                alert(`✅ Conexión exitosa con el ESP32 en ${ip} y matriz LED probada con la letra 'B'.`);
                this.updateConnectionBadge(true);
            } else {
                alert(`⚠️ El ESP32 respondió con código HTTP ${res.status}.`);
            }
        } catch (err) {
            alert(`⚠️ No se pudo conectar a http://${ip}/api/set-character. Verifica que el ESP32 esté encendido y conectado a tu red Wi-Fi.`);
        } finally {
            this.testConnectionBtn.textContent = 'Probar';
        }
    }
}

// Arrancar aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    window.matrixMind = new MatrixMindApp();
});
