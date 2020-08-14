/*********************************

  Magic Mirror Module:
  MMM-XboxFriends
  https://github.com/...

  This module uses Puppeteer (https://github.com/puppeteer/puppeteer)
  to access your xbox profile and retrieve your friend list

  By Kristoffer Fyfe
  MIT Licensed (not yet)

*********************************/

Module.register("MMM-XboxFriends", {
	
	/**************************
		Default variables 
	**************************/
	defaults: {
		chromiumPath: 'chromium-browser',	
		showBrowser : false,				// change to true if you want to see whats going on in the browser
		friendsArray: [],					
		maximumEntries: 3,					// max friends to show
		offline: false,						// true: show offline friends, false: show only online friends
		fadePoint: 1,						// 1: no fade, 0<=fadePoint<1: where it starts to fade (eg: 0.75 it fades the last 1/4 of the list
		fadeMinEntries: 7,					// min entries to fade. 
		debug: false,						// true: show my debug logs
		maxLengthDetails: 25,				// max string length for name and status
		onlineFriends: 0,					// count online friends
		totalFriends: 0,					// count total friends
		updateInterval: 10					// minutes to update
		
	}, 
	  
	/**************************
		MMM start function 
	**************************/
	start: function () {
		if(this.config.debug){this.sendSocketNotification("LOG", 'Core start');}
		
		this.init = 'Initializing...';
		this.loaded = false;
		
		this.updateDom();
		
		/*assign variables and starts for the first time*/
		this.sendSocketNotification("CONFIG", this.config);
		
		var self = this;

		/*sets interval for updating*/
		setInterval(function() {
			self.getData();
		  }, self.config.updateInterval * 60 * 1000); //convert to milliseconds
		
		
	},

	/**************************
		MMM getDom function 
	**************************/	  
	getDom: function() {
		if(this.config.debug){this.sendSocketNotification("LOG", 'Core getDom');}
		
		var wrapper = document.createElement('div');
		var list = document.createElement('ul');
		
		list.classList.add('list');
		wrapper.appendChild(list);
		
		if(this.config.debug){this.sendSocketNotification("LOG", 'loaded: ' + this.loaded);}
		
		/*if friend list was loaded OK then creates HTML*/
		if (this.loaded){
			if(this.config.debug){this.sendSocketNotification("LOG", 'largo array: ' + this.friendsArray.length);}
			if(this.config.debug){this.sendSocketNotification("LOG", 'config.maxEntries: ' + this.config.maximumEntries);}
			if(this.config.debug){this.sendSocketNotification("LOG", 'config.offline: ' + this.config.offline);}
			if(this.config.debug){this.sendSocketNotification("LOG", 'config.fadePoint: ' + this.config.fadePoint);}
			
			/*vars for fading*/
			var startFade = Math.min(this.friendsArray.length, this.config.maximumEntries) * this.config.fadePoint;
			var stepsFade = Math.min(this.friendsArray.length, this.config.maximumEntries) - startFade;
			var currentFadeStep = 0;
			
			this.config.totalFriends = this.friendsArray.length;
			
			/*for each friend create a list unit with image, name and status*/
			for (let i=0; i<Math.min(this.friendsArray.length, this.config.maximumEntries); i++){
				if(this.friendsArray[i].online == 'online' || this.config.offline){
					var friend = document.createElement('li');
					var info = document.createElement('div');
					var image = document.createElement('div');
					var detail = document.createElement('div');
					var name = document.createElement('span');
					var status = document.createElement('span');
					
					friend.classList.add('friend');
					
					/*calculations for fading*/
					if (this.config.fadeMinEntries <= Math.min(this.friendsArray.length, this.config.maximumEntries)){
						if (i+1 >= startFade){
							currentFadeStep = i+1 - startFade;
							friend.style.opacity = 1 - (1 / stepsFade) * currentFadeStep;
						}
					}
					
					info.classList.add('info');
					detail.classList.add('detail');
					
					image.classList.add('image');
					var icon = new Image(); 
					icon.classList.add('foto');
					icon.src = this.file('img/'+ this.friendsArray[i].name.toLowerCase() + '.jpg');
					
					if(this.config.debug){this.sendSocketNotification("LOG", 'img src: '+icon.src);}
					
					image.appendChild (icon);
					
					name.classList.add('name');
					name.innerHTML = this.shorten(this.friendsArray[i].name, this.config.maxLengthDetails);
								
					status.classList.add('status');
					status.innerHTML = this.shorten(this.friendsArray[i].detail, this.config.maxLengthDetails);
					
					detail.appendChild(name);
					detail.appendChild(status);
					
					info.appendChild(image);
					info.appendChild(detail);
					
					friend.appendChild(info);
					list.appendChild(friend);
					
					/*count online friends for header*/
					if (this.friendsArray[i].online == 'online'){
						this.config.onlineFriends++;
					}
					
					
				};
			};
			
		}else{
			wrapper.innerHTML = this.init;
		};
		
		return wrapper;
	},
	
	/**************************************
		MMM notificationReceived function 
	***************************************/  
	notificationReceived: function(notification, payload, sender) {
			
	},
	
	/********************************************
		MMM socketNotificationReceived function 
	********************************************/    
	socketNotificationReceived: function(notification, payload) {
			
		switch(notification){
			/* if retrieval of friends list was OK */
			case('INFO_OK'):
				if(this.config.debug){this.sendSocketNotification("LOG", 'XXX core socketNotificationReceived: '+notification);}
				this.init = '';
				this.loaded = true;
				this.friendsArray = payload;
				break;
			/* if login was OK */
			case('LOGIN_OK'):
				if(this.config.debug){this.sendSocketNotification("LOG", 'XXX core socketNotificationReceived: '+notification);}
				this.init = 'Login OK';
				break;
			case('LOGIN_NOT_OK_USER'):
				if(this.config.debug){this.sendSocketNotification("LOG", 'XXX core socketNotificationReceived: '+notification);}
				this.init = 'Wrong user';
				this.sendSocketNotification("STOP",'user');
				break;
			case('LOGIN_NOT_OK_PASS'):
				if(this.config.debug){this.sendSocketNotification("LOG", 'XXX core socketNotificationReceived: '+notification);}
				this.init = 'Wrong password';
				this.sendSocketNotification("STOP",'pass');
				break;
			case('LOGIN_NOT_OK_FACTOR'):
				if(this.config.debug){this.sendSocketNotification("LOG", 'XXX core socketNotificationReceived: '+notification);}
				this.init = 'Second factor problem';
				this.sendSocketNotification("STOP",'factor');
				break;
			default:
				break;
		}
		this.updateDom();
		
	},
	
	/*****************************
		MMM getStyles function 
	******************************/    
	getStyles: function () {
		return [
			"MMM-XboxFriends.css",
		];
	},
	
	/******************************************************
		Changes the header if/when totalFriends > 0
		and shows header + (onlineFriends / totalFriends)
	******************************************************/    
	getHeader: function () {
		if (this.config.totalFriends == 0){
			return this.data.header;
		}else{
			return this.data.header + ' ( ' + this.config.onlineFriends + ' / ' + this.config.totalFriends + ' )';
		}
	},
	
	/*********************************
		Gets data (starts Puppeteer) 
	*********************************/    
	getData: function(){
		this.sendSocketNotification("GET", '');
	},
	
	/************************************************
		Shorten a <string> to a length=<maxLenghth> 
		including a &hellip (...) at the end
	************************************************/    
	shorten: function (string, maxLength){
		if (maxLength && typeof maxLength === "number" && string.length > maxLength) {
			return string.trim().slice(0, maxLength) + "&hellip;";
		} else {
			return string.trim();
		}
	},
})
