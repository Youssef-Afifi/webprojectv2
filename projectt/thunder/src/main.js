import { useState, useEffect } from "react";
import Home from "./home";
import LoginForm from './LoginForm.';


const Main = ()=>{
    let [page,setPage]=useState('home');
    let currentPage;
    if(page==='home')
        currentPage=<Home/>
    else if(page==='login')
        currentPage=<LoginForm navigate={setPage}/>
}
export default Main;