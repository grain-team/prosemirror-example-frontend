import ProseMirrorDocument from 'react-prosemirror-document';
import React, { Component } from 'react';
import './App.css';

const pmDocument = {
  type: 'doc',
  content: [{
    type: 'paragraph',
    content: [{
      type: 'text',
      text: 'Lets add a link to '
    }, {
      type: 'text',
      text: 'my website',
      marks: [{
        type: 'link',
        href: 'https://espen.codes/',
        title: 'Espen.Codes (personal website)'
      }]
    }, {
      type: 'text',
      text: ' for fun an profit.'
    }]
  }]
};

class App extends Component {
  render() {
    return (
        <ProseMirrorDocument document={pmDocument} />
    );
  }
}

export default App;
