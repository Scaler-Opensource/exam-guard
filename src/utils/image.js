const resizeImage = (imageSrc, resizeOptions) => new Promise(
  (resolve, reject) => {
    const { width, height } = resizeOptions; // Default quality to 0.7 (adjustable)

    // Create a new image object
    const img = new Image();
    img.src = imageSrc;

    img.onload = () => {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set the canvas dimensions to the desired size
      canvas.width = width;
      canvas.height = height;

      // Draw the image on the canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Convert the resized image to a blob with compression
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg', // Use JPEG for smaller file size
        0.7, // Compression quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
  },
);

export default resizeImage;
