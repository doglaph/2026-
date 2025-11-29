const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// 设置画布大小
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 烟花粒子类
class Particle {
    constructor(x, y, color, velocity, size = 3) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = velocity;
        this.size = size;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.005;
        this.gravity = 0.1;
    }
    
    update() {
        this.velocity.x *= 0.99;
        this.velocity.y *= 0.99;
        this.velocity.y += this.gravity;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= this.decay;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 烟花类
class Firework {
    constructor(x, y, targetY, color) {
        this.x = x;
        this.y = y;
        this.targetY = targetY;
        this.color = color;
        this.velocity = {
            x: 0,
            y: -Math.random() * 3 - 12
        };
        this.size = 3;
        this.trail = [];
        this.exploded = false;
        this.particles = [];
    }
    
    update() {
        if (!this.exploded) {
            this.velocity.y += 0.15;
            this.y += this.velocity.y;
            
            // 添加轨迹
            this.trail.push({x: this.x, y: this.y, alpha: 1});
            if (this.trail.length > 10) {
                this.trail.shift();
            }
            
            // 更新轨迹透明度
            this.trail.forEach(point => {
                point.alpha -= 0.1;
            });
            
            // 到达目标高度时爆炸
            if (this.velocity.y >= 0 || this.y <= this.targetY) {
                this.explode();
            }
        } else {
            // 更新爆炸粒子
            this.particles.forEach((particle, index) => {
                particle.update();
                if (particle.alpha <= 0) {
                    this.particles.splice(index, 1);
                }
            });
        }
    }
    
    explode() {
        this.exploded = true;
        const particleCount = Math.random() * 50 + 50;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            const velocity = Math.random() * 6 + 2;
            
            this.particles.push(new Particle(
                this.x,
                this.y,
                this.color,
                {
                    x: Math.cos(angle) * velocity,
                    y: Math.sin(angle) * velocity
                },
                Math.random() * 3 + 1
            ));
        }
    }
    
    draw() {
        if (!this.exploded) {
            // 绘制轨迹
            this.trail.forEach(point => {
                ctx.save();
                ctx.globalAlpha = point.alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(point.x, point.y, this.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
            
            // 绘制烟花主体
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 绘制爆炸粒子
            this.particles.forEach(particle => {
                particle.draw();
            });
        }
    }
}

// 文字烟花类
class TextFirework {
    constructor(text, x, y) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.particles = [];
        this.fontSize = 80;
        this.createTextParticles();
    }
    
    createTextParticles() {
        // 创建临时画布来获取文字像素
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = 400;
        tempCanvas.height = 100;
        
        tempCtx.fillStyle = 'white';
        tempCtx.font = `bold ${this.fontSize}px Arial`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText(this.text, 200, 50);
        
        // 获取像素数据
        const imageData = tempCtx.getImageData(0, 0, 400, 100);
        const pixels = imageData.data;
        
        // 创建粒子
        for (let y = 0; y < 100; y += 4) {
            for (let x = 0; x < 400; x += 4) {
                const index = (y * 400 + x) * 4;
                const alpha = pixels[index + 3];
                
                if (alpha > 128) {
                    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'];
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    
                    this.particles.push({
                        targetX: this.x + x - 200,
                        targetY: this.y + y - 50,
                        x: this.x + (Math.random() - 0.5) * 800,
                        y: this.y + (Math.random() - 0.5) * 400,
                        color: color,
                        size: Math.random() * 3 + 2,
                        speed: Math.random() * 0.02 + 0.01
                    });
                }
            }
        }
    }
    
    update() {
        this.particles.forEach(particle => {
            const dx = particle.targetX - particle.x;
            const dy = particle.targetY - particle.y;
            
            particle.x += dx * particle.speed;
            particle.y += dy * particle.speed;
        });
    }
    
    draw() {
        this.particles.forEach(particle => {
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

// 全局变量
let fireworks = [];
let textFireworks = [];
let animationId;
let isShowing2026 = false;

// 动画循环
function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 更新和绘制烟花
    fireworks.forEach((firework, index) => {
        firework.update();
        firework.draw();
        
        if (firework.exploded && firework.particles.length === 0) {
            fireworks.splice(index, 1);
        }
    });
    
    // 更新和绘制文字烟花
    textFireworks.forEach(textFirework => {
        textFirework.update();
        textFirework.draw();
    });
    
    animationId = requestAnimationFrame(animate);
}

// 开始烟花秀
function startFireworks() {
    isShowing2026 = false;
    textFireworks = [];
    
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'];
    
    // 自动发射烟花
    const launchInterval = setInterval(() => {
        if (!isShowing2026) {
            const x = Math.random() * canvas.width;
            const y = canvas.height;
            const targetY = Math.random() * canvas.height * 0.5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            fireworks.push(new Firework(x, y, targetY, color));
        } else {
            clearInterval(launchInterval);
        }
    }, 300);
    
    // 10秒后自动停止
    setTimeout(() => {
        clearInterval(launchInterval);
    }, 10000);
}

// 显示2026
function show2026() {
    isShowing2026 = true;
    textFireworks = [];
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // 创建2026文字烟花
    setTimeout(() => {
        textFireworks.push(new TextFirework('2', centerX - 150, centerY));
    }, 0);
    
    setTimeout(() => {
        textFireworks.push(new TextFirework('0', centerX - 50, centerY));
    }, 200);
    
    setTimeout(() => {
        textFireworks.push(new TextFirework('2', centerX + 50, centerY));
    }, 400);
    
    setTimeout(() => {
        textFireworks.push(new TextFirework('6', centerX + 150, centerY));
    }, 600);
}

// 清空画布
function clearCanvas() {
    fireworks = [];
    textFireworks = [];
    isShowing2026 = false;
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// 鼠标点击发射烟花
canvas.addEventListener('click', (e) => {
    if (!isShowing2026) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        fireworks.push(new Firework(e.clientX, canvas.height, e.clientY, color));
    }
});

// 窗口大小调整
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// 启动动画
animate();

// 自动开始烟花秀
setTimeout(startFireworks, 1000);