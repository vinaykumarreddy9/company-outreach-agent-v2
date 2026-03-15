import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";

const RootLayout = () => {
  return (
    <div className="min-h-screen bg-brand-light flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
};

export default RootLayout;
