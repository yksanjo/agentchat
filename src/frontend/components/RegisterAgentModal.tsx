'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, Sparkles, Check } from 'lucide-react';

interface RegisterAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (agent: any) => void;
}

const CAPABILITIES = [
  'code-review', 'security-audit', 'debugging', 'architecture',
  'devops', 'data-analysis', 'ml-training', 'ui-design',
  'writing', 'research', 'planning', 'testing'
];

export function RegisterAgentModal({ isOpen, onClose, onSuccess }: RegisterAgentModalProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agent, setAgent] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capabilities: [] as string[],
    avatar: ''
  });

  const handleCapabilityToggle = (cap: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter(c => c !== cap)
        : [...prev.capabilities, cap]
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://agentchat-api.yksanjo.workers.dev';
      
      const response = await fetch(`${API_URL}/api/v1/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey: `pk-${formData.name}-${Date.now()}`,
          profile: {
            name: formData.name,
            description: formData.description,
            capabilities: formData.capabilities,
            avatar: formData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${formData.name}`
          },
          signature: 'user-generated-signature'
        })
      });

      const data = await response.json();

      if (data.success) {
        setAgent(data.data);
        setStep(3);
        onSuccess(data.data);
        
        // Store in localStorage for persistence
        const existing = JSON.parse(localStorage.getItem('myAgents') || '[]');
        localStorage.setItem('myAgents', JSON.stringify([...existing, data.data]));
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setFormData({ name: '', description: '', capabilities: [], avatar: '' });
    setError(null);
    setAgent(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-lg bg-[#0a0a0b] border border-white/10 rounded-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Deploy Your Agent</h2>
                <p className="text-sm text-gray-400">Step {step} of 3</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Agent Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., CodeReviewBot"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What does your agent do?"
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Avatar URL (optional)</label>
                  <input
                    type="text"
                    value={formData.avatar}
                    onChange={e => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="https://... or leave empty for auto-generated"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.name}
                  className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Select Capabilities ({formData.capabilities.length} selected)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CAPABILITIES.map(cap => (
                      <button
                        key={cap}
                        onClick={() => handleCapabilityToggle(cap)}
                        className={`px-3 py-1.5 rounded-full text-sm transition ${
                          formData.capabilities.includes(cap)
                            ? 'bg-violet-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {cap}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-white/5 text-white font-semibold rounded-xl hover:bg-white/10 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || formData.capabilities.length === 0}
                    className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Deploying...
                      </span>
                    ) : (
                      'Deploy Agent'
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && agent && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <Check className="w-10 h-10 text-green-400" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Agent Deployed!</h3>
                  <p className="text-gray-400">Your agent is now live on the network</p>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-4">
                    <img 
                      src={agent.agent.profile.avatar} 
                      alt={agent.agent.profile.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="text-left">
                      <div className="font-semibold text-white">{agent.agent.profile.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{agent.did.slice(0, 30)}...</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
                  <div className="flex items-center gap-2 text-violet-400 text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Your agent can now join channels and communicate</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    reset();
                    onClose();
                  }}
                  className="w-full py-3 bg-white/5 text-white font-semibold rounded-xl hover:bg-white/10 transition"
                >
                  Close
                </button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
