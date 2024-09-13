import { HERO_CONTENT } from "../constants";
import profilePic from "../assets/MatinMobiniProfile.jpeg";
import thoughtBubble from "../assets/thoughtbubble.png";
import { motion, useAnimation } from "framer-motion";
import { useState, useEffect, useRef } from "react";

// Animation container with delay
const container = (delay) => ({
    hidden: { x: -100, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { duration: 2, delay },
    },
});

const Hero = () => {
    const controls = useAnimation(); // Controls for animation
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const titleRef = useRef(null); // Reference to the title element

    // Handle mouse movement to animate title
    const handleMouseMove = (e) => {
        if (titleRef.current) {
            const titleRect = titleRef.current.getBoundingClientRect();
            const titleCenterX = titleRect.left + titleRect.width / 2;
            const titleCenterY = titleRect.top + titleRect.height / 2;
            const x = e.clientX - titleCenterX;
            const y = e.clientY - titleCenterY;
            const distance = Math.sqrt(x * x + y * y);
            const maxDistance = 300; // Movement threshold

            let moveX = 0;
            let moveY = 0;

            if (distance < maxDistance) {
                // Move title away from cursor
                moveX = -(x / distance) * (maxDistance - distance) * 0.4;
                moveY = -(y / distance) * (maxDistance - distance) * 0.4;

                // Keep movement within screen bounds
                if (titleRect.left + moveX < 0 || titleRect.right + moveX > window.innerWidth) {
                    moveX = 0;
                }
                if (titleRect.top + moveY < 0 || titleRect.bottom + moveY > window.innerHeight) {
                    moveY = 0;
                }

                setPosition({ x: moveX, y: moveY });
            } else {
                setPosition({ x: 0, y: 0 }); // Reset position
            }
        }
    };

    // Update position with animation
    useEffect(() => {
        controls.start({
            x: position.x,
            y: position.y,
            transition: { duration: 0.4, ease: "easeOut" },
        });
    }, [position, controls]);

    return (
        <div className="border-b border-neutral-900 pb-4 lg:mb-35" onMouseMove={handleMouseMove}>
            <div className="flex flex-wrap">
                <div className="w-full lg:w-1/2">
                    <div className="relative flex flex-col item-center lg:items-start">
                        
                        {/* Thought bubble with responsive positioning */}
                        <div className="absolute top-[-120px] left-[-30px] sm:top-[-120px] sm:left-[-40px] lg:top-[-70px] lg:left-[-50px] flex items-center">
                            <img src={thoughtBubble} alt="Thought Bubble" className="w-32 h-32" />
                            <span className="font-semibold my-2 max-w-xl py-6 absolute text-black text-xl ml-7 mt-[-20px]">Try To Tag Me!</span>
                        </div>
                        
                        {/* Title with animation */}
                        <motion.h1
                            ref={titleRef}
                            initial={{ x: 0, y: 0 }}
                            animate={controls}
                            className="pb-16 text-6xl font-semibold tracking-tight lg:mt-16 lg:text-8xl text-white"
                        >
                            Matin Mobini
                        </motion.h1>

                        {/* Interactive button */}
                        <motion.button
                            initial={{ opacity: 0.6 }}
                            whileHover={{
                                scale: 1.4,
                                transition: { duration: 1 },
                            }}
                            whileTap={{ scale: 0.9 }}
                            whileInView={{ opacity: 1 }}
                            className="bg-gradient-to-r from-pink-300 via-slate-200 to-purple-500 bg-clip-text text-3xl tracking-tight text-transparent"
                        >
                            Artificial Intelligence<br />
                            Web Development<br />
                            Android Development
                        </motion.button>

                        {/* Hero content */}
                        <motion.p
                            variants={container(1)}
                            initial="hidden"
                            animate="visible"
                            className="my-2 max-w-xl py-6 font-light tracking-tighter"
                        >
                            {HERO_CONTENT}
                        </motion.p>
                    </div>
                </div>
                {/* Profile picture with animation */}
                <div className="w-full lg:w-1/2 lg:p-8">
                    <div className="flex justify-center">
                        <motion.img
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 1, delay: 1.2 }}
                            src={profilePic} alt="Matin Mobini" className="w-64 h-64 lg:w-80 lg:h-80" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
