import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface WinModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
}

export default function WinModal({ isOpen, onClose, amount }: WinModalProps) {
  // Use confetti effect when the modal is shown
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      // Only import and run on client
      import('canvas-confetti').then(confetti => {
        const duration = 3000;
        const end = Date.now() + duration;

        const colors = ['#FFD700', '#FFFFFF', '#002B5B'];

        (function frame() {
          confetti.default({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.8 },
            colors
          });
          
          confetti.default({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.8 },
            colors
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());
      });
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="bg-gray-900 border-[#FFD700]/20 max-w-md">
            <DialogHeader>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="text-7xl text-center mb-4"
              >
                🏆
              </motion.div>
              <DialogTitle className="text-center text-3xl font-bold text-[#FFD700]">
                Congratulations!
              </DialogTitle>
              <DialogDescription className="text-center text-xl">
                You won <span className="text-[#FFD700] font-bold">₦{amount.toLocaleString()}</span>!
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                className="w-full bg-[#FFD700] hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-lg transition"
                onClick={onClose}
              >
                Continue Playing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
