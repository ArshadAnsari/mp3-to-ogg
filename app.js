var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var child_process = require('child_process');
var fs = require('fs');
var router = express.Router();
var session = require("express-session");

var workerProcess;
var command;
var sess;
var fileArr = {};
var _uploadPath;
var userCount = 0;

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
		secret: 'hgbfdjjbvjbdoihsdvjbsdib',
		cookie : {maxAge : 6000}
}));

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/download/:name', function (req, res) {
	//console.log(req.params.name)
	console.log(sess.folderCounter)
	// var filePath = "uploads/" + req.params.name;
	var filePath = 'uploads/temp' + sess.folderCounter + '/' + req.params.name;
	var fileName = req.params.name;
	// console.log(filePath)
	res.download(filePath, fileName, function(){});
});

app.delete("/delete", function (req, res) {
	fs.readdir("uploads/", function(_err, _data){
		if(_err)
		{}
		else
		{
			_data.forEach( function (file){
				fs.unlink("uploads/"+file, function(e){});
			});
		}
	});
})


app.post('/upload', function (req, res) {
	sess = req.session
	if (sess && sess.folderCounter) 
	{
		// _uploadPath = 'uploads/temp' + sess.folderCounter + '/';
	}
	else 
	{
		userCount++;
		sess.folderCounter = userCount;
		fs.mkdir(__dirname + '/uploads/temp' + sess.folderCounter, function(err){});
	}
	_uploadPath = 'uploads/temp' + sess.folderCounter + '/';
	
	
	fileArr = {};
	var form = new formidable.IncomingForm();

	// specify that we want to allow the user to upload multiple files in a single request
	form.multiples = true;

	// store all uploads in the /uploads directory
	form.uploadDir = path.join(__dirname, '/' + _uploadPath);

	// every time a file has been uploaded successfully rename it to its original name
	form.on('file', function (field, file) {
		// console.log(file.name)
		file.name = file.name.replace(/\s/g, "");
		fileArr[file.name.split(".")[0]] = file.name.split(".")[0] + '.ogg';
		fs.rename(file.path, path.join(form.uploadDir, file.name));
		command = 'ffmpeg -i '+ _uploadPath + file.name + ' -b:a 24k -ac 1 -ar 16000 ' + _uploadPath + file.name.split(".")[0] + '.ogg';
		workerProcess = child_process.exec(command, function (error, stdout, stderr) {
				if (error)
					console.log("error in file conversion");
			});
		workerProcess.on('exit', function (code) {
			
			fs.readdir(_uploadPath, function(_err, _data){
				if(_err)
				{}
				else
				{
					_data.forEach( function (file){
						if(file.split(".")[1] == "mp3")
							fs.unlink(_uploadPath+file, function(e){});
					});
				}
			});
			
			// console.log('Child process exited with exit code ' + code);
		});
	});

	form.on('error', function (err) {
		console.log('An error has occured in file loading: \n' + err);
	});

	// once all the files have been uploaded, send a response to the client
	form.on('end', function () {
		res.end(JSON.stringify(fileArr));
	});

	// parse the incoming request containing the form data
	form.parse(req);
});

var server = app.listen(3000, function () {
		console.log('Server listening on port number 3000');
	});
