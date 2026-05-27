import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, CheckCircle2, ChevronRight, ChevronLeft, FileText, Music, Image as ImageIcon, FileCode, Presentation, AlertCircle, Check, Download } from 'lucide-react';
import { LANGUAGES, STATES, ISKCON_LOCATIONS, OFFERING_FORMATS } from '../constants';
import { supabase } from '../lib/supabase';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const formatFileName = (
  language: string,
  state: string,
  city: string,
  name: string,
  contact: string,
  index: number,
  originalName: string
) => {
  const sanitize = (text: string) =>
    text.toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

  const extension = originalName.split('.').pop() || '';
  const base = [
    sanitize(language),
    sanitize(state),
    sanitize(city),
    sanitize(name),
    sanitize(contact),
    index.toString()
  ];
  return `${base.join('-')}.${extension}`;
};

interface FormData {
  language: string;
  state: string;
  city: string;
  name: string;
  contact: string;
  formatType: string;
  textContent: string;
}

const STEPS = ['Format', 'Details', 'Content', 'Review'];

export default function OfferingForm({ userId }: { userId: string }) {
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
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [allFileUrls, setAllFileUrls] = useState<{url: string, name: string}[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cities = formData.state ? ISKCON_LOCATIONS[formData.state] || [] : [];

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const isStep1Valid = !!formData.formatType;
  const isStep2Valid = !!(formData.language && formData.state && formData.city && formData.name && formData.contact);
  const isStep3Valid = formData.formatType === 'text' ? !!formData.textContent.trim() : files.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let filesToUpload = [...files];

      // Convert text offering to Blob
      if (formData.formatType === 'text' && formData.textContent.trim() !== '') {
        const textBlob = new Blob([formData.textContent], { type: 'application/msword' });
        const textFile = new File([textBlob], 'text-offering.doc', { type: 'application/msword' });
        filesToUpload = [textFile];
      }

      const storedUserId = localStorage.getItem('user') || userId || 'anonymous';
      const cleanDataArray = [];

      if (filesToUpload.length > 0) {
        for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i];
          const renamedName = formatFileName(
            formData.language || 'unknown',
            formData.state || 'unknown',
            formData.city || 'unknown',
            formData.name || 'unknown',
            formData.contact || 'unknown',
            filesToUpload.length > 1 ? i + 1 : 1,
            file.name
          );

          // Upload to Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('offerings')
            .upload(renamedName, file, {
              contentType: file.type || 'application/octet-stream',
              upsert: false
            });

          if (uploadError) {
            throw new Error(`Storage upload failed: ${uploadError.message}`);
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('offerings')
            .getPublicUrl(renamedName);

          cleanDataArray.push({
            language: formData.language,
            state: formData.state,
            city: formData.city,
            name: formData.name,
            contact: formData.contact,
            format_type: formData.formatType,
            file_name: renamedName,
            file_url: publicUrl,
            file_index: filesToUpload.length > 1 ? i + 1 : 1,
            total_files: filesToUpload.length,
            user_id: storedUserId
          });
        }
      }

      // Insert into DB
      if (cleanDataArray.length > 0) {
        const { error: dbError } = await supabase.from('offerings').insert(cleanDataArray);
        if (dbError) throw new Error(`Database insert failed: ${dbError.message}`);
        
        if (cleanDataArray.length === 1) {
          setDownloadUrl(cleanDataArray[0].file_url);
        }
        setAllFileUrls(cleanDataArray.map(d => ({ url: d.file_url, name: d.file_name })));
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Frontend submission error:", err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (allFileUrls.length > 1) {
      const zip = new JSZip();
      for (const file of allFileUrls) {
        try {
          const res = await fetch(file.url);
          const blob = await res.blob();
          zip.file(file.name, blob);
        } catch { /* skip */ }
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'vyas_puja_submission.zip');
    } else if (allFileUrls.length === 1) {
      try {
        const res = await fetch(allFileUrls[0].url);
        const blob = await res.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = allFileUrls[0].name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      } catch {
        alert('Failed to download file.');
      }
    }
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto text-center p-12 bg-white rounded-2xl shadow-xl border border-stone-100"
      >
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-stone-900 mb-3">Offering Received</h2>
        <p className="text-stone-500 mb-8 leading-relaxed">
          Your heartfelt offering has been successfully logged and processed. All glories to Srila Prabhupada.
        </p>
        
        <div className="flex flex-col gap-3">
          {allFileUrls.length > 0 && (
            <button 
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 bg-stone-100 text-stone-700 px-6 py-4 rounded-xl font-bold hover:bg-stone-200 transition-colors"
            >
              <Download className="w-5 h-5" /> Download Copy
            </button>
          )}
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-orange-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-md shadow-orange-600/20"
          >
            Submit Another Offering
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4 gap-3">
          {STEPS.map((s, i) => {
            const isActive = i + 1 === step;
            const isCompleted = i + 1 < step;
            return (
              <div key={s} className="flex-1 flex flex-col gap-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isActive ? 'bg-orange-500' : isCompleted ? 'bg-orange-300' : 'bg-stone-200'
                  }`}
                />
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  isActive ? 'text-orange-600' : isCompleted ? 'text-orange-400' : 'text-stone-400'
                }`}>
                  {s}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 md:p-10 shadow-xl border border-stone-100">
        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            
            {/* STEP 1: FORMAT SELECTION */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Choose offering format</h2>
                  <p className="text-stone-500 text-sm">Select how you wish to present your offering</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {OFFERING_FORMATS.map(format => {
                    const Icon = {
                      text: FileText,
                      audio: Music,
                      image: ImageIcon,
                      document: FileCode,
                      ppt: Presentation
                    }[format.id] || FileText;

                    const description = {
                      text: "Write your offering",
                      audio: ".mp3 .wav .m4a",
                      image: ".jpg .png .webp",
                      document: ".pdf .doc .docx",
                      ppt: ".ppt .pptx"
                    }[format.id];

                    const isSelected = formData.formatType === format.id;

                    return (
                      <button
                        key={format.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, formatType: format.id, textContent: '' })}
                        className={`p-6 rounded-xl border-2 transition-all flex flex-col items-start gap-4 text-left relative overflow-hidden group ${
                          isSelected 
                            ? 'border-orange-500 bg-orange-50' 
                            : 'border-stone-200 hover:border-orange-300 hover:bg-stone-50'
                        }`}
                      >
                        <div className={`p-3 rounded-lg ${isSelected ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-500 group-hover:bg-orange-100 group-hover:text-orange-600'}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <span className={`block font-bold text-lg mb-1 ${isSelected ? 'text-orange-700' : 'text-stone-700'}`}>
                            {format.label}
                          </span>
                          <span className={`text-xs font-medium ${isSelected ? 'text-orange-600/70' : 'text-stone-400'}`}>
                            {description}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-4 right-4 text-orange-500">
                            <CheckCircle2 className="w-6 h-6" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-6 border-t border-stone-100">
                  <button 
                    type="button"
                    onClick={handleNext}
                    disabled={!isStep1Valid}
                    className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DETAILS FORM */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Devotee Details</h2>
                  <p className="text-stone-500 text-sm">Please provide your location and contact information</p>
                </div>
                
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-stone-700">Select Offering Language *</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      value={formData.language}
                      onChange={e => setFormData({ ...formData, language: e.target.value })}
                    >
                      <option value="">Choose a language</option>
                      {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-stone-700">State *</label>
                      <select 
                        required
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                        value={formData.state}
                        onChange={e => setFormData({ ...formData, state: e.target.value, city: '' })}
                      >
                        <option value="">Select State</option>
                        {STATES.map(state => <option key={state} value={state}>{state}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-stone-700">City / Temple Location *</label>
                      <select 
                        required
                        disabled={!formData.state}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all disabled:opacity-50"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                      >
                        <option value="">Select City</option>
                        {cities.map(city => <option key={city} value={city}>{city}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-stone-700">Full Devotee Name *</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g., Haridas Thakur Das"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-stone-700">Contact (Phone / Email) *</label>
                    <input 
                      required
                      type="text"
                      placeholder="Enter phone number or email address"
                      className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      value={formData.contact}
                      onChange={e => setFormData({ ...formData, contact: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-6 border-t border-stone-100">
                  <button 
                    type="button"
                    onClick={handleBack}
                    className="text-stone-500 px-6 py-3 font-semibold hover:text-stone-900 transition-colors flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button 
                    type="button"
                    onClick={handleNext}
                    disabled={!isStep2Valid}
                    className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: CONTENT INPUT */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Upload Content</h2>
                  <p className="text-stone-500 text-sm">Provide your {formData.formatType} offering below</p>
                </div>
                
                <div className="space-y-6">
                  {formData.formatType === 'text' ? (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-stone-700">Your Offering Text *</label>
                      <textarea 
                        required
                        className="w-full px-4 py-4 bg-stone-50 border border-stone-200 rounded-xl h-64 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
                        placeholder="Write your offering here..."
                        value={formData.textContent}
                        onChange={e => setFormData({ ...formData, textContent: e.target.value })}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <label className="text-sm font-semibold text-stone-700">Selected Files *</label>
                      <div className="relative border-2 border-dashed border-stone-300 bg-stone-50 rounded-xl p-12 transition-all hover:border-orange-400 group flex flex-col items-center justify-center cursor-pointer">
                        <input 
                          type="file" 
                          multiple 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={e => {
                            if (e.target.files) setFiles(Array.from(e.target.files));
                          }}
                        />
                        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Upload className="w-8 h-8 text-orange-500" />
                        </div>
                        <p className="text-stone-900 font-semibold mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-stone-500">
                          Supports {formData.formatType} files
                        </p>
                      </div>

                      {files.length > 0 && (
                        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
                          <p className="text-sm font-semibold text-stone-700 mb-3">{files.length} file(s) ready to upload:</p>
                          <ul className="space-y-2">
                            {files.map((f, i) => (
                              <li key={i} className="flex items-center gap-3 text-sm text-stone-600 bg-white p-2.5 rounded-lg border border-stone-100 shadow-sm">
                                <FileText className="w-4 h-4 text-orange-400" />
                                <span className="truncate">{f.name}</span>
                                <span className="ml-auto text-xs text-stone-400">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-6 border-t border-stone-100">
                  <button 
                    type="button"
                    onClick={handleBack}
                    className="text-stone-500 px-6 py-3 font-semibold hover:text-stone-900 transition-colors flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button 
                    type="button"
                    onClick={handleNext}
                    disabled={!isStep3Valid}
                    className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Review Details <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: REVIEW */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">Review & Submit</h2>
                  <p className="text-stone-500 text-sm">Please verify your details before final submission</p>
                </div>
                
                <div className="bg-stone-50 rounded-xl p-6 border border-stone-200 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">Format</p>
                      <p className="font-semibold text-stone-900 uppercase">{formData.formatType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">Language</p>
                      <p className="font-semibold text-stone-900">{formData.language}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">State</p>
                      <p className="font-semibold text-stone-900">{formData.state}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">City/Temple</p>
                      <p className="font-semibold text-stone-900">{formData.city}</p>
                    </div>
                  </div>

                  <div className="h-px bg-stone-200 w-full"></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">Devotee Name</p>
                      <p className="font-semibold text-stone-900 text-lg">{formData.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-1">Contact</p>
                      <p className="font-semibold text-stone-900">{formData.contact}</p>
                    </div>
                  </div>

                  <div className="h-px bg-stone-200 w-full"></div>

                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-wider mb-3">Content Attached</p>
                    {formData.formatType === 'text' ? (
                      <div className="bg-white p-4 rounded-lg border border-stone-200 text-sm text-stone-700 italic max-h-32 overflow-y-auto">
                        "{formData.textContent}"
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {files.map((f, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm font-medium text-stone-700 bg-white p-3 rounded-lg border border-stone-200">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="truncate">{f.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 text-red-700 bg-red-50 p-4 rounded-xl border border-red-100">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-semibold">{error}</p>
                  </div>
                )}

                <div className="flex justify-between pt-6 border-t border-stone-100">
                  <button 
                    type="button"
                    onClick={handleBack}
                    className="text-stone-500 px-6 py-3 font-semibold hover:text-stone-900 transition-colors flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Edit Details
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white px-10 py-3 rounded-lg font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 disabled:opacity-70 disabled:cursor-wait flex items-center gap-2 text-lg tracking-wide"
                  >
                    {loading ? (
                      'Submitting...'
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" /> Submit Offering
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
