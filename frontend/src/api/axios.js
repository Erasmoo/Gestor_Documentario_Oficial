import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:4000/api', // La URL de tu backend
    timeout: 1000, // Set a timeout for requests (in milliseconds)
});

// Interceptor de respuesta para manejar errores globalmente
instance.interceptors.response.use(
    (response) => response,  // Devuelve la respuesta si es exitosa
    (error) => {
        if (error.response) {
            // Aquí estamos manejando los errores que vienen con una respuesta del servidor
            return Promise.reject(error.response.data);
        }
        // Si no hay respuesta, devuelve el error tal cual
        return Promise.reject(error);
    }
);

export default instance;
