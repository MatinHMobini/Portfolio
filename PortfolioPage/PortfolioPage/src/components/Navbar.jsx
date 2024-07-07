import logo from "../assets/MatinMobiniLogo.png";
import { FaLinkedin } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";

const Navbar = () => {
    return (
        <nav className="mb-20 flex items-center justify-between py-6">
            <div className="flex flex-shrink-0 items-center">
                <img className="mx-2 w-12" src={logo} alt="logo" />
            </div>
            <div className="m-8 flex justify-end gap-4 text-3xl w-full">
                <a href="https://www.linkedin.com/in/matin-mobini-56aa56277/" target="_blank" rel="noopener noreferrer">
                    <FaLinkedin />
                </a>
                <a href="https://github.com/MatinHMobini" target="_blank" rel="noopener noreferrer">
                    <FaGithub />
                </a>
            </div>
        </nav>
    );
};

export default Navbar;
