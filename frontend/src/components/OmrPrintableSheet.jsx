import React from 'react';

export default function OmrPrintableSheet({ sheetData }) {
  if (!sheetData) return null;

  const { student, exam, institution, sheet_uid } = sheetData;
  const totalQuestions = exam.total_questions || 25;
  const options = ['A', 'B', 'C', 'D'];

  // Calculate layout columns: 20 or 25 questions -> 2 columns of 10 or 13; 50 questions -> 2 columns of 25; 100 questions -> 4 columns of 25
  let cols = 2;
  let rowsPerCol = Math.ceil(totalQuestions / 2);
  if (totalQuestions > 50) {
    cols = 4;
    rowsPerCol = 25;
  }

  // Partition questions by column
  const columnQuestions = [];
  for (let c = 0; c < cols; c++) {
    const qList = [];
    const startQ = c * rowsPerCol + 1;
    const endQ = Math.min((c + 1) * rowsPerCol, totalQuestions);
    for (let q = startQ; q <= endQ; q++) {
      qList.push(q);
    }
    columnQuestions.push(qList);
  }

  return (
    <div className="w-[210mm] min-h-[297mm] mx-auto bg-white text-black p-[8mm] shadow-xl print:shadow-none print:p-[5mm] print:m-0 flex flex-col justify-between select-none relative font-sans">
      
      {/* 4 SOLID CORNER ALIGNMENT FIDUCIAL MARKERS FOR OPENCV PERSPECTIVE WARP */}
      <div className="absolute top-[8mm] left-[8mm] w-[12mm] h-[12mm] bg-black" />
      <div className="absolute top-[8mm] right-[8mm] w-[12mm] h-[12mm] bg-black" />
      <div className="absolute bottom-[8mm] left-[8mm] w-[12mm] h-[12mm] bg-black" />
      <div className="absolute bottom-[8mm] right-[8mm] w-[12mm] h-[12mm] bg-black" />

      {/* Sheet Content Area (with margins around corner markers) */}
      <div className="mx-[14mm] mt-[4mm] mb-[4mm] flex-1 flex flex-col">
        
        {/* HEADER */}
        <div className="flex justify-between items-start border-b-2 border-black pb-3">
          <div className="flex-1 pr-4">
            <h1 className="text-xl font-black uppercase tracking-tight text-black">{institution}</h1>
            <h2 className="text-sm font-bold uppercase text-slate-800 tracking-wide mt-0.5">{exam.title}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-700 font-medium mt-1">
              <span><strong>Subject:</strong> {exam.subject}</span>
              <span><strong>Date:</strong> {exam.exam_date}</span>
              <span><strong>Total Questions:</strong> {totalQuestions}</span>
            </div>
          </div>

          {/* QR Code Block */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 border-2 border-black p-1 flex items-center justify-center bg-white">
              {/* Fallback QR representation */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(sheet_uid)}`}
                alt="Sheet QR Code"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <span className="text-[8px] font-mono font-bold tracking-tighter mt-1">{sheet_uid}</span>
          </div>
        </div>

        {/* CANDIDATE INFO BOX */}
        <div className="grid grid-cols-2 gap-3 border-2 border-black p-2.5 my-3 text-xs">
          <div>
            <p className="font-semibold text-slate-600">Candidate Full Name:</p>
            <p className="text-sm font-bold uppercase tracking-tight text-black border-b border-dashed border-slate-400 pb-0.5 mt-0.5">
              {student.name}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="font-semibold text-slate-600">Roll No:</p>
              <p className="font-bold text-sm text-black border-b border-dashed border-slate-400 pb-0.5 mt-0.5">{student.roll_no}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-600">Reg No:</p>
              <p className="font-bold text-xs text-black border-b border-dashed border-slate-400 pb-0.5 mt-0.5 truncate">{student.reg_no}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-600">Batch:</p>
              <p className="font-bold text-xs text-black border-b border-dashed border-slate-400 pb-0.5 mt-0.5 truncate">{student.batch}</p>
            </div>
          </div>
        </div>

        {/* FILLING INSTRUCTIONS GUIDE */}
        <div className="bg-slate-50 border border-slate-400 p-2 text-[10px] text-slate-800 flex items-center justify-between mb-4">
          <div>
            <strong>INSTRUCTIONS:</strong> Use black or dark blue ballpoint pen. Fill bubbles completely. Do not fold or tear this sheet.
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <div className="flex items-center space-x-1">
              <span className="text-emerald-700 font-bold">Correct:</span>
              <div className="w-3.5 h-3.5 rounded-full bg-black border border-black" />
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-rose-700 font-bold">Wrong:</span>
              <div className="w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center text-[8px] font-bold">✕</div>
              <div className="w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center text-[8px] font-bold">✓</div>
            </div>
          </div>
        </div>

        {/* OMR BUBBLE GRIDS */}
        <div className={`grid grid-cols-${cols} gap-6 flex-1`}>
          {columnQuestions.map((questions, colIndex) => (
            <div key={colIndex} className="border border-slate-300 rounded-lg p-2 flex flex-col justify-between">
              {/* Column header */}
              <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-1 font-bold text-[11px] text-slate-700">
                <span className="w-8">Q.No</span>
                <div className="flex space-x-4 pr-1">
                  {options.map(opt => (
                    <span key={opt} className="w-4 text-center">{opt}</span>
                  ))}
                </div>
              </div>

              {/* Question Rows */}
              <div className="space-y-1.5 flex-1 flex flex-col justify-around">
                {questions.map(qNum => (
                  <div key={qNum} className="flex items-center justify-between text-xs py-0.5">
                    <span className="w-8 font-bold font-mono text-[11px] text-slate-800">{qNum}.</span>
                    <div className="flex space-x-4">
                      {options.map(opt => (
                        <div 
                          key={opt}
                          className="w-4 h-4 rounded-full border border-black flex items-center justify-center text-[9px] font-bold text-black"
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="mt-4 pt-2 border-t border-black flex items-center justify-between text-[9px] text-slate-600 font-medium">
          <div>SmartOMR Automated Evaluation — Certified Optical Mark Recognition Form</div>
          <div>Candidate Signature: _______________________ &nbsp;&nbsp;&nbsp; Invigilator Signature: _______________________</div>
        </div>

      </div>

    </div>
  );
}

