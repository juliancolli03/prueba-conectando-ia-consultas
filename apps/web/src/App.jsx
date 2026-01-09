import { useState } from 'react';

function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo al escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Error al enviar el formulario');
      }

      if (data.ok) {
        setStatus('success');
        // Limpiar formulario
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: ''
        });
      } else {
        throw new Error(data.message || data.error || 'Error al procesar la solicitud');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message || 'Ocurrió un error. Por favor intenta nuevamente.');
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>Contacto</h1>
          <p className="subtitle">
            Completa el formulario y nos pondremos en contacto contigo a la brevedad.
            <br />
            <small style={{fontSize: '0.85em', opacity: 0.8}}>
              Tu mensaje será clasificado automáticamente por nuestra inteligencia artificial.
            </small>
          </p>
        </header>

        {status === 'success' && (
          <div className="alert alert-success">
            <strong>¡Gracias por contactarnos!</strong>
            <p>Hemos recibido tu información y te responderemos pronto.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="alert alert-error">
            <strong>Error</strong>
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="name">
              Nombre <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'input-error' : ''}
              disabled={status === 'loading'}
              required
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
              disabled={status === 'loading'}
              required
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Teléfono</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={status === 'loading'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Mensaje</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="5"
              disabled={status === 'loading'}
            />
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;