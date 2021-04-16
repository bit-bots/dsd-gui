# GUI for the Dynamic Stack Decider
dsd-ui is a bachelor project with the goal to create a graphical user interface (GUI) for the Dynamic Stack Decider (DSD) framework.
The GUI is written in JavaScript, CSS and HTML.
Its based on the frameworks [Electronjs](https://www.electronjs.org/) and [Vue.js](https://vuejs.org/).
To getting started follow the instructions below.


## Project setup
1. Make sure you have [Node.js](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed 
2. Navigate into the project folder `cd /dsd-ui`
3. Install all necessary dependencies 
```
npm install
```
Depending on the system you use, change the return value of the function `getDir()` (./src/utils/Utils.js).
- Windows: `return '\\'`
- Linux : `return '/'`'
### Compiles for development mode
To enable the console uncomment line 35 in the background.ts file (./src/background.ts). 
```
35: // win.webContents.openDevTools()
```
to start the program type ```npm run electron:serve```
inside the project directory
## building the project
Build the project on the system you want to use to make sure that all dependencies are properly resolved by electron.
Make sure you disabled the console.
```
npm run electron:build
```
## How to use
These sections describe the basic functions of the program as well as its limitations.
### Getting started
- Load Project: If you want to load a DSD, make sure that the folder structure of the DSD looks like following:
```
\$behavior$
    \actions
    \decisions
    \$file$.dsd
    ...
```
After selecting the folder you can change the pre filled options or just continue. Optionally a blackboard can be added.

- show the topology: After the project is loaded you can open the topology of a DSD by dbclick on the .dsd file or right-click -> open.
- add new Elements: To add new elements to the graph you can search them in the sidemenu  and drag them into the canvas. Alternative you can search for the element by useing the searchBar at the top of the sidemenu (Ctrl+F).

### Advanced functions
- restructure the graph (Ctrl+D): Autostructure the existing graph 
- to load an existing configuration:
1. open the .dsd file and select the mode 'CODE' on the bottom of the canvas
2. paste in the new configuration
3. save the configuration
4. select the mode 'GRAPH'
5. press the button 'reload from .dsd-file' in the actionbar at the top
- change theme: File->Settings->Theme

