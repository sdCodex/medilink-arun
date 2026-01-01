const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

/**
 * Upload file to Cloudinary from buffer
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} fileName - Original file name
 * @param {String} folder - Cloudinary folder name
 * @returns {Promise<Object>} Upload result with URL and public ID
 */
const uploadToCloudinary = (fileBuffer, fileName, folder = 'medical-reports') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: 'auto', // Automatically detect file type
                public_id: `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`,
                overwrite: false
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary Upload Error:', error);
                    reject(error);
                } else {
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                        format: result.format,
                        resourceType: result.resource_type,
                        bytes: result.bytes
                    });
                }
            }
        );

        // Convert buffer to stream and pipe to Cloudinary
        const readableStream = new Readable();
        readableStream.push(fileBuffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
    });
};

/**
 * Upload file from base64 string
 * @param {String} base64String - Base64 encoded file
 * @param {String} fileName - Original file name
 * @param {String} folder - Cloudinary folder name
 * @returns {Promise<Object>} Upload result
 */
const uploadBase64ToCloudinary = async (base64String, fileName, folder = 'medical-reports') => {
    try {
        const result = await cloudinary.uploader.upload(base64String, {
            folder,
            resource_type: 'auto',
            public_id: `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`,
            overwrite: false
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            resourceType: result.resource_type,
            bytes: result.bytes
        };
    } catch (error) {
        console.error('Cloudinary Base64 Upload Error:', error);
        throw error;
    }
};

/**
 * Delete file from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @param {String} resourceType - Resource type (image, video, raw)
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromCloudinary = async (publicId, resourceType = 'raw') => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });

        console.log(`✅ Deleted from Cloudinary: ${publicId}`);
        return result;
    } catch (error) {
        console.error('Cloudinary Delete Error:', error);
        throw error;
    }
};

/**
 * Get file info from Cloudinary
 * @param {String} publicId - Cloudinary public ID
 * @returns {Promise<Object>} File info
 */
const getFileInfo = async (publicId) => {
    try {
        const result = await cloudinary.api.resource(publicId, {
            resource_type: 'raw'
        });
        return result;
    } catch (error) {
        console.error('Cloudinary Get Info Error:', error);
        throw error;
    }
};

module.exports = {
    uploadToCloudinary,
    uploadBase64ToCloudinary,
    deleteFromCloudinary,
    getFileInfo
};
