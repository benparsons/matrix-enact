import React, { Component } from 'react';
import './App.css';
import axios from 'axios';
import Modal from 'react-modal';

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

Modal.setAppElement('#root')

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      parts: [],
      script: [],
      line: 0,
      roomEntry: '#matrix:matrix.org',
      startEventId: '$1561541048242207hqsBl:matrix.org',
      messageCount: 50,
      roomId: '',
      events: [],
      statusMessage: "Loading...",
      modalIsOpen: true
    }
    this.closeModal = this.closeModal.bind(this);
    this.setGuestAccessToken();
  }

  componentDidMount() {

    this.setDefaultsFromHash();
  }

  closeModal() {
    this.setState({modalIsOpen: false});
  }

  async setDefaultsFromHash() {
    if (window.location.hash) {
      var hash = window.location.hash.split("/");
      if (hash.length < 3) return;

      this.setState({
        roomEntry: hash[1],
        startEventId: hash[2],  
      })
    }
  }

  async setGuestAccessToken() {

    if (this.state.accessToken) return;
    try {
      var url = "https://matrix.org/_matrix/client/r0/register?kind=guest";
      const res = await axios.post(url, {});
      const { data } = await res;
      this.setState({accessToken: data.access_token, statusMessage: "Ready"});
    } catch (error) {
      window._paq.push(['trackEvent', 'matrix-enact', 'error-2', error]);
    }
  }

  render() {
    return (
      <div className="App">
        <Modal
          isOpen={this.state.modalIsOpen}
          onAfterOpen={this.afterOpenModal}
          onRequestClose={this.closeModal}
          style={{content : {
              top                   : '50%',
              left                  : '50%',
              right                 : 'auto',
              bottom                : 'auto',
              marginRight           : '-50%',
              transform             : 'translate(-50%, -50%)'
            }
          }}
          contentLabel="Modal"
        >
          <h2 ref={subtitle => this.subtitle = subtitle}>Welcome to matrix-enact</h2>
          <div>matrix-enact "performs" the history from public Matrix rooms.</div>
          <div>Just give it a room id (or alias) a message ID to begin from and a message count,<br />and it will use the voices in your browser to read
            the history of the room.
          </div>
          <div><button onClick={this.closeModal}>close</button></div>
        </Modal>

<div className="container-outer">
        <div className="container-inner">
      <table>
        <tbody>
        <tr>
          <td rowSpan="3"><h1>matrix-enact</h1></td>
          <td>Room:</td>
          <td><input type="text"
        value={this.state.roomEntry}
        onChange={evt => this.setState({roomEntry: evt.target.value})}
        ></input></td>
        <td>
          <button
            disabled={this.state.loadDisabled}
            onClick={() => {
              window._paq.push(['trackEvent', 'matrix-enact', 'LoadButton', 'Clicked']);
              this.loadScriptFromEventId()
            }}>Load</button>
          <button onClick={() => window.location.reload()}>Stop&Refresh</button>
        </td>
        </tr>
        <tr>
          <td>Start EventId:</td>
          <td><input type="text"
        value={this.state.startEventId}
        onChange={evt => this.setState({startEventId: evt.target.value})}
        ></input></td>
          <td rowSpan="2" className="statusMessage">
            Status:<br />
            {this.state.statusMessage}
          </td>
        </tr>
        <tr>
          <td>Message count:</td>
          <td><input type="number"
        value={this.state.messageCount}
        onChange={evt => this.setState({messageCount: evt.target.value})}
        max="200" min="2"
        ></input></td>
        </tr>
        </tbody>
        </table>
        </div></div>
        <hr />
      <ScriptGrid
        parts={this.state.parts}
        currentLine={this.state.line}
        script={this.state.script}
        nextLine={this.nextLine.bind(this)} />
      </div>
    );
  }

  async loadScriptFromEventId(startEventId) {
    this.setState({statusMessage: "Loading events", loadDisabled: true})
    var roomId = '';
    var firstCall = false;
    if (! startEventId) { 
      startEventId = this.state.startEventId;
      firstCall = true;
    }
    if (this.state.roomEntry[0] === "#") {
      try {
        var getIdUrl = "https://matrix.org/_matrix/client/r0/directory/room/";
        getIdUrl += encodeURIComponent(this.state.roomEntry);
        const res = await axios.get(getIdUrl);
        const { data } = await res;
        this.setState({roomId: data.room_id});
        roomId = data.room_id;
      } catch (error) {
        console.log(error);
        window._paq.push(['trackEvent', 'matrix-enact', 'error-3', error]);
      }
    } else {
      this.setState({roomId: this.state.roomEntry});
      roomId = this.state.roomEntry;
    }

    // first we construct the url as per the CS API
    const url = `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(roomId)}/context/${encodeURIComponent(startEventId)}?limit=100&access_token=${this.state.accessToken}`;

    axios.get(url)
    .then(res => {

      var newEvents = [];
      if (firstCall) { newEvents = [res.data.event] };
      newEvents = newEvents.concat(res.data.events_after);
      newEvents = newEvents.filter(e => e.content.body);
      this.setState({events: this.state.events.concat(newEvents)});
      if (firstCall) { this.nextLine(); }
      console.log(this.state);
      if (this.state.messageCount > this.state.events.length) {
        // get last known event
        var lastEvent = res.data.events_after[res.data.events_after.length - 1];
        this.loadScriptFromEventId(lastEvent.event_id);
      } else {
        this.setState({events: this.state.events.slice(0, this.state.messageCount), statusMessage: "Done"});
      }
    })
    .catch(function (error) {
      console.log(error);
      window._paq.push(['trackEvent', 'matrix-enact', 'error-1', error]);
    });

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
      display: age > 8 ? 'none' : 'initial'
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
      //console.log("stopped: " + utterance.text);
    });
    var nextLine = this.props.nextLine;
    utterance.onend = function(a) {
      //console.log("ended: " + utterance.text);
      nextLine();
    };
    utterance.text = this.props.lineText;
    utterance.voice = this.props.part.voice;
    window.utterances.push(utterance); // makes utterance.onend more reliable in Chrome. it's true!
    synth.speak(utterance);
    //console.log(utterance);
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
