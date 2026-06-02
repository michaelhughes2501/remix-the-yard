import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, Book, MessageSquare, Shield, Briefcase } from 'lucide-react';

const faqs = [
  {
    category: 'Getting Started',
    icon: <Book size={20} />,
    questions: [
      {
        q: "What is this platform for?",
        a: "This platform is designed to support individuals re-entering society by providing resources for employment, housing, legal tracking, and a supportive community forum."
      },
      {
        q: "Is my information private?",
        a: "Yes. You can control what information is visible to others in your Profile settings. Only administrators have access to sensitive data."
      },
      {
        q: "How do I find a mentor?",
        a: "You can request a mentor through the Mentorship tab. We will match you with a verified mentor based on your background and goals."
      }
    ]
  },
  {
    category: 'Opportunities',
    icon: <Briefcase size={20} />,
    questions: [
      {
        q: "Are all jobs listed here felony-friendly?",
        a: "Yes, we specifically curate job listings from second-chance employers who are open to hiring individuals with criminal records."
      },
      {
        q: "How do I track my job applications?",
        a: "In the Opportunities tab, click on 'Application Tracker' to log and monitor the status of jobs you've applied for."
      }
    ]
  },
  {
    category: 'Community & Forum',
    icon: <MessageSquare size={20} />,
    questions: [
      {
        q: "What are the rules for the forum?",
        a: "We expect all members to be respectful, supportive, and constructive. Hate speech, harassment, and illegal content are strictly prohibited and will result in suspension."
      },
      {
        q: "How do I report inappropriate content?",
        a: "Click the 'Flag' icon on any thread or reply to report it to our moderation team for review."
      }
    ]
  },
  {
    category: 'Legal & Compliance',
    icon: <Shield size={20} />,
    questions: [
      {
        q: "How does the Case Tracker work?",
        a: "The Case Tracker allows you to log your legal cases, track their status, and set reminders for upcoming hearing dates."
      },
      {
        q: "Can my parole officer see my activity?",
        a: "Only if you explicitly share it with them. We do not automatically share your platform activity with law enforcement or parole officers."
      }
    ]
  }
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openQ, setOpenQ] = useState<string | null>(null);

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <header className="space-y-4 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-[#141414] text-[#E4E3E0] rounded-full flex items-center justify-center">
            <HelpCircle size={40} />
          </div>
        </div>
        <h2 className="text-6xl font-serif italic tracking-tighter">Help Center</h2>
        <p className="text-xl opacity-60 max-w-2xl mx-auto">
          Find answers to common questions and learn how to make the most of the platform.
        </p>
      </header>

      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" size={20} />
        <input 
          type="text"
          placeholder="Search for answers..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full border-2 border-[#141414] p-4 pl-12 focus:outline-none focus:ring-4 focus:ring-[#141414]/10 bg-white text-lg"
        />
      </div>

      <div className="space-y-8">
        {filteredFaqs.length === 0 ? (
          <div className="text-center p-12 border border-[#141414]/20 opacity-60 italic font-serif">
            No results found for "{searchQuery}". Please try different keywords.
          </div>
        ) : (
          filteredFaqs.map((category, idx) => (
            <div key={idx} className="bg-white border border-[#141414] overflow-hidden">
              <div className="bg-[#141414] text-[#E4E3E0] p-4 flex items-center gap-3">
                {category.icon}
                <h3 className="font-bold uppercase tracking-widest text-sm">{category.category}</h3>
              </div>
              <div className="divide-y divide-[#141414]/10">
                {category.questions.map((q, qIdx) => {
                  const isOpen = openQ === `${idx}-${qIdx}`;
                  return (
                    <div key={qIdx} className="bg-white">
                      <button 
                        onClick={() => setOpenQ(isOpen ? null : `${idx}-${qIdx}`)}
                        className="w-full text-left p-6 flex justify-between items-center hover:bg-[#141414]/5 transition-colors"
                      >
                        <span className="font-bold text-lg pr-8">{q.q}</span>
                        {isOpen ? <ChevronUp className="shrink-0" /> : <ChevronDown className="shrink-0 opacity-50" />}
                      </button>
                      {isOpen && (
                        <div className="p-6 pt-0 text-lg leading-relaxed opacity-80 bg-[#141414]/5 border-t border-[#141414]/10">
                          <div className="pt-6">{q.a}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-[#141414] text-[#E4E3E0] p-8 text-center space-y-4">
        <h3 className="text-2xl font-serif italic">Still need help?</h3>
        <p className="opacity-80">If you couldn't find the answer you were looking for, our support team is here to help.</p>
        <button className="bg-white text-[#141414] px-8 py-3 uppercase tracking-widest text-xs font-bold hover:bg-gray-200 transition-colors mt-4">
          Contact Support
        </button>
      </div>
    </div>
  );
}
