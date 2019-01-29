import React, { Component } from 'react';
import './App.css';
import axios from 'axios';

var synth = window.speechSynthesis;
var voices = [];
window.utterances = [];

function configureVoices() {
  populateVoices();
  window.speechSynthesis.onvoiceschanged = function() {
    console.log("onvoiceschanged");
    populateVoices();
  }
}
configureVoices();
function populateVoices() {
  console.log("populateVoices");
  voices = [];
  for (var voice_index in window.speechSynthesis.getVoices()) {
    if (window.speechSynthesis.getVoices()[voice_index].lang.indexOf("en") === 0) {
      voices.push(window.speechSynthesis.getVoices()[voice_index]);
    }
  }
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

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
      roomId: '',
      events: []
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
      <ScriptGrid
        parts={this.state.parts}
        currentLine={this.state.line}
        script={this.state.script}
        nextLine={this.nextLine.bind(this)} />
      </div>
    );
  }

  async loadScriptFromEventId() {
    const access_token = "";
    var roomId = '';
    if (this.state.roomEntry[0] === "#") {
      var getIdUrl = "https://matrix.org/_matrix/client/r0/directory/room/";
      getIdUrl += encodeURIComponent(this.state.roomEntry);
      const res = await axios.get(getIdUrl);
      const { data } = await res;
      this.setState({roomId: data.room_id});
      roomId = data.room_id;
    } else {
      this.setState({roomId: this.state.roomEntry});
      roomId = this.state.roomEntry;
    }

    const url = `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(roomId)}/context/${encodeURIComponent(this.state.startEventId)}?limit=100&access_token=${access_token}`;

    axios.get(url)
    .then(res => {
      this.setState({events: [res.data.event].concat(res.data.events_after.filter(e => e.content.body))});
      console.log(res.data);
      this.nextLine();
    })

  }

  nextLine() {
    var line = this.state.line;
    if (! this.state.events[line]) return;
    var newPart = this.state.events[line].sender;
    if (! this.state.parts.find(p =>{return p.name === newPart;})) {
      this.setState({
        parts: this.state.parts.concat([{
          name: newPart,
          voice: voices[getRandomInt(0, voices.length)]
        }])
      })
    }
    this.setState({
      script: this.state.script.concat(this.state.events[line]),
      line: this.state.line + 1,
      nextText: "Continue"
    });
  }
}

class ScriptGrid extends Component {
  render() {
    const parts = this.props.parts.map((part, i) => {
      const lines = this.props.script.map((line, lineNumber) => { 
        line.lineNumber = lineNumber;
        return line; 
      }).filter(l => l.sender === part.name);

      return (
        <Part key={"part" + i} part={part}
        lines={lines}
        currentLine={this.props.currentLine}
        nextLine={this.props.nextLine}
        />
      );
    });
    return (
      <div className="container-outer">
        <div className="container-inner">
          <div>{parts}</div>
        </div>
      </div>
    )
  }
}

class Part extends Component {
  render() {
    const lines = this.props.lines.map((line, index) => {
      var lineText = line.content.body.split('\n')
                      .filter(l => l[0] !== '>' && l !== '')
                      .join('\n');
      lineText = lineText.replace( /(.*)\[(.*)\]\(.*\)(.*)/gm, `$1$2$3`);
      return (
        <Line
        key={"line"+index}
        lineText={lineText}
        lineNumber={line.lineNumber}
        currentLine={this.props.currentLine}
        part={this.props.part}
        nextLine={this.props.nextLine} />
      );
    });
    var age = this.props.currentLine - Math.max(...this.props.lines.map(l => {return l.lineNumber}));
    const divStyle = {
      display: age > 5 ? 'none' : 'initial'
    };
    return (
      <div 
      style={divStyle}
      className="part-column">
        <div className="part-name">{this.props.part.name}</div>
        {lines}
      </div>
    )
  }
}

class Line extends Component {
  constructor(props) {
    super(props);
    var utterance = new SpeechSynthesisUtterance();
    utterance.addEventListener('end', function () {
      console.log("stopped: " + utterance.text);
    });
    var nextLine = this.props.nextLine;
    utterance.onend = function(a) {
      console.log("ended: " + utterance.text);
      nextLine();
    };
    utterance.text = this.props.lineText;
    utterance.voice = this.props.part.voice;
    window.utterances.push(utterance); // makes utterance.onend more reliable in Chrome. it's true!
    synth.speak(utterance);
    console.log(utterance);
  }

  render() {
    const divStyle = {
      top: 30 + (this.props.lineNumber%10)*50 + "px",
      opacity: this.props.lineNumber + 1 === this.props.currentLine ? 1 :0.1
    };
    return(
      <div ref={"line"+this.props.lineNumber} style={divStyle}>{this.props.lineText}</div>
    );
  }
}

export default App;
