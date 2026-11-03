import { useEffect } from "react";
import { ArrowRight, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface SignInRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SignInRequiredModal({
  isOpen,
  onClose,
  onSuccess,
}: SignInRequiredModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative border border-slate-200"
          >
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-display">Sign In Required</h3>
                  <p className="text-xs text-slate-500">Create a local account to save and load configurations.</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm text-slate-700">
                <p>This self-hosted version includes all features for every signed-in user.</p>
                <p>Use the profile page to create an account with email and password.</p>
              </div>

              <button
                id="go-to-profile"
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="w-full py-3 bg-accent-purple hover:bg-accent-slate text-white font-medium rounded-xl transition shadow-lg shadow-accent-purple/10 cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                Open Profile
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[10px] text-center text-slate-400 font-mono">
                No checkout required
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
