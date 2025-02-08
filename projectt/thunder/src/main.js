import { useState } from "react";
import Home from "./home";
import LoginForm from "./LoginForm";
import Register from "./register.js"; 
import NavBar from "./navbar"; 


const Main = () => {
    let [page, setPage] = useState("home");
    let currentPage;

    if (page === "home")
        currentPage = <Home navigate={setPage} />;
    else if (page === "login")
        currentPage = <LoginForm navigate={setPage} />;
    else if (page === "register")    
        currentPage = <Register navigate={setPage} />; 

    return (
        <div>
            //<NavBar navigate={setPage} /> 
            {currentPage}
        </div>
    );
};

export default Main;
