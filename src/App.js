import React, {useReducer, useState, useRef} from "react";
import * as mobilenet from "@tensorflow-models/mobilenet";
import "./App.css";

// Represents each of the 6 states in the application
const stateMachine = {
  initial: "initial",
  states: {
    initial: {on: {next: "loadingModel" }},
    loadingModel: {on: {next: "awaitUpload"}},
    awaitUpload: {on: {next: "ready"}},
    ready: {on: {next: "classifying"}, showImage: true},
    classifying: {on: {next: "complete"}},
    complete: {on: {next: "awaitUpload"}, showImage: true, showResults:true}
  }
};

function App() {
  const reducer = (currentState, event) => stateMachine.states[currentState].on[event] || stateMachine.initial;

  // STATES USED
  // state: a string for current state
  // dispatch: fires an  event into the reducer to get a new state
  const [state, dispatch] = useReducer(reducer, stateMachine.initial);
  const [model, setModel] = useState(null);
  const [imageURL, setImageUrl] = useState(null);
  const [results, setResults] = useState([]);
  const inputRef = useRef();
  const imageRef = useRef();

  // FUNCTIONS


  const next = () => dispatch('next');

  const loadModel = async () => {
    //first transition to loading the model
    next();

    const mobilenetModel = await mobilenet.load();
    setModel(mobilenetModel);

    //next transition to await
    next();
  };

  // rep invariant: app only handles one image at a time (first
  //                    item in the array of files ONLY)
  const handleUpload = e => {
    const {files} = e.target;

    // an image that we need to turn into an url
    //  which we will use as the source of an image
    //  element.
    if(files.length > 0) {
      const url = URL.createObjectURL(e.target.files[0]);
      setImageUrl(url);
      next();
    }
  };

  const identify = async () => {
    next();
    const results = await model.classify(imageRef.current);
    setResults(results);
    next();
  };

  const reset = async () => {
    setResults([]);
    next();
  };


  const buttonProps = {
    initial: { text: 'Load Model', action: loadModel},
    loadingModel: {text: 'Loading Model...'},
    awaitUpload: {text: 'Upload Photo', action: () => inputRef.current.click()},
    ready: {text: 'Identify', action: identify},
    classifying: {text: 'Identifying', action: () => {}},
    complete: {text: 'Reset', action: reset}
  };

  // we set showImage to be false as a default to ensure that we don't
  // cause any errors in image HTML
  const {showImage = false, showResults = false} = stateMachine.states[state];

  return (
      <div>
        {showImage && <img alt= "preview" src = {imageURL} ref = {imageRef}/>}
        <input type="file" accept = "image/*" capture = "camera" ref = {inputRef} onChange = {handleUpload}/>

        {showResults && (
            <ul>
              {results.map(({ className, probability }) => (
                  <li key={className}>{`${className}: %${(probability * 100).toFixed(
                      2
                  )}`}</li>
              ))}
            </ul>
        )}

        <button onClick = {buttonProps[state].action}>{buttonProps[state].text}</button>
      </div>
  );
}

export default App;
