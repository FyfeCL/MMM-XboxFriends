/**************************************

  Node Helper for MMM-XboxFriends.

  This helper is responsible for the 
  use of Puppeteer

*************************************/

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const request = require('request');
const CREDS = require('./docs/creds');			// for xbox.com credentials

/*selectors for xbox.com login form*/
const USERNAME_SELECTOR = '#i0116';
const USERNAME_ERR_SELECTOR = '#usernameError';
const PASSWORD_SELECTOR = '#i0118';
const PASSWORD_ERR_SELECTOR = '#passwordError';
const FACTOR_ERR_SELECTOR = '#idDiv_SAASDS_Title';
const BUTTON_SELECTOR1 = '#idSIButton9';
const BUTTON_SELECTOR2 = '#idSIButton9';
const REMIND_SELECTOR1 = '#idChkBx_PWD_KMSI0Pwd';
const REMIND_SELECTOR2 = '#idChkBx_SAOTCAS_TD';

/*selectors for xbox.com friends list*/
const LIST_USERNAME_SELECTOR = '#mainTab1 > div > rendermodule > div > xbox-friends > div > div > xbox-friend-entity > div > ul > li:nth-child(INDEX) > div > xbox-people > div > a > xbox-profiletext > div > div.name > span.name';
const LIST_ONLINE_SELECTOR = '#mainTab1 > div > rendermodule > div > xbox-friends > div > div > xbox-friend-entity > div > ul > li:nth-child(INDEX) > div > xbox-people > div > a > xbox-profileimage > div.status.online';
const LIST_DETAIL_SELECTOR = '#mainTab1 > div > rendermodule > div > xbox-friends > div > div > xbox-friend-entity > div > ul > li:nth-child(INDEX) > div > xbox-people > div > a > xbox-profiletext > div > div.metadatatext';
const LIST_IMAGE_SELECTOR = '#mainTab1 > div > rendermodule > div > xbox-friends > div > div > xbox-friend-entity > div > ul > li:nth-child(INDEX) > div > xbox-people > div > a > xbox-profileimage > div.xboxprofileimage > img';


var NodeHelper = require("node_helper");
var self;
var friendsArray = [];

module.exports = NodeHelper.create({
	
	/*****************************
		MMM start function 
	******************************/  
	start: function() {
		self = this;
		self.config = {};
		self.browser;
		self.page;
		self.path = path.resolve(global.root_path + '/modules/MMM-XboxFriends/');
		self.loginUser = false;
		self.loginPass = false;
		self.loginFactor = false;
		self.loginFinal = false;
	},
	
	/********************************************
		MMM socketNotificationReceived function 
	********************************************/  
	socketNotificationReceived: function(notification, payload) {
		
		switch(notification){
				case('CONFIG'):
					self.config = payload;
					if(self.config.debug){console.log('Helper notification CONFIG');}
					get_info();
					break;
				case('GET'):
					if(self.config.debug){console.log('Helper notification GET');}
					get_info();
					break;
				case('STOP'):
					if(self.config.debug){console.log('Helper notification STOP');}
					stop(payload);
					break;
				case('LOG'):
					console.log(payload);
					break;
				default:
					break;
		}
	}
});

/************************
	Close browser
*************************/
async function stop(reason){
	await self.page.close();
	await self.browser.close();
	if(self.config.debug){console.log('Puppeteer closed...');}
	if(reason == 'user'){
		self.loginUser = false;
		console.log('wrong user');
	}else if(reason == 'pass'){
		self.loginPass = false;
		console.log('wrong pass');
	}else if(reason == 'factor'){
		self.loginFator = false;
		console.log('second factor problem');
	}
}

/**********************************
	Check creds.js for credentials
***********************************/
var checkCreds = function checkCreds() {
	console.log('creds: username: '+CREDS.username+' pass: '+CREDS.password);
	if(CREDS.username != '' && CREDS.password != ''){
		return true;
	}else{
		return false;
	}
}

/**********************************
	Check creds.js for credentials
		cred: 	true, using creds.js
		* 		false, using manual login
***********************************/
async function login(with_creds){
	if(with_creds){
		/*myUserDataDir saves cookies and session so that you don't have to login every time*/
		self.browser = await puppeteer.launch({executablePath: self.config.chromiumPath, headless : !self.config.showBrowser, userDataDir: self.path+'/myUserDataDir/'});
		if(self.config.debug){console.log('userdata: '+self.path+'/myUserDataDir/');}
		self.page = await self.browser.newPage();
		
		/*go to page*/
		await self.page.goto('https://account.xbox.com/en-US/Friends');	
		
		/*login with CREDS credentials*/
		try {
			await self.page.click(USERNAME_SELECTOR);
			if(self.config.debug){console.log('Writing user: ' + CREDS.username);}
			await self.page.keyboard.type(CREDS.username);
			await self.page.click(BUTTON_SELECTOR1);
			//await self.page.waitForNavigation({waitUntil:'networkidle2'});
			
			try{
				if(self.config.debug){console.log('buscando username error');}
				await self.page.waitForSelector(USERNAME_ERR_SELECTOR, {timeout: 1000});
				if(self.config.debug){console.log('username error');}
				self.sendSocketNotification("LOGIN_NOT_OK_USER", '');
				self.loginUser = false;
			}catch(error){
				if(self.config.debug){console.log('user ok')};
				self.loginUser = true;
			}
			
			if(self.loginUser){
				
				//await self.page.waitForNavigation({waitUntil:'networkidle2'});
				//await self.page.waitFor(1000);
				
				await self.page.click(PASSWORD_SELECTOR);
				if(self.config.debug){console.log('Writing password: '+CREDS.password);}
				await self.page.keyboard.type(CREDS.password);
				await self.page.click(REMIND_SELECTOR1);
				await self.page.click(BUTTON_SELECTOR2);
				//await self.page.waitForNavigation({waitUntil:'networkidle2'});
				
				try{
					if(self.config.debug){console.log('buscando password error');}
					await self.page.waitForSelector(PASSWORD_ERR_SELECTOR, {timeout: 2000});
					if(self.config.debug){console.log('password error');}
					self.sendSocketNotification("LOGIN_NOT_OK_PASS", '');
					self.loginPass = false;
				}catch(error){
					if(self.config.debug){console.log('pass ok');}
					self.loginPass = true;
				}
				
				if (self.loginUser && self.loginPass){
					try{
						if(self.config.debug){console.log('waiting second factor');}
						await self.page.click(REMIND_SELECTOR2);
						await self.page.waitForNavigation({timeout: 29999});		//waits 29.9 s to approval
						try{
							if(self.config.debug){console.log('buscando factor denied');}
							await self.page.waitForSelector(FACTOR_ERR_SELECTOR, {timeout: 2000});
							if(self.config.debug){console.log('factor error')};
							self.sendSocketNotification("LOGIN_NOT_OK_FACTOR", '');
							self.loginFactor = false;
						}catch(error){
							if(self.config.debug){console.log('factor ok');}
							self.loginFactor = true;
						}
					}catch(error){
						if(error.message.includes('29999')){
							if(self.config.debug){console.log('second factor error');}
							self.sendSocketNotification("LOGIN_NOT_OK_FACTOR", '');
							self.loginFactor = false;
						}
					}
				}
			}
			
			
		} catch (error) {
			if(error == 'Error: No node found for selector: #i0116'){		// it's OK, happens when you skip login
			}else{
				console.log('login error: '+error);
			}
			 
		}
	}	
}

/***************************************************************
	1. Launch Puppeteer
	2. Go to https://account.xbox.com/en-US/Friends
	3. Login
	4. For each friend in the list retrieve name <username>, 
		onlineStatus <online>, whatsDoing <detail> and 
		icon <imgPath> 
**************************************************************/
async function get_info(){
	try{
		if(self.config.debug){console.log('Launching puppeteer...');}
		
		loginCache('read');
		
		if(self.config.debug){console.log('loginFinal: '+self.loginFinal);}
		
		if(self.loginFinal){
			if(self.config.debug){console.log('already logged in');}
			/*myUserDataDir saves cookies and session so that you don't have to login every time*/
			self.browser = await puppeteer.launch({executablePath: self.config.chromiumPath, headless : !self.config.showBrowser, userDataDir: self.path+'/myUserDataDir/'});
			if(self.config.debug){console.log('userdata: '+self.path+'/myUserDataDir/');}
			self.page = await self.browser.newPage();
		
			/*go to page*/
			await self.page.goto('https://account.xbox.com/en-US/Friends');
			
		}else if(checkCreds() && !self.loginFinal){
			console.log('creds ok, without login yet');
			await login(true);		// true, using creds.js 
			loginCache('write');
		}
		
		loginCache('read');
		
		if (self.loginFinal){
			
			if(self.config.debug){console.log('Login OK...');}
			self.sendSocketNotification("LOGIN_OK", '');
			
			/*waits for the list to appear, sometimes (I don't know why) you have to refresh the page to get the list*/ 
			if(self.config.debug){console.log('Searching list...');}
			try {
				await self.page.waitForSelector('#mainTab1 > div > rendermodule > div > xbox-friends > div > div > xbox-friend-entity > div > ul > li:nth-child(1)', { timeout: 10000});
				if(self.config.debug){console.log('List found');}
			} catch (error) {
				if(error.message.includes('selector') && error.message.includes('#mainTab1')){	// it's OK, happens sometimes
				}else{
					console.log('list error:: '+error);
				}
				if(self.config.debug){console.log('List not found, refreshing...');}
				await self.page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
			}
			
			/*for each friend in the list retrieve the info*/
			try{
				let i = 1;
				let username = '';
				
				function friend(id, name, online, detail, imgPath){
					this.id = id;
					this.name = name;
					this.online = online;
					this.detail = detail;
					this.imgPath = imgPath;          
				};
				
				friendsArray = [];
				
				do {
					/*retrieve name*/
					let usernameSelector = LIST_USERNAME_SELECTOR.replace("INDEX", i);
					let username = await self.page.evaluate((sel) => {
					let element = document.querySelector(sel);
					return element? element.innerHTML: null;
					}, usernameSelector);

					if (!username){
						break; 
					}

					/*retrieve online status*/
					let onlineSelector = LIST_ONLINE_SELECTOR.replace("INDEX", i);
					let online = await self.page.evaluate((sel) => {
					let element = document.querySelector(sel);
					return element? element.innerHTML: null;
					}, onlineSelector);
					
					if (online == '') {
						online = 'online';
					} else { 
						online = 'offline';
					}

					/*retrieve whatsDoing*/
					let detailSelector = LIST_DETAIL_SELECTOR.replace("INDEX", i);
					let detail = await self.page.evaluate((sel) => {
					let element = document.querySelector(sel);
					return element? element.innerHTML: null;
					}, detailSelector);

					/*retrieve friend icon*/
					let imageSelector = LIST_IMAGE_SELECTOR.replace("INDEX", i);
					let imageUrl = await self.page.evaluate((sel) => {
					let image = document.querySelector(sel);
					return image.src;
					}, imageSelector);

					/*call download function to download icon*/
					let downloadPath = self.path.concat('/img/',username.toLowerCase(),'.jpg');
					if(self.config.debug){console.log('download: ', downloadPath);}
					await download(imageUrl, downloadPath, function () {
									console.log('image OK');
								});
					
					friendsArray.push(new friend(i, username, online, detail.trim(), downloadPath));

					i++;

				} while (!username);
				
				if(self.config.debug){
					console.log('Num. amigos: ', i-1);
					console.log(friendsArray);
					console.log('largo array: '+friendsArray.length);
				}
				
				self.sendSocketNotification("INFO_OK", friendsArray);
	  
			}catch (error) {
				console.log('loop error: '+error);
			}
			
			stop();
		}
	}catch(error){
		console.error('get_info(): '+error);
			
	}
}

/********************************************
	to download a file from <uri>, 
	save it with name <filename> and
	callback <callback> 
********************************************/
var download = function download(uri, filename, callback) {
	try{
		request.head(uri, function (err, res, body) {
			request(uri).pipe(fs.createWriteStream(filename));
		});
	
	}catch(error){
			console.error('download(): '+error);
			
	}
};

/********************************************
	save/read a file to check if the login 
	already happened
********************************************/
async function loginCache(obj){
	if(self.config.debug){console.log('loginCache: ');}
	try{
		switch(obj){
			case('write'):
				fs.writeFileSync(self.path.concat('/docs/loggedin.txt',''));
				break;
			case('read'):
				if(fs.existsSync(self.path.concat('/docs/loggedin.txt'))){
					self.loginFinal = true;
				}else{
					self.loginFinal = false;
				}
				break;
			default:
				break;
		}
		
	}catch(error){
		console.error('loginCache(): '+error);
	}
}

