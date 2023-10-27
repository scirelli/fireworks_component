const rndRange = function rndRange(min, max) {
    if(isNaN(min) || isNaN(max)) return NaN;
    return Math.random()*(max-min)+min;
}

const toRadians = function toRadians(angle) {
    return angle * (Math.PI / 180);
}

class Rect {
    constructor(x, y, x2, y2) {
        this.x = x;
        this.x2 = x2;
        this.y = y;
        this.y2 = y2;

        this.width = Math.abs(x2 - x);
        this.height = Math.abs(y2 - y);
    }
}

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    copy(v) {
        this.x = v.x;
        this.y = v.y;
        return this;
    }

    clone() {
        return new Vector().copy(this);
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    scale(k) {
        this.x *= k;
        this.y *= k;
        return this;
    }

    static scale(v, k) {
        return new Vector().copy(v).scale(k);
    }

    dot(v) {
        return this.x*v.x + this.y*v.y;
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    neg() {
        this.x *= -1;
        this.y *= -1;
        return this;
    }
}

class Particle {
    constructor() {
        this.vel = new Vector();
        this.pos = new Vector();
        this.force = new Vector();
        this.mass = 1;
    }
}

class Firework {
    static MIN_VEL = 1/1000; // units/ms
    static MAX_VEL = 5/1000; // units/ms

    static GRAVITY = new Vector(0, 1 * 1e-3); //1 units/1s^2 = 1x10^-3 units/s*ms

    constructor(bounds, callback, particleCnt=10) {
        this.callback = callback;
        this.explodeTimeMS = 0;
        this.particles = [];
        this.bounds = bounds;
        this.exploding = false;
        this.startAnimationTimeStampMs = 0;
        this.previousAnimationTimeStampMs = 0;

        init(particleCnt);
    }

    init(particleCnt) {
        this.exploding = false;
        let a = toRadians(rndRange(30,150)),
            v = rndRange(0.01, 0.9);

        for(let i=0, p; i<particleCnt; i++) {
            p = new Particle();

            p.vel
                .add(new Vector(0, -0.5))
                .add(new Vector(v*Math.cos(a), -1*v*Math.sin(a)));
            p.force.copy(Firework.GRAVITY);
            p.pos.x = this.bounds.width/2;
            p.pos.y = this.bounds.height-1;

            this.particles.push(p);
        }
    }

    setBounds(bounds) {
        this.bounds = bounds;
        return this;
    }

    step(tmieMs) {
        this.applyTimedEvents(timeMs);
        this.applyForces(timeMs);
        this.detectCollision(timeMs);
        this.callback(timeMs, this.particles);
    }

    applyTimedEvents(timeMs) {
        if(timeMs - this.animationStartTimeMs > this.explodeTimeMS && !this.exploding) {
            this.exploding = true;
            for(let i=0,l=this.particles.length,p=null,a,v; i<l; i++) {
                p = this.particles[i];
                a = toRadians(rndRange(0,360));
                v = rndRange(0.01, 0.9);
                p.vel.add(new Vector(v*Math.cos(a), -1*v*Math.sin(a)));
                //p.forces.push(new Vector(0.1 * 1e-3,0));
            }
        }
    }

    applyForces(timeMs) {
        const elapsed = timeMs - this.previousAnimationTimeStampMs;
        this.previousAnimationTimeStampMs = timeMs;

        for(let i=0,l=this.particles.length,p=null, force; i<l; i++) {
            p = this.particles[i];
            p.vel.x += (p.force.x/p.mass) * elapsed;
            p.vel.y += (p.force.y/p.mass) * elapsed;
            p.pos.x += p.vel.x * elapsed;
            p.pos.y += p.vel.y * elapsed;
        }
    }

    detectCollision(timeMs) {}
}

class Simulator {
    constructor() {
        this.startAnimationTimeStampMs = 0;
        this.previousAnimationTimeStampMs = 0;
    }

    init() {
    }

    step(tmieMs) {
    }

    applyForces(timeMs) {
    }

    detectCollision(timeMs) {
    }
}

customElements.define('firework-animation', class FireworkElement extends HTMLElement {
    static TAG_NAME = 'firework-animation';

    static DEFAULT_RUNTIME_S = 2 ;
    static DEFAULT_RUNTIME_MS = FireworkElement.DEFAULT_RUNTIME_S * 1000;

    static get observedAttributes() { return [
        'data-active', 'active', 
        'data-particle-count', 'particle-count',
        'data-runtime', 'runtime',
        'data-loop', 'loop',
        'data-repeat', 'repeat'
    ]; }

    constructor(){
        super();
        this.active = false;
        this.isRunning = false;
        this.particleCount = 0;
        this.runtimeMs = FireworkElement.DEFAULT_RUNTIME_MS;
        this.shouldRepeat = false;
        this.startAnimationTimeStampMs = 0;
        this.previousAnimationTimeStampMs = 0;
        this.particles = [];
        this.exploding = false;

        this.attachShadow({mode: 'open'});

        this.__init();
    }

    __init() {
        this.__attachStyles();
    }

    connectedCallback() {
        console.log(`Custom element ${FireworkElement.TAG_NAME} added to page.`);
        this.__clearparticles();
        this.__createparticles();
        if(this.active) this.__start();
    }

    disconnectedCallback() {
        console.log(`Custom element ${FireworkElement.TAG_NAME} removed from page.`);
    }

    adoptedCallback() {
        console.log(`Custom element ${FireworkElement.TAG_NAME} moved to new page.`);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`Attribute ${name} has changed.`);

        if(oldValue === newValue) return;

        switch(name) {
            case 'active':
            case 'data-active':
                console.log(`Attribute ${FireworkElement.TAG_NAME}.${name} value is now ${newValue}`);
                this.active = newValue && newValue.toLowerCase() !== 'false';
                if(this.active && this.isConnected) this.__start();
                break;

            case 'data-particle-count':
            case 'particle-count':
                this.particleCount = parseInt(newValue) || 0;
                if(this.isConnected){
                    this.__clearparticles();
                    this.__createparticles();
                }
                break;
            case 'data-repeat':
            case 'repeat':
                this.shouldRepeat = newValue && newValue.toLowerCase() !== 'false';
                break;
            case 'data-runtime':
            case 'runtime':
                this.runtimeMs = (window.parseFloat(newValue) || FireworkElement.DEFAULT_RUNTIME) * 1000;
                break;
        }
    }

    __attachStyles() {
        let styles = document.createElement('link');
        styles.rel = 'stylesheet';
        styles.href = '/components/fireworks/fireworks.css';
        this.shadowRoot.appendChild(styles);
    }

    __clearparticles() {
        this.shadowRoot.querySelectorAll('.particle').forEach(e=>e.remove());
    }

    __createparticles() {
        for(let i=0, elem; i<this.particleCount; i++){
            elem = document.createElement('div');
            elem.classList.add('hidden')
            elem.ivel = new Vector();
            elem.vel = new Vector();
            elem.force = new Vector();
            elem.pos = new Vector();
            elem.mass = 1;
            this.particles.push(elem);
        }
        this.shadowRoot.append(...this.particles);
        this.__initParticles();
    }
    
    __initParticles() {
        this.exploding = false;
        let a = toRadians(rndRange(30,150)),
            v = rndRange(0.01, 0.9);
        for(let i=0, l=this.particles.length, elem, borderWidth; i<l; i++){
            elem = this.particles[i];
            elem.classList.add('particle')
            elem.classList.add('hidden')
            elem.ivel.x = 0;
            elem.ivel.y = -0.5;
            elem.ivel.add(new Vector(v*Math.cos(a), -1*v*Math.sin(a)));
            elem.vel.copy(elem.ivel);
            elem.force.copy(Firework.GRAVITY);
            borderWidth = parseFloat(getComputedStyle(elem).getPropertyValue('border-width')) || 0;
            elem.pos.x = (this.clientWidth / 2) - (elem.clientWidth/2) - borderWidth;
            elem.pos.y = this.clientHeight - elem.clientHeight - borderWidth;
        }
    }

    __animate(timeStampMs) {
        if(!this.isRunning) return;

        this.__do(timeStampMs);
        this.__applyForces(timeStampMs);
        //this.__detectCollision();
        this.__draw();

        if(timeStampMs - this.animationStartTimeMs >= this.runtimeMs){
            if(!this.shouldRepeat) return;
            this.__reset();
        }else{
            window.requestAnimationFrame(this.__animate.bind(this));
        }
    }
    
    __do(timeStampMs) {
        if(timeStampMs - this.animationStartTimeMs > 800 && !this.exploding) {
            this.exploding = true;
            for(let i=0,l=this.particles.length,p=null,a,v; i<l; i++) {
                p = this.particles[i];
                a = toRadians(rndRange(0,360));
                v = rndRange(0.01, 0.9);
                p.vel.add(new Vector(v*Math.cos(a), -1*v*Math.sin(a)));
                //p.forces.push(new Vector(0.1 * 1e-3,0));
            }
        }
    }

    __applyForces(timeStampMs) {
        const elapsed = timeStampMs - this.previousAnimationTimeStampMs;
        this.previousAnimationTimeStampMs = timeStampMs;

        for(let i=0,l=this.particles.length,p=null, force; i<l; i++) {
            p = this.particles[i];
            p.vel.x += (p.force.x/p.mass) * elapsed;
            p.vel.y += (p.force.y/p.mass) * elapsed;
            p.pos.x += p.vel.x * elapsed;
            p.pos.y += p.vel.y * elapsed;
        }
    }

    __detectCollision() {
        for(let i=0,l=this.particles.length,p=null,borderWidth; i<l; i++) {
            p = this.particles[i];
            borderWidth = parseFloat(getComputedStyle(p).getPropertyValue('border-width')) || 0;
            if(p.pos.y > (this.clientHeight - p.clientHeight - borderWidth)){
                p.pos.y = this.clientHeight - p.clientHeight - borderWidth;
                p.vel.y *= -1;
            }
        }
    }

    __draw(){
        for(let i=0,l=this.particles.length,p=null; i<l; i++) {
            p = this.particles[i];
            p.style.left = p.pos.x + 'px';
            p.style.top = p.pos.y + 'px';
        }
    }

    __reset() {
        console.log('Resetting');
        this.__stop();
        this.__initParticles();
        this.__start();
    }

    __start() {
        console.log('Starting');
        window.requestAnimationFrame(timeStamp => {
            this.isRunning = true;
            this.animationStartTimeMs = timeStamp;
            this.previousAnimationTimeStampMs = timeStamp;
            this.__animate(timeStamp);
        });
    }

    __stop() {
        console.log('Stopping');
        this.isRunning = false;
    }

    static __registerElement() {
        customElements.define(FireworkElement.TAG_NAME, FireworkElement);
    }
});
