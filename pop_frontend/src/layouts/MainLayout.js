import "../App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "../components/Navbar";

export default function MainLayout({ children }) {
    return (
        <>
            <Navbar />
            {children}
        </>
    );
}
