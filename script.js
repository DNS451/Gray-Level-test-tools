class GrayscaleViewer {
    constructor() {
        this.levels = [5, 10, 15, 20, 25];
        this.currentLevelIndex = 1;
        this.currentImage = null;
        this.isGrayscale = true;
        this.initializeElements();
        this.bindEvents();
        this.updateGradientBar();
        this.currentColor = 'gray'; // 添加颜色状态
    }

    initializeElements() {
        this.gradientBar = document.getElementById('gradientBar');
        this.distribution = document.getElementById('distribution');
        this.distributionValue = document.getElementById('distributionValue');
        this.imageContainer = document.getElementById('imageContainer');
        this.levelDisplay = document.getElementById('levelDisplay');
        this.imageInput = document.getElementById('imageInput');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.grayToggle = document.getElementById('grayToggle');
        this.resetDistBtn = document.getElementById('resetDistribution');
        this.grayValues = document.getElementById('grayValues');
    }

    bindEvents() {
        document.getElementById('decreaseLevel').addEventListener('click', () => this.changeLevel(-1));
        document.getElementById('increaseLevel').addEventListener('click', () => this.changeLevel(1));
        
        document.querySelectorAll('.bg-btn').forEach(btn => {
            btn.addEventListener('click', () => this.changeBg(btn.dataset.color));
        });

        this.distribution.addEventListener('input', (e) => this.updateDistribution(e.target.value));
        this.uploadBtn.addEventListener('click', () => this.imageInput.click());
        this.imageInput.addEventListener('change', (e) => this.handleImage(e));
        
        this.grayToggle.addEventListener('change', () => {
            this.isGrayscale = this.grayToggle.checked;
            if (this.currentImage) {
                this.processImage();
            }
        });

        this.resetDistBtn.addEventListener('click', () => {
            this.distribution.value = 0;
            this.updateDistribution(0);
        });
        
        // 添加拖拽上传支持
        this.imageContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.imageContainer.classList.add('drag-over');
        });

        this.imageContainer.addEventListener('dragleave', () => {
            this.imageContainer.classList.remove('drag-over');
        });

        this.imageContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            this.imageContainer.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImageFile(file);
            }
        });

        window.addEventListener('resize', () => {
            if (this.currentImage) this.processImage();
        });
        
        // 添加颜色按钮事件监听
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => this.changeColor(btn.dataset.color));
        });
    }

    handleImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImage = new Image();
            this.currentImage.onload = () => this.processImage();
            this.currentImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    changeBg(color) {
        const colors = {
            white: ['#ffffff', '#333333'],
            gray: ['#808080', '#ffffff'],
            black: ['#000000', '#ffffff']
        };
        document.body.style.backgroundColor = colors[color][0];
        document.body.style.color = colors[color][1];
    }

    updateDistribution(value) {
        this.distributionValue.textContent = Number(value).toFixed(1);
        this.updateGradientBar();
        if (this.currentImage) {
            this.processImage();
        }
    }

    changeColor(color) {
        this.currentColor = color;
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === color);
        });
        this.updateGradientBar();
        if (this.currentImage) {
            this.processImage();
        }
    }

    calculateGrayValue(i, level, distribution) {
        const x = i / (level - 1);
        let power = Math.pow(2, Number(distribution));
        let value = Math.pow(x, power) * 255;
        value = Math.round(value);
        
        if (this.currentColor === 'gray') {
            return value; // 返回数值而不是rgb字符串
        } else {
            const colors = {
                red: [value, 0, 0],
                green: [0, value, 0],
                blue: [0, 0, value]
            };
            return colors[this.currentColor] ? colors[this.currentColor] : [value, value, value];
        }
    }

    updateGradientBar() {
        const level = this.levels[this.currentLevelIndex];
        document.documentElement.style.setProperty('--level-count', level);
        const distribution = this.distribution.value;
        
        this.gradientBar.innerHTML = '';
        
        for (let i = 0; i < level; i++) {
            const value = this.calculateGrayValue(i, level, distribution);
            const div = document.createElement('div');
            if (Array.isArray(value)) {
                div.style.backgroundColor = `rgb(${value[0]},${value[1]},${value[2]})`;
            } else {
                div.style.backgroundColor = `rgb(${value},${value},${value})`;
            }
            this.gradientBar.appendChild(div);
        }
        
        this.levelDisplay.textContent = level;
    }

    changeLevel(direction) {
        this.currentLevelIndex = Math.min(Math.max(0, this.currentLevelIndex + direction), this.levels.length - 1);
        this.updateGradientBar();
        if (this.currentImage) {
            this.processImage();
        }
    }

    handleImage(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleImageFile(file);
        }
    }

    processImage() {
        this.imageContainer.innerHTML = '';
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = this.imageContainer.clientWidth;
        canvas.height = this.imageContainer.clientHeight;
        
        ctx.drawImage(this.currentImage, 0, 0, canvas.width, canvas.height);
        
        if (this.isGrayscale) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const level = this.levels[this.currentLevelIndex];
            const distribution = this.distribution.value;
            
            for (let i = 0; i < data.length; i += 4) {
                const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
                const normalizedGray = gray / 255;
                const index = Math.floor(normalizedGray * (level - 1));
                const value = this.calculateGrayValue(index, level, distribution);
                
                if (Array.isArray(value)) {
                    data[i] = value[0];     // R
                    data[i + 1] = value[1]; // G
                    data[i + 2] = value[2]; // B
                } else {
                    data[i] = data[i + 1] = data[i + 2] = value;
                }
            }
            
            ctx.putImageData(imageData, 0, 0);
        }
        
        const img = document.createElement('img');
        img.src = canvas.toDataURL();
        this.imageContainer.innerHTML = '';
        this.imageContainer.appendChild(img);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GrayscaleViewer();
});