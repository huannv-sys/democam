# MONITORS4 - Sistema de monitoreo vehicular y gestión de eventos

## Descripción

MONITORS4 es una plataforma de monitoreo vehicular que se integra con soluciones como HOWEN para cámaras de seguridad y WIALON para el registro de eventos. Permite el seguimiento en tiempo real de vehículos y la recepción de alarmas personalizables de diferentes tipos, como exceso de velocidad, botón de pánico, desviación de ruta o paradas prolongadas.

---

## Índice

- [Instalación y Configuración](#instalación-y-configuración)
- [Estructura de Carpetas](#estructura-de-carpetas)
- [Capturas de Pantalla](#capturas-de-pantalla)
- [Contacto](#contacto)

---

## Instalación y Configuración

### Requisitos Previos
Asegúrate de tener Node.js y npm instalados en tu sistema. Puedes encontrar instrucciones de instalación en [Node.js Installation Guide](https://nodejs.org/).

### Cómo Levantar el Proyecto

1. **Clonar el Repositorio:**
    ```bash
    git clone https://github.com/silverblade34/platform_monitors4.git
    ```

2. **Acceder al Directorio del Proyecto:**
    ```bash
    cd monitors4
    ```

3. **Instalar las Dependencias:**
    ```bash
    npm install
    ```

4. **Configurar el Entorno:**
   - Renombra el archivo `.env.example` a `.env`.
   - Ajusta las variables de entorno según sea necesario.

5. **Iniciar la Aplicación:**
    ```bash
    npm run serve
    ```

La aplicación estará disponible en `http://localhost:8080`.

---

## Estructura de Carpetas

- `/public`: Contiene archivos estáticos.
- `/src`: Contiene el código fuente de la aplicación Vue.js.
- `/src/components`: Componentes reutilizables de Vue.js.
- `/src/views`: Vistas de la aplicación.
- `/src/router`: Configuración de enrutamiento.
- `/src/store`: Configuración de Vuex para el manejo de estados.

---

## Capturas de Pantalla

Inserta capturas de pantalla relevantes de tu aplicación para mostrar su apariencia y funcionalidades principales.

![Dashboard](https://drive.google.com/uc?export=view&id=1V1KtMl8INUWEAcPTY3SCm7-1GgsyuhNv)
![Recepción de eventos](https://drive.google.com/uc?export=view&id=12qBrT0HNQ5vNnMSFPRf9yrUiuhYf6Hij)
![Gestión de Eventos](https://drive.google.com/uc?export=view&id=1xSKUHOZK_hnmDR85vZtaDy4MI3vYDw_e)
![Recepción evidencias de Eventos](https://drive.google.com/uc?export=view&id=134y0iSMBVlyk0-rLYY_ZWkDct7a--43Z)

---

## Contacto

Si tienes preguntas, encuentras problemas o estás interesado en colaborar, no dudes en ponerte en contacto con nosotros. Estamos aquí para ayudar y mejorar MONITORS4 juntos.

- **Correo Electrónico:** [mpacheco.tacay@gmail.com](mailto:mpacheco.tacay@gmail.com)
- **LinkedIn:** [Marcos Pacheco](https://www.linkedin.com/in/marcos-pacheco-tacay-674206249/)
- **Sitio Web:** [https://silverblade34.github.io/portfolio_website/](https://silverblade34.github.io/portfolio_website/)

¡Esperamos escucharte pronto y colaborar en el desarrollo de MONITORS4!