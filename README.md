#  Rhythm Plus - Dedicated Private Rooms

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotjs&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white" alt="Railway" />
  <img src="https://img.shields.io/badge/Tampermonkey-00C9FF?style=for-the-badge&logo=tampermonkey&logoColor=white" alt="Tampermonkey" />
</p>

Servidor backend centralizado en **Node.js** y **Socket.io**, acompañado de un script cliente para **Tampermonkey**. Permite la creación y gestión centralizada de salas de duelos privadas en tiempo real para **Rhythm Plus**, actuando como una autoridad independiente sin depender de hosts locales.

---

## 🚀 Características

* **Salas Privadas por Código:** Los usuarios pueden crear salas y compartir un código único para que otros se unan de forma global.
* **Servidor Dedicado en Railway:** Arquitectura centralizada corriendo 24/7 en la nube de forma totalmente gratuita.
* **Integración con Tampermonkey:** Comunicación fluida en tiempo real mediante WebSockets (`Socket.io`).

---

## 📂 Estructura del Repositorio

```text
📦 rhythm-plus-duels-server
 ┣ 📜 package.json    # Configuración de dependencias (Express y Socket.io)
 ┗ 📜 server.js       # Lógica del backend para manejo de salas y conexiones
