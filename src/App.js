import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      parts: [],
      script: [],
      line: 0,
      roomEntry: '',
      startEventId: '',
      messageCount: 0
    }
  }

  render() {
    return (
      <div className="App">
      <table>
        <tr>
          <td>Room:</td>
          <td><input type="text"
        value={this.state.roomEntry}
        onChange={evt => this.setState({roomEntry: evt.target.value})}
        ></input></td>
        <td>
          <button>Run</button>
        </td>
        </tr>
        <tr>
          <td>Start EventId:</td>
          <td><input type="text"
        value={this.state.startEventId}
        onChange={evt => this.setState({startEventId: evt.target.value})}
        ></input></td>
        </tr>
        <tr>
          <td>Message count:</td>
          <td><input type="number"
        value={this.state.messageCount}
        onChange={evt => this.setState({messageCount: evt.target.value})}
        max="50" min="1"
        ></input></td>
        </tr>
      </table>
        
        <header className="App-header">
          <p>
            Edit <code>src/App.js</code> and save to reload.
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

  updateInputValue(evt) {
    this.setState({
      inputValue: evt.target.value
    });
  }
}

export default App;
