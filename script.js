// ============================================
// NASA-CORE.js - 120FPS CINEMATIC ENGINE
// Inspired by NASA Horizon Design System
// ============================================

"use strict";

// NASA Performance Monitoring System
class NASA_PerformanceMonitor {
    constructor() {
        this.fps = 120;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.frameTimes = [];
        this.isMonitoring = false;
        this.performanceLog = [];
        this.thresholds = {
            fpsWarning: 55,
            fpsCritical: 30,
            memoryWarning: 0.85,
            renderWarning: 16 // ms
        };
        
        this.initPerformanceObserver();
    }
    
    initPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                // Monitor long tasks
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 50) {
                            console.warn('NASA Performance: Long task detected', entry);
                            this.triggerOptimization();
                        }
                    }
                });
                
                observer.observe({ entryTypes: ['longtask'] });
                
                // Monitor memory
                if ('memory' in performance) {
                    setInterval(() => this.checkMemory(), 10000);
                }
            } catch (e) {
                console.warn('NASA Performance Observer not supported');
            }
        }
    }
    
    startMonitoring() {
        this.isMonitoring = true;
        this.performanceLog = [];
        this.monitorFrame();
        
        // Initialize Web Vitals monitoring
        if ('webVitals' in window) {
            import('https://unpkg.com/web-vitals?module').then(({ getCLS, getFID, getLCP, getFCP, getTTFB }) => {
                getCLS(console.log);
                getFID(console.log);
                getLCP(console.log);
                getFCP(console.log);
                getTTFB(console.log);
            });
        }
    }
    
    monitorFrame() {
        if (!this.isMonitoring) return;
        
        const now = performance.now();
        const delta = now - this.lastTime;
        
        this.frameCount++;
        this.frameTimes.push(delta);
        
        // Keep only last 120 frames (2 seconds at 60fps)
        if (this.frameTimes.length > 120) {
            this.frameTimes.shift();
        }
        
        // Calculate current FPS
        const avgFrameTime = this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length;
        this.fps = Math.round(1000 / avgFrameTime);
        
        // Update FPS display
        this.updateFPSDisplay();
        
        // Check performance thresholds
        this.checkPerformanceThresholds(this.fps);
        
        this.lastTime = now;
        requestAnimationFrame(() => this.monitorFrame());
    }
    
    checkPerformanceThresholds(currentFPS) {
        if (currentFPS < this.thresholds.fpsWarning) {
            this.triggerOptimization('medium');
            
            if (currentFPS < this.thresholds.fpsCritical) {
                this.triggerOptimization('high');
                console.warn(`NASA Critical Performance: ${currentFPS}FPS`);
            }
        }
    }
    
    checkMemory() {
        const memory = performance.memory;
        const usedJSHeapSize = memory.usedJSHeapSize;
        const totalJSHeapSize = memory.totalJSHeapSize;
        const memoryRatio = usedJSHeapSize / totalJSHeapSize;
        
        if (memoryRatio > this.thresholds.memoryWarning) {
            this.triggerGarbageCollection();
            console.warn(`NASA Memory Warning: ${Math.round(memoryRatio * 100)}% used`);
        }
    }
    
    triggerOptimization(level = 'low') {
        const optimizations = {
            low: ['reduce-particle-count', 'disable-backdrop-blur'],
            medium: ['reduce-animations', 'disable-parallax', 'reduce-shadows'],
            high: ['disable-all-animations', 'enable-lite-mode', 'reduce-quality']
        };
        
        optimizations[level].forEach(opt => {
            document.documentElement.classList.add(`perf-${opt}`);
        });
        
        // Log optimization
        this.logPerformanceEvent(`Optimization triggered: ${level}`);
    }
    
    triggerGarbageCollection() {
        if (window.gc) {
            window.gc();
        } else if (self.gc) {
            self.gc();
        }
        
        // Force collection in modern browsers
        try {
            if (window.CollectGarbage) {
                window.CollectGarbage();
            }
        } catch (e) {}
        
        this.logPerformanceEvent('Garbage collection triggered');
    }
    
    updateFPSDisplay() {
        const fpsElements = document.querySelectorAll('.monitor-value, .stat-value[data-stat="fps"]');
        fpsElements.forEach(el => {
            el.textContent = this.fps;
            
            // Color coding based on FPS
            if (this.fps >= 55) {
                el.style.color = 'var(--status-nominal)';
            } else if (this.fps >= 30) {
                el.style.color = 'var(--status-caution)';
            } else {
                el.style.color = 'var(--status-critical)';
            }
        });
    }
    
    logPerformanceEvent(message) {
        const event = {
            timestamp: Date.now(),
            fps: this.fps,
            message: message,
            memory: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize
            } : null
        };
        
        this.performanceLog.push(event);
        
        // Keep only last 100 events
        if (this.performanceLog.length > 100) {
            this.performanceLog.shift();
        }
        
        // Send to analytics if available
        if (window.nasaAnalytics) {
            window.nasaAnalytics.track('performance_event', event);
        }
    }
    
    getPerformanceReport() {
        return {
            averageFPS: Math.round(1000 / (this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length)),
            minFPS: Math.round(1000 / Math.max(...this.frameTimes)),
            events: this.performanceLog.length,
            memoryUsage: performance.memory ? 
                Math.round((performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100) : null
        };
    }
}

// NASA Animation Controller - 120FPS Optimized
class NASA_AnimationController {
    constructor() {
        this.animations = new Map();
        this.rafIds = new Map();
        this.timeScale = 1.0;
        this.isPaused = false;
        this.lastTimestamp = 0;
        this.deltaTime = 0;
        this.maxDelta = 0.1; // Prevent spiral of death
        this.animationCallbacks = [];
        this.physicsEnabled = true;
        
        this.initAnimationLoop();
    }
    
    initAnimationLoop() {
        const animate = (timestamp) => {
            if (!this.lastTimestamp) this.lastTimestamp = timestamp;
            
            // Calculate delta time with scaling
            this.deltaTime = Math.min((timestamp - this.lastTimestamp) / 1000, this.maxDelta) * this.timeScale;
            
            if (!this.isPaused) {
                // Update all animations
                this.updateAnimations(this.deltaTime);
                
                // Execute animation callbacks
                this.executeAnimationCallbacks(this.deltaTime, timestamp);
                
                // Update physics if enabled
                if (this.physicsEnabled) {
                    this.updatePhysics(this.deltaTime);
                }
            }
            
            this.lastTimestamp = timestamp;
            
            // Continue animation loop
            this.animationLoopId = requestAnimationFrame(animate);
        };
        
        this.animationLoopId = requestAnimationFrame(animate);
    }
    
    createAnimation(key, config) {
        const animation = {
            ...config,
            currentTime: 0,
            progress: 0,
            isPlaying: false,
            isComplete: false,
            reverse: false,
            yoyo: false,
            repeat: 0,
            repeatCount: 0,
            onUpdate: config.onUpdate || (() => {}),
            onComplete: config.onComplete || (() => {}),
            onStart: config.onStart || (() => {}),
            easing: this.getEasingFunction(config.easing || 'easeInOutQuad')
        };
        
        this.animations.set(key, animation);
        return key;
    }
    
    getEasingFunction(name) {
        const easingFunctions = {
            // NASA Mission Easing Functions
            easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
            easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
            easeOutElastic: (t) => {
                const c4 = (2 * Math.PI) / 3;
                return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
            },
            easeOutBounce: (t) => {
                const n1 = 7.5625;
                const d1 = 2.75;
                
                if (t < 1 / d1) {
                    return n1 * t * t;
                } else if (t < 2 / d1) {
                    return n1 * (t -= 1.5 / d1) * t + 0.75;
                } else if (t < 2.5 / d1) {
                    return n1 * (t -= 2.25 / d1) * t + 0.9375;
                } else {
                    return n1 * (t -= 2.625 / d1) * t + 0.984375;
                }
            },
            // NASA Launch Sequence Easing
            easeLaunch: (t) => 1 - Math.pow(1 - t, 3),
            easeOrbit: (t) => {
                return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            }
        };
        
        return easingFunctions[name] || easingFunctions.easeInOutQuad;
    }
    
    playAnimation(key) {
        const animation = this.animations.get(key);
        if (!animation) return;
        
        animation.isPlaying = true;
        animation.isComplete = false;
        animation.onStart();
    }
    
    updateAnimations(deltaTime) {
        this.animations.forEach((animation, key) => {
            if (!animation.isPlaying || animation.isComplete) return;
            
            // Update animation time
            animation.currentTime += deltaTime * (animation.reverse ? -1 : 1);
            
            // Calculate progress (0 to 1)
            animation.progress = Math.max(0, Math.min(1, animation.currentTime / animation.duration));
            
            // Apply easing
            const easedProgress = animation.easing(animation.progress);
            
            // Update animation values
            if (typeof animation.from === 'number' && typeof animation.to === 'number') {
                animation.currentValue = animation.from + (animation.to - animation.from) * easedProgress;
            } else if (Array.isArray(animation.from) && Array.isArray(animation.to)) {
                animation.currentValue = animation.from.map((fromVal, i) => 
                    fromVal + (animation.to[i] - fromVal) * easedProgress
                );
            }
            
            // Call update callback
            animation.onUpdate(animation.currentValue, easedProgress, animation);
            
            // Check if animation is complete
            if ((!animation.reverse && animation.progress >= 1) || 
                (animation.reverse && animation.progress <= 0)) {
                
                if (animation.yoyo) {
                    animation.reverse = !animation.reverse;
                    animation.currentTime = animation.reverse ? animation.duration : 0;
                } else if (animation.repeat > animation.repeatCount) {
                    animation.repeatCount++;
                    animation.currentTime = 0;
                    animation.progress = 0;
                } else {
                    animation.isComplete = true;
                    animation.isPlaying = false;
                    animation.onComplete();
                }
            }
        });
    }
    
    executeAnimationCallbacks(deltaTime, timestamp) {
        this.animationCallbacks.forEach((callback, index) => {
            try {
                callback(deltaTime, timestamp);
            } catch (error) {
                console.error('NASA Animation Callback Error:', error);
                this.animationCallbacks.splice(index, 1);
            }
        });
    }
    
    updatePhysics(deltaTime) {
        // Update particle systems
        document.querySelectorAll('.particle-system').forEach(system => {
            this.updateParticleSystem(system, deltaTime);
        });
        
        // Update parallax elements
        this.updateParallax(deltaTime);
    }
    
    updateParticleSystem(system, deltaTime) {
        const particles = system.querySelectorAll('.particle');
        particles.forEach(particle => {
            const speed = parseFloat(particle.dataset.speed) || 1;
            const x = parseFloat(particle.dataset.x) || 0;
            const y = parseFloat(particle.dataset.y) || 0;
            
            particle.dataset.x = x + (Math.random() - 0.5) * speed * deltaTime * 100;
            particle.dataset.y = y + (Math.random() - 0.5) * speed * deltaTime * 100;
            
            particle.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        });
    }
    
    updateParallax(deltaTime) {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        const scrollY = window.scrollY;
        
        parallaxElements.forEach(element => {
            const speed = parseFloat(element.dataset.parallaxSpeed) || 0.5;
            const offset = parseFloat(element.dataset.parallaxOffset) || 0;
            const direction = element.dataset.parallaxDirection || 'vertical';
            
            let translateValue;
            if (direction === 'vertical') {
                translateValue = scrollY * speed + offset;
                element.style.transform = `translate3d(0, ${translateValue}px, 0)`;
            } else if (direction === 'horizontal') {
                translateValue = scrollY * speed + offset;
                element.style.transform = `translate3d(${translateValue}px, 0, 0)`;
            }
        });
    }
    
    addAnimationCallback(callback) {
        this.animationCallbacks.push(callback);
        return this.animationCallbacks.length - 1;
    }
    
    removeAnimationCallback(index) {
        this.animationCallbacks.splice(index, 1);
    }
    
    pauseAllAnimations() {
        this.isPaused = true;
        this.rafIds.forEach(id => cancelAnimationFrame(id));
    }
    
    resumeAllAnimations() {
        this.isPaused = false;
        this.initAnimationLoop();
    }
    
    destroy() {
        cancelAnimationFrame(this.animationLoopId);
        this.rafIds.forEach(id => cancelAnimationFrame(id));
        this.animations.clear();
        this.rafIds.clear();
        this.animationCallbacks = [];
    }
}

// NASA Product Management System
class NASA_ProductManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentFilter = 'all';
        this.currentView = 'grid';
        this.productsPerPage = 12;
        this.currentPage = 1;
        this.sortBy = 'featured';
        this.cart = [];
        this.favorites = new Set();
        this.productObservers = [];
        
        this.initProducts();
        this.initIndexedDB();
    }
    
    initProducts() {
        // Sample NASA-inspired products
        this.products = [
            {
                id: 'artemis-telescope-001',
                name: 'Artemis Lunar Telescope Pro',
                price: 24999,
                category: 'telescope',
                mission: 'artemis',
                featured: true,
                image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564',
                description: 'Professional-grade telescope for lunar observation. Inspired by NASA Artemis mission specifications.',
                specs: {
                    aperture: '150mm',
                    focalLength: '1200mm',
                    weight: '8.5kg',
                    included: ['Eyepieces', 'Tripod', 'Solar Filter']
                },
                tags: ['lunar', 'professional', 'artemis', 'featured'],
                stock: 15,
                sku: 'NASA-ART-001'
            },
            {
                id: 'mars-rover-hoodie',
                name: 'Mars Rover Expedition Hoodie',
                price: 1899,
                category: 'apparel',
                mission: 'mars',
                featured: true,
                image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7',
                description: 'Premium hoodie with Mars rover design. Thermal insulation for astronomical observations.',
                specs: {
                    material: 'Organic Cotton & Polyester',
                    sizes: ['S', 'M', 'L', 'XL'],
                    color: 'Mars Red'
                },
                tags: ['mars', 'apparel', 'expedition', 'featured'],
                stock: 42,
                sku: 'NASA-MAR-002'
            },
            {
                id: 'jpl-star-projector',
                name: 'JPL Star Projector Elite',
                price: 3599,
                category: 'accessories',
                mission: 'iss',
                featured: false,
                image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401',
                description: 'Advanced star projector with real-time celestial tracking. JPL calibration.',
                specs: {
                    projection: '360-degree',
                    stars: '5000+',
                    modes: ['Galaxy', 'Constellation', 'Planetary'],
                    power: 'USB-C'
                },
                tags: ['projector', 'jpl', 'accessory'],
                stock: 28,
                sku: 'NASA-JPL-003'
            },
            {
                id: 'gateway-space-journal',
                name: 'Gateway Space Observation Journal',
                price: 799,
                category: 'accessories',
                mission: 'gateway',
                featured: true,
                image: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d',
                description: 'Premium leather-bound journal for space observations. Moon to Mars architecture themed.',
                specs: {
                    pages: '200',
                    paper: 'Astronomical-grade',
                    includes: ['Star Charts', 'Observation Logs']
                },
                tags: ['journal', 'gateway', 'writing', 'featured'],
                stock: 56,
                sku: 'NASA-GTW-004'
            },
            {
                id: 'hubble-imaging-kit',
                name: 'Hubble Imaging Adapter Kit',
                price: 4999,
                category: 'imaging',
                mission: 'hubble',
                featured: false,
                image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
                description: 'Connect your DSLR to any telescope for astrophotography. Hubble inspired.',
                specs: {
                    compatibility: 'Universal',
                    cameraMount: 'T-ring',
                    weight: '450g'
                },
                tags: ['imaging', 'photography', 'hubble'],
                stock: 23,
                sku: 'NASA-HUB-005'
            }
        ];
        
        this.filteredProducts = [...this.products];
    }
    
    async initIndexedDB() {
        if ('indexedDB' in window) {
            try {
                const request = indexedDB.open('NASA_Store', 1);
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    // Create object stores
                    if (!db.objectStoreNames.contains('products')) {
                        db.createObjectStore('products', { keyPath: 'id' });
                    }
                    
                    if (!db.objectStoreNames.contains('cart')) {
                        db.createObjectStore('cart', { keyPath: 'id' });
                    }
                    
                    if (!db.objectStoreNames.contains('favorites')) {
                        db.createObjectStore('favorites', { keyPath: 'id' });
                    }
                    
                    if (!db.objectStoreNames.contains('orders')) {
                        db.createObjectStore('orders', { keyPath: 'orderId', autoIncrement: true });
                    }
                };
                
                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    this.loadFromIndexedDB();
                };
                
                request.onerror = (event) => {
                    console.error('NASA IndexedDB Error:', event.target.error);
                };
            } catch (error) {
                console.warn('NASA: IndexedDB not available, using localStorage');
                this.useLocalStorage();
            }
        }
    }
    
    async loadFromIndexedDB() {
        if (!this.db) return;
        
        try {
            // Load cart
            const cartTx = this.db.transaction('cart', 'readonly');
            const cartStore = cartTx.objectStore('cart');
            const cartRequest = cartStore.getAll();
            
            cartRequest.onsuccess = (event) => {
                this.cart = event.target.result || [];
                this.notifyObservers('cart-updated');
            };
            
            // Load favorites
            const favTx = this.db.transaction('favorites', 'readonly');
            const favStore = favTx.objectStore('favorites');
            const favRequest = favStore.getAll();
            
            favRequest.onsuccess = (event) => {
                const favorites = event.target.result || [];
                this.favorites = new Set(favorites.map(f => f.id));
                this.notifyObservers('favorites-updated');
            };
        } catch (error) {
            console.error('NASA: Failed to load from IndexedDB', error);
        }
    }
    
    useLocalStorage() {
        try {
            const savedCart = localStorage.getItem('nasa_cart');
            const savedFavorites = localStorage.getItem('nasa_favorites');
            
            if (savedCart) {
                this.cart = JSON.parse(savedCart);
                this.notifyObservers('cart-updated');
            }
            
            if (savedFavorites) {
                this.favorites = new Set(JSON.parse(savedFavorites));
                this.notifyObservers('favorites-updated');
            }
        } catch (error) {
            console.warn('NASA: Failed to load from localStorage', error);
        }
    }
    
    filterProducts(filter, mission = null) {
        this.currentFilter = filter;
        
        if (filter === 'all' && !mission) {
            this.filteredProducts = [...this.products];
        } else {
            this.filteredProducts = this.products.filter(product => {
                const matchesFilter = filter === 'all' || product.category === filter;
                const matchesMission = !mission || product.mission === mission;
                return matchesFilter && matchesMission;
            });
        }
        
        // Apply sorting
        this.sortProducts(this.sortBy);
        
        this.notifyObservers('products-filtered');
    }
    
    sortProducts(sortBy) {
        this.sortBy = sortBy;
        
        this.filteredProducts.sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return a.price - b.price;
                case 'price-high':
                    return b.price - a.price;
                case 'featured':
                    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
                case 'newest':
                    return (b.id || '').localeCompare(a.id || '');
                default:
                    return 0;
            }
        });
        
        this.notifyObservers('products-sorted');
    }
    
    searchProducts(query) {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        this.filteredProducts = this.products.filter(product => {
            const searchString = `
                ${product.name} 
                ${product.description} 
                ${product.category} 
                ${product.mission} 
                ${product.tags.join(' ')}
            `.toLowerCase();
            
            return searchTerms.every(term => searchString.includes(term));
        });
        
        this.notifyObservers('products-searched');
    }
    
    getProductById(id) {
        return this.products.find(product => product.id === id);
    }
    
    addToCart(productId, quantity = 1, size = null) {
        const product = this.getProductById(productId);
        if (!product) return false;
        
        const existingItem = this.cart.find(item => item.id === productId && item.size === size);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.cart.push({
                id: productId,
                name: product.name,
                price: product.price,
                quantity: quantity,
                size: size,
                image: product.image,
                sku: product.sku
            });
        }
        
        this.saveCart();
        this.notifyObservers('cart-updated');
        return true;
    }
    
    removeFromCart(productId, size = null) {
        const index = this.cart.findIndex(item => item.id === productId && item.size === size);
        
        if (index !== -1) {
            this.cart.splice(index, 1);
            this.saveCart();
            this.notifyObservers('cart-updated');
            return true;
        }
        
        return false;
    }
    
    updateCartQuantity(productId, quantity, size = null) {
        const item = this.cart.find(item => item.id === productId && item.size === size);
        
        if (item) {
            item.quantity = Math.max(0, quantity);
            
            if (item.quantity === 0) {
                this.removeFromCart(productId, size);
            } else {
                this.saveCart();
                this.notifyObservers('cart-updated');
            }
            
            return true;
        }
        
        return false;
    }
    
    saveCart() {
        if (this.db) {
            try {
                const tx = this.db.transaction('cart', 'readwrite');
                const store = tx.objectStore('cart');
                
                // Clear and re-add all items
                store.clear();
                this.cart.forEach(item => store.put(item));
            } catch (error) {
                console.error('NASA: Failed to save cart to IndexedDB', error);
            }
        } else {
            localStorage.setItem('nasa_cart', JSON.stringify(this.cart));
        }
    }
    
    toggleFavorite(productId) {
        if (this.favorites.has(productId)) {
            this.favorites.delete(productId);
        } else {
            this.favorites.add(productId);
        }
        
        this.saveFavorites();
        this.notifyObservers('favorites-updated');
    }
    
    saveFavorites() {
        const favoritesArray = Array.from(this.favorites);
        
        if (this.db) {
            try {
                const tx = this.db.transaction('favorites', 'readwrite');
                const store = tx.objectStore('favorites');
                
                store.clear();
                favoritesArray.forEach(id => store.put({ id }));
            } catch (error) {
                console.error('NASA: Failed to save favorites to IndexedDB', error);
            }
        } else {
            localStorage.setItem('nasa_favorites', JSON.stringify(favoritesArray));
        }
    }
    
    calculateCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    getCartCount() {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }
    
    subscribe(observer) {
        this.productObservers.push(observer);
        return () => {
            const index = this.productObservers.indexOf(observer);
            if (index > -1) this.productObservers.splice(index, 1);
        };
    }
    
    notifyObservers(event) {
        this.productObservers.forEach(observer => {
            try {
                observer(event, this);
            } catch (error) {
                console.error('NASA Product Observer Error:', error);
            }
        });
    }
    
    getPagedProducts(page = 1) {
        this.currentPage = page;
        const start = (page - 1) * this.productsPerPage;
        const end = start + this.productsPerPage;
        return this.filteredProducts.slice(start, end);
    }
    
    getTotalPages() {
        return Math.ceil(this.filteredProducts.length / this.productsPerPage);
    }
}

// NASA Mission Control Interface
class NASA_MissionControl {
    constructor() {
        this.currentMission = 'artemis';
        this.missionData = {
            artemis: {
                name: 'Artemis Program',
                status: 'active',
                phase: 'Phase II',
                nextLaunch: '2025-12-01',
                progress: 65,
                description: 'Returning humans to the Moon and establishing sustainable lunar exploration.'
            },
            mars: {
                name: 'Mars Campaign',
                status: 'planning',
                phase: 'MAT Phase',
                nextLaunch: '2030-07-15',
                progress: 30,
                description: 'Preparing for human missions to Mars with robotic precursors.'
            },
            iss: {
                name: 'International Space Station',
                status: 'operational',
                phase: 'Expedition 68',
                nextLaunch: '2024-03-15',
                progress: 95,
                description: 'Orbital laboratory for scientific research and technology development.'
            },
            gateway: {
                name: 'Lunar Gateway',
                status: 'development',
                phase: 'Assembly Phase',
                nextLaunch: '2026-11-01',
                progress: 45,
                description: 'Lunar orbital platform for deep space exploration.'
            }
        };
        
        this.liveFeed = [];
        this.missionTimers = new Map();
        this.initMissionControl();
    }
    
    initMissionControl() {
        this.startLiveFeed();
        this.startMissionTimers();
        this.initWebSocket();
    }
    
    startLiveFeed() {
        // Simulate live mission updates
        const missionUpdates = [
            "Artemis III landing sites under evaluation",
            "ISS completes 145,678th orbit",
            "Mars Sample Return mission design review complete",
            "JPL releases new exoplanet data archive",
            "Lunar Gateway propulsion module testing",
            "Space Launch System core stage assembly",
            "Hubble Space Telescope maintenance completed",
            "James Webb Telescope new discoveries",
            "Commercial Crew Program milestones achieved",
            "Space weather monitoring alert system updated"
        ];
        
        // Add initial updates
        for (let i = 0; i < 3; i++) {
            this.addLiveFeedUpdate(missionUpdates[i]);
        }
        
        // Simulate new updates every 30-60 seconds
        setInterval(() => {
            const randomUpdate = missionUpdates[Math.floor(Math.random() * missionUpdates.length)];
            this.addLiveFeedUpdate(randomUpdate);
        }, 30000 + Math.random() * 30000);
    }
    
    addLiveFeedUpdate(text, mission = null) {
        const update = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            text: text,
            mission: mission || this.getRandomMission(),
            type: 'info'
        };
        
        this.liveFeed.unshift(update);
        
        // Keep only last 50 updates
        if (this.liveFeed.length > 50) {
            this.liveFeed.pop();
        }
        
        // Update UI
        this.updateLiveFeedDisplay();
        
        return update;
    }
    
    updateLiveFeedDisplay() {
        const feedContainer = document.querySelector('.feed-content');
        if (!feedContainer) return;
        
        // Show only last 5 updates
        const recentUpdates = this.liveFeed.slice(0, 5);
        
        feedContainer.innerHTML = recentUpdates.map(update => `
            <div class="feed-item" data-mission="${update.mission}">
                <span class="feed-time">${this.formatMissionTime(update.timestamp)}</span>
                <span class="feed-text">${update.text}</span>
            </div>
        `).join('');
    }
    
    formatMissionTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `T+00:${diffMins.toString().padStart(2, '0')}:00`;
        
        const diffHours = Math.floor(diffMins / 60);
        return `T+${diffHours.toString().padStart(2, '0')}:${(diffMins % 60).toString().padStart(2, '0')}:00`;
    }
    
    startMissionTimers() {
        Object.keys(this.missionData).forEach(mission => {
            this.startMissionTimer(mission);
        });
    }
    
    startMissionTimer(mission) {
        const timerId = setInterval(() => {
            this.updateMissionProgress(mission);
        }, 5000);
        
        this.missionTimers.set(mission, timerId);
    }
    
    updateMissionProgress(mission) {
        const data = this.missionData[mission];
        
        // Simulate progress changes
        if (data.status === 'active' || data.status === 'development') {
            const change = (Math.random() - 0.3) * 0.5; // -0.15 to +0.35
            data.progress = Math.max(0, Math.min(100, data.progress + change));
            
            // Update UI if element exists
            const progressElement = document.querySelector(`[data-mission="${mission}"] .mission-progress`);
            if (progressElement) {
                progressElement.style.width = `${data.progress}%`;
                progressElement.textContent = `${Math.round(data.progress)}%`;
            }
        }
    }
    
    initWebSocket() {
        // Simulate WebSocket connection for real-time updates
        if (window.WebSocket) {
            try {
                // In production, this would connect to actual mission control server
                // this.ws = new WebSocket('wss://mission-control.nasa.gov/stream');
                
                // For demo, simulate WebSocket behavior
                this.simulateWebSocket();
            } catch (error) {
                console.warn('NASA: WebSocket simulation enabled');
                this.simulateWebSocket();
            }
        }
    }
    
    simulateWebSocket() {
        // Simulate receiving mission updates
        setInterval(() => {
            const events = [
                { type: 'telemetry', mission: 'artemis', data: { altitude: 384400, velocity: 3680 }},
                { type: 'status', mission: 'iss', data: { crew: 7, oxygen: 95, power: 88 }},
                { type: 'alert', mission: 'mars', data: { event: 'dust_storm', level: 'moderate' }},
                { type: 'science', mission: 'hubble', data: { observation: 'exoplanet_atmosphere', status: 'complete' }}
            ];
            
            const event = events[Math.floor(Math.random() * events.length)];
            this.handleMissionEvent(event);
        }, 15000);
    }
    
    handleMissionEvent(event) {
        switch (event.type) {
            case 'telemetry':
                this.updateTelemetryDisplay(event.mission, event.data);
                break;
            case 'status':
                this.updateStatusDisplay(event.mission, event.data);
                break;
            case 'alert':
                this.showMissionAlert(event.mission, event.data);
                break;
            case 'science':
                this.addScienceUpdate(event.mission, event.data);
                break;
        }
    }
    
    updateTelemetryDisplay(mission, data) {
        // Update telemetry displays in UI
        const telemetryElements = document.querySelectorAll(`[data-telemetry="${mission}"]`);
        telemetryElements.forEach(element => {
            const metric = element.dataset.metric;
            if (data[metric]) {
                element.textContent = data[metric];
                element.classList.add('telemetry-updated');
                
                setTimeout(() => {
                    element.classList.remove('telemetry-updated');
                }, 1000);
            }
        });
    }
    
    showMissionAlert(mission, data) {
        const alert = {
            mission: mission,
            level: data.level || 'info',
            message: `${mission.toUpperCase()}: ${data.event}`,
            timestamp: new Date().toISOString()
        };
        
        this.showNotification(alert.message, alert.level);
        this.addLiveFeedUpdate(alert.message, mission);
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `mission-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">⚠️</div>
                <div class="notification-text">${message}</div>
            </div>
            <button class="notification-close">×</button>
        `;
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        // Add to notification container
        const container = document.querySelector('.notification-container') || this.createNotificationContainer();
        container.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.add('notification-fade-out');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
    
    createNotificationContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }
    
    getRandomMission() {
        const missions = Object.keys(this.missionData);
        return missions[Math.floor(Math.random() * missions.length)];
    }
    
    switchMission(mission) {
        if (this.missionData[mission]) {
            this.currentMission = mission;
            
            // Update UI
            document.querySelectorAll('.mission-control').forEach(element => {
                element.dataset.currentMission = mission;
            });
            
            // Trigger mission change event
            this.notifyMissionChange(mission);
            
            return true;
        }
        return false;
    }
    
    notifyMissionChange(mission) {
        const event = new CustomEvent('nasa-mission-change', {
            detail: { mission, data: this.missionData[mission] }
        });
        window.dispatchEvent(event);
    }
    
    getMissionData(mission = null) {
        return mission ? this.missionData[mission] : this.missionData[this.currentMission];
    }
    
    destroy() {
        this.missionTimers.forEach(timer => clearInterval(timer));
        this.missionTimers.clear();
        
        if (this.ws) {
            this.ws.close();
        }
    }
}

// NASA Order System with WhatsApp Integration
class NASA_OrderSystem {
    constructor() {
        this.whatsappNumber = '+919957811508';
        this.orderQueue = [];
        this.orderHistory = [];
        this.currentOrder = null;
        this.orderTemplates = {
            basic: `Hello, I want to place an order:
Product: {product}
Size: {size}
Quantity: {quantity}
Address: {address}
Name: {name}`,
            
            detailed: `Hello ${this.getStoreName()}, I want to place an order:

📦 ORDER DETAILS:
Product: {product}
Price: {price}
Size: {size}
Quantity: {quantity}
Total: {total}

👤 CUSTOMER DETAILS:
Name: {name}
Address: {address}
Phone: {phone}

🆔 Order ID: {orderId}`,
            
            nasa: `🚀 MISSION ORDER TRANSMISSION
To: ${this.getStoreName()} Mission Control
From: {name}

📡 PAYLOAD SPECIFICATIONS:
Product: {product}
Mission: {mission}
Size: {size}
Quantity: {quantity}
Mass: {mass} kg
SKU: {sku}

📍 DESTINATION COORDINATES:
{address}

📞 COMMS FREQUENCY:
{phone}

🆔 MISSION ID: {orderId}
📊 TOTAL COST: {total}
⏱️ TRANSMISSION TIME: {timestamp}`
        };
        
        this.initOrderSystem();
    }
    
    initOrderSystem() {
        this.loadOrderHistory();
        this.initOrderForm();
    }
    
    getStoreName() {
        return 'arestopranav_.0p STORE';
    }
    
    createOrder(product, customer, options = {}) {
        const orderId = this.generateOrderId();
        const timestamp = new Date().toISOString();
        const total = product.price * options.quantity;
        
        const order = {
            id: orderId,
            timestamp: timestamp,
            product: {
                id: product.id,
                name: product.name,
                price: product.price,
                sku: product.sku,
                category: product.category,
                mission: product.mission
            },
            customer: {
                name: customer.name,
                address: customer.address,
                phone: customer.phone,
                email: customer.email
            },
            options: {
                size: options.size || null,
                quantity: options.quantity || 1,
                notes: options.notes || ''
            },
            total: total,
            status: 'pending',
            payment: {
                method: options.paymentMethod || 'whatsapp',
                status: 'pending'
            },
            shipping: {
                method: 'standard',
                estimatedDelivery: this.calculateDeliveryDate(),
                tracking: null
            }
        };
        
        this.currentOrder = order;
        this.orderQueue.push(order);
        
        // Save to history
        this.saveOrder(order);
        
        // Update UI
        this.updateOrderStatus();
        
        return order;
    }
    
    generateOrderId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `NASA-${timestamp}-${random}`.toUpperCase();
    }
    
    calculateDeliveryDate() {
        const date = new Date();
        date.setDate(date.getDate() + 5); // 5 days standard delivery
        return date.toISOString();
    }
    
    initOrderForm() {
        const orderForm = document.getElementById('order-form');
        if (orderForm) {
            orderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleOrderSubmit(e);
            });
        }
        
        // Initialize quantity controls
        this.initQuantityControls();
        
        // Initialize size selection
        this.initSizeSelection();
    }
    
    initQuantityControls() {
        document.querySelectorAll('.quantity-control').forEach(control => {
            const decreaseBtn = control.querySelector('[data-action="decrease"]');
            const increaseBtn = control.querySelector('[data-action="increase"]');
            const quantityDisplay = control.querySelector('.quantity-value');
            
            if (decreaseBtn && increaseBtn && quantityDisplay) {
                let quantity = parseInt(quantityDisplay.textContent) || 1;
                
                decreaseBtn.addEventListener('click', () => {
                    if (quantity > 1) {
                        quantity--;
                        quantityDisplay.textContent = quantity;
                        this.updateOrderSummary();
                    }
                });
                
                increaseBtn.addEventListener('click', () => {
                    if (quantity < 10) {
                        quantity++;
                        quantityDisplay.textContent = quantity;
                        this.updateOrderSummary();
                    }
                });
            }
        });
    }
    
    initSizeSelection() {
        document.querySelectorAll('.size-selector').forEach(selector => {
            const options = selector.querySelectorAll('.size-option');
            
            options.forEach(option => {
                option.addEventListener('click', () => {
                    options.forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    this.updateOrderSummary();
                });
            });
        });
    }
    
    handleOrderSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        // Validate form
        if (!this.validateOrderForm(formData)) {
            this.showValidationErrors();
            return;
        }
        
        // Get product data
        const productElement = document.querySelector('[data-product]');
        const productId = productElement?.dataset.product;
        const product = window.nasaProductManager?.getProductById(productId);
        
        if (!product) {
            this.showError('Product not found');
            return;
        }
        
        // Create customer object
        const customer = {
            name: formData.get('name'),
            address: formData.get('address'),
            phone: formData.get('phone'),
            email: formData.get('email')
        };
        
        // Get order options
        const quantity = parseInt(formData.get('quantity') || 1);
        const size = formData.get('size');
        const notes = formData.get('notes');
        
        // Create order
        const order = this.createOrder(product, customer, {
            quantity: quantity,
            size: size,
            notes: notes,
            paymentMethod: 'whatsapp'
        });
        
        // Send via WhatsApp
        this.sendOrderViaWhatsApp(order);
        
        // Show confirmation
        this.showOrderConfirmation(order);
    }
    
    validateOrderForm(formData) {
        const requiredFields = ['name', 'address', 'phone'];
        
        for (const field of requiredFields) {
            if (!formData.get(field)?.trim()) {
                return false;
            }
        }
        
        // Validate phone number
        const phone = formData.get('phone');
        if (!this.isValidPhoneNumber(phone)) {
            return false;
        }
        
        return true;
    }
    
    isValidPhoneNumber(phone) {
        // Basic phone validation for Indian numbers
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    }
    
    showValidationErrors() {
        this.showNotification('Please fill all required fields correctly', 'error');
        
        // Highlight invalid fields
        document.querySelectorAll('[required]').forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('invalid');
                
                field.addEventListener('input', () => {
                    if (field.value.trim()) {
                        field.classList.remove('invalid');
                    }
                }, { once: true });
            }
        });
    }
    
    sendOrderViaWhatsApp(order, template = 'nasa') {
        const messageTemplate = this.orderTemplates[template] || this.orderTemplates.nasa;
        
        // Format message
        const formattedMessage = this.formatWhatsAppMessage(order, messageTemplate);
        
        // Encode for URL
        const encodedMessage = encodeURIComponent(formattedMessage);
        
        // Create WhatsApp URL
        const whatsappUrl = `https://wa.me/${this.whatsappNumber}?text=${encodedMessage}`;
        
        // Open in new tab
        window.open(whatsappUrl, '_blank');
        
        // Log the order transmission
        this.logOrderTransmission(order, 'whatsapp');
        
        return whatsappUrl;
    }
    
    formatWhatsAppMessage(order, template) {
        const placeholders = {
            '{product}': order.product.name,
            '{price}': this.formatCurrency(order.product.price),
            '{size}': order.options.size || 'N/A',
            '{quantity}': order.options.quantity,
            '{address}': order.customer.address,
            '{name}': order.customer.name,
            '{phone}': order.customer.phone,
            '{total}': this.formatCurrency(order.total),
            '{orderId}': order.id,
            '{timestamp}': new Date().toLocaleString(),
            '{mission}': order.product.mission?.toUpperCase() || 'GENERAL',
            '{mass}': this.calculateProductMass(order.product),
            '{sku}': order.product.sku,
            '{store}': this.getStoreName()
        };
        
        let message = template;
        Object.keys(placeholders).forEach(key => {
            message = message.replace(key, placeholders[key]);
        });
        
        return message;
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    calculateProductMass(product) {
        // Estimate based on product category
        const massMap = {
            'telescope': 5.2,
            'apparel': 0.3,
            'accessories': 0.8,
            'imaging': 1.5
        };
        
        return massMap[product.category] || 1.0;
    }
    
    showOrderConfirmation(order) {
        const modal = document.getElementById('order-confirmation');
        if (!modal) return;
        
        // Populate confirmation details
        modal.querySelector('.order-id').textContent = order.id;
        modal.querySelector('.order-total').textContent = this.formatCurrency(order.total);
        modal.querySelector('.estimated-delivery').textContent = 
            new Date(order.shipping.estimatedDelivery).toLocaleDateString();
        
        // Show modal
        modal.classList.add('active');
        
        // Setup close button
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        // Setup WhatsApp button
        const whatsappBtn = modal.querySelector('.whatsapp-confirm');
        if (whatsappBtn) {
            whatsappBtn.href = this.sendOrderViaWhatsApp(order, 'detailed');
        }
    }
    
    updateOrderSummary() {
        const summaryElement = document.querySelector('.order-summary');
        if (!summaryElement) return;
        
        const quantity = parseInt(document.querySelector('.quantity-value')?.textContent || 1);
        const size = document.querySelector('.size-option.active')?.textContent || 'M';
        const productElement = document.querySelector('[data-product]');
        const productId = productElement?.dataset.product;
        const product = window.nasaProductManager?.getProductById(productId);
        
        if (product) {
            const total = product.price * quantity;
            
            summaryElement.innerHTML = `
                <div class="summary-item">
                    <span>Product:</span>
                    <span>${product.name}</span>
                </div>
                <div class="summary-item">
                    <span>Size:</span>
                    <span>${size}</span>
                </div>
                <div class="summary-item">
                    <span>Quantity:</span>
                    <span>${quantity}</span>
                </div>
                <div class="summary-item total">
                    <span>Total:</span>
                    <span>${this.formatCurrency(total)}</span>
                </div>
            `;
        }
    }
    
    updateOrderStatus() {
        const statusElement = document.querySelector('.order-status');
        if (!statusElement || !this.currentOrder) return;
        
        const statusConfig = {
            pending: { text: 'Awaiting Transmission', class: 'status-pending' },
            sent: { text: 'Transmission Sent', class: 'status-sent' },
            confirmed: { text: 'Mission Confirmed', class: 'status-confirmed' },
            processing: { text: 'Payload Processing', class: 'status-processing' },
            shipped: { text: 'In Transit', class: 'status-shipped' },
            delivered: { text: 'Mission Complete', class: 'status-delivered' }
        };
        
        const config = statusConfig[this.currentOrder.status] || statusConfig.pending;
        
        statusElement.textContent = config.text;
        statusElement.className = `order-status ${config.class}`;
    }
    
    saveOrder(order) {
        this.orderHistory.push(order);
        
        // Save to localStorage
        try {
            const history = JSON.parse(localStorage.getItem('nasa_order_history') || '[]');
            history.unshift(order);
            
            // Keep only last 50 orders
            if (history.length > 50) {
                history.pop();
            }
            
            localStorage.setItem('nasa_order_history', JSON.stringify(history));
        } catch (error) {
            console.warn('NASA: Failed to save order history', error);
        }
    }
    
    loadOrderHistory() {
        try {
            const history = JSON.parse(localStorage.getItem('nasa_order_history') || '[]');
            this.orderHistory = history;
        } catch (error) {
            this.orderHistory = [];
        }
    }
    
    logOrderTransmission(order, method) {
        const log = {
            timestamp: new Date().toISOString(),
            orderId: order.id,
            method: method,
            status: 'transmitted'
        };
        
        console.log('NASA Order Transmission:', log);
        
        // Send to analytics if available
        if (window.nasaAnalytics) {
            window.nasaAnalytics.track('order_transmission', log);
        }
    }
    
    showNotification(message, type = 'info') {
        // Reuse mission control notification or create new
        if (window.nasaMissionControl) {
            window.nasaMissionControl.showNotification(message, type);
        } else {
            alert(message); // Fallback
        }
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    destroy() {
        this.orderQueue = [];
        this.currentOrder = null;
    }
}

// NASA User Interface Manager
class NASA_UIManager {
    constructor() {
        this.currentTheme = 'dark';
        this.animationsEnabled = true;
        this.soundEnabled = false;
        this.notificationsEnabled = true;
        this.uiState = {
            menuOpen: false,
            modalOpen: false,
            cartOpen: false,
            searchOpen: false
        };
        
        this.initUI();
        this.initEventListeners();
        this.initIntersectionObserver();
    }
    
    initUI() {
        // Apply theme
        this.applyTheme(this.currentTheme);
        
        // Initialize components
        this.initNavigation();
        this.initModals();
        this.initTooltips();
        this.initScrollAnimations();
        
        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.animationsEnabled = false;
            document.documentElement.classList.add('reduced-motion');
        }
    }
    
    initEventListeners() {
        // Theme toggle
        document.querySelectorAll('.theme-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => this.toggleTheme());
        });
        
        // Sound toggle
        document.querySelectorAll('.sound-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => this.toggleSound());
        });
        
        // Navigation
        document.querySelectorAll('.nav-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => this.toggleNavigation());
        });
        
        // Close modals on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
        
        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.handleResize(), 250);
        });
        
        // Handle scroll
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            this.handleScroll();
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.handleScrollEnd();
            }, 150);
        });
    }
    
    initIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.intersectionObserver = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('in-view');
                            
                            // Trigger animation based on data attributes
                            const animation = entry.target.dataset.animation;
                            if (animation && this.animationsEnabled) {
                                this.triggerAnimation(entry.target, animation);
                            }
                        }
                    });
                },
                {
                    root: null,
                    rootMargin: '50px',
                    threshold: 0.1
                }
            );
            
            // Observe all elements with data-observe attribute
            document.querySelectorAll('[data-observe]').forEach(element => {
                this.intersectionObserver.observe(element);
            });
        }
    }
    
    initNavigation() {
        const nav = document.querySelector('.nasa-navigation');
        if (!nav) return;
        
        // Mobile menu toggle
        const menuToggle = nav.querySelector('.mobile-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.uiState.menuOpen && !nav.contains(e.target)) {
                this.closeMobileMenu();
            }
        });
        
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    this.scrollToElement(targetElement);
                    
                    // Close mobile menu if open
                    if (this.uiState.menuOpen) {
                        this.closeMobileMenu();
                    }
                }
            });
        });
    }
    
    initModals() {
        // Close modals when clicking overlay
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('modal-close')) {
                    this.closeModal(modal);
                }
            });
        });
        
        // Close modals on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.uiState.modalOpen) {
                this.closeAllModals();
            }
        });
    }
    
    initTooltips() {
        if ('tippy' in window) {
            tippy('[data-tippy-content]', {
                theme: 'nasa',
                animation: 'scale',
                duration: 200,
                delay: [100, 0]
            });
        } else {
            // Fallback tooltip implementation
            this.initFallbackTooltips();
        }
    }
    
    initFallbackTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            const tooltipText = element.dataset.tooltip;
            
            element.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'nasa-tooltip';
                tooltip.textContent = tooltipText;
                
                document.body.appendChild(tooltip);
                
                // Position tooltip
                const rect = element.getBoundingClientRect();
                tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
                tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
                
                element.dataset.tooltipId = Date.now();
            });
            
            element.addEventListener('mouseleave', () => {
                document.querySelectorAll('.nasa-tooltip').forEach(tooltip => {
                    tooltip.remove();
                });
            });
        });
    }
    
    initScrollAnimations() {
        if (this.animationsEnabled) {
            // Add scroll-triggered animations
            document.querySelectorAll('[data-scroll-animation]').forEach(element => {
                element.dataset.observe = 'true';
            });
        }
    }
    
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.currentTheme);
        
        // Save preference
        localStorage.setItem('nasa_theme', this.currentTheme);
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('nasa-theme-change', {
            detail: { theme: this.currentTheme }
        }));
    }
    
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update UI elements
        document.querySelectorAll('.theme-toggle').forEach(toggle => {
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        });
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        
        // Update UI
        document.querySelectorAll('.sound-toggle').forEach(toggle => {
            const icon = toggle.querySelector('i');
            if (icon) {
                icon.className = this.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            }
        });
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('nasa-sound-toggle', {
            detail: { enabled: this.soundEnabled }
        }));
    }
    
    toggleNavigation() {
        if (this.uiState.menuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }
    
    openMobileMenu() {
        document.body.classList.add('menu-open');
        this.uiState.menuOpen = true;
        
        // Dispatch event
        window.dispatchEvent(new Event('nasa-menu-open'));
    }
    
    closeMobileMenu() {
        document.body.classList.remove('menu-open');
        this.uiState.menuOpen = false;
        
        // Dispatch event
        window.dispatchEvent(new Event('nasa-menu-close'));
    }
    
    toggleMobileMenu() {
        if (this.uiState.menuOpen) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }
    
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.classList.add('active');
        document.body.classList.add('modal-open');
        this.uiState.modalOpen = true;
        
        // Focus trap
        this.setupModalFocusTrap(modal);
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('nasa-modal-open', {
            detail: { modalId }
        }));
    }
    
    closeModal(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }
        
        if (!modal) return;
        
        modal.classList.remove('active');
        
        // Check if any other modals are open
        const openModals = document.querySelectorAll('.modal.active');
        if (openModals.length === 0) {
            document.body.classList.remove('modal-open');
            this.uiState.modalOpen = false;
        }
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('nasa-modal-close', {
            detail: { modalId: modal.id }
        }));
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            this.closeModal(modal);
        });
    }
    
    setupModalFocusTrap(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
        
        // Focus first element
        setTimeout(() => firstElement.focus(), 100);
    }
    
    handleResize() {
        const width = window.innerWidth;
        
        // Update UI based on screen size
        if (width < 768 && !this.uiState.menuOpen) {
            // Mobile optimizations
            document.documentElement.classList.add('mobile-view');
        } else {
            document.documentElement.classList.remove('mobile-view');
        }
        
        // Dispatch resize event
        window.dispatchEvent(new CustomEvent('nasa-resize', {
            detail: { width, height: window.innerHeight }
        }));
    }
    
    handleScroll() {
        const scrollY = window.scrollY;
        const scrollDirection = this.getScrollDirection();
        
        // Update navigation
        this.updateNavigationOnScroll(scrollY, scrollDirection);
        
        // Update progress indicators
        this.updateScrollProgress(scrollY);
        
        // Trigger scroll animations
        this.triggerScrollAnimations(scrollY);
    }
    
    handleScrollEnd() {
        // Remove scroll class after scrolling stops
        document.documentElement.classList.remove('scrolling');
    }
    
    getScrollDirection() {
        if (!this.lastScrollY) {
            this.lastScrollY = window.scrollY;
            return 'down';
        }
        
        const direction = window.scrollY > this.lastScrollY ? 'down' : 'up';
        this.lastScrollY = window.scrollY;
        
        return direction;
    }
    
    updateNavigationOnScroll(scrollY, direction) {
        const nav = document.querySelector('.nasa-navigation');
        if (!nav) return;
        
        if (scrollY > 100) {
            if (direction === 'down' && scrollY > this.lastScrollY + 50) {
                nav.classList.add('hidden');
            } else if (direction === 'up') {
                nav.classList.remove('hidden');
                nav.classList.add('scrolled');
            }
        } else {
            nav.classList.remove('scrolled', 'hidden');
        }
    }
    
    updateScrollProgress(scrollY) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
        
        // Update progress bar if exists
        const progressBar = document.querySelector('.scroll-progress');
        if (progressBar) {
            progressBar.style.width = `${scrollPercent}%`;
        }
        
        // Update scroll indicators
        document.querySelectorAll('[data-scroll-progress]').forEach(element => {
            element.style.setProperty('--scroll-progress', `${scrollPercent}%`);
        });
    }
    
    triggerScrollAnimations(scrollY) {
        // Trigger animations based on scroll position
        document.querySelectorAll('[data-scroll-trigger]').forEach(element => {
            const triggerPoint = parseInt(element.dataset.scrollTrigger) || 0;
            const offset = element.getBoundingClientRect().top + scrollY - window.innerHeight;
            
            if (scrollY > offset + triggerPoint) {
                const animation = element.dataset.scrollAnimation || 'fade-up';
                this.triggerAnimation(element, animation);
            }
        });
    }
    
    triggerAnimation(element, animation) {
        if (!this.animationsEnabled) return;
        
        element.classList.add(`animate-${animation}`);
        
        // Remove animation class after completion
        const duration = parseInt(element.dataset.animationDuration) || 1000;
        setTimeout(() => {
            element.classList.remove(`animate-${animation}`);
        }, duration);
    }
    
    scrollToElement(element, options = {}) {
        const defaultOptions = {
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest',
            offset: -80 // Account for fixed header
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        const targetPosition = element.offsetTop + finalOptions.offset;
        
        window.scrollTo({
            top: targetPosition,
            behavior: finalOptions.behavior
        });
    }
    
    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `nasa-toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">${this.getToastIcon(type)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">×</button>
        `;
        
        const container = document.querySelector('.toast-container') || this.createToastContainer();
        container.appendChild(toast);
        
        // Setup close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });
        
        // Auto-remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                this.removeToast(toast);
            }
        }, duration);
        
        return toast;
    }
    
    getToastIcon(type) {
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        return icons[type] || icons.info;
    }
    
    createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }
    
    removeToast(toast) {
        toast.classList.add('toast-fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }
    
    enableAnimations() {
        this.animationsEnabled = true;
        document.documentElement.classList.remove('reduced-motion');
    }
    
    disableAnimations() {
        this.animationsEnabled = false;
        document.documentElement.classList.add('reduced-motion');
    }
    
    destroy() {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        // Remove all event listeners
        this.cleanupEventListeners();
    }
    
    cleanupEventListeners() {
        // Implementation depends on how events were attached
        // In a production app, you'd track and remove specific listeners
    }
}

// NASA Main Application Controller
class NASA_Application {
    constructor() {
        this.modules = new Map();
        this.isInitialized = false;
        this.startTime = performance.now();
        
        // NASA Core Values
        this.missionStatement = "Enabling cosmic exploration through premium astronomy commerce";
        this.version = "1.0.0";
        this.build = "120fps-cinematic";
        
        // Initialize core systems
        this.initCoreSystems();
    }
    
    initCoreSystems() {
        try {
            // Initialize performance monitor first
            this.modules.set('performance', new NASA_PerformanceMonitor());
            
            // Initialize animation controller
            this.modules.set('animations', new NASA_AnimationController());
            
            // Initialize UI Manager
            this.modules.set('ui', new NASA_UIManager());
            
            // Initialize Product Manager
            this.modules.set('products', new NASA_ProductManager());
            
            // Initialize Mission Control
            this.modules.set('mission', new NASA_MissionControl());
            
            // Initialize Order System
            this.modules.set('orders', new NASA_OrderSystem());
            
            // Setup global error handling
            this.initErrorHandling();
            
            // Setup analytics
            this.initAnalytics();
            
            // Start performance monitoring
            this.modules.get('performance').startMonitoring();
            
            this.isInitialized = true;
            console.log(`🚀 NASA Application v${this.version} initialized in ${(performance.now() - this.startTime).toFixed(2)}ms`);
            
            // Dispatch initialization complete event
            window.dispatchEvent(new Event('nasa-init-complete'));
            
        } catch (error) {
            console.error('NASA Application failed to initialize:', error);
            this.handleInitError(error);
        }
    }
    
    initErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleError(event.error || event);
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason);
        });
        
        // NASA-specific error boundary
        this.setupErrorBoundary();
    }
    
    setupErrorBoundary() {
        // Wrap critical functions with error handling
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = (callback, delay, ...args) => {
            return originalSetTimeout(() => {
                try {
                    callback(...args);
                } catch (error) {
                    this.handleError(error);
                }
            }, delay);
        };
        
        // Similar for setInterval and requestAnimationFrame
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = (callback) => {
            return originalRAF((timestamp) => {
                try {
                    callback(timestamp);
                } catch (error) {
                    this.handleError(error);
                }
            });
        };
    }
    
    handleError(error) {
        const errorData = {
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        console.error('NASA Error:', errorData);
        
        // Send to error tracking service if available
        if (window.nasaAnalytics) {
            window.nasaAnalytics.track('error', errorData);
        }
        
        // Show user-friendly error message for critical errors
        if (this.isCriticalError(error)) {
            this.showErrorFallback();
        }
        
        return false; // Don't prevent default error handling
    }
    
    isCriticalError(error) {
        const criticalErrors = [
            'TypeError',
            'ReferenceError',
            'RangeError',
            'SyntaxError'
        ];
        
        return criticalErrors.some(errorType => error.name === errorType);
    }
    
    showErrorFallback() {
        // Create error overlay
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'nasa-error-overlay';
        errorOverlay.innerHTML = `
            <div class="error-content">
                <div class="error-icon">🚨</div>
                <h3>Mission Control Error</h3>
                <p>We've encountered a cosmic anomaly. Our engineers are working on it.</p>
                <button class="error-retry" onclick="location.reload()">Retry Mission</button>
                <button class="error-continue" onclick="this.parentElement.parentElement.remove()">Continue Anyway</button>
            </div>
        `;
        
        document.body.appendChild(errorOverlay);
    }
    
    handleInitError(error) {
        console.error('NASA Init Error:', error);
        
        // Attempt graceful degradation
        this.enableDegradedMode();
        
        // Show initialization error
        this.showToast('Application initialized with reduced capabilities', 'warning');
    }
    
    enableDegradedMode() {
        document.documentElement.classList.add('degraded-mode');
        
        // Disable heavy animations
        if (this.modules.has('animations')) {
            this.modules.get('animations').pauseAllAnimations();
        }
        
        // Disable non-essential features
        const performance = this.modules.get('performance');
        if (performance) {
            performance.triggerOptimization('high');
        }
    }
    
    initAnalytics() {
        // Initialize NASA Analytics if available
        if (typeof NASA_Analytics !== 'undefined') {
            this.modules.set('analytics', new NASA_Analytics());
        } else {
            // Basic analytics fallback
            this.setupBasicAnalytics();
        }
    }
    
    setupBasicAnalytics() {
        const analytics = {
            pageViews: 0,
            events: [],
            startTime: Date.now(),
            
            track: function(event, data) {
                this.events.push({
                    event,
                    data,
                    timestamp: new Date().toISOString()
                });
                
                // Keep only last 100 events
                if (this.events.length > 100) {
                    this.events.shift();
                }
                
                console.log(`NASA Analytics: ${event}`, data);
            },
            
            trackPageView: function() {
                this.pageViews++;
                this.track('page_view', {
                    url: window.location.href,
                    title: document.title
                });
            },
            
            getSessionDuration: function() {
                return Date.now() - this.startTime;
            }
        };
        
        window.nasaAnalytics = analytics;
        analytics.trackPageView();
    }
    
    showToast(message, type = 'info') {
        if (this.modules.has('ui')) {
            this.modules.get('ui').showToast(message, type);
        } else {
            alert(message); // Fallback
        }
    }
    
    getModule(moduleName) {
        return this.modules.get(moduleName);
    }
    
    async executeMission(missionName, ...args) {
        if (!this.isInitialized) {
            throw new Error('NASA Application not initialized');
        }
        
        try {
            console.log(`🚀 Executing mission: ${missionName}`);
            
            // Mission-specific logic
            switch (missionName) {
                case 'launch-sequence':
                    return await this.executeLaunchSequence(...args);
                case 'product-exploration':
                    return await this.executeProductExploration(...args);
                case 'order-transmission':
                    return await this.executeOrderTransmission(...args);
                case 'system-diagnostic':
                    return await this.executeSystemDiagnostic();
                default:
                    throw new Error(`Unknown mission: ${missionName}`);
            }
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }
    
    async executeLaunchSequence() {
        // Simulate launch sequence
        const steps = [
            'Initializing systems...',
            'Loading product database...',
            'Establishing mission control...',
            'Calibrating animations...',
            'Ready for exploration!'
        ];
        
        for (const step of steps) {
            this.showToast(step, 'info');
            await this.delay(1000);
        }
        
        return { status: 'success', message: 'Launch sequence complete' };
    }
    
    async executeProductExploration(productId) {
        const productManager = this.getModule('products');
        if (!productManager) throw new Error('Product manager not available');
        
        const product = productManager.getProductById(productId);
        if (!product) throw new Error('Product not found');
        
        // Open product modal
        if (this.modules.has('ui')) {
            this.modules.get('ui').openModal('product-modal');
        }
        
        return { product, status: 'exploring' };
    }
    
    async executeOrderTransmission(orderData) {
        const orderSystem = this.getModule('orders');
        if (!orderSystem) throw new Error('Order system not available');
        
        // Create and send order
        const order = orderSystem.createOrder(
            orderData.product,
            orderData.customer,
            orderData.options
        );
        
        orderSystem.sendOrderViaWhatsApp(order);
        
        return { order, status: 'transmitted' };
    }
    
    async executeSystemDiagnostic() {
        const diagnostic = {
            performance: this.getModule('performance')?.getPerformanceReport(),
            products: {
                total: this.getModule('products')?.products.length || 0,
                filtered: this.getModule('products')?.filteredProducts.length || 0
            },
            mission: this.getModule('mission')?.currentMission,
            ui: {
                theme: this.getModule('ui')?.currentTheme,
                animations: this.getModule('ui')?.animationsEnabled
            },
            session: {
                duration: Date.now() - this.startTime,
                pageViews: window.nasaAnalytics?.pageViews || 0
            }
        };
        
        console.log('NASA System Diagnostic:', diagnostic);
        return diagnostic;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async emergencyShutdown() {
        console.warn('🚨 NASA Emergency Shutdown Initiated');
        
        // Save critical data
        await this.saveCriticalData();
        
        // Gracefully shutdown modules
        for (const [name, module] of this.modules) {
            if (module.destroy) {
                try {
                    module.destroy();
                } catch (error) {
                    console.error(`Failed to destroy module ${name}:`, error);
                }
            }
        }
        
        // Clear all timeouts and intervals
        this.clearAllTimers();
        
        // Show shutdown message
        this.showToast('System shutdown complete', 'warning');
        
        return { status: 'shutdown', timestamp: new Date().toISOString() };
    }
    
    async saveCriticalData() {
        try {
            // Save cart and favorites
            const productManager = this.getModule('products');
            if (productManager) {
                productManager.saveCart();
                productManager.saveFavorites();
            }
            
            // Save order history
            const orderSystem = this.getModule('orders');
            if (orderSystem) {
                // Already saved in localStorage
            }
            
            // Save UI preferences
            const uiManager = this.getModule('ui');
            if (uiManager) {
                localStorage.setItem('nasa_theme', uiManager.currentTheme);
            }
        } catch (error) {
            console.error('Failed to save critical data:', error);
        }
    }
    
    clearAllTimers() {
        // Get the highest timeout/interval IDs
        let id = setTimeout(() => {}, 0);
        while (id--) {
            clearTimeout(id);
            clearInterval(id);
        }
    }
    
    getStatus() {
        return {
            initialized: this.isInitialized,
            modules: Array.from(this.modules.keys()),
            version: this.version,
            build: this.build,
            uptime: performance.now() - this.startTime
        };
    }
}

// NASA Global Initialization
(function() {
    'use strict';
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNASAApplication);
    } else {
        initNASAApplication();
    }
    
    async function initNASAApplication() {
        try {
            // Show loading sequence
            await showNASALoadingSequence();
            
            // Initialize main application
            window.NASA = new NASA_Application();
            
            // Make core modules globally accessible for debugging
            window.nasaPerformance = window.NASA.getModule('performance');
            window.nasaAnimations = window.NASA.getModule('animations');
            window.nasaUI = window.NASA.getModule('ui');
            window.nasaProductManager = window.NASA.getModule('products');
            window.nasaMissionControl = window.NASA.getModule('mission');
            window.nasaOrders = window.NASA.getModule('orders');
            
            // Hide loading screen
            hideLoadingScreen();
            
            // Start mission sequences
            startMissionSequences();
            
            // Log initialization
            console.log('🚀 NASA Astronomy Commerce Platform Ready');
            console.log('📡 WhatsApp: +91 9957811508');
            console.log('🌌 Mission: Bringing the cosmos to your doorstep');
            
        } catch (error) {
            console.error('Failed to initialize NASA Application:', error);
            showEmergencyFallback();
        }
    }
    
    async function showNASALoadingSequence() {
        const loadingScreen = document.getElementById('nasa-loader');
        if (!loadingScreen) return;
        
        // Show loading screen
        loadingScreen.classList.remove('hidden');
        
        // Animate progress bar
        const progressBar = loadingScreen.querySelector('.progress-fill');
        if (progressBar) {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 2;
                progressBar.style.width = `${progress}%`;
                progressBar.dataset.progress = progress;
                
                if (progress >= 100) {
                    clearInterval(interval);
                }
            }, 50);
        }
        
        // Animate countdown
        const countdownElement = loadingScreen.querySelector('.countdown');
        if (countdownElement) {
            let count = 10;
            const countdownInterval = setInterval(() => {
                countdownElement.textContent = count;
                count--;
                
                if (count < 0) {
                    clearInterval(countdownInterval);
                }
            }, 100);
        }
        
        // Animate sequence items
        const sequenceItems = loadingScreen.querySelectorAll('.sequence-item');
        sequenceItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 800);
        });
        
        // Wait for minimum loading time
        await new Promise(resolve => setTimeout(resolve, 4000));
    }
    
    function hideLoadingScreen() {
        const loadingScreen = document.getElementById('nasa-loader');
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 1000);
        }
    }
    
    function startMissionSequences() {
        // Start mission control updates
        if (window.nasaMissionControl) {
            window.nasaMissionControl.addLiveFeedUpdate('System initialization complete');
            window.nasaMissionControl.addLiveFeedUpdate('Mission control online');
            window.nasaMissionControl.addLiveFeedUpdate('Ready for cosmic exploration');
        }
        
        // Start particle animations
        startParticleSystem();
        
        // Start scroll animations
        startScrollAnimations();
        
        // Initialize product grid
        initializeProductGrid();
    }
    
    function startParticleSystem() {
        // Create particle system if not exists
        if (!document.querySelector('.particle-system')) {
            const particleSystem = document.createElement('div');
            particleSystem.className = 'particle-system';
            document.body.appendChild(particleSystem);
            
            // Generate particles
            for (let i = 0; i < 50; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.dataset.speed = (Math.random() * 0.5 + 0.1).toFixed(2);
                particle.dataset.x = (Math.random() * 100 - 50);
                particle.dataset.y = (Math.random() * 100 - 50);
                
                particleSystem.appendChild(particle);
            }
        }
    }
    
    function startScrollAnimations() {
        // Initialize scroll-triggered animations
        if (window.nasaUI) {
            window.nasaUI.initScrollAnimations();
        }
    }
    
    function initializeProductGrid() {
        const productsGrid = document.getElementById('products-grid');
        if (!productsGrid || !window.nasaProductManager) return;
        
        // Load initial products
        const products = window.nasaProductManager.getPagedProducts(1);
        
        // Render products
        productsGrid.innerHTML = products.map(product => `
            <div class="product-card" data-product="${product.id}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    ${product.featured ? '<span class="product-badge">Featured</span>' : ''}
                </div>
                <div class="product-content">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-meta">
                        <div class="product-price">${formatCurrency(product.price)}</div>
                        <div class="product-mission" data-mission="${product.mission}">
                            ${product.mission?.toUpperCase()}
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="btn-whatsapp" data-order="${product.id}">
                            <i class="fab fa-whatsapp"></i> Order Now
                        </button>
                        <button class="btn-details" data-details="${product.id}">
                            Details
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners
        productsGrid.querySelectorAll('.btn-whatsapp').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('[data-order]').dataset.order;
                openOrderModal(productId);
            });
        });
        
        productsGrid.querySelectorAll('.btn-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('[data-details]').dataset.details;
                openProductDetails(productId);
            });
        });
    }
    
    function openOrderModal(productId) {
        if (!window.nasaProductManager || !window.nasaUI) return;
        
        const product = window.nasaProductManager.getProductById(productId);
        if (!product) return;
        
        // Set product in order form
        const orderForm = document.getElementById('order-form');
        if (orderForm) {
            orderForm.querySelector('[name="product"]').value = product.id;
            orderForm.querySelector('.product-name').textContent = product.name;
            orderForm.querySelector('.product-price').textContent = formatCurrency(product.price);
        }
        
        // Open order modal
        window.nasaUI.openModal('order-modal');
        
        // Update order summary
        if (window.nasaOrders) {
            window.nasaOrders.updateOrderSummary();
        }
    }
    
    function openProductDetails(productId) {
        if (!window.nasaProductManager || !window.nasaUI) return;
        
        const product = window.nasaProductManager.getProductById(productId);
        if (!product) return;
        
        // Populate product modal
        const modal = document.getElementById('product-modal');
        if (modal) {
            modal.querySelector('.modal-title').textContent = product.name;
            modal.querySelector('.modal-image').src = product.image;
            modal.querySelector('.modal-description').textContent = product.description;
            modal.querySelector('.modal-price').textContent = formatCurrency(product.price);
            
            // Create specs list
            const specsContainer = modal.querySelector('.modal-specs');
            if (specsContainer && product.specs) {
                specsContainer.innerHTML = Object.entries(product.specs)
                    .map(([key, value]) => `
                        <div class="spec-item">
                            <span class="spec-key">${key}:</span>
                            <span class="spec-value">${value}</span>
                        </div>
                    `).join('');
            }
        }
        
        // Open product modal
        window.nasaUI.openModal('product-modal');
    }
    
    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    }
    
    function showEmergencyFallback() {
        // Create emergency fallback interface
        const fallback = document.createElement('div');
        fallback.className = 'nasa-emergency-fallback';
        fallback.innerHTML = `
            <div class="emergency-content">
                <h2>🚨 Mission Control Offline</h2>
                <p>We're experiencing technical difficulties. Basic functionality is available.</p>
                <div class="emergency-actions">
                    <a href="https://wa.me/919957811508" class="emergency-btn" target="_blank">
                        📞 Contact via WhatsApp
                    </a>
                    <button class="emergency-btn" onclick="location.reload()">
                        🔄 Retry Connection
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(fallback);
    }
    
    // Global utility functions
    window.NASA_Utils = {
        formatCurrency: (amount) => {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
            }).format(amount);
        },
        
        debounce: (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        throttle: (func, limit) => {
            let inThrottle;
            return function executedFunction(...args) {
                if (!inThrottle) {
                    func(...args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        generateID: (prefix = '') => {
            return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
        },
        
        validateEmail: (email) => {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },
        
        validatePhone: (phone) => {
            const re = /^[6-9]\d{9}$/;
            return re.test(phone.replace(/\D/g, ''));
        }
    };
    
    // WhatsApp shortcut function
    window.orderViaWhatsApp = function(product, size = 'M', quantity = 1, name = '', address = '') {
        const message = `Hello, I want to place an order:\nProduct: ${product}\nSize: ${size}\nQuantity: ${quantity}\nAddress: ${address}\nName: ${name}`;
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/919957811508?text=${encodedMessage}`, '_blank');
    };
    
    // Performance shortcut
    window.getNASAStatus = function() {
        return window.NASA ? window.NASA.getStatus() : { error: 'NASA not initialized' };
    };
})();

// NASA Error Boundary for React-like error handling
class NASA_ErrorBoundary {
    constructor(component, fallbackUI = null) {
        this.component = component;
        this.fallbackUI = fallbackUI;
        this.hasError = false;
    }
    
    render() {
        if (this.hasError && this.fallbackUI) {
            return this.fallbackUI;
        }
        
        try {
            return this.component();
        } catch (error) {
            this.hasError = true;
            console.error('NASA Error Boundary caught:', error);
            
            if (window.NASA) {
                window.NASA.handleError(error);
            }
            
            return this.fallbackUI || `<div class="nasa-error">Component failed to load</div>`;
        }
    }
    
    reset() {
        this.hasError = false;
    }
}

// Service Worker Registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/nasa-sw.js').then(registration => {
            console.log('NASA Service Worker registered:', registration);
        }).catch(error => {
            console.log('NASA Service Worker registration failed:', error);
        });
    });
}

// Web App Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button
    const installButton = document.querySelector('.install-app');
    if (installButton) {
        installButton.style.display = 'block';
        installButton.addEventListener('click', () => {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('NASA App installed');
                }
                deferredPrompt = null;
            });
        });
    }
});

// ============================================
// NASA-CORE.js - END OF MAIN IMPLEMENTATION
// ============================================

// Export modules for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        NASA_Application,
        NASA_PerformanceMonitor,
        NASA_AnimationController,
        NASA_ProductManager,
        NASA_MissionControl,
        NASA_OrderSystem,
        NASA_UIManager,
        NASA_ErrorBoundary
    };
}

// Add to global scope for browser
if (typeof window !== 'undefined') {
    window.NASA_Modules = {
        NASA_Application,
        NASA_PerformanceMonitor,
        NASA_AnimationController,
        NASA_ProductManager,
        NASA_MissionControl,
        NASA_OrderSystem,
        NASA_UIManager,
        NASA_ErrorBoundary
    };
  }
