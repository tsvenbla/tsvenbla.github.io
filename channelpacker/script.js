/**
 * RGBA Channel Packer
 * Modern JavaScript implementation for packing grayscale images into RGBA channels
 */

class ChannelPacker {
    constructor() {
        this.channels = ['red', 'green', 'blue', 'alpha'];
        this.loadedImages = new Map();
        this.resultCanvas = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.bindEvents();
        this.updatePackButton();
    }

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // File input listeners
        this.channels.forEach(channel => {
            const input = document.getElementById(`${channel}-input`);
            const uploadBtn = input.previousElementSibling;
            
            // File input change
            input.addEventListener('change', (event) => {
                this.handleImageUpload(event, channel);
            });
            
            // Upload button click
            uploadBtn.addEventListener('click', () => {
                input.click();
            });

            // Drag and drop support
            const uploadContainer = document.getElementById(`${channel}-upload`);
            this.addDragDropSupport(uploadContainer, input);
        });

        // Pack button
        document.getElementById('pack-btn').addEventListener('click', () => {
            this.packChannels();
        });

        // Download button
        document.getElementById('download-btn').addEventListener('click', () => {
            this.downloadResult();
        });

        // Configuration changes
        document.getElementById('missing-rgb-fill').addEventListener('change', () => {
            this.updatePackButton();
        });

        document.getElementById('missing-alpha-fill').addEventListener('change', () => {
            this.updatePackButton();
        });
    }

    /**
     * Add drag and drop support to upload containers
     */
    addDragDropSupport(container, input) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            container.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            container.addEventListener(eventName, () => {
                container.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            container.addEventListener(eventName, () => {
                container.classList.remove('drag-over');
            }, false);
        });

        container.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            const imageFile = files.find(file => file.type.startsWith('image/'));
            
            if (imageFile) {
                // Simulate file input change
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(imageFile);
                input.files = dataTransfer.files;
                
                // Trigger change event
                const event = new Event('change', { bubbles: true });
                input.dispatchEvent(event);
            }
        }, false);
    }

    /**
     * Prevent default drag behaviors
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Handle image upload
     */
    async handleImageUpload(event, channel) {
        const file = event.target.files[0];
        if (!file) {
            this.removeImage(channel);
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return;
        }

        // Validate file size (max 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showError('Image file is too large. Please select a file smaller than 50MB.');
            return;
        }

        try {
            const image = await this.loadImage(file);
            this.loadedImages.set(channel, image);
            this.showPreview(channel, image, file);
            this.markChannelAsLoaded(channel);
            this.updatePackButton();
            
            // Check dimensions consistency
            this.checkDimensionsConsistency();
            
        } catch (error) {
            console.error(`Error loading image for ${channel} channel:`, error);
            this.showError(`Failed to load image for ${channel} channel. Please try again.`);
            this.removeImage(channel);
        }
    }

    /**
     * Load image from file
     */
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load image'));
                
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Show image preview
     */
    showPreview(channel, image, file) {
        const previewContainer = document.getElementById(`${channel}-preview`);
        const previewImg = document.createElement('img');
        
        previewImg.src = image.src;
        previewImg.className = 'preview-img';
        previewImg.alt = `${channel} channel preview - ${file.name}`;
        
        // Clear previous content and add new preview
        previewContainer.innerHTML = '';
        previewContainer.appendChild(previewImg);
        
        // Add file info
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        fileInfo.innerHTML = `
            <small>${file.name}</small><br>
            <small>${image.width} × ${image.height}px</small>
        `;
        previewContainer.appendChild(fileInfo);
    }

    /**
     * Mark channel container as having an image
     */
    markChannelAsLoaded(channel) {
        const container = document.getElementById(`${channel}-upload`);
        container.classList.add('has-image');
    }

    /**
     * Remove image from channel
     */
    removeImage(channel) {
        this.loadedImages.delete(channel);
        
        const container = document.getElementById(`${channel}-upload`);
        const preview = document.getElementById(`${channel}-preview`);
        
        container.classList.remove('has-image');
        preview.innerHTML = '';
        
        this.updatePackButton();
    }

    /**
     * Check if all loaded images have consistent dimensions
     */
    checkDimensionsConsistency() {
        const images = Array.from(this.loadedImages.values());
        if (images.length < 2) return;

        const firstImage = images[0];
        const dimensionsMatch = images.every(img => 
            img.width === firstImage.width && img.height === firstImage.height
        );

        if (!dimensionsMatch) {
            this.showWarning('Warning: Images have different dimensions. They will be resized to match the largest dimensions during packing.');
        }
    }

    /**
     * Update pack button state
     */
    updatePackButton() {
        const packBtn = document.getElementById('pack-btn');
        const loadedCount = this.loadedImages.size;
        const helpText = document.getElementById('pack-help');
        
        if (loadedCount >= 2) {
            packBtn.disabled = false;
            helpText.textContent = `Ready to pack ${loadedCount} channel${loadedCount > 1 ? 's' : ''}`;
            helpText.style.color = '#4caf50';
        } else {
            packBtn.disabled = true;
            helpText.textContent = `Requires at least 2 images (${loadedCount}/2)`;
            helpText.style.color = '#666';
        }
    }

    /**
     * Pack channels into RGBA image
     */
    async packChannels() {
        if (this.loadedImages.size < 2) {
            this.showError('Please upload at least 2 images before packing.');
            return;
        }

        const loadingElement = document.getElementById('loading');
        const resultElement = document.getElementById('result');
        const downloadBtn = document.getElementById('download-btn');

        try {
            // Show loading state
            loadingElement.classList.add('show');
            resultElement.innerHTML = '';
            downloadBtn.style.display = 'none';

            // Process in next tick to allow UI update
            await new Promise(resolve => setTimeout(resolve, 100));

            const packedCanvas = await this.processChannels();
            
            // Show result
            this.displayResult(packedCanvas);
            downloadBtn.style.display = 'inline-block';
            
        } catch (error) {
            console.error('Error packing channels:', error);
            this.showError('Failed to pack channels. Please try again.');
        } finally {
            loadingElement.classList.remove('show');
        }
    }

    /**
     * Process channels and create packed image
     */
    async processChannels() {
        // Calculate target dimensions
        const { width, height } = this.calculateTargetDimensions();
        
        // Get fill values from configuration
        const rgbFill = document.getElementById('missing-rgb-fill').value === 'white' ? 255 : 0;
        const alphaFill = document.getElementById('missing-alpha-fill').value === 'white' ? 255 : 0;
        
        // Create canvases for each channel
        const channelData = await this.prepareChannelData(width, height, rgbFill, alphaFill);
        
        // Create result canvas
        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = width;
        resultCanvas.height = height;
        resultCanvas.className = 'result-canvas';
        
        const resultCtx = resultCanvas.getContext('2d');
        const resultImageData = resultCtx.createImageData(width, height);
        const resultData = resultImageData.data;

        // Pack channels into RGBA
        for (let i = 0; i < resultData.length; i += 4) {
            const pixelIndex = i / 4;
            const sourceIndex = pixelIndex * 4;

            // Use red component of each grayscale image as the channel value
            resultData[i] = channelData.red[sourceIndex];         // Red channel
            resultData[i + 1] = channelData.green[sourceIndex];   // Green channel
            resultData[i + 2] = channelData.blue[sourceIndex];    // Blue channel
            resultData[i + 3] = channelData.alpha[sourceIndex];   // Alpha channel
        }

        // Put the result back to canvas
        resultCtx.putImageData(resultImageData, 0, 0);
        this.resultCanvas = resultCanvas;
        
        return resultCanvas;
    }

    /**
     * Calculate target dimensions for the packed image
     */
    calculateTargetDimensions() {
        const images = Array.from(this.loadedImages.values());
        
        const width = Math.max(...images.map(img => img.width));
        const height = Math.max(...images.map(img => img.height));
        
        return { width, height };
    }

    /**
     * Prepare channel data with proper fill values
     */
    async prepareChannelData(width, height, rgbFill, alphaFill) {
        const channelData = {};
        
        for (const channel of this.channels) {
            if (this.loadedImages.has(channel)) {
                // Use actual image data
                const canvas = this.createChannelCanvas(this.loadedImages.get(channel), width, height);
                const ctx = canvas.getContext('2d');
                const imageData = ctx.getImageData(0, 0, width, height);
                channelData[channel] = imageData.data;
            } else {
                // Create fill data
                const fillValue = channel === 'alpha' ? alphaFill : rgbFill;
                channelData[channel] = new Uint8ClampedArray(width * height * 4);
                
                // Fill with specified value
                for (let i = 0; i < channelData[channel].length; i += 4) {
                    channelData[channel][i] = fillValue;     // Use fill value
                    channelData[channel][i + 1] = fillValue; // Not used, but kept for consistency
                    channelData[channel][i + 2] = fillValue; // Not used, but kept for consistency
                    channelData[channel][i + 3] = 255;       // Alpha for the working image
                }
            }
        }
        
        return channelData;
    }

    /**
     * Create canvas with channel image data
     */
    createChannelCanvas(image, targetWidth, targetHeight) {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw image scaled to target dimensions
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
        
        return canvas;
    }

    /**
     * Display the packed result
     */
    displayResult(canvas) {
        const resultElement = document.getElementById('result');
        
        const title = document.createElement('h3');
        title.textContent = '✅ Packed Result:';
        
        const info = document.createElement('p');
        const loadedChannels = Array.from(this.loadedImages.keys());
        const missingChannels = this.channels.filter(ch => !this.loadedImages.has(ch));
        
        info.innerHTML = `
            <strong>Dimensions:</strong> ${canvas.width} × ${canvas.height}px<br>
            <strong>Loaded channels:</strong> ${loadedChannels.join(', ')}<br>
            ${missingChannels.length > 0 ? `<strong>Filled channels:</strong> ${missingChannels.join(', ')}` : ''}
        `;
        info.style.marginBottom = '1rem';
        info.style.fontSize = '0.9rem';
        info.style.color = '#666';
        
        resultElement.innerHTML = '';
        resultElement.appendChild(title);
        resultElement.appendChild(info);
        resultElement.appendChild(canvas);
    }

    /**
     * Download the packed result
     */
    downloadResult() {
        if (!this.resultCanvas) {
            this.showError('No result to download. Please pack channels first.');
            return;
        }

        try {
            this.resultCanvas.toBlob((blob) => {
                if (!blob) {
                    this.showError('Failed to create download file.');
                    return;
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                
                link.href = url;
                link.download = `packed_channels_${Date.now()}.png`;
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Clean up
                setTimeout(() => URL.revokeObjectURL(url), 1000);
                
            }, 'image/png', 0.95);
        } catch (error) {
            console.error('Download error:', error);
            this.showError('Failed to download the result.');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show warning message
     */
    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            max-width: 400px;
            word-wrap: break-word;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            animation: slideIn 0.3s ease;
        `;

        // Set background color based on type
        const colors = {
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3',
            success: '#4caf50'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);

        // Add click to dismiss
        notification.addEventListener('click', () => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });
    }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification {
        cursor: pointer;
        transition: transform 0.2s ease;
    }
    
    .notification:hover {
        transform: scale(1.02);
    }
    
    .drag-over {
        border-color: #667eea !important;
        background-color: rgba(102, 126, 234, 0.05);
    }
`;
document.head.appendChild(style);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChannelPacker();
});
