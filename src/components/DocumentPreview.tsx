import React, { useState, useEffect, useRef } from 'react';
import { Scale } from 'lucide-react';
import { SPADetails, SecDetails, ProposalDetails } from '../types';
import { cn } from '@/lib/utils';

interface DocumentPreviewProps {
  details: SPADetails;
  secDetails?: SecDetails;
  proposalDetails?: ProposalDetails;
  documentType: 'spa' | 'sec' | 'sec_dispute' | 'proposal';
  contentRef: React.RefObject<HTMLDivElement>;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ details, secDetails, proposalDetails, documentType, contentRef }) => {
  const [estimatedPages, setEstimatedPages] = useState(1);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();

  const phase1Base = proposalDetails?.phase1Fee ?? 50000;
  const phase2Base = proposalDetails?.phase2Fee ?? 30000;
  const phase3Base = proposalDetails?.phase3Fee ?? 30000;
  const isDiscount = !!proposalDetails?.isDiscountEligible;
  const discountPct = proposalDetails?.discountPercentage ?? 10;

  const phase1Final = isDiscount ? phase1Base * (1 - discountPct / 100) : phase1Base;
  const phase2Final = isDiscount ? phase2Base * (1 - discountPct / 100) : phase2Base;
  const phase3Final = isDiscount ? phase3Base * (1 - discountPct / 100) : phase3Base;

  const {
    affiantName,
    nationality,
    civilStatus,
    address,
    representatives,
    idType,
    idNumber,
    purposes,
    paperSize
  } = details;

  const innerPageHeight = paperSize === 'legal' ? '10.8in' : paperSize === 'a4' ? '9.4in' : '8.8in';

  useEffect(() => {
    const updatePages = () => {
      if (!contentContainerRef.current) return;
      const height = contentContainerRef.current.getBoundingClientRect().height;
      let pixelsPerPage = 1056;
      if (paperSize === 'a4') pixelsPerPage = 930;
      if (paperSize === 'letter') pixelsPerPage = 864;
      
      const pages = Math.ceil(height / pixelsPerPage);
      setEstimatedPages(pages + 1);
    };

    // Run immediately
    updatePages();

    // Run after a tiny delay to ensure React has fully painted the new text to the DOM
    const timeoutId = setTimeout(updatePages, 50);

    // Keep ResizeObserver as a fallback for any layout shifts
    const observer = new ResizeObserver(() => {
      updatePages();
    });

    if (contentContainerRef.current) {
      observer.observe(contentContainerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [details, paperSize]);

  const numberToWords = (num: number) => {
    const words = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN"];
    return words[num] || num.toString();
  };

  const getClientLastName = (fullName: string) => {
    if (proposalDetails?.clientLastName) {
      return proposalDetails.clientLastName
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    if (!fullName) return "Client";
    const cleaned = fullName.trim();
    const parts = cleaned.split(/\s+/);
    if (parts.length === 0) return "Client";
    let last = parts[parts.length - 1];
    const lowerLast = last.toLowerCase();
    if ((lowerLast === 'jr' || lowerLast === 'jr.' || lowerLast === 'sr' || lowerLast === 'sr.' || lowerLast === 'iii' || lowerLast === 'ii' || lowerLast === 'iv') && parts.length > 1) {
      last = parts[parts.length - 2];
    }
    return last.charAt(0).toUpperCase() + last.slice(1).toLowerCase();
  };

  const formatProposalDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      const day = d.getDate();
      const month = d.toLocaleDateString('en-US', { month: 'long' });
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return dateString;
    }
  };

  const paperClasses = {
    legal: 'w-[8.5in] min-h-[13in]',
    a4: 'w-[210mm] min-h-[297mm]',
    letter: 'w-[8.5in] min-h-[11in]'
  };

  const getProposalPageClass = () => {
    return cn(
      "bg-white shadow-2xl relative flex flex-col justify-between text-justify select-text",
      paperSize === 'legal' ? 'w-[8.5in] h-[13in] min-h-[13in]' : paperSize === 'a4' ? 'w-[210mm] h-[297mm] min-h-[297mm]' : 'w-[8.5in] h-[11in] min-h-[11in]',
      "pt-[0.5in] pb-[0.8in] px-[0.8in] mb-8 print:mb-0 print:shadow-none print:w-full print:h-screen print:min-h-0"
    );
  };

  return (
    <div className="flex flex-col items-center bg-muted p-8 overflow-auto print:bg-white print:p-0 print-container">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;700&display=swap');
        
        .document-font {
          font-family: 'Book Antiqua', 'Palatino Linotype', 'Palatino', 'Georgia', serif !important;
        }

        @media print {
          /* Hide UI elements marked with no-print */
          .no-print { display: none !important; }

          /* Reset layout constraints on all parent containers so the document flows naturally */
          body, #root, .min-h-screen, main, .overflow-auto {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            display: block !important;
            background: white !important;
          }

          /* Ensure the print content takes full width and removes screen styles */
          .print-content { 
            width: 100% !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          @page { 
            size: ${paperSize === 'legal' ? '8.5in 13in' : paperSize}; 
            margin: 0; 
          }
          
          .page-break { page-break-before: always !important; }
          .no-break { page-break-inside: avoid !important; }
          
          /* Prevent table rows from splitting across pages */
          tr { page-break-inside: avoid !important; }
          table { page-break-inside: auto !important; }
        }
      `}} />

      <div
        ref={contentRef}
        className={cn(
          "document-font text-black text-[12pt] print:shadow-none print:m-0 print-content w-full flex flex-col items-center",
          documentType === 'proposal'
            ? "bg-transparent shadow-none p-0 m-0"
            : cn("bg-white shadow-2xl p-[1in]", paperClasses[paperSize])
        )}
      >
        {/* Page 1 Content */}
        <div className="flex flex-col w-full items-center" ref={contentContainerRef}>
          {documentType === 'spa' ? (
            <>
              <div className="text-center font-bold mb-12 uppercase">
                SPECIAL POWER OF ATTORNEY
              </div>  

              <div className="font-bold mb-8 uppercase">KNOW ALL MEN BY THESE PRESENTS:</div>

              <div className="mb-6 leading-relaxed">
                I, <strong>{affiantName || "[NAME OF PRINCIPAL]"}</strong>, of legal age, {nationality || "Filipino"}, {civilStatus || "[CIVIL STATUS]"}, resident of {address || "[COMPLETE ADDRESS]"}, do hereby constitute and appoint representatives of <strong>SADSAD TAMESIS LEGAL AND ACCOUNTANCY FIRM</strong> including <strong>{representatives || "[NAME OF REPRESENTATIVES]"}</strong> of legal ages, Filipino, as my true and legal representatives to act for and in my name and stead and perform the following acts and things to wit:
              </div>

              <div className="print:break-inside-avoid">
                <ol className="list-decimal ml-8 mb-6 space-y-4">
                  {purposes?.map((p) => {
                    let formattedText = p.text;
                    
                    // Logic to cleanly inject RDO or LGU details without repetition
                    if (p.agency === 'BIR' && p.rdo) {
                      const rdoSuffix = ` - ${p.rdo}`;
                      // Check if the RDO is already present in the text
                      if (!formattedText.includes(p.rdo)) {
                        if (formattedText.includes('Bureau of Internal Revenue (BIR)')) {
                          formattedText = formattedText.replace('Bureau of Internal Revenue (BIR)', `Bureau of Internal Revenue (BIR)${rdoSuffix}`);
                        } else if (formattedText.includes('BIR')) {
                          formattedText = formattedText.replace('BIR', `BIR${rdoSuffix}`);
                        } else {
                          formattedText += rdoSuffix;
                        }
                      }
                    } else if (p.agency === 'LGU' && p.lgu) {
                      const lguSuffix = ` - ${p.lgu}`;
                      // Check if the LGU is already present in the text
                      if (!formattedText.includes(p.lgu)) {
                        if (formattedText.includes('Local Government Unit (LGU)')) {
                          formattedText = formattedText.replace('Local Government Unit (LGU)', `Local Government Unit (LGU)${lguSuffix}`);
                        } else if (formattedText.includes('LGU')) {
                          formattedText = formattedText.replace('LGU', `LGU${lguSuffix}`);
                        } else {
                          formattedText += lguSuffix;
                        }
                      }
                    }

                    return (
                      <li key={p.id} className="pl-2 leading-relaxed text-justify">
                        {formattedText}
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="mb-8 leading-relaxed">
                <strong>HEREBY GRANTING</strong> unto my representative full power and authority to execute and perform every act necessary to render effective the abovementioned power, as though I myself, has so performed it, and <strong>HEREBY APPROVING ALL</strong> that he/she may do by virtue hereof this authority. I have no objection for the said named authorized representatives, signing the documents on my behalf in my absence.
              </div>

              <div className="no-break">
                <div className="mb-12 leading-relaxed">
                  <strong>IN WITNESS WHEREOF</strong>, I have hereunto set my hand this ____ day of ____________ {currentYear}.
                </div>

                <div className="flex flex-col items-end mb-12 mt-20">
                  <div className="flex flex-col items-center min-w-[250px]">
                    <div className="w-full border-b border-black mb-1"></div>
                    <div className="font-bold uppercase text-center leading-tight">
                      {affiantName || "AFFIANT"}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (documentType === 'sec' || documentType === 'sec_dispute') ? (
            <>
              <div className="flex flex-col mb-12 ml-0 mr-auto w-fit">
                <div className="grid grid-cols-[auto_20px_auto] items-center">
                  <div className="font-bold uppercase whitespace-nowrap">REPUBLIC OF THE PHILIPPINES</div>
                  <div className="font-bold uppercase text-center">)</div>
                  <div className="w-10"></div>
                </div>
                <div className="grid grid-cols-[auto_20px_auto] items-center">
                  <div className="border-b border-black min-w-[250px]">&nbsp;</div>
                  <div className="font-bold uppercase text-center">)</div>
                  <div className="font-bold uppercase whitespace-nowrap ml-1">S.S.</div>
                </div>
              </div>

              <div className="text-center font-bold mb-12 uppercase">
                SECRETARY'S CERTIFICATE
              </div>

              {documentType === 'sec_dispute' && (
                <div className="font-bold mb-8 uppercase">KNOWN ALL MEN BY THIS PRESENTS</div>
              )}

              <div className="mb-6 leading-relaxed indent-12">
                I, <strong>{secDetails?.signatoryName || "[NAME OF SECRETARY]"}</strong>, of legal age, Filipino, with office address at <strong>{secDetails?.signatoryAddress || "[SIGNATORY OFFICE ADDRESS]"}</strong>, after being duly sworn in accordance with law, hereby certify that:
              </div>

              <div className="space-y-6 mb-8 text-justify">
                <div className="flex gap-4">
                  <span className="font-bold">1.</span>
                  <span>I am the duly elected and qualified <strong>{secDetails?.signatoryCapacity.split(' (')[0] || "Corporate Secretary"}</strong> of <strong>{secDetails?.corpName || "[CORPORATE NAME]"}</strong> (the "Corporation"), a corporation duly organized and existing under and by virtue of the laws of the Republic of the Philippines with address at <strong>{secDetails?.corpAddress || "[PRINCIPAL OFFICE ADDRESS]"}</strong>.</span>
                </div>

                <div className="flex gap-4">
                  <span className="font-bold">2.</span>
                  {documentType === 'sec_dispute' ? (
                    <span>
                      To the best of my knowledge, from the date of approval of the amendment by the Board of Directors in a meeting held on <strong>{secDetails?.meetingDate ? new Date(secDetails.meetingDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : "[DATE OF MEETING]"}</strong> and the Stockholders in a meeting held on <strong>{secDetails?.meetingDate ? new Date(secDetails.meetingDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : "[DATE OF MEETING]"}</strong> up to the date of filing of the application for amendment of Articles of Incorporation and/or By-Laws with the Commission, no action or proceeding has been filed or is pending before any Court involving an intra-corporate dispute and/or any claim by any person or group against the board of directors, individual director and/or major corporate officer/s of the Corporation as its duly elected and/or appointed director or officer or vice versa.
                    </span>
                  ) : (
                    <span>That as <strong>{secDetails?.signatoryCapacity.split(' (')[0] || "Corporate Secretary"}</strong>, I am the custodian of the corporate records of the Corporation including minutes of the meetings of its stockholders and Board of Directors.</span>
                  )}
                </div>

                {documentType !== 'sec_dispute' && (
                  <div className="flex gap-4">
                    <span className="font-bold">3.</span>
                    <span>That during the <strong>{secDetails?.meetingType || "[MEETING TYPE]"} Meeting</strong> of the Board of Directors of the Corporation held on <strong>{secDetails?.meetingDate ? new Date(secDetails.meetingDate).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : "[MEETING DATE]"}</strong>, at which meeting a quorum was present and acted throughout, the following resolutions was unanimously adopted and approved:</span>
                  </div>
                )}
              </div>

                {documentType !== 'sec_dispute' && (
                  <div className="ml-8 space-y-4 mb-6 text-justify pl-12 pr-12">
                    {secDetails?.clauses?.map((clause, idx) => (
                      <div key={clause.id} className="leading-relaxed">
                        <div className={clause.tableData ? "mb-4" : ""}>
                          <strong>{idx === 0 ? '"' : ''}{clause.type}</strong>{clause.text.trim().startsWith(',') ? '' : ','} {clause.text.trim()}{!clause.tableData && idx === (secDetails?.clauses.length || 0) - 1 ? '"' : ''}
                        </div>
                        {Array.isArray(clause.tableData) && clause.tableData.length > 0 && Array.isArray(clause.tableData[0]) && String(clause.tableData[0][0] || "").toLowerCase() !== "null" && (
                          <div className="mb-4 w-full">
                            <table className="w-[99%] mx-auto border-collapse border border-black text-[12pt]">
                              <tbody>
                                {clause.tableData.map((row, rIdx) => (
                                  <tr key={rIdx}>
                                    {Array.isArray(row) ? row.map((cell, cIdx) => (
                                      <td key={cIdx} className="border border-black p-2 text-center">
                                        {cell}
                                      </td>
                                    )) : (
                                      <td className="border border-black p-2 text-center">{String(row)}</td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {idx === (secDetails?.clauses.length || 0) - 1 && <span className="block mt-2 font-bold">"</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              {documentType !== 'sec_dispute' && (
                <div className="space-y-6 mb-12">
                  <div className="flex gap-4">
                    <span className="font-bold">4.</span>
                    <span>The above resolution has not been amended or revoked and can be relied upon until a subsequent resolution of the Board of Directors amending, modifying, or revoking the said resolution has been served upon the parties concerned.</span>
                  </div>
                </div>
              )}

              <div className="no-break mt-4">
                <div className="mb-6 leading-relaxed indent-12">
                  {documentType === 'sec_dispute' ? (
                    <><strong>IN TRUTH WITNESS WHEREOF</strong>, I have hereunto affixed my signature this ____ day of ____________, {currentYear}, in the City/Municipality of ____________________, Province of ____________________, Republic of the Philippines.</>
                  ) : (
                    <><strong>IN WITNESS WHEREOF</strong>, I affix my signature this ____ day of ____________ {currentYear} in ____________________.</>
                  )}
                </div>

                <div className="flex flex-col items-center mb-4 mt-10 ml-auto mr-0 w-fit">
                  <div className="flex flex-col items-center min-w-[300px]">
                    <div className="w-full border-b border-black mb-1"></div>
                    <div className="font-bold uppercase text-center leading-tight">
                      {secDetails?.signatoryName || "SIGNATORY NAME"}
                    </div>
                     <div className="text-sm mt-1">{secDetails?.signatoryCapacity.split(' (')[0] || "Corporate Secretary"}</div>
                   </div>
                 </div>
               </div>
             </>
          ) : (
            <div className="text-black leading-relaxed antialiased font-book-antiqua w-full flex flex-col items-center" style={{ fontFamily: "'Book Antiqua', 'Palatino Linotype', 'Palatino', 'Georgia', serif" }}>
              {/* PAGE 1: COVER PAGE */}
              <div className={getProposalPageClass()}>
                <div className="flex flex-col items-center w-full max-w-xl mx-auto pt-16">
                  {/* Central premium STLAF Logo */}
                  <div className="flex flex-col items-center select-none">
                    <img 
                      src="/custom_logo/header.png" 
                      alt="STLAF Logo" 
                      className="h-80 max-h-80 w-auto object-contain" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                <div className="my-auto py-8 flex flex-col items-center w-full">
                  {/* Dynamic Client display exactly matching target PDF style */}
                  <div className="w-auto border-b border-black pb-2 px-12">
                    <h1 className="text-[26px] font-bold text-black uppercase tracking-wider text-center">
                      {proposalDetails?.clientName || "[CLIENT NAME]"}
                    </h1>
                  </div>
                </div>

                {/* Cover Page Footer */}
                <div className="select-none -mx-[0.6in]">
                  <div className="w-full border-t-[3px] border-black mb-2"></div>
                  <div className="text-center tracking-wide font-bold" style={{ fontFamily: "'Source Serif 4', 'Georgia', serif", fontSize: "11pt" }}>
                    www.stlaf.global
                  </div>
                </div>
              </div>

              {/* Page Break to Page 2 */}
              <div className="page-break" />

              {/* PAGE 2: COVER LETTER & FIRST MODULE */}
              <div className={getProposalPageClass()}>
                <div>
                  {/* Compact Letterhead */}
                  <div className="flex justify-between items-center mb-6 select-none pb-4 -mx-[0.6in]">
                    <div className="flex items-center gap-3">
                      <img 
                        src="/custom_logo/header.png" 
                        alt="STLAF Logo" 
                        className="h-20 max-h-20 w-auto object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="text-right font-medium text-black leading-normal" style={{ fontFamily: "Georgia, serif", fontSize: "9.5pt" }}>
                      7F, Victoria Sports Tower<br />
                      EDSA, South Triangle, Quezon City, Philippines<br />
                      legal@sadsadtamesislaw.com | (02) 8463-494
                    </div>
                  </div>

                  {/* Letter Metadata */}
                  <div className="space-y-3 text-[11pt]">
                    <div className="leading-normal text-left" style={{ fontFamily: "'Book Antiqua', 'Palatino Linotype', 'Palatino', 'Georgia', serif", fontSize: "11pt" }}>
                      <div className="font-bold uppercase text-black">
                        {proposalDetails?.clientName || "[CLIENT NAME]"}
                      </div>
                      <div className="text-black font-normal" style={{ textTransform: 'none' }}>
                        {proposalDetails?.clientStreet || proposalDetails?.clientStreet2 || proposalDetails?.clientBarangay || proposalDetails?.clientCity || proposalDetails?.clientProvince ? (
                          <>
                            {proposalDetails.clientStreet && (
                              <div>
                                {proposalDetails.clientStreet}
                                {proposalDetails.clientBarangay ? `, ${proposalDetails.clientBarangay},` : ","}
                              </div>
                            )}
                            <div>
                              {proposalDetails.clientStreet2 ? `${proposalDetails.clientStreet2}, ` : ""}
                              {proposalDetails.clientCity || ""}
                              {proposalDetails.clientProvince ? `, ${proposalDetails.clientProvince}` : ""}
                            </div>
                          </>
                        ) : (
                          proposalDetails?.clientAddress || "PASAY CITY, METRO MANILA"
                        )}
                      </div>
                    </div>

                    <div className="font-bold text-black text-[11pt]">
                      {formatProposalDate(proposalDetails?.proposalDate || "")}
                    </div>

                    <div className="font-bold text-black pb-1 text-[11pt] tracking-wide">
                      PROPOSAL TO PROVIDE LEGAL ASSISTANCE AND ADVISORY SERVICES
                    </div>

                    <div className="text-black text-[11pt]">
                      Dear {proposalDetails?.salutation || "Mr."} {getClientLastName(proposalDetails?.clientName || "")},
                    </div>

                    <p className="text-black text-justify text-[11pt] leading-relaxed">
                      Thank you for considering STLAF (Sadsad Tamesis Legal and Accountancy Firm) to provide you with our legal services. At STLAF, we take pride in delivering more than just legal counsel and numerical analysis. Our approach emphasizes providing insights that transcend mere legalities and financial figures, ensuring the highest quality and excellence in our services.
                    </p>

                    <p className="text-black text-justify text-[11pt] leading-relaxed">
                      We are pleased to submit this proposal to you, offering legal assistance and advisory services for <span className="font-semibold text-black">{proposalDetails?.clientName || "the Client"}</span> for incorporation of new business.
                    </p>

                    <p className="text-black text-justify text-[11pt] leading-relaxed">
                      Upon acceptance, this proposal will serve as the contractual agreement between us, outlining the scope of services to be provided and confirming the respective responsibilities of both parties regarding the discussed engagement.
                    </p>

                    <div className="font-bold italic text-[11pt] text-black pt-1">
                      Scope of Services
                    </div>

                    <p className="text-black text-[11pt] leading-relaxed">
                      Based on our understanding, you intend to put up a new business, and thus in need of legal assistance to assist you in the registration of the said business with the related government offices in the Philippines. In this connection, we are sending you this proposal which will cover the following services:
                    </p>

                    {/* PHASE I LIST */}
                    {proposalDetails?.includePhase1 && (
                      <div className="space-y-1">
                        <div className="font-bold text-[11pt] text-black uppercase tracking-wide">
                           PHASE I: Securities and Exchange Commission (SEC)
                        </div>
                        <ul className="list-decimal pl-12 text-[11pt] text-black space-y-0.5">
                          <li>Legal advisory on how to put up a corporation in the Philippines;</li>
                          <li>Reservation and acquisition of Company name from the SEC;</li>
                          <li>Assistance in the drafting of documents, as necessary, to be submitted with the SEC, including By-Laws, Articles of Incorporation, Treasurer’s Affidavit, among others;</li>
                          <li>Coordination with your authorized representative and finalization of the required documents to be submitted to the SEC;</li>
                          <li>Submission and coordination with the officers of the SEC; and</li>
                          <li>Acquisition of the SEC Certification of Registration.</li>
                        </ul>
                      </div>
                    )}

                    {/* PHASE II PART I LIST */}
                    {proposalDetails?.includePhase2 && (
                      <div className="space-y-1 pt-1 break-inside-avoid">
                        <div className="font-bold text-[11pt] text-black uppercase tracking-wide">
                           PHASE II: Bureau of Internal Revenue (BIR)
                        </div>
                        <ul className="list-decimal pl-12 text-[11pt] text-black space-y-0.5">
                          <li>Preparation and acquisition of the necessary documents to be submitted to the BIR;</li>
                          <li>Drafting of Secretary’s Certificate and other documentary requirements;</li>
                          <li>Requisition of the Tax Identification Number of the new business;</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="select-none -mx-[0.6in]">
                  <div className="w-full border-t-[3px] border-black mb-2"></div>
                  <div className="text-center tracking-wide font-bold" style={{ fontFamily: "'Source Serif 4', 'Georgia', serif", fontSize: "11pt" }}>
                    www.stlaf.global
                  </div>
                </div>
              </div>

              {/* Page Break to Page 3 */}
              <div className="page-break" />

              {/* PAGE 3: BIR CONTINUED & PHASE III & FEES */}
              <div className={getProposalPageClass()}>
                <div>
                  {/* Compact Letterhead */}
                  <div className="flex justify-between items-center mb-6 select-none pb-4 -mx-[0.6in]">
                    <div className="flex items-center gap-3">
                      <img 
                        src="/custom_logo/header.png" 
                        alt="STLAF Logo" 
                        className="h-20 max-h-20 w-auto object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="text-right font-medium text-black leading-normal" style={{ fontFamily: "Georgia, serif", fontSize: "9.5pt" }}>
                      7F, Victoria Sports Tower<br />
                      EDSA, South Triangle, Quezon City, Philippines<br />
                      legal@sadsadtamesislaw.com | (02) 8463-494
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* PHASE II PART II */}
                    {proposalDetails?.includePhase2 && (
                      <div className="space-y-1">
                        <div className="font-bold text-[11pt] text-black uppercase tracking-wide">
                          PHASE II: Bureau of Internal Revenue (BIR) (cont'd)
                        </div>
                        <ul className="list-decimal pl-12 text-[11pt] text-black space-y-0.5" start={4}>
                          <li>Coordination with your authorized representative and finalization of required documents to be submitted to the BIR;</li>
                          <li>Requisition of the Certificate of the Authority to Print Receipts; and</li>
                          <li>Acquisition of BIR Certificate of Registration.</li>
                        </ul>
                      </div>
                    )}

                    {/* PHASE III LIST */}
                    {proposalDetails?.includePhase3 && (
                      <div className="space-y-1 pt-1">
                        <div className="font-bold text-[11pt] text-black uppercase tracking-wide">
                          PHASE III: Local Government Unit Permit to Operate (Mayor’s Permit)
                        </div>
                        <ul className="list-decimal pl-12 text-[11pt] text-black space-y-0.5">
                          <li>Coordination with the Local Government where the Company will operate;</li>
                          <li>Collation of all necessary documents to be submitted to the local government;</li>
                          <li>Drafting of Secretary’s Certificate and other documentary requirements;</li>
                          <li>Preparation of a summary of taxes and fees on behalf of the business;</li>
                          <li>Payment of taxes and fees on behalf of the business;</li>
                          <li>Secure clearance from ancillary departments of the local government; and</li>
                          <li>Acquisition of Mayor’s Permit issued by the Local Government Unit.</li>
                        </ul>
                      </div>
                    )}

                    {/* FEE ARRANGEMENT */}
                    <div className="pt-2">
                      <div className="font-bold italic text-[11pt] text-black mb-1">
                        Fee arrangement
                      </div>
                      <p className="text-black text-[11pt] leading-relaxed mb-4 text-justify">
                        Our usual professional fees are a function of the time spent required to carry out the engagement. All professional fees shall be exclusive of VAT and withholding taxes. In summary:
                      </p>

                      <div className="space-y-3">
                        {/* Phase 1 display block */}
                        {proposalDetails?.includePhase1 && (
                          <div className="text-[11pt] text-black space-y-1">
                            <div className="font-bold pl-12 uppercase select-none">
                              PHASE 1. SECURITIES AND EXCHANGE COMMISSION
                            </div>
                            <div className="pl-24 grid grid-cols-[280px_30px_1fr] text-[11pt] text-black items-baseline leading-normal">
                              <div>Upon acceptance of this proposal</div>
                              <div className="text-center">-</div>
                              <div>
                                <span className="font-bold">
                                  Php {phase1Final.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                {isDiscount && (
                                  <span className="block text-[11pt] italic mt-0.5 select-none text-black">
                                    {discountPct}% discount from Php {phase1Base.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Phase 2 display block */}
                        {proposalDetails?.includePhase2 && (
                          <div className="text-[11pt] text-black space-y-1">
                            <div className="font-bold pl-12 uppercase select-none">
                              PHASE 2. BUREAU OF INTERNAL REVENUE
                            </div>
                            <div className="pl-24 grid grid-cols-[280px_30px_1fr] text-[11pt] text-black items-baseline leading-normal">
                              <div>Upon release of BIR COR</div>
                              <div className="text-center">-</div>
                              <div>
                                <span className="font-bold">
                                  Php {phase2Final.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                {isDiscount && (
                                  <span className="block text-[11pt] italic mt-0.5 select-none text-black">
                                    {discountPct}% discount from Php {phase2Base.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Phase 3 display block */}
                        {proposalDetails?.includePhase3 && (
                          <div className="text-[11pt] text-black space-y-1">
                            <div className="font-bold pl-12 uppercase select-none">
                              PHASE 3. LOCAL GOVERNMENT UNIT
                            </div>
                            <div className="pl-24 grid grid-cols-[280px_30px_1fr] text-[11pt] text-black items-baseline leading-normal">
                              <div>Upon release of the Mayor's Permit</div>
                              <div className="text-center">-</div>
                              <div>
                                <span className="font-bold">
                                  Php {phase3Final.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                {isDiscount && (
                                  <span className="block text-[11pt] italic mt-0.5 select-none text-black">
                                    {discountPct}% discount from Php {phase3Base.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="select-none -mx-[0.6in]">
                  <div className="w-full border-t-[3px] border-black mb-2"></div>
                  <div className="text-center tracking-wide font-bold" style={{ fontFamily: "'Source Serif 4', 'Georgia', serif", fontSize: "11pt" }}>
                    www.stlaf.global
                  </div>
                </div>
              </div>

              {/* Page Break to Page 4 */}
              <div className="page-break" />

              {/* PAGE 4: ADMINISTRATIVE & SIGN OFF */}
              <div className={getProposalPageClass()}>
                <div>
                  {/* Compact Letterhead */}
                  <div className="flex justify-between items-center mb-6 select-none pb-4 -mx-[0.6in]">
                    <div className="flex items-center gap-3">
                      <img 
                        src="/custom_logo/header.png" 
                        alt="STLAF Logo" 
                        className="h-20 max-h-20 w-auto object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="text-right font-medium text-black leading-normal" style={{ fontFamily: "Georgia, serif", fontSize: "9.5pt" }}>
                      7F, Victoria Sports Tower<br />
                      EDSA, South Triangle, Quezon City, Philippines<br />
                      legal@sadsadtamesislaw.com | (02) 8463-494
                    </div>
                  </div>

                  <div className="space-y-3 text-[11pt]">
                    {/* SSS Note Block matches PDF */}
                    <p className="text-black text-[11pt] leading-relaxed">
                      Should you choose our law firm to register your business with the Social Security System (SSS), the Philippine Health Insurance Corporation (PhilHealth), and the Home Mutual Development Fund (HMDF/Pag-IBIG), the scope of this service includes the registration and acquisition of a corporate ID number for SSS, PhilHealth and Pag-IBIG. For the foregoing service, our professional fees shall be fixed at <span className="font-semibold text-black">Php {((proposalDetails?.govRegFee !== undefined ? proposalDetails.govRegFee : 10000)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> per Government Agency required.
                    </p>

                    <p className="text-black text-[11pt] leading-relaxed">
                      We shall send you our billings every fifth (5th) day of each month and expect payment from you no later than the tenth (10th) day of the same month, or five (5) days from the date of billing.
                    </p>

                    <p className="text-black leading-relaxed text-justify">
                      If your account is not paid within the 5-day limit, following our firm policy, the firm’s management will insist that no further work be done on your file until the account is paid and your retainer is brought up to date.
                    </p>

                    <p className="text-black leading-relaxed text-justify">
                      All indirect expenses shall be for the account of the client. However, in instances that we may be advised to advance some incidental necessary costs and other out-of-pocket expenses such as photocopying expenses, filing, and mailing fees, we expect to be reimbursed for the same within ten (10) days from the actual payment of such expense. Messengerial Expenses shall likewise be for the account of the client which shall be fixed at <span className="font-semibold text-black">Php {((proposalDetails?.messengerialMetroManila !== undefined ? proposalDetails.messengerialMetroManila : 1000)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> within Metro Manila and <span className="font-semibold text-black">Php {((proposalDetails?.messengerialOutside !== undefined ? proposalDetails.messengerialOutside : 1500)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> outside Metro Manila per day of legwork.
                    </p>

                    <p className="text-black leading-relaxed text-justify">
                      Unless related to pending cases that warrant the appearance of our lawyers or accountants, a minimal fee on meetings with third parties that you may require the presence of our lawyers or accountants shall be charged, (charges may change depending on the area or location).
                    </p>

                    <p className="text-black leading-relaxed text-justify">
                      You may rest assured that we will exert our best efforts to complete the engagement most professionally and expeditiously consistent with our desire to provide distinguished services.
                    </p>

                    {/* SINCERELY YOURS AND ATTY CHRIS */}
                    <div className="pt-2 select-none" style={{ fontFamily: "'Book Antiqua', 'Palatino Linotype', 'Palatino', 'Georgia', serif", fontSize: "11pt" }}>
                      <div className="text-black mb-8">Sincerely yours,</div>
                      
                      <div className="mb-4">
                        <div className="font-bold uppercase text-black leading-tight">
                          ATTY. CHRIS C. TAMESIS
                        </div>
                        <div className="text-black font-normal leading-tight">
                          Partner
                        </div>
                      </div>
                    </div>

                    {/* CONFORMITY */}
                    <div className="pt-2" style={{ fontFamily: "'Book Antiqua', 'Palatino Linotype', 'Palatino', 'Georgia', serif", fontSize: "11pt" }}>
                      <div className="text-left font-bold uppercase tracking-wide text-black mb-2 underline">
                        ACCEPTANCE and CONFORMITY
                      </div>

                      <div className="grid grid-cols-[1.2fr_1.1fr] gap-6 items-start">
                        {/* Acceptance text paragraph */}
                        <div>
                          <p className="text-black text-justify leading-relaxed">
                            I have read, and hereby accept, the terms of this engagement letter. Upon signing this proposal, I accept the following Phases/Package: <span className="italic">(Kindly put a mark below, Phases/Package of the services requested)</span>
                          </p>
                        </div>

                        {/* Checklist table matching the image with compact checkboxes */}
                        <div className="border border-black bg-white select-none">
                          <table className="w-full border-collapse">
                            <tbody>
                              <tr className="border-b border-black">
                                <td className="py-0.5 px-2 border-r border-black italic text-[11pt] leading-tight text-black font-book-antiqua" style={{ fontFamily: "'Book Antiqua', serif" }}>Phase 1</td>
                                <td className="py-0.5 px-2 text-center w-12">
                                  <div className="w-4 h-4 border border-black mx-auto"></div>
                                </td>
                              </tr>
                              <tr className="border-b border-black">
                                <td className="py-0.5 px-2 border-r border-black italic text-[11pt] leading-tight text-black font-book-antiqua" style={{ fontFamily: "'Book Antiqua', serif" }}>Phase 2</td>
                                <td className="py-0.5 px-2 text-center w-12">
                                  <div className="w-4 h-4 border border-black mx-auto"></div>
                                </td>
                              </tr>
                              <tr className="border-b border-black">
                                <td className="py-0.5 px-2 border-r border-black italic text-[11pt] leading-tight text-black font-book-antiqua" style={{ fontFamily: "'Book Antiqua', serif" }}>Phase 3</td>
                                <td className="py-0.5 px-2 text-center w-12">
                                  <div className="w-4 h-4 border border-black mx-auto"></div>
                                </td>
                              </tr>
                              <tr className="border-b border-black">
                                <td className="py-0.5 px-2 border-r border-black italic uppercase text-[11pt] leading-tight text-black font-book-antiqua" style={{ fontFamily: "'Book Antiqua', serif" }}>SSS</td>
                                <td className="py-0.5 px-2 text-center w-12">
                                  <div className="w-4 h-4 border border-black mx-auto"></div>
                                </td>
                              </tr>
                              <tr className="border-b border-black">
                                <td className="py-0.5 px-2 border-r border-black italic uppercase text-[11pt] leading-tight text-black font-book-antiqua" style={{ fontFamily: "'Book Antiqua', serif" }}>PAG-IBIG</td>
                                <td className="py-0.5 px-2 text-center w-12">
                                  <div className="w-4 h-4 border border-black mx-auto"></div>
                                </td>
                              </tr>
                              <tr>
                                <td className="py-0.5 px-2 border-r border-black italic uppercase text-[11pt] leading-tight text-black font-book-antiqua" style={{ fontFamily: "'Book Antiqua', serif" }}>PHILHEALTH</td>
                                <td className="py-0.5 px-2 text-center w-12">
                                  <div className="w-4 h-4 border border-black mx-auto"></div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Client Signature and Date Signed centered horizontally after the acceptance content */}
                      <div className="flex flex-col items-center justify-center mt-6 space-y-8 text-center select-none" style={{ fontFamily: "'Book Antiqua', 'Palatino Linotype', 'Palatino', 'Georgia', serif" }}>
                        <div className="flex flex-col items-center">
                          <span className="text-black select-none leading-none mb-1">
                            .........................................................................
                          </span>
                          <span className="font-bold uppercase tracking-wide text-black text-[12pt]">
                            {proposalDetails?.clientName || "[CLIENT NAME]"}
                          </span>
                        </div>

                        <div className="flex flex-col items-center">
                          <span className="text-black select-none leading-none mb-1">
                            .........................................................................
                          </span>
                          <span className="font-bold uppercase tracking-wide text-black text-[12pt]">
                            DATE SIGNED
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="select-none -mx-[0.6in]">
                  <div className="w-full border-t-[3px] border-black mb-2"></div>
                  <div className="text-center tracking-wide font-bold" style={{ fontFamily: "'Source Serif 4', 'Georgia', serif", fontSize: "11pt" }}>
                    www.stlaf.global
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Page 2: Jurat / Acknowledgement Section */}
        {documentType !== 'proposal' && (
          <div className="no-break mt-4 pt-2 flex flex-col">
            {documentType === 'spa' ? (
              <>
                <div className="text-center font-bold mb-12 uppercase">
                  ACKNOWLEDGEMENT
                </div>

                <div className="flex flex-col mb-8 ml-0 mr-auto w-fit">
                  <div className="grid grid-cols-[auto_20px_auto] items-center">
                    <div className="font-bold uppercase whitespace-nowrap">REPUBLIC OF THE PHILIPPINES</div>
                    <div className="font-bold uppercase text-center">)</div>
                    <div className="w-10"></div>
                  </div>
                  <div className="grid grid-cols-[auto_20px_auto] items-center">
                    <div className="border-b border-black min-w-[250px]">&nbsp;</div>
                    <div className="font-bold uppercase text-center">)</div>
                    <div className="font-bold uppercase whitespace-nowrap ml-1">S.S.</div>
                  </div>
                </div>

                <div className="mb-6 leading-relaxed">
                  I certify that on ____________ before me, a notary public duly authorized in the city named above to make acknowledgments personally appeared:
                </div>

                <table className="w-[99%] mx-auto table-fixed border-collapse border border-black mb-8">
                  <thead>
                    <tr>
                      <th className="border border-black p-3 text-center font-bold text-sm uppercase w-1/2">NAME</th>
                      <th className="border border-black p-3 text-center font-bold text-sm uppercase w-1/2">COMPETENT EVIDENCE OF IDENTITY</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-3 font-bold text-center align-middle h-24 uppercase">
                        {affiantName || "[NAME OF PRINCIPAL]"}
                      </td>
                      <td className="border border-black p-3 text-center align-middle h-24">
                        {idType || "[ID TYPE]"} No. {idNumber || "[ID NUMBER]"}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="mb-6 leading-relaxed">
                  Who is identified by me through his/her aforementioned competent evidence of identity to be the same person in the foregoing Special Power of Attorney consisting of <strong>{numberToWords(estimatedPages)} ({estimatedPages})</strong> pages, including in which this Acknowledgment is written, and who acknowledged to me that the signature appearing above was voluntarily affixed by him/her for the purposes stated therein, and who declared to me that he/she has executed the Special Power of Attorney as his/her free and voluntary act and deed.
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 leading-relaxed text-justify indent-12">
                  {documentType === 'sec_dispute' ? (
                    <><strong>SUBSCRIBED AND SWORN</strong> to before me this ____________ at ____________________, affiant exhibiting to me his/her {secDetails?.idType || "[ID TYPE]"} No. {secDetails?.idNumber || "[ID NUMBER]"}.</>
                  ) : (
                    <><strong>SUBSCRIBED AND SWORN</strong> to before me, a notary public in and for ____________________ this ____ day of ____________ {currentYear}, affiant personally appeared. I identified him/her, through competent evidence of identity, particularly, <strong>{secDetails?.idType || "[ID TYPE]"} No. {secDetails?.idNumber || "[ID NUMBER]"}</strong> to be the same person who presented the foregoing instrument, signed in my presence, and who took an oath before me as to such instrument.</>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-between items-start mt-8">
              <div className="text-[12pt] flex flex-col font-bold">
                <div className="grid grid-cols-[75px_80px_5px] items-end leading-none mb-1">
                  <span className="font-bold">Doc. No.</span>
                  <span className="border-b border-black"></span>
                  <span className="font-normal">;</span>
                </div>
                <div className="grid grid-cols-[75px_80px_5px] items-end leading-none mb-1">
                  <span className="font-bold">Page No.</span>
                  <span className="border-b border-black"></span>
                  <span className="font-normal">;</span>
                </div>
                <div className="grid grid-cols-[75px_80px_5px] items-end leading-none mb-1">
                  <span className="font-bold">Book No.</span>
                  <span className="border-b border-black"></span>
                  <span className="font-normal">;</span>
                </div>
                <div className="grid grid-cols-[75px_80px_5px] items-end leading-none">
                  <span className="font-bold">Series of</span>
                  <span className="font-bold">{currentYear}.</span>
                </div>
              </div>
              
              <div className="flex flex-col items-center min-w-[200px] mt-1 shrink-0">
                <div className="text-center font-bold uppercase pt-1 w-full text-sm">
                  NOTARY PUBLIC
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
