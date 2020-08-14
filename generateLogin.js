/**************************************

  MMM-XboxFriends.

  This script creates session data of 
  logged in user

*************************************/

const puppeteer = require('puppeteer');
const fs = require('fs');

const TITLE_SELECTOR = '#primaryArea > core-area > core-region-pivot > section > section > header > a.f-active';

(async () => {
	try{
		//launch Puppeteer with target folder /myUserDataDir
		const browser = await puppeteer.launch({ 
		executablePath: 'chromium-browser',
		headless:  false,
		userDataDir: './myUserDataDir' });
		const page = await browser.newPage();
		await page.goto('https://account.xbox.com/en-US/Friends');
		
		// checks if its already logged in
		console.log('Are you already logged in?');
		try{
			await page.waitForSelector(TITLE_SELECTOR, {timeout: 4999});
			console.log('Yes! Closing...');
			await page.close();
			await browser.close();
			process.exit();
		}catch(error){
			if(error.message.includes('4999')){
			}else {console.log('login: '+error);
			}
		}
		
		// if not, wait for the login
		console.log('No, please login');		
		await page.waitForNavigation({waitUntil:'networkidle2'});
		console.log('user OK');
		await page.waitForNavigation({waitUntil:'networkidle2'});
		console.log('pass OK');
		
		await page.waitForSelector(TITLE_SELECTOR, {timeout: 40000});
		console.log('Login data created!');
		
		//creates "cache" file so the module knows that you are already logged in
		fs.writeFileSync('./docs/loggedin.txt','');
		await page.close();
		await browser.close();
	 
	}catch(error){
		console.log(error);		
	}
})();
