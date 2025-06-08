/**
 * RGBA Channel Packer
 * Semantic HTML implementation with color inversion support
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
     * Bind all event listeners using semantic selectors
     */
    bindEvents() {
        // File input listeners for each channel section
        this.channels.forEach(channel => {
            const section = this.getChannelSection(channel);
            const input = section.querySelector('input[type="file"]');
            const uploadBtn = section.querySelector('button');
            
            // File input change
            input.addEventListener('change', (event) => {
                this.handleImageUpload(event, channel);
            });
            
            // Upload button click
            uploadBtn.addEventListener('click', () => {
                input.click();
            });

            // Invert checkbox change
            const invertCheckbox = section.querySelector('input[type="checkbox"]');
            invertCheckbox.addEventListener('change', () => {
                if (this.loadedImages.has(channel)) {
                    // Re-process the image with current invert setting
                    this.updatePreview(channel);
                }
            });

            // Drag and drop support
            this.addDragDropSupport(section, input);
        });

        // Pack button (first button in controls section)
        const packBtn = this.getPackButton();
        packBtn.addEventListener('click', () => {
            this.packChannels();
        });

        // Download button (second button in controls section)
        const downloadBtn = this.getDownloadButton();
        downloadBtn.addEventListener('click', () => {
            this.downloadResult();
        });

        // Configuration changes
        const configSelects = document.querySelectorAll('fieldset:nth-of-type(2) select');
        configSelects.forEach(select => {
            select.addEventListener('change', () => {
                this.updatePackButton();
            });
        });
    }

    /**
     * Get channel section by data attribute
     */
    getChannelSection(channel) {
        return document.querySelector(`section[data-channel="${channel}"]`);
    }

    /**
     * Get pack button
     */
    getPackButton() {
        return document.querySelector('main > section button:first-of-type');
    }

    /**
     * Get download button
     */
    getDownloadButton() {
        return document.querySelector('main > section button:last-of-type');
    }

    /**
     * Get loading element
     */
    getLoadingElement() {
        return document.querySelector('aside[role="status"]');
    }

    /**
     * Get result output element
     */
    getResultElement() {
        return document.querySelector('output');
    }

    /**
     * Add drag and drop support to sections
     */
    addDragDropSupport(section, input) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            section.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            section.addEventListener(eventName, () => {
                section.setAttribute('data-drag-over', 'true');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            section.addEventListener(eventName, () => {
                section.removeAttribute('data-drag-over');
            }, false);
        });

        section.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            const imageFile = files.find(file => file.type.startsWith('image/'));
            
            if (imageFile) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(imageFile);
                input.files = dataTransfer.files;
                
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
            this.loadedImages.set(channel, { image, file });
            this.updatePreview(channel);
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
     * Update preview with inversion if needed
     */
    updatePreview(channel) {
        const section = this.getChannelSection(channel);
        const figure = section.querySelector('figure');
        const invertCheckbox = section.querySelector('input[type="checkbox"]');
        const imageData = this.loadedImages.get(channel);
        
        if (!imageData) return;

        const { image, file } = imageData;
        
        // Create preview canvas to apply inversion if needed
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        
        // Apply inversion if checkbox is checked
        if (invertCheckbox.checked) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];         // Red
                data[i + 1] = 255 - data[i + 1]; // Green
                data[i + 2] = 255 - data[i + 2]; // Blue
                // Alpha channel (i + 3) remains unchanged
            }
            
            ctx.putImageData(imageData, 0, 0);
        }
        
        // Create preview image
        const previewImg = document.createElement('img');
        previewImg.src = canvas.toDataURL();
        previewImg.alt = `${channel} channel preview - ${file.name}${invertCheckbox.checked ? ' (inverted)' : ''}`;
        
        // Create file info
        const figcaption = document.createElement('figcaption');
        figcaption.innerHTML = `
            <strong>${file.name}</strong><br>
            ${image.width} × ${image.height}px
            ${invertCheckbox.checked ? '<br><em>(Colors inverted)</em>' : ''}
        `;
        
        // Update figure content
        figure.innerHTML = '';
        figure.appendChild(previewImg);
        figure.appendChild(figcaption);
    }

    /**
     * Mark channel section as having an image
     */
    markChannelAsLoaded(channel) {
        const section = this.getChannelSection(channel);
        section.style.borderColor = 'var(--success-green)';
        section.style.borderStyle = 'solid';
    }

    /**
     * Remove image from channel
     */
    removeImage(channel) {
        this.loadedImages.delete(channel);
        
        const section = this.getChannelSection(channel);
        const figure = section.querySelector('figure');
        const invertCheckbox = section.querySelector('input[type="checkbox"]');
        
        section.style.borderColor = '';
        section.style.borderStyle = '';
        figure.innerHTML = '';
        invertCheckbox.checked = false;
        
        this.updatePackButton();
    }

    /**
     * Check if all loaded images have consistent dimensions
     */
    checkDimensionsConsistency() {
        const images = Array.from(this.loadedImages.values()).map(data => data.image);
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
        const packBtn = this.getPackButton();
        const helpText = document.querySelector('#pack-help');
        const loadedCount = this.loadedImages.size;
        
        if (loadedCount >= 2) {
            packBtn.disabled = false;
            helpText.textContent = `Ready to pack ${loadedCount} channel${loadedCount > 1 ? 's' : ''}`;
            helpText.style.color = 'var(--success-green)';
        } else {
            packBtn.disabled = true;
            helpText.textContent = `Requires at least 2 images (${loadedCount}/2)`;
            helpText.style.color = 'var(--medium-gray)';
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

        const loadingElement = this.getLoadingElement();
        const resultElement = this.getResultElement();
        const downloadBtn = this.getDownloadButton();

        try {
            // Show loading state
            loadingElement.hidden = false;
            resultElement.innerHTML = '';
            downloadBtn.hidden = true;

            // Process in next tick to allow UI update
            await new Promise(resolve => setTimeout(resolve, 100));

            const packedCanvas = await this.processChannels();
            
            // Show result
            this.displayResult(packedCanvas);
            downloadBtn.hidden = false;
            
        } catch (error) {
            console.error('Error packing channels:', error);
            this.showError('Failed to pack channels. Please try again.');
        } finally {
            loadingElement.hidden = true;
        }
    }

    /**
     * Process channels and create packed image with inversion support
     */
    async processChannels() {
        // Calculate target dimensions
        const { width, height } = this.calculateTargetDimensions();
        
        // Get fill values from configuration
        const configSelects = document.querySelectorAll('fieldset:nth-of-type(2) select');
        const rgbFill = configSelects[0].value === 'white' ? 255 : 0;
        const alphaFill = configSelects[1].value === 'white' ? 255 : 0;
        
        // Create canvases for each channel with inversion
        const channelData = await this.prepareChannelData(width, height, rgbFill, alphaFill);
        
        // Create result canvas
        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = width;
        resultCanvas.height = height;
        
        const resultCtx = resultCanvas.getContext('2d');
        const resultImageData = resultCtx.createImageData(width, height);
        const resultData = resultImageData.data;

        // Pack channels into RGBA
        for (let i = 0; i < resultData.length; i += 4) {
            const pixelIndex = i / 4;
            const sourceIndex = pixelIndex * 4;

            // Use red component of each processed image as the channel value
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
        const images = Array.from(this.loadedImages.values()).map(data => data.image);
        
        const width = Math.max(...images.map(img => img.width));
        const height = Math.max(...images.map(img => img.height));
        
        return { width, height };
    }

    /**
     * Prepare channel data with inversion support
     */
    async prepareChannelData(width, height, rgbFill, alphaFill) {
        const channelData = {};
        
        for (const channel of this.channels) {
            if (this.loadedImages.has(channel)) {
                // Check if inversion is enabled for this channel
                const section = this.getChannelSection(channel);
                const invertCheckbox = section.querySelector('input[type="checkbox"]');
                const shouldInvert = invertCheckbox.checked;
                
                // Use actual image data with potential inversion
                const canvas = this.createChannelCanvas(
                    this.loadedImages.get(channel).image, 
                    width, 
                    height, 
                    shouldInvert
                );
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
     * Create canvas with channel image data and optional inversion
     */
    createChannelCanvas(image, targetWidth, targetHeight, shouldInvert = false) {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw image scaled to target dimensions
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
        
        // Apply inversion if requested
        if (shouldInvert) {
            const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];         // Red
                data[i + 1] = 255 - data[i + 1]; // Green
                data[i + 2] = 255 - data[i + 2]; // Blue
                // Alpha channel (i + 3) remains unchanged
            }
            
            ctx.putImageData(imageData, 0, 0);
        }
        
        return canvas;
    }

    /**
     * Display the packed result
     */
    displayResult(canvas) {
        const resultElement = this.getResultElement();
        
        const title = document.createElement('h3');
        title.textContent = '✅ Packed Result';
        
        const loadedChannels = Array.from(this.loadedImages.keys());
        const missingChannels = this.channels.filter(ch => !this.loadedImages.has(ch));
        const invertedChannels = this.channels.filter(ch => {
            if (!this.loadedImages.has(ch)) return false;
            const section = this.getChannelSection(ch);
            return section.querySelector('input[type="checkbox"]').checked;
        });
        
        const info = document.createElement('p');
        info.innerHTML = `
            <strong>Dimensions:</strong> ${canvas.width} × ${canvas.height}px<br>
            <strong>Loaded channels:</strong> ${loadedChannels.join(', ')}<br>
            ${missingChannels.length > 0 ? `<strong>Filled channels:</strong> ${missingChannels.join(', ')}<br>` : ''}
            ${invertedChannels.length > 0 ? `<strong>Inverted channels:</strong> ${invertedChannels.join(', ')}` : ''}
        `;
        info.style.marginBottom = '1rem';
        info.style.fontSize = '0.9rem';
        info.style.color = 'var(--medium-gray)';
        
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
`;
document.head.appendChild(style);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChannelPacker();
});
