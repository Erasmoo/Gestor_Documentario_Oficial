const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Document = require('../models/Document');

// Configuración de almacenamiento de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Ruta para subir documentos
// Ruta para subir documentos
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { title, description } = req.body;

    const newDocument = new Document({
      title,
      description,
      filename: req.file.originalname,  // Usamos "filename" según el esquema
      filePath: req.file.path           // Ruta completa al archivo subido
    });

    await newDocument.save();

    // Aseguramos que el fileURL se agrega correctamente
    const fileURL = `http://localhost:4000/uploads/${path.basename(newDocument.filePath)}`;

    // Devolvemos el documento con el fileURL
    res.status(201).json({
      ...newDocument.toObject(),
      fileURL: fileURL // Se agrega la URL accesible para la vista previa y descarga
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error al subir documento',
      error: err.message
    });
  }
});


// Ruta para obtener todos los documentos
router.get('/', async (req, res) => {
  try {
    const documents = await Document.find().sort({ uploadedAt: -1 });
    res.json(documents);
  } catch (err) {
    res.status(500).json({
      message: 'Error al obtener documentos',
      error: err.message
    });
  }
});


// Al devolver el documento, asegúrate de que devuelves la URL accesible
const newDocument = new Document({
  title,
  description,
  filename: req.file.originalname,  // Usamos "filename" según el esquema
  filePath: req.file.path           // Ruta completa al archivo subido
});

// Asegúrate de devolver la ruta accesible para la vista previa
await newDocument.save();
res.status(201).json({
  ...newDocument.toObject(),
  fileURL: `http://localhost:4000/uploads/${path.basename(newDocument.filePath)}`
});

module.exports = router;

