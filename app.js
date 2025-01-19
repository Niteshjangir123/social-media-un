const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware to handle static files
app.use(express.static('public'));

// Set up Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Route: Home Page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Route: Upload File
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const ext = file.mimetype;

        if (ext === 'application/pdf') {
            const dataBuffer = fs.readFileSync(file.path);
            const pdfText = await pdfParse(dataBuffer);
            res.json({ text: pdfText.text });
        } else if (ext.startsWith('image/')) {
            Tesseract.recognize(file.path, 'eng')
                .then(({ data: { text } }) => res.json({ text }))
                .catch(err => res.status(500).json({ error: 'OCR failed', details: err }));
        } else {
            res.status(400).json({ error: 'Unsupported file type' });
        }

        // Clean up uploaded file
        fs.unlinkSync(file.path);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred during processing', details: error });
    }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
