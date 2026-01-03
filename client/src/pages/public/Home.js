import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield,
    Stethoscope,
    Plus,
    Activity,
    Zap,
    Clock,
    Lock,
    Users,
    ArrowRight,
    MoveRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '../../components/layout/Footer';

const Home = () => {
    const navigate = useNavigate();

    const features = [
        {
            title: "Doctor Management",
            description: "Seamless verification and access control for medical professionals across the system.",
            icon: Stethoscope,
            color: "text-purple-600",
            bg: "bg-purple-50"
        },
        {
            title: "Patient Records",
            description: "Comprehensive digital health history with multi-layer encryption and portable access.",
            icon: Activity,
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            title: "Appointment Booking",
            description: "Instant scheduling with real-time availability and smart doctor matching logic.",
            icon: Clock,
            color: "text-green-600",
            bg: "bg-green-50"
        },
        {
            title: "Analytics Dashboard",
            description: "Advanced health data visualization and trend analysis for better medical outcomes.",
            icon: Zap,
            color: "text-amber-600",
            bg: "bg-amber-50"
        }
    ];

    const stats = [
        { label: "Total Doctors", value: "2,400+", icon: Stethoscope },
        { label: "Total Patients", value: "150k+", icon: Users },
        { label: "Today's Appointments", value: "850+", icon: Clock },
        { label: "Medical Records", value: "1.2M", icon: Shield }
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <Plus size={24} strokeWidth={3} />
                        </div>
                        <span className="text-2xl font-black text-slate-800 tracking-tight">
                            Medi<span className="text-primary-600">Link</span>
                        </span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Features</a>
                        <a href="#stats" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Statistics</a>
                        <button
                            onClick={() => navigate('/emergency')}
                            className="text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors"
                        >
                            Emergency Scan
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-24 overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-200/20 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary-200/20 rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/2" />

                <div className="max-w-7xl mx-auto px-6 text-center lg:text-left flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1 space-y-10">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-xs font-black text-primary-600 shadow-sm border border-primary-50 tracking-widest uppercase mb-6">
                                <Shield size={14} /> Security First Architecture
                            </span>
                            <h1 className="text-6xl lg:text-8xl font-black text-slate-900 leading-[1.1] tracking-tight">
                                Welcome to <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600 italic">Healthcare</span> System
                            </h1>
                            <p className="mt-8 text-xl text-slate-500 font-medium max-w-2xl leading-relaxed">
                                Experience a seamless medical infrastructure that connects Doctors, Patients, and Administrators with high-performance digital tools and instant health record portability.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-wrap gap-4 justify-center lg:justify-start"
                        >
                            <button
                                onClick={() => navigate('/login', { state: { role: 'doctor' } })}
                                className="px-8 py-5 bg-primary-600 text-white rounded-[1.5rem] font-bold shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all hover:scale-105"
                            >
                                Doctor Login
                            </button>
                            <button
                                onClick={() => navigate('/login', { state: { role: 'admin' } })}
                                className="px-8 py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all hover:scale-105"
                            >
                                Admin Login
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                className="px-8 py-5 bg-white text-slate-900 border border-slate-200 rounded-[1.5rem] font-bold shadow-sm hover:bg-slate-50 transition-all"
                            >
                                Register Now <ArrowRight size={18} className="inline ml-2" />
                            </button>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 relative"
                    >
                        <div className="relative w-full aspect-square max-w-md mx-auto">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500 to-indigo-600 rounded-[4rem] rotate-6 opacity-10" />
                            <div className="absolute inset-0 bg-white rounded-[3.5rem] shadow-2xl border border-slate-100 p-8 flex flex-col justify-center gap-8">
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600">
                                        <Plus size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none mb-1">Health Records</h3>
                                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">End-to-End Encrypted</p>
                                </div>
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-4 bg-slate-50 rounded-full w-full relative overflow-hidden">
                                            <motion.div
                                                className="absolute inset-0 bg-primary-200 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.random() * 60 + 40}%` }}
                                                transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-slate-100 rounded-full w-3/4" />
                                        <div className="h-3 bg-slate-50 rounded-full w-1/2" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-24 space-y-4">
                        <span className="text-primary-600 font-black uppercase text-xs tracking-[0.3em]">Our Ecosystem</span>
                        <h2 className="text-5xl font-black text-slate-900">Advanced Digital Capabilities</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                whileHover={{ y: -12 }}
                                className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 group"
                            >
                                <div className={`w-14 h-14 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                                    <feature.icon size={28} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-4">{feature.title}</h3>
                                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">
                                    {feature.description}
                                </p>
                                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                    Learn More <MoveRight size={16} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section id="stats" className="py-24 bg-slate-900 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-10 left-10 w-40 h-40 border-4 border-white/20 rounded-full" />
                    <div className="absolute bottom-20 right-20 w-80 h-80 border-8 border-white/20 rounded-full" />
                </div>

                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center space-y-4">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-primary-400 mx-auto">
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <h4 className="text-4xl lg:text-5xl font-black text-white mb-2">{stat.value}</h4>
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 relative overflow-hidden">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <div className="bg-primary-600 rounded-[3.5rem] p-16 text-white shadow-2xl shadow-primary-200 relative">
                        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                        <h2 className="text-4xl font-black mb-6 leading-tight">Ready to Modernize Your <br />Medical Experience?</h2>
                        <p className="text-primary-100 mb-10 font-medium">Join 150,000+ users already using MedLink for secure health management.</p>
                        <button
                            onClick={() => navigate('/register')}
                            className="px-10 py-5 bg-white text-primary-600 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl hover:bg-slate-50 transition-all hover:scale-105"
                        >
                            Get Started for Free
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Home;
