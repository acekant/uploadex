const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Use the express-session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: true,
  saveUninitialized: true
}));

// Use body-parser middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Use express-fileupload middleware for handling file uploads
app.use(fileUpload());

// Multer configuration for handling file uploads
const storage = path.join(__dirname, 'files');

// Middleware to check if the user is logged in
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Routes
app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.sendFile(__dirname + '/login.html');
  }
  res.redirect('/welcome');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'user' && password === 'password') {
    req.session.user = username;
    res.redirect('/upload');
  } else {
    res.send('Invalid credentials');
  }
});

app.get('/welcome', requireLogin, (req, res) => {
  res.sendFile(__dirname + '/welcome.html');
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send('Error logging out');
    }
    res.redirect('/login');
  });
});

// Route to render the upload form
app.get('/upload', requireLogin, (req, res) => {
  res.sendFile(__dirname + '/upload-page.html');
});

// Route to handle file upload
app.post('/upload', requireLogin, (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const uploadedFiles = req.files.files;
  const uploadPath = path.join(storage);

  // Ensure the 'files' directory exists
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
  }

  // Move each file to the 'files' directory
  for (let i = 0; i < uploadedFiles.length; i++) {
    const file = uploadedFiles[i];
    const filePath = path.join(uploadPath, file.name);
    file.mv(filePath, (err) => {
      if (err) {
        return res.status(500).send(err);
      }
    });
  }

  res.send('Files uploaded successfully!');
});

app.get('/view', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'view.html'));
  });
  
  // Route to provide the list of uploaded files
  app.get('/filelist', (req, res) => {
    // Get the list of files in the 'files' folder
    const fs = require('fs');
    const filesPath = path.join(__dirname, 'files');
  
    fs.readdir(filesPath, (err, files) => {
      if (err) {
        console.error('Error reading files:', err);
        res.json({ success: false, message: 'Error reading files.' });
      } else {
        res.json({ success: true, files: files });
      }
    });
  });
  
  // Route to handle file downloads
  app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'files', filename);
  
    // Send the file as an attachment for download
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).send('Error downloading file.');
      }
    });
  });

// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
