import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import Swal from 'sweetalert2';
import * as pdfjsLib from 'pdfjs-dist';


function App() {
  const [documents, setDocuments] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const documentsPerPage = 5;

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error('Error al obtener documentos:', err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
  
    if (title && description && file) {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('file', file);
  
      try {
        const res = await axios.post('http://localhost:4000/api/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
  
        // Mostrar alerta de éxito usando SweetAlert
        Swal.fire({
          title: 'Éxito!',
          text: 'Documento guardado correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
        });
  
        setTitle('');
        setDescription('');
        setFile(null);
        setShowUploadModal(false);
        fetchDocuments();
      } catch (err) {
        console.error('Error al subir documento:', err);
  
        // Mostrar alerta de error usando SweetAlert
        Swal.fire({
          title: 'Error!',
          text: 'Hubo un problema al guardar el documento.',
          icon: 'error',
          confirmButtonText: 'Aceptar',
        });
      }
    } else {
      // Mostrar alerta si no se completaron los campos
      Swal.fire({
        title: 'Campos incompletos',
        text: 'Por favor complete todos los campos, incluyendo el archivo.',
        icon: 'warning',
        confirmButtonText: 'Aceptar',
      });
    }
  };
  

  const openUploadModal = () => {
    setShowUploadModal(true);
  };

  const renderPdfPreview = (pdfUrl) => {
  return new Promise((resolve, reject) => {
    pdfjsLib.getDocument(pdfUrl).promise.then((pdf) => {
      pdf.getPage(1).then((page) => { // solo la primera página
        const scale = 0.5; // Reducir el tamaño para vista previa
        const viewport = page.getViewport({ scale: scale });

        // Crear un canvas para renderizar la página
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Renderizar la página en el canvas
        page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise.then(() => {
          resolve(canvas.toDataURL());
        }).catch(reject);
      }).catch(reject);
    }).catch(reject);
  });
};

// Función para abrir la vista previa
const openPreview = async (fileURL) => {
  try {
    // Si el archivo es un PDF
    if (fileURL.endsWith('.pdf')) {
      const previewUrl = await renderPdfPreview(fileURL);

      Swal.fire({
        title: 'Vista Previa del Documento',
        html: `<img src="${previewUrl}" style="width: 100%; height: auto;" />`,
        showCloseButton: true,
        focusConfirm: false,
        confirmButtonText: 'Cerrar',
        width: '80%',
        padding: '20px',
      });
    } else {
      // Si no es un PDF, mostramos una imagen normal
      Swal.fire({
        title: 'Vista Previa del Documento',
        html: `<img src="${fileURL}" style="width: 100%; height: auto;" />`,
        showCloseButton: true,
        focusConfirm: false,
        confirmButtonText: 'Cerrar',
        width: '80%',
        padding: '20px',
      });
    }
  } catch (err) {
    console.error('Error al cargar la vista previa del documento:', err);
    Swal.fire({
      title: 'Error',
      text: 'No se pudo cargar la vista previa del documento.',
      icon: 'error',
    });
  }
};

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastDocument = currentPage * documentsPerPage;
  const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
  const currentDocuments = filteredDocuments.slice(indexOfFirstDocument, indexOfLastDocument);

  const totalPages = Math.ceil(filteredDocuments.length / documentsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="app-content">
      <div className="container-fluid">
        <div className="row mt-4">
          <div className="col-12">
            <div className="card-body">
              <button
                className="btn btn-primary"
                onClick={openUploadModal}
              >
                <i className="bi bi-plus-lg"></i> Subir Documento
              </button>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-3">Documentos Subidos</h5>
              <input
                type="text"
                className="form-control w-50"
                placeholder="Buscar documentos por título..."
                aria-describedby="search-icon"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div id="documentList" className="mt-4">
          <ul className="list-group">
            {currentDocuments.map((doc, index) => (
              <li key={index} className="list-group-item">
                <strong>{doc.title}</strong><br />
                <em>{doc.description}</em><br />
                <small>{doc.date}</small><br />
                <button
                  className="btn btn-sm btn-info me-2"
                  onClick={() => openPreview(doc.fileURL)}
                >
                  Vista Previa
                </button>
                <a
                  className="btn btn-sm btn-secondary"
                  href={doc.fileURL}
                  download={doc.title}  // El archivo se descargará con el nombre del título del documento
                >
                  Descargar
                </a>

              </li>
            ))}
          </ul>
          <div className="pagination mt-3">
            <button
              className="btn btn-primary me-2"
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <span>Página {currentPage} de {totalPages}</span>
            <button
              className="btn btn-primary ms-2"
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Subida */}
      {showUploadModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleUpload}>
                <div className="modal-header">
                  <h5 className="modal-title">Subir Documento</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowUploadModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Título</label>
                    <input
                      type="text"
                      className="form-control"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Archivo</label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".pdf, .docx"
                      onChange={(e) => setFile(e.target.files[0])}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowUploadModal(false)}
                  >
                    Cerrar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vista Previa */}
      {showPreviewModal && (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Vista Previa del Documento</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPreviewModal(true)}
                ></button>
              </div>
              <div className="modal-body" style={{ height: '80vh' }}>
                <iframe
                  src={previewUrl}
                  title="Vista Previa"
                  frameBorder="0"
                  style={{ width: '100%', height: '100%' }}
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
