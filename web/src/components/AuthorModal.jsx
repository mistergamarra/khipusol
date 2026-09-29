import React from 'react';
import { X, User, Mail } from 'lucide-react';

export default function AuthorModal({ isOpen, onClose, t }) {
    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-8 shadow-2xl relative text-center space-y-5">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition">
                    <X className="w-5 h-5" />
                </button>

                <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/30">
                    <User className="w-8 h-8" />
                </div>

                <div>
                    <h3 className="text-xl font-bold text-slate-200 mb-1.5">{t.authorTitle}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{t.authorBio}</p>
                </div>

                <div className="space-y-3 pt-1">
                    <a
                        href="mailto:mister.gamarra@gmail.com"
                        className="flex items-center gap-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-4 py-3 rounded-xl text-slate-300 hover:text-white transition text-xs font-medium">
                        <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="truncate">mister.gamarra@gmail.com</span>
                    </a>
                    <a
                        href="https://github.com/mistergamarra"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-4 py-3 rounded-xl text-slate-300 hover:text-white transition text-xs font-medium">
                        <svg className="w-4 h-4 fill-current text-purple-400 shrink-0" viewBox="0 0 24 24">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02_0 0024 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                        <span>github.com/mistergamarra</span>
                    </a>
                    <a
                        href="https://linkedin.com/in/arnold-gamarra"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 px-4 py-3 rounded-xl text-slate-300 hover:text-white transition text-xs font-medium">
                        <svg className="w-4 h-4 fill-current text-cyan-400 shrink-0" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        <span>LinkedIn Profile</span>
                    </a>
                </div>
            </div>
        </div>
    );
}