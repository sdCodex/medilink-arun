require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminExists = await Admin.findOne({ email: 'admin@medilink.com' });
        if (adminExists) {
            console.log('Admin already exists');
            process.exit(0);
        }

        const admin = await Admin.create({
            name: 'System Admin',
            email: 'admin@medilink.com',
            password: 'AdminPassword123!',
            role: 'admin',
            permissions: {
                canApproveDoctor: true,
                canViewAuditLogs: true,
                canRevokeAccess: true
            }
        });

        console.log('Admin created successfully:');
        console.log('Email: admin@medilink.com');
        console.log('Password: AdminPassword123!');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
