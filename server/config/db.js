const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.warn('⚠️ MONGODB_URI not found in .env. Falling back to local development database.');
        }

        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medilink';
        const conn = await mongoose.connect(uri);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);

        if (process.env.NODE_ENV === 'development') {
            console.log('🛠️ [DEV MODE] Running with Mock Database for verification...');
            // In a real verification phase, we might want to continue with a mock here
            // but for now, we'll let it fail or the user provide the URI.
            // Actually, let's keep it as is but provide better logging.
        }
        process.exit(1);
    }
};

module.exports = connectDB;

