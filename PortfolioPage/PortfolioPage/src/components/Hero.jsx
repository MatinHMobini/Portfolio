import { HERO_CONTENT } from "../constants";
import profilePic from "../assets/MatinMobiniProfile.png";
import { motion, useAnimation } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const container = (delay) => ({
    hidden: { x: -100, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { duration: 2, delay },
    },
});

const Hero = () => {
    const controls = useAnimation();
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const titleRef = useRef(null);

    const handleMouseMove = (e) => {
        if (titleRef.current) {
            const titleRect = titleRef.current.getBoundingClientRect();
            const titleCenterX = titleRect.left + titleRect.width / 2;
            const titleCenterY = titleRect.top + titleRect.height / 2;
            const x = e.clientX - titleCenterX;
            const y = e.clientY - titleCenterY;
            const distance = Math.sqrt(x * x + y * y);
            const maxDistance = 300; // Distance within which the title moves

            let moveX = 0;
            let moveY = 0;

            if (distance < maxDistance) {
                // Calculate movement direction based on cursor position
                moveX = -(x / distance) * (maxDistance - distance) * 0.4;
                moveY = -(y / distance) * (maxDistance - distance) * 0.4;

                // Ensure movement is within the screen bounds
                if (titleRect.left + moveX < 0 || titleRect.right + moveX > window.innerWidth) {
                    moveX = 0;
                }
                if (titleRect.top + moveY < 0 || titleRect.bottom + moveY > window.innerHeight) {
                    moveY = 0;
                }

                setPosition({ x: moveX, y: moveY });
            } else {
                setPosition({ x: 0, y: 0 });
            }
        }
    };

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
                    <div className="flex flex-col item-center lg:items-start">
                        <motion.h1
                            ref={titleRef}
                            initial={{ x: 0, y: 0 }}
                            animate={controls}
                            className="pb-16 text-6xl font-semibold tracking-tight lg:mt-16 lg:text-8xl text-white"
                        >
                            Matin Mobini
                        </motion.h1>

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
