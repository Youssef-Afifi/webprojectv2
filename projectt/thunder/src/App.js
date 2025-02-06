import logo from './logo.svg';
import './App.css';
import './home.js';
import LoginForm from './LoginForm.js';
import RegistrationForm from './register.js';


function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
        <h1>thunder</h1>
        <RegistrationForm/>
        <LoginForm/>

        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
