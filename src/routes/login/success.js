import React from 'react';
import NavBar from '../../components/NavBar';
import isAuthenticated from '../../utils/auth/isAuthenticated';

function App(props) {
  const classes = props.classes;
  isAuthenticated(); //May cause two requests to be sent to /auth/status since App.js is reloaded
  return (
    <div className={classes.root}>
        <NavBar enableDrawer={false} classes={classes}/>
        <div className={classes.content}>
            <div className={classes.toolbar} />
                <h1>Login successful</h1>
        </div>
    </div>
  );
}
export default App;

