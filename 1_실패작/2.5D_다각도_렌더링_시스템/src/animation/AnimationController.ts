export class AnimationController {
    private isAnimating: boolean = false;
    private animationSpeed: number = 1; // 도/프레임
    private animationDirection: 1 | -1 = 1;
    private animationStartTime: number = 0;
    private animationId: number | null = null;
    private system: any;
    
    constructor(system: any) {
        this.system = system;
    }
    
    play() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.animationStartTime = performance.now();
        this.animate();
    }
    
    pause() {
        this.isAnimating = false;
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    reset() {
        this.pause();
        this.system.setAngle(0);
    }
    
    private animate() {
        if (!this.isAnimating) return;
        
        const currentAngle = this.system.getAngle();
        let newAngle = currentAngle + (this.animationSpeed * this.animationDirection);
        
        // 순환 처리
        if (newAngle >= 360) {
            newAngle -= 360;
        } else if (newAngle < 0) {
            newAngle += 360;
        }
        
        this.system.setAngle(newAngle);
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    setSpeed(speed: number) {
        this.animationSpeed = Math.max(0.1, Math.min(10, speed));
    }
    
    getSpeed(): number {
        return this.animationSpeed;
    }
    
    setDirection(direction: 1 | -1) {
        this.animationDirection = direction;
    }
    
    getDirection(): 1 | -1 {
        return this.animationDirection;
    }
    
    toggleDirection() {
        this.animationDirection *= -1;
    }
    
    isPlaying(): boolean {
        return this.isAnimating;
    }
}