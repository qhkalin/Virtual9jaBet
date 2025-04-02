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

interface LoseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoseModal({ isOpen, onClose }: LoseModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="bg-gray-900 border-red-500/20 max-w-md">
            <DialogHeader>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="text-7xl text-center mb-4"
              >
                😢
              </motion.div>
              <DialogTitle className="text-center text-3xl font-bold text-red-500">
                You Lost
              </DialogTitle>
              <DialogDescription className="text-center text-xl">
                Better luck next time!
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                className="w-full bg-primary hover:bg-blue-900 text-white font-bold py-3 px-4 rounded-lg transition"
                onClick={onClose}
              >
                Try Again
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
