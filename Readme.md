# Chess royal

6 part series on how to build multiplayer game using Frakas.

## Part 1 - Setting things up
### Part 2 - Adding movement
### Part 3 - Adding game logic
### Part 4 - Adding multiplayer logic
### Part 5 - Putting game into the cloud
### Part 6 - Wrapping things up

Final game can be played here: `<placehoder>`

## Setting things up

### 1. Project setup
To get started with Frakas, you'll first need to install [NodeJs](https://nodejs.org)

I'll be using [VSCode](https://code.visualstudio.com/) for my text editor and development environment, but use whatever editor you are comfortable with.

Let's create a folder to save our project files to, lets call it `chess-royale`.

Open up a terminal and navigate to `chess-royale` folder and run the following command to install the Frakas CLI.

```bash
npm i @frakas/cli
```

Now run the following command to initalize Frakas.

```
frakas init
```
You should now see the following folder structure

![Folder structure](https://raw.githubusercontent.com/teamhitori/chess-royale/main/raw/init.jpg)


Run the following command

```
frakas serve
```

Now when you upen up your browser at the following location http://localhost:8080 you should see the folowing

![Frakas in browser](https://raw.githubusercontent.com/teamhitori/chess-royale/main/raw/frakas-init.gif)


