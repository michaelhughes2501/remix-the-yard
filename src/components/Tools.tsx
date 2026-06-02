import React, { useState } from 'react';
import { Scale, Search, Calculator, AlertTriangle, ExternalLink } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import Markdown from 'react-markdown';

export default function Tools() {
  const [dgetState, setDgetState] = useState('');
  const [dgetQuery, setDgetQuery] = useState('');
  const [dgetResult, setDgetResult] = useState<any>(null);
  const [isDgetLoading, setIsDgetLoading] = useState(false);

  const [crimeDetails, setCrimeDetails] = useState('');
  const [estimateResult, setEstimateResult] = useState('');
  const [isEstimateLoading, setIsEstimateLoading] = useState(false);

  const handleSearchDocket = async () => {
    if (!dgetState) return;
    setIsDgetLoading(true);
    try {
      const response = await geminiService.searchCourtDocket(dgetState, dgetQuery);
      setDgetResult(response);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDgetLoading(false);
    }
  };

  const handleEstimate = async () => {
    if (!crimeDetails) return;
    setIsEstimateLoading(true);
    try {
      const result = await geminiService.estimateSentence(crimeDetails);
      setEstimateResult(result || '');
    } catch (error) {
      console.error(error);
    } finally {
      setIsEstimateLoading(false);
    }
  };

  return (
    <div className="space-y-16">
      <header className="space-y-4">
        <h2 className="text-6xl font-serif italic tracking-tighter">Legal Tools</h2>
        <p className="text-xl opacity-60 max-w-2xl">
          Navigate the system. Search court dockets and estimate potential sentences.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Court Docket Search */}
        <section className="bg-white border border-[#141414] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Search className="opacity-40" />
            <h3 className="text-3xl font-serif italic">Court Docket Search</h3>
          </div>
          <p className="text-sm opacity-60">
            Find official court records and case information by state.
          </p>
          <div className="space-y-4">
            <select 
              value={dgetState}
              onChange={(e) => setDgetState(e.target.value)}
              className="w-full border border-[#141414] p-4 bg-transparent focus:outline-none"
            >
              <option value="">Select State...</option>
              <option value="California">California</option>
              <option value="New York">New York</option>
              <option value="Texas">Texas</option>
              <option value="Florida">Florida</option>
              <option value="Colorado">Colorado</option>
              {/* Add more states as needed */}
            </select>
            <input 
              type="text" 
              value={dgetQuery}
              onChange={(e) => setDgetQuery(e.target.value)}
              placeholder="Case number or name (optional)..."
              className="w-full border border-[#141414] p-4 bg-transparent focus:outline-none"
            />
            <button 
              onClick={handleSearchDocket}
              disabled={isDgetLoading}
              className="w-full bg-[#141414] text-[#E4E3E0] py-4 uppercase tracking-widest font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isDgetLoading ? 'Searching...' : 'Search Dockets'}
            </button>
          </div>

          {dgetResult && (
            <div className="mt-8 space-y-4">
              <div className="p-4 bg-[#141414]/5 rounded-sm">
                <Markdown>{dgetResult.text}</Markdown>
              </div>
              {dgetResult.candidates?.[0]?.groundingMetadata?.groundingChunks && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase tracking-widest font-bold opacity-40">Sources</h4>
                  {dgetResult.candidates[0].groundingMetadata.groundingChunks.map((chunk: any, i: number) => (
                    chunk.web && (
                      <a 
                        key={i} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <ExternalLink size={14} /> {chunk.web.title}
                      </a>
                    )
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Sentence Estimator */}
        <section className="bg-[#141414] text-[#E4E3E0] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Calculator className="text-yellow-400" />
            <h3 className="text-3xl font-serif italic">Sentence Estimator</h3>
          </div>
          <div className="flex items-start gap-3 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-sm">
            <AlertTriangle className="text-yellow-400 shrink-0" size={20} />
            <p className="text-xs opacity-80">
              DISCLAIMER: This tool provides rough estimates based on public data. It is NOT legal advice. Always consult with a qualified attorney.
            </p>
          </div>
          <div className="space-y-4">
            <textarea 
              value={crimeDetails}
              onChange={(e) => setCrimeDetails(e.target.value)}
              placeholder="Describe the charges, state, and any prior history..."
              className="w-full h-32 bg-white/10 border border-white/20 p-4 focus:outline-none focus:border-white/40"
            />
            <button 
              onClick={handleEstimate}
              disabled={isEstimateLoading}
              className="w-full bg-white text-[#141414] py-4 uppercase tracking-widest font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isEstimateLoading ? 'Calculating...' : 'Estimate Sentence'}
            </button>
          </div>

          {estimateResult && (
            <div className="mt-8 p-6 bg-white/5 rounded-sm prose prose-invert prose-sm">
              <Markdown>{estimateResult}</Markdown>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
