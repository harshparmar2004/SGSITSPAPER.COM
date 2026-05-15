import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  
  // Initial load
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsVisible(false);
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAF7F2] select-none"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.4, 
              ease: "easeOut",
              delay: 0.1
            }}
            className="flex flex-col items-center"
          >
            <motion.div
               animate={{ 
                 y: [0, -10, 0],
               }}
               transition={{ 
                 duration: 2, 
                 repeat: Infinity,
                 ease: "easeInOut"
               }}
               className="mb-8 relative"
            >
              <div className="absolute inset-0 bg-amber-400 blur-3xl opacity-20 rounded-full" />
              <img
                src="/logo.svg"
                alt="SGSITS Logo"
                className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-[0_0_24px_rgba(251,191,36,0.4)] relative z-10"
              />
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-3xl md:text-5xl font-extrabold text-stone-900 tracking-tighter uppercase text-center"
            >
              SGSITS <span className="text-amber-700">PYQ Hub</span>
            </motion.h1>
            
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "circOut", repeat: Infinity, repeatDelay: 0.2 }}
              className="mt-10 w-48 h-1 overflow-hidden"
            >
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="w-full h-full bg-amber-500 rounded-full"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
