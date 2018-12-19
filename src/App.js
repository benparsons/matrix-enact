import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      parts: [],
      script: [],
      line: 0,
      roomEntry: '#matrix:matrix.org',
      startEventId: '$15451748443784682ewPHy:matrix.org',
      messageCount: 20,
      roomId: ''
    }
  }

  render() {
    return (
      <div className="App">
      <table>
        <tbody><tr>
          <td>Room:</td>
          <td><input type="text"
        value={this.state.roomEntry}
        onChange={evt => this.setState({roomEntry: evt.target.value})}
        ></input></td>
        <td>
          <button onClick={() => this.loadScriptFromEventId()}>Load</button>
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
        max="50" min="2"
        ></input></td>
        </tr>
        </tbody>
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

  async loadScriptFromEventId() {
    const access_token = "";

    if (this.state.roomEntry[0] === "#") {
      var getIdUrl = "https://matrix.org/_matrix/client/r0/directory/room/";
      getIdUrl += encodeURIComponent(this.state.roomEntry);
      const res = await axios.get(getIdUrl);
      const { data } = await res;
      this.setState({roomId: data.room_id});
    } else {
      this.setState({roomId: this.state.roomEntry});
    }

    const url = `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(this.state.roomId)}/context/${encodeURIComponent(this.state.startEventId)}?limit=${this.state.messageCount * 2 - 1}&access_token=${access_token}`;

    axios.get(url)
    .then(res => {
      console.log(res.data);
    })

  }
}

export default App;
