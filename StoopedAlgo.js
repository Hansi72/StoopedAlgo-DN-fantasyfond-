const puppeteer = require('puppeteer');
var fs = require('fs');


async function run() {
	
	//arg1 = username, arg2 = pass
	const uname = process.argv[2];
	const pass = process.argv[3];
	
  const browser = await puppeteer.launch({headless: true});
  const tapere = await browser.newPage();
  const fantasy = await browser.newPage();
  
  //finn taperliste
  await tapere.goto('https://investor.dn.no/#!/Utforsk/Tapere/');
	className = "ng-binding";
	taperHref = await getHrefbyClass(className, tapere);
	//console.log(taperHref[0].split("/")[5]);  //gir DNs "aksjekode"
	
	//login
	await fantasy.goto('https://www.dn.no/dn/login/');
	await new Promise(resolve => setTimeout(resolve, 5000));   //quickfix bytt ut med networkidle el noe
  await fantasy.evaluate((uname, pass) => {
	  document.getElementById("epostadresse").value = uname;
	  document.getElementById("password").value = pass;
	  document.getElementById("login").click();
	  },uname, pass);
  
  await new Promise(resolve => setTimeout(resolve, 3000));   //quickfix bytt ut med networkidle el noe
  console.log("login complete");
  
  await fantasy.goto('https://investor.dn.no/#!/Fantasyfond/OppdaterFond/');
  await new Promise(resolve => setTimeout(resolve, 3000));   //quickfix bytt ut med networkidle el noe
  
	
	
	//do stuff
	await clearStockPicks(fantasy);
	
	
	//velger de 5 øverste taperne
	for(i = 0; i < taperHref.length; i++){
		await putStock(taperHref[i].split("/")[5], fantasy);
		if(await getStockCount(fantasy) == 5){break;}
	}
	await new Promise(resolve => setTimeout(resolve, 2000));
await saveChanges(fantasy);
console.log("done, closing..");
await new Promise(resolve => setTimeout(resolve, 2000));
process.exit(0);
}




//Returns liste med Hrefs 
async function getHrefbyClass(className, page){
console.log("getting HrefbyClass from class: " + className);
return await page.evaluate((className) => {
	var hreflist = [];
	for(i = 0;i < document.getElementsByClassName(className).length; i++){
		if(document.getElementsByClassName(className)[i].href != null){
  hreflist.push(document.getElementsByClassName(className)[i].href);    
		}
	}
	return Promise.resolve(hreflist);
  }, className);
}

//Legger til en aksje i porteføljen 
async function putStock(aksje, page){
	console.log("picking stock: " + aksje);	
	try{
  await page.evaluate((aksje) => {	  
	const inputs = document.getElementsByTagName("input");
	for(i = 0; i < inputs.length; i++){
		console.log("hansi " + inputs.item(i).getAttribute("placeholder")); 
		//finner riktig input field.
		if(inputs.item(i).getAttribute("placeholder") == "Finn en aksje på Oslo Børs"){
			inputs.item(i).value = aksje;
			var event = new Event('input', {
			bubbles: true,
			cancelable: true,
			});
			inputs.item(i).dispatchEvent(event);
			setTimeout(() => { }, 5000);
			document.getElementsByClassName('top-desc')[0].click(); 
			} 
		}
  }, aksje);
}
catch(err){
	console.log("putStock failed, er aksjen tilgjengelig i fantasyfond?");
}
await new Promise(resolve => setTimeout(resolve, 3000));
}

//Get hvor mange aksjer som er valgt
async function getStockCount(page){
	console.log("getting chosenStockCount");
	try{
return await page.evaluate(() => {
	var antall;
allSVG = document.getElementsByTagName("svg");
	  for(i = 0; i < allSVG.length; i++){  
	  if(allSVG[i].getAttribute("width") == "720" && allSVG[i].getAttribute("height") == "550"){
		  //console.log(allSVG[i].childElementCount-8);
		  antall = (allSVG[i].childElementCount-8);
	      }
	     }
return Promise.resolve(antall);
  });
}
catch(err){
	console.log("getStockCount failed" + err);
	console.log("Retrying in 3 seconds..");
		await new Promise(resolve => setTimeout(resolve, 3000));
		getStockCount(page);
}


}

//Clear aksjefelt (kjør denne før valg av aksjer) returns undefined hvis 0
async function clearStockPicks(page){ 
console.log("clearing stocks");
try{
return await page.evaluate(() => {
 stockresult = document.getElementsByTagName("g");
	  //console.log(stockresult);
	  for(i = 0; i < stockresult.length; i++){  
	  if(stockresult[i].getAttribute("transform") == "translate(690,18)"){
		  //console.log(stockresult[i]);
		 stockresult[i].children.item(2).dispatchEvent(new Event('click'));
		console.log(stockresult[i].children.item(2));
	  }
	  }
return Promise.resolve();
  });
}
	catch(err){
		console.log("clearStockPicks Failed" + err);
		console.log("Retrying in 3 seconds..");
		await new Promise(resolve => setTimeout(resolve, 3000));
		clearStockPicks(page);
	}
}

//Lagre endringer 
async function saveChanges(page){ 
console.log("Saving changes");
try{
return await page.evaluate(() => {
 //document.getElementById("reweight_update").click();
 document.getElementById("reweight_fund").click();
return Promise.resolve();
  });
}
	catch(err){
		console.log("Saving changes failed" + err);
		console.log("Retrying in 3 seconds..");
		await new Promise(resolve => setTimeout(resolve, 3000));
		saveChanges(page);
		}
}

run();