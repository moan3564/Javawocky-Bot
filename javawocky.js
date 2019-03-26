
/**
 * Author: Judah Page
 * Purpose: This is a bot designed for use on the Javawockies private discord server. 
 * It takes user input, and responds with appropriate data. 
 * Read the README for a command list.
 */
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const {Client, Attachment, Channel, User} = require('discord.js');
const TOKEN_PATH = 'token.json';
var config = JSON.parse(fs.readFileSync('config.json'));//Loading configuration file.
const ClientSecret = config.clientSecret;
const Token = config.token;



// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/documents.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

var last = [0,1,2];
var todoList="";
var currentChannel=0;
const client = new Client();

/**
 * This sets up the bots ready functions. We really only use it to indicate to 
 * the console the bot is ready for use, and to set the game the bot is playing.
 */
	
client.on('ready',()=>{
	console.log("Ready!");
	client.user.setActivity('FRC Deep Space', { type: 'Playing' });
});

/**  
 * If the bot ever disconnects, it will automatically shut down. You could also put 
 * disconnect functions in here to happen first if need be.
 */
client.on('disconnected',function(){
	console.log('Disconnected: Exiting');
	process.exit(1);
	
});

//This line just makes sure that all errors are "handled". It really just prints them to the console.
client.on('error', console.error);

/**
 * This is the primary function of the bot, the message function. The bot checks each 
 * message for ! in front of it. When it finds a !, it then finds the appropriate command, and returns.
 */
client.on('message',message=>{
	// Setting up our input checking and argument parsing. 
    var isPrefix = message.content.charAt(0);
	const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();
	
	
	if(isPrefix=='!'){ //if the message starts with !, find the appropriate command.
	
		switch(command){//In our switch statement, each command is a case. This helps keep the code easier to read.
			
			case 'weather'://Returns weather near the Javawockies shop.
				message.channel.send(config.weather);
				break;
		
			//Turns the bot off
			case 'downtime':
				if(message.author.id=='202942210713452544'){//This command is only accessible to Judah.
					message.channel.send("Bye bye");
					console.log('Turning off.');
					client.destroy();
				}
				else{//Warns if not authorized user.
					message.channel.send("Your not allowed to use this command.");
				}
				break;
				
			case 'todo'://Returns the current todo list from google docs. 
				
				currentChannel=message.channel.id;
				// Load client secrets from a local file.
				fs.readFile('credentials.json', (err, content) => {
					if (err) return console.log('Error loading client secret file:', err);
					// Authorize a client with credentials, then call the Google Docs API.
					authorize(JSON.parse(content), printDocTitle);
					
				});
				

				break;
				
			case 'links'://Prints out important and useful links
				message.channel.send(config.links);
				break;
				
			case 'events'://Prints out current events 
				message.channel.send(config.events);
				break;
			
			case 'help'://Lets the user know a list of helpful commands
				let userVar = message.author;
				message.channel.send(userVar+config.help);
				break;
				
			case 'safety'://Prints a random saftey quote.
				var safetyNum = parseInt(config.safeNum);//Get the number of saftey quotes.
				
				while(true){//To avoid duplicates, we run this loop till we get a new number.
					var num = Math.floor(Math.random()*safetyNum);// Pick a random number.
					if(num!=last[0]&&num!=last[1]&&num!=last[2]){//Making sure we haven't used this number in a while
						message.channel.send(config.safety[num]);
						
						//Cycling values
						last[2]=last[1];
						last[1]=last[0];
						last[0]=num;
						break;
					}
				}
				break;
			
			case 'update'://Updates the config file. Allows on the fly changes to certain commands.
				config=JSON.parse(fs.readFileSync('config.json'));
				break;
				
			case 'tba'://Fetches Teams from The Blue Alliance website. 
				var address = "https://www.thebluealliance.com/team/";//TBA Website
				
				if(args[0]!=null){//Check and see if an argument was provided
				
					if(!isNaN(args[0])&&args[0]<=7915&&args[0]>0){//Check if it's a number, and that it's between 7915 and 0.
					
						address= address+args[0];//Append the team number to the address.
						message.channel.send('Here you go! Team'+args[0]+'\n'+address);
					}
					else{//Error check for team number.
					message.channel.send("Sorry, not a valid team number! Teams range from 1-7915.");
					}
				}
				else{//Error check for argument.
					
					message.channel.send("Sorry, you didn't include a team number! Make sure to write your command like !tba 6336 so I can understand it.");
				}
				break;
				
			default: //Error check for commands.
				message.channel.send(config.default);
				break;
		}
	}
	
	
	
});

//Google Code. It handles all the google docs api. 
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Prints the title of a sample doc:
 * https://docs.google.com/document/d/195j9eDD3ccgjQRttHhJPymLJUCOUjs-jmwTrekvdjFE/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth 2.0 client.
 */
function printDocTitle(auth) {
  const docs = google.docs({version: 'v1', auth});
  docs.documents.get({
    documentId: '1p_ewpzzMlgmPuqZwN7B51FOzQNGmYdqHpd0-1eL7iyM',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
	//Setup JSON Properly
	var string = JSON.parse(JSON.stringify(res));
	//Get Size of document
	var contentSize = string.data.body.content.length;
	//Iterator and empty the todolist
	var i = 0;
	todoList ="";
	
	//Get all the text
	for( i=1; i<contentSize; i++){
		todoList +=string.data.body.content[i].paragraph.elements[0].textRun.content;
	}
	//Send it to chat
	client.channels.get(currentChannel).send(todoList);
    
	

  });
}


client.login(Token);