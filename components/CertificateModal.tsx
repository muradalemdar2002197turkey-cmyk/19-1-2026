
import React from 'react';
import { Certificate, PlatformConfig } from '../types';

interface CertificateModalProps {
  certificate: Certificate;
  studentName: string;
  config: PlatformConfig;
  onClose: () => void;
}

const CertificateModal: React.FC<CertificateModalProps> = ({ certificate, studentName, config, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-fadeIn no-print-overlay">
      <div className="absolute top-4 left-4 flex gap-4 no-print">
        <button 
          onClick={handlePrint}
          className="bg-green-600 text-white px-8 py-3 rounded-full font-black shadow-xl hover:bg-green-700 transition-all flex items-center gap-2"
        >
          <span>تنزيل الشهادة (PDF) 📥</span>
        </button>
        <button 
          onClick={onClose}
          className="bg-white/10 text-white p-3 rounded-full hover:bg-white/20 transition-all"
        >
          ✖️
        </button>
      </div>

      {/* Certificate Content - Print Area */}
      <div className="bg-white text-gray-900 w-full max-w-[1000px] aspect-[1.414/1] shadow-2xl relative p-12 border-[20px] border-double border-yellow-600 print:shadow-none print:border-[15px] animate-scaleUp overflow-hidden" id="printable-certificate">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
           <img src={config.logo} className="absolute -top-20 -right-20 w-96 h-96 rotate-12" />
           <img src={config.logo} className="absolute -bottom-20 -left-20 w-96 h-96 -rotate-12" />
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-between border-4 border-yellow-500/20 p-8 sm:p-16">
          <div className="text-center space-y-4">
            <img src={config.logo} className="w-24 h-24 mx-auto rounded-full border-4 border-yellow-500 shadow-md mb-4" />
            <h1 className="text-4xl sm:text-6xl font-black text-yellow-700 font-serif mb-2">شهادة تقدير وتفوق</h1>
            <p className="text-lg sm:text-xl font-bold text-gray-500">Certificate of Appreciation</p>
          </div>

          <div className="text-center space-y-6 w-full">
            <p className="text-xl sm:text-2xl font-bold">تتشرف منصة <span className="text-blue-700">{config.teacherName}</span> بمنح هذه الشهادة لـ:</p>
            <div className="py-4 border-b-2 border-dashed border-yellow-500 inline-block px-12">
               <h2 className="text-4xl sm:text-6xl font-black text-blue-900 drop-shadow-sm">{studentName}</h2>
            </div>
            <div className="max-w-2xl mx-auto">
              <p className="text-lg sm:text-2xl font-bold leading-relaxed text-gray-700 italic">
                "{certificate.content}"
              </p>
            </div>
          </div>

          <div className="w-full flex justify-between items-end px-4 sm:px-12 mt-8">
            <div className="text-center space-y-1">
               <p className="text-[10px] sm:text-xs text-gray-400 font-black">تحريراً في:</p>
               <p className="font-black text-sm sm:text-lg">{certificate.date}</p>
            </div>
            
            <div className="relative flex flex-col items-center">
               <div className="absolute -top-20 opacity-30">
                  <img src={config.logo} className="w-32 h-32 grayscale" />
               </div>
               <p className="text-[10px] sm:text-xs text-gray-400 font-black mb-1">توقيع المعلم:</p>
               <p className="font-black text-xl sm:text-3xl font-serif text-blue-900 border-b-2 border-blue-900 pb-1">{config.teacherName}</p>
               <div className="mt-2 flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                  <span className="text-yellow-600 text-[10px] font-black">ختم المنصة الأصلي</span>
                  <span className="text-lg">✔️</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-certificate, #printable-certificate * { visibility: visible; }
          #printable-certificate {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 20px;
            border: 15px double #ca8a04 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default CertificateModal;
