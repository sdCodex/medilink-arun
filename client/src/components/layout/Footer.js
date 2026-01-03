import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter, Mail, Facebook, Heart } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <Heart size={24} fill="currentColor" />
                            </div>
                            <span className="text-2xl font-black text-slate-800">
                                Medi<span className="text-primary-600">Link</span>
                            </span>
                        </Link>
                        <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                            Empowering healthcare through secure, portable, and instant digital medical records. Your health, in your control.
                        </p>
                        <div className="flex gap-4">
                            <SocialIcon icon={Twitter} href="#" />
                            <SocialIcon icon={Github} href="#" />
                            <SocialIcon icon={Linkedin} href="#" />
                            <SocialIcon icon={Facebook} href="#" />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-slate-900 font-bold mb-6">Explore</h4>
                        <ul className="space-y-4">
                            <FooterLink to="/" label="Home" />
                            <FooterLink to="/about" label="About Us" />
                            <FooterLink to="/services" label="Services" />
                            <FooterLink to="/careers" label="Careers" />
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-slate-900 font-bold mb-6">Resources</h4>
                        <ul className="space-y-4">
                            <FooterLink to="/help" label="Help Center" />
                            <FooterLink to="/privacy" label="Privacy Policy" />
                            <FooterLink to="/terms" label="Terms of Service" />
                            <FooterLink to="/contact" label="Contact Us" />
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-slate-900 font-bold mb-6">Get in Touch</h4>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail className="text-primary-500 shrink-0 mt-1" size={18} />
                                <div>
                                    <p className="text-slate-800 text-sm font-bold">Support Email</p>
                                    <p className="text-slate-500 text-sm">support@medilink.com</p>
                                </div>
                            </div>
                            <div className="bg-primary-50 p-4 rounded-2xl border border-primary-100 mt-6">
                                <p className="text-primary-600 text-[10px] font-black uppercase tracking-widest mb-1">Emergency 24/7</p>
                                <p className="text-primary-800 text-lg font-black">+1 (800) MEDI-LINK</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-400 text-xs font-medium">
                        © 2026 MediLink. All rights reserved.
                    </p>
                    <div className="flex gap-8">
                        <Link to="/privacy" className="text-slate-400 text-xs hover:text-primary-600 transition-colors">Privacy</Link>
                        <Link to="/terms" className="text-slate-400 text-xs hover:text-primary-600 transition-colors">Terms</Link>
                        <Link to="/cookies" className="text-slate-400 text-xs hover:text-primary-600 transition-colors">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

const FooterLink = ({ to, label }) => (
    <li>
        <Link to={to} className="text-slate-500 text-sm hover:text-primary-600 transition-colors font-medium">
            {label}
        </Link>
    </li>
);

const SocialIcon = ({ icon: Icon, href }) => (
    <a
        href={href}
        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-primary-50 hover:text-primary-600 transition-all duration-300"
    >
        <Icon size={18} />
    </a>
);

export default Footer;
