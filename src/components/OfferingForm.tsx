import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, CheckCircle2, ChevronRight, ChevronLeft, FileText, Music, Image as ImageIcon, FileCode, Presentation, AlertCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { LANGUAGES, STATES, ISKCON_LOCATIONS, OFFERING_FORMATS } from '../constants';
import { formatFileName, createZipAndDownload, downloadSingleFile } from '../lib/file-utils';

interface FormData {
  language: string;
  state: string;
  city: string;
  name: string;
  contact: string;
  formatType: string;
  textContent: string;
}

export default function OfferingForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    language: '',
    state: '',
    city: '',
    name: '',
    contact: '',
    formatType: '',
    textContent: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cities = formData.state ? ISKCON_LOCATIONS[formData.state] || [] : [];

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Prepare entries for Firestore
      const timestamp = new Date().toISOString();
      const newEntries: any[] = [];

      if (formData.formatType === 'text') {
        newEntries.push({
          timestamp,
          dbTimestamp: serverTimestamp(),
          ...formData,
          fileName: "text-offering.txt",
          fileIndex: 1,
          totalFiles: 1
        });
      } else if (files.length > 0) {
        files.forEach((file, index) => {
          const renamedName = formatFileName(
            formData.language,
            formData.state,
            formData.city,
            formData.name,
            formData.contact,
            index + 1,
            file.name
          );
          newEntries.push({
            timestamp,
            dbTimestamp: serverTimestamp(),
            ...formData,
            fileName: renamedName,
            fileIndex: index + 1,
            totalFiles: files.length
          });
        });
      }

      // 2. Save to Firestore
      for (const entry of newEntries) {
        try {
          await addDoc(collection(db, 'offerings'), entry);
        } catch (dbErr) {
          handleFirestoreError(dbErr, 'create', 'offerings');
        }
      }

      // 3. Process local downloads for user
      if (formData.formatType !== 'text') {
        if (files.length === 1) {
          downloadSingleFile(files[0], formData);
        } else if (files.length > 1) {
          await createZipAndDownload(files, formData);
        }
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto text-center p-12 bg-white rounded-[2rem] shadow-2xl shadow-stone-200/50 border border-stone-100"
      >
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Offering Received</h2>
        <p className="text-stone-500 mb-8 leading-relaxed">
          Your heartfelt offering has been successfully logged and processed. All glories to Srila Prabhupada.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-natural-gold text-white px-8 py-4 rounded-xl font-bold hover:bg-natural-gold/90 transition-all shadow-lg shadow-natural-gold/20"
        >
          Submit Another Offering
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4 gap-2">
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all duration-700 ${
                s <= step ? 'bg-natural-gold' : 'bg-stone-200'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-stone-400">
          <span>Identity</span>
          <span>Personal</span>
          <span>Content</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-8 md:p-12 shadow-2xl shadow-stone-200/40 border border-stone-100">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-8">General Information</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Select Offering Language</label>
                  <select 
                    required
                    className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-natural-gold focus:bg-white transition-all"
                    value={formData.language}
                    onChange={e => setFormData({ ...formData, language: e.target.value })}
                  >
                    <option value="">Select Language</option>
                    {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">State</label>
                    <select 
                      required
                      className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-natural-gold focus:bg-white transition-all"
                      value={formData.state}
                      onChange={e => setFormData({ ...formData, state: e.target.value, city: '' })}
                    >
                      <option value="">Select State</option>
                      {STATES.map(state => <option key={state} value={state}>{state}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">City / Temple Location</label>
                    <select 
                      required
                      disabled={!formData.state}
                      className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-natural-gold focus:bg-white transition-all disabled:opacity-50"
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                    >
                      <option value="">Select City</option>
                      {cities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-8">
                <button 
                  type="button"
                  onClick={handleNext}
                  disabled={!formData.language || !formData.state || !formData.city}
                  className="bg-natural-gold text-white px-10 py-4 rounded-xl font-bold hover:bg-natural-gold/90 transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl shadow-natural-gold/20"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-8">Personal Details</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Full Devotee Name</label>
                  <input 
                    required
                    type="text"
                    placeholder="Enter full name"
                    className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-natural-gold focus:bg-white transition-all"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Contact (Phone / Email)</label>
                  <input 
                    required
                    type="text"
                    placeholder="Enter phone or email"
                    className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-natural-gold focus:bg-white transition-all"
                    value={formData.contact}
                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <button 
                  type="button"
                  onClick={handleBack}
                  className="text-stone-400 px-6 py-4 font-bold uppercase tracking-widest text-[11px] hover:text-natural-olive transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button 
                  type="button"
                  onClick={handleNext}
                  disabled={!formData.name || !formData.contact}
                  className="bg-natural-gold text-white px-10 py-4 rounded-xl font-bold hover:bg-natural-gold/90 transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl shadow-natural-gold/20"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-8">Offering Content</h2>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Offering Format</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {OFFERING_FORMATS.map(format => {
                      const Icon = {
                        text: FileText,
                        audio: Music,
                        image: ImageIcon,
                        document: FileCode,
                        ppt: Presentation
                      }[format.id] || FileText;

                      return (
                        <button
                          key={format.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, formatType: format.id, textContent: '' })}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center ${
                            formData.formatType === format.id 
                              ? 'border-natural-gold bg-natural-gold/5 text-natural-gold' 
                              : 'border-stone-100 bg-stone-50 hover:bg-stone-100 text-stone-400'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-tighter">{format.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formData.formatType === 'text' ? (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Your Offering</label>
                    <textarea 
                      required
                      className="w-full px-5 py-4 bg-stone-50 border border-stone-200 rounded-2xl h-64 text-sm focus:outline-none focus:ring-2 focus:ring-natural-gold focus:bg-white transition-all resize-none"
                      placeholder="Write your offering here..."
                      value={formData.textContent}
                      onChange={e => setFormData({ ...formData, textContent: e.target.value })}
                    />
                  </div>
                ) : formData.formatType ? (
                  <div className="space-y-4">
                    <label className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Upload Files</label>
                    <div className="relative border-2 border-dashed border-stone-200 bg-stone-50 rounded-2xl p-10 transition-all hover:border-natural-gold/40 group">
                      <input 
                        type="file" 
                        multiple 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={e => {
                          if (e.target.files) setFiles(Array.from(e.target.files));
                        }}
                      />
                      <div className="text-center group-hover:scale-105 transition-transform">
                        <Upload className="w-12 h-12 text-stone-300 mx-auto mb-4 group-hover:text-natural-gold" />
                        <p className="text-sm text-stone-500 font-medium">
                          {files.length > 0 
                            ? `${files.length} file(s) selected` 
                            : 'Drag & drop or browse files'
                          }
                        </p>
                        <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-2">{formData.formatType} files only</p>
                      </div>
                    </div>
                    {files.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {files.map((f, i) => (
                          <div key={i} className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-[10px] font-bold border border-stone-200">
                            {f.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {error && (
                <div className="flex items-center gap-3 text-red-700 bg-red-50 p-4 rounded-2xl border border-red-100">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-wide">{error}</p>
                </div>
              )}

              <div className="flex justify-between pt-8 items-center">
                <button 
                  type="button"
                  onClick={handleBack}
                  className="text-stone-400 px-6 py-4 font-bold uppercase tracking-widest text-[11px] hover:text-natural-olive transition-colors flex items-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" /> Back
                </button>
                <button 
                  type="submit"
                  disabled={loading || !formData.formatType || (formData.formatType === 'text' ? !formData.textContent : files.length === 0)}
                  className="bg-natural-gold text-white px-12 py-5 rounded-full font-black uppercase tracking-[0.15em] text-xs hover:bg-natural-gold/90 transition-all flex items-center gap-3 disabled:opacity-50 shadow-2xl shadow-natural-gold/30"
                >
                  {loading ? 'Processing...' : (
                    <>
                      Submit & Download <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
