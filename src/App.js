import React  from 'react';
import './App.css';

import {Step} from "prosemirror-transform"
import {schema} from "prosemirror-schema-basic"
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import {collab, receiveTransaction, sendableSteps, getVersion} from "prosemirror-collab"
import 'prosemirror-view/style/prosemirror.css'

class App extends React.Component {
    constructor (props) {
        super(props);
        this.editorRef = React.createRef();
        this.view = null;
        this.editState = null;
        this.socket = null;
        this.dispatch = this.dispatch.bind(this);
    }

    dispatch(action) {
        if (action.type === "init") {
            this.editState = EditorState.create({
                doc: action.doc,
                schema: schema,
                plugins: [
                    collab({version: action.version}),
                ]
            });
            let tr = receiveTransaction(this.editState, action.steps, action.clientIDs)
            this.editState = this.editState.apply(tr);
            this.view = new EditorView(null, {
                state: this.editState,
                dispatchTransaction: transaction => this.dispatch({type: "transaction", transaction})
            });
            this.editorRef.current.appendChild(this.view.dom);
            this.forceUpdate();
        } else if (action.type === "transaction") {
            this.editState = this.editState.apply(action.transaction);
            const sendable = sendableSteps(this.editState);
            if (sendable) {
                this.send(sendable);
            }
            this.view.updateState(this.editState);
            this.forceUpdate();
        }
    }

    send(steps) {
        const json = JSON.stringify({
            version: getVersion(this.editState),
            steps: steps.steps.map(s => s.toJSON()),
            clientID: steps.clientID,
        });
        this.socket.send(json)
    }

    componentDidMount() {
        const url ='ws://localhost:8080?hash=' + window.location.hash.substring(1);
        this.socket = new WebSocket(url);
        this.socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case "init":
                    this.dispatch({
                        type: "init",
                        steps: data.steps.map(j => Step.fromJSON(schema, j)),
                        clientIDs: data.clientIDs,
                        doc: schema.nodeFromJSON(data.doc),
                        version: data.version
                    })
                    break;
                case "steps":
                    const steps = data.steps.map(j => Step.fromJSON(schema, j));
                    let tr = receiveTransaction(this.editState, steps, data.clientIDs)

                    this.dispatch({
                        type: "transaction",
                        transaction: tr
                    })
                    break;
            }
        });
    }

    render () {
        const editor = <div ref={this.editorRef} />
        return this.props.render ? this.props.render({
            editor,
            view: this.view
        }) : editor
    }
}

export default App;
